'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Send, Trash2 } from 'lucide-react';

interface TableRow {
  id: number;
  shape: 'round' | 'square' | 'rect' | 'knight';
  seats: number;
  fromTable: string;
  toTable: string;
}

const SHAPES = [
  { value: 'round', label: 'עגול' },
  { value: 'square', label: 'מרובע' },
  { value: 'rect', label: 'מלבני' },
  { value: 'knight', label: 'נחש / אביר' },
] as const;

function AddTableContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '1';

  const [rows, setRows] = useState<TableRow[]>([
    { id: 1, shape: 'round', seats: 12, fromTable: '1', toTable: '5' },
  ]);

  const addRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: Date.now(),
        shape: 'round',
        seats: 12,
        fromTable: '',
        toTable: '',
      },
    ]);
  };

  const removeRow = (id: number) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: number, field: keyof TableRow, value: string | number) => {
    setRows(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const buildTablesFromRows = () => {
    const tables: any[] = [];

    for (const row of rows) {
      const from = parseInt(row.fromTable, 10);
      const to = parseInt(row.toTable, 10);

      if (!from || !to || from > to) {
        alert('נא למלא "משולחן" ו"עד שולחן" בכל שורה (מספרים תקינים)');
        return null;
      }

      for (let n = from; n <= to; n++) {
        tables.push({
          id: Date.now() + n + Math.random(),
          type: row.shape,
          seats: row.seats,
          tableNumber: n,
          label: `${SHAPES.find(s => s.value === row.shape)?.label || row.shape} ${row.seats}`,
          size: row.shape === 'knight' || row.seats >= 20 ? 2 : 1,
        });
      }
    }

    tables.sort((a, b) => a.tableNumber - b.tableNumber);
    return tables;
  };

  const sendAll = () => {
    const tables = buildTablesFromRows();
    if (!tables || tables.length === 0) return;

    let existing: any[] = [];
    try {
      existing = JSON.parse(localStorage.getItem('newTables') || '[]');
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }

    localStorage.setItem('newTables', JSON.stringify([...existing, ...tables]));
    alert(`✅ ${tables.length} שולחנות הועלו ל"שולחנות חדשים" בסקיצה`);
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/event/${eventId}/seating`}
          className="text-blue-600 hover:underline mb-6 inline-block"
        >
          ← חזרה לסקיצת האולם
        </Link>

        <h1 className="text-4xl font-bold mb-8 text-center">הוספת שולחנות מרובים</h1>

        <div className="space-y-6">
          {rows.map((row, idx) => (
            <div key={row.id} className="bg-white rounded-3xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">קבוצה {idx + 1}</h2>
                {rows.length > 1 && (
                  <button
                    onClick={() => removeRow(row.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">צורת שולחן</label>
                  <select
                    value={row.shape}
                    onChange={(e) => updateRow(row.id, 'shape', e.target.value)}
                    className="w-full p-3 border rounded-xl"
                  >
                    {SHAPES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">מספר כסאות</label>
                  <input
                    type="number"
                    min={4}
                    max={50}
                    value={row.seats}
                    onChange={(e) => updateRow(row.id, 'seats', parseInt(e.target.value) || 4)}
                    className="w-full p-3 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">משולחן מס׳</label>
                  <input
                    type="number"
                    min={1}
                    value={row.fromTable}
                    onChange={(e) => updateRow(row.id, 'fromTable', e.target.value)}
                    className="w-full p-3 border rounded-xl"
                    placeholder="לדוגמה: 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">עד שולחן מס׳</label>
                  <input
                    type="number"
                    min={1}
                    value={row.toTable}
                    onChange={(e) => updateRow(row.id, 'toTable', e.target.value)}
                    className="w-full p-3 border rounded-xl"
                    placeholder="לדוגמה: 5"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <button
              onClick={addRow}
              className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-amber-600 text-amber-700 rounded-2xl hover:bg-amber-50 font-medium"
            >
              <Plus size={22} /> הוסף עוד סוג שולחן
            </button>

            <button
              onClick={sendAll}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-12 py-4 rounded-2xl font-bold text-lg hover:brightness-110"
            >
              <Send size={22} /> העלה הכל לסקיצה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddTablePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xl">טוען...</div>}>
      <AddTableContent />
    </Suspense>
  );
}