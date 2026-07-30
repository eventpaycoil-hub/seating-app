'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type YesNo = 'כן' | 'לא' | '';

interface Lead {
  id: string;
  name: string;
  phone: string;
  eventDate: string;
  guestCount: string;
  rsvp: YesNo;
  seating: YesNo;
  creditGifts: YesNo;
  location: string;
  price: string;
  createdAt: string;
}

const STORAGE_KEY = 'eventpay_customer_tracking';

const emptyForm: Omit<Lead, 'id' | 'createdAt'> = {
  name: '',
  phone: '',
  eventDate: '',
  guestCount: '',
  rsvp: '',
  seating: '',
  creditGifts: '',
  location: '',
  price: '',
};

function loadLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLeads(list: Lead[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function CustomerTrackingPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLeads(loadLeads());
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.location.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const updateField = (key: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      alert('נא למלא שם לקוח');
      return;
    }

    if (editingId) {
      const next = leads.map((l) =>
        l.id === editingId
          ? {
              ...l,
              ...form,
              name: form.name.trim(),
              phone: form.phone.trim(),
            }
          : l
      );
      setLeads(next);
      saveLeads(next);
    } else {
      const item: Lead = {
        id: String(Date.now()),
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        createdAt: new Date().toISOString(),
      };
      const next = [item, ...leads];
      setLeads(next);
      saveLeads(next);
    }
    resetForm();
  };

  const handleEdit = (lead: Lead) => {
    setEditingId(lead.id);
    setForm({
      name: lead.name,
      phone: lead.phone,
      eventDate: lead.eventDate,
      guestCount: lead.guestCount,
      rsvp: lead.rsvp,
      seating: lead.seating,
      creditGifts: lead.creditGifts,
      location: lead.location,
      price: lead.price,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    if (!confirm('למחוק רשומה זו?')) return;
    const next = leads.filter((l) => l.id !== id);
    setLeads(next);
    saveLeads(next);
    if (editingId === id) resetForm();
  };

  const YesNoSelect = ({
    value,
    onChange,
  }: {
    value: YesNo;
    onChange: (v: YesNo) => void;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as YesNo)}
      className="w-full p-3 border rounded-2xl bg-white"
    >
      <option value="">—</option>
      <option value="כן">כן</option>
      <option value="לא">לא</option>
    </select>
  );

  return (
    <div className="min-h-screen bg-zinc-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">מעקב לקוחות</h1>
            <p className="text-slate-500 text-sm mt-1">רישום שיחות ומעקב הצעות · מנהל בלבד</p>
          </div>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← חזרה
          </Link>
        </div>

        {/* טופס */}
        <div className="bg-white rounded-3xl shadow p-6 border border-slate-200">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'עריכת לקוח' : 'הוספת לקוח חדש'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1">שם</label>
              <input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full p-3 border rounded-2xl"
                placeholder="שם מלא"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">טלפון</label>
              <input
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full p-3 border rounded-2xl"
                dir="ltr"
                placeholder="050-0000000"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">תאריך האירוע</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => updateField('eventDate', e.target.value)}
                className="w-full p-3 border rounded-2xl"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">כמות מוזמנים</label>
              <input
                value={form.guestCount}
                onChange={(e) => updateField('guestCount', e.target.value)}
                className="w-full p-3 border rounded-2xl"
                placeholder="למשל: 250"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">אישורי הגעה</label>
              <YesNoSelect value={form.rsvp} onChange={(v) => updateField('rsvp', v)} />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">סידורי הושבה</label>
              <YesNoSelect value={form.seating} onChange={(v) => updateField('seating', v)} />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">מתנות באשראי</label>
              <YesNoSelect
                value={form.creditGifts}
                onChange={(v) => updateField('creditGifts', v)}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">מיקום האירוע</label>
              <input
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                className="w-full p-3 border rounded-2xl"
                placeholder="אולם / עיר"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">מחיר</label>
              <input
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                className="w-full p-3 border rounded-2xl"
                placeholder="למשל: 3500 ₪"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-bold"
            >
              {editingId ? 'עדכן' : 'שמור לקוח'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-3 rounded-2xl font-medium"
              >
                ביטול עריכה
              </button>
            )}
          </div>
        </div>

        {/* חיפוש + טבלה */}
        <div className="bg-white rounded-3xl shadow p-6 border border-slate-200">
          <div className="flex flex-col md:flex-row gap-3 mb-5 items-stretch md:items-center justify-between">
            <h2 className="text-xl font-bold">רשימת לקוחות ({filtered.length})</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם / טלפון / מיקום..."
              className="w-full md:w-80 p-3 border rounded-2xl"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center text-slate-400 py-12">אין רשומות עדיין</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-600">
                    <th className="text-right p-3 font-medium">שם</th>
                    <th className="text-right p-3 font-medium">טלפון</th>
                    <th className="text-right p-3 font-medium">תאריך אירוע</th>
                    <th className="text-right p-3 font-medium">כמות</th>
                    <th className="text-right p-3 font-medium">RSVP</th>
                    <th className="text-right p-3 font-medium">הושבה</th>
                    <th className="text-right p-3 font-medium">אשראי</th>
                    <th className="text-right p-3 font-medium">מיקום</th>
                    <th className="text-right p-3 font-medium">מחיר</th>
                    <th className="text-center p-3 font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id} className="border-t hover:bg-slate-50">
                      <td className="p-3 font-medium">{l.name}</td>
                      <td className="p-3 font-mono" dir="ltr">
                        {l.phone || '—'}
                      </td>
                      <td className="p-3">{l.eventDate || '—'}</td>
                      <td className="p-3">{l.guestCount || '—'}</td>
                      <td className="p-3">{l.rsvp || '—'}</td>
                      <td className="p-3">{l.seating || '—'}</td>
                      <td className="p-3">{l.creditGifts || '—'}</td>
                      <td className="p-3">{l.location || '—'}</td>
                      <td className="p-3">{l.price || '—'}</td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            onClick={() => handleEdit(l)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-medium"
                          >
                            ערוך
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(l.id)}
                            className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-medium"
                          >
                            מחק
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}