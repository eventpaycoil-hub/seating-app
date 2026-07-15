'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Send } from 'lucide-react';

export default function AddTablePage() {
  const [shape, setShape] = useState<'round' | 'square' | 'rect'>('round');
  const [seats, setSeats] = useState(12);
  const [quantity, setQuantity] = useState(1);

  const sendTables = () => {
    const newTables = Array.from({ length: quantity }, (_, i) => ({
      id: Date.now() + i,
      type: shape,
      seats: seats,
      label: `${shape === 'round' ? 'עגול' : shape === 'square' ? 'מרובע' : 'מלבני'} ${seats}`,
      size: seats >= 20 ? 2 : 1
    }));

    localStorage.setItem('newTables', JSON.stringify(newTables));

    alert(`✅ ${quantity} שולחנות נשלחו!`);
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-md mx-auto">
        <Link href="/seating" className="text-blue-600 hover:underline mb-8 inline-block">← חזרה לסקיצת האולם</Link>

        <h1 className="text-4xl font-bold mb-8 text-center">הוספת שולחנות</h1>

        <div className="bg-white rounded-3xl shadow p-8 space-y-8">
          <div>
            <label className="block text-sm font-medium mb-2">צורת השולחן</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'round', label: 'עגול' },
                { value: 'square', label: 'מרובע' },
                { value: 'rect', label: 'מלבני' },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setShape(s.value as any)}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    shape === s.value
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">מספר כסאות</label>
            <input
              type="range"
              min="4"
              max="50"
              step="2"
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="text-center text-4xl font-bold text-emerald-600 mt-3">
              {seats}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">כמות שולחנות</label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="text-center text-4xl font-bold text-emerald-600 mt-3">
              {quantity}
            </div>
          </div>

          <button
            onClick={sendTables}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-5 rounded-3xl font-bold text-xl flex items-center justify-center gap-3 hover:brightness-110"
          >
            <Send size={24} /> שלח {quantity} שולחנות לסקיצה
          </button>
        </div>
      </div>
    </div>
  );
}