// @ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';

interface Quote {
  id: number;
  date: string;
  name: string;
  phone?: string;
  eventType?: string;
  status?: string;
  subject?: string;
  services?: string[];
  notes?: string;
  beforeVAT?: string;
  vat?: string;
  total?: string;
  guests?: string;
  rsvpPrice?: string;
  giftsPrice?: string;
  managementPrice?: string;
  seatingPrice?: string;
  hostessesPrice?: string;
}

function findServicePrice(services: string[] | undefined, keywords: string[]) {
  if (!services?.length) return '—';
  const line = services.find((s) =>
    keywords.some((k) => s.toLowerCase().includes(k.toLowerCase()))
  );
  if (!line) return '—';
  const match = line.match(/([\d,]+(?:\.\d+)?)/);
  return match ? match[1] : line;
}

export default function MyQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState('');
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('eventpay-quotes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setQuotes(parsed);
      }
    } catch {
      setQuotes([]);
    }
  }, []);

  const saveToLocal = (updatedQuotes: Quote[]) => {
    localStorage.setItem('eventpay-quotes', JSON.stringify(updatedQuotes));
    setQuotes(updatedQuotes);
  };

  const filteredQuotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter(
      (item) =>
        (item.name || '').toLowerCase().includes(q) ||
        (item.phone || '').includes(q) ||
        (item.eventType || '').toLowerCase().includes(q) ||
        String(item.id).includes(q)
    );
  }, [quotes, search]);

  const deleteQuote = (id: number) => {
    if (!confirm('למחוק את ההצעה?')) return;
    saveToLocal(quotes.filter((q) => q.id !== id));
  };

  const startEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setEditForm({
      name: quote.name || '',
      phone: quote.phone || '',
      eventType: quote.eventType || '',
      notes: quote.notes || '',
      beforeVAT: quote.beforeVAT || '',
      vat: quote.vat || '',
      total: quote.total || '',
      servicesText: (quote.services || []).join('\n'),
      status: quote.status || 'נשלח',
      guests: quote.guests || '',
      rsvpPrice: quote.rsvpPrice || '',
      giftsPrice: quote.giftsPrice || '',
      managementPrice: quote.managementPrice || '',
      seatingPrice: quote.seatingPrice || '',
      hostessesPrice: quote.hostessesPrice || '',
    });
  };

  const saveEdit = () => {
    if (!editingQuote) return;
    const services = (editForm.servicesText || '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean);

    const updated = quotes.map((q) =>
      q.id === editingQuote.id
        ? {
            ...q,
            name: editForm.name,
            phone: editForm.phone,
            eventType: editForm.eventType,
            notes: editForm.notes,
            beforeVAT: editForm.beforeVAT,
            vat: editForm.vat,
            total: editForm.total,
            services,
            status: editForm.status,
            guests: editForm.guests,
            rsvpPrice: editForm.rsvpPrice,
            giftsPrice: editForm.giftsPrice,
            managementPrice: editForm.managementPrice,
            seatingPrice: editForm.seatingPrice,
            hostessesPrice: editForm.hostessesPrice,
          }
        : q
    );
    saveToLocal(updated);
    setEditingQuote(null);
    alert('✅ ההצעה עודכנה!');
  };

  const resendQuote = (quote: Quote) => {
    const servicesText = (quote.services || []).join('\n');
    const message = `*הצעת מחיר - EventPay*\n\n*שם:* ${quote.name}\n*טלפון:* ${quote.phone || ''}\n*סוג אירוע:* ${quote.eventType || ''}\n\n${servicesText}\n\nסה"כ: ₪${quote.total || '0'}`;
    const phone = (quote.phone || '').replace(/\D/g, '').slice(-9);
    if (!phone) {
      alert('אין מספר טלפון להצעה זו');
      return;
    }
    window.open(`https://wa.me/972${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const exportToPDF = (quote: Quote) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const servicesHtml = (quote.services || [])
      .map((s) => `<div class="service">• ${s}</div>`)
      .join('');

    printWindow.document.write(`
      <html dir="rtl" lang="he">
      <head>
        <title>הצעת מחיר - ${quote.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.8; }
          h1 { text-align: center; color: #d97706; }
          .info { background: #f8f4eb; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .service { margin: 10px 0; }
          .summary { background: #fffbeb; padding: 20px; border-radius: 10px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <h1>הצעת מחיר - EventPay</h1>
        ${quote.subject ? `<p><strong>${quote.subject}</strong></p>` : ''}
        <div class="info">
          <strong>תאריך:</strong> ${quote.date}<br><br>
          <strong>שם:</strong> ${quote.name}<br>
          <strong>טלפון:</strong> ${quote.phone || '—'}<br>
          <strong>סוג אירוע:</strong> ${quote.eventType || '—'}
        </div>
        <div>
          <strong>שירותים:</strong><br><br>
          ${servicesHtml || '—'}
        </div>
        ${quote.notes ? `<p><strong>הערות:</strong><br>${quote.notes}</p>` : ''}
        <div class="summary">
          <strong>סיכום מחירים:</strong><br>
          לפני מע"מ: ₪${quote.beforeVAT || '0'}<br>
          מע"מ 18%: ₪${quote.vat || '0'}<br><br>
          <strong>סה"כ כולל מע"מ: ₪${quote.total || '0'}</strong>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const thClass =
    'px-3 py-3 text-xs font-bold text-slate-700 whitespace-nowrap border-b border-slate-200 text-center';
  const tdClass =
    'px-3 py-3 text-sm text-slate-700 whitespace-nowrap border-b border-slate-100 text-center';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4eb] via-white to-[#f5eede] py-10" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-amber-900">צפייה בהצעות מחיר</h1>
          <p className="text-amber-700 mt-1 text-sm">
            מספר הצעות מחיר: {quotes.length}
          </p>
        </div>

        <div className="relative mb-6 max-w-md mx-auto">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="חיפוש לפי שם / טלפון / מספר הצעה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-amber-200 rounded-2xl pr-11 pl-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
          />
        </div>

        {filteredQuotes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow">
            <p className="text-xl text-gray-400">
              {quotes.length === 0 ? 'עדיין לא שלחת הצעות מחיר' : 'לא נמצאו תוצאות לחיפוש'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-x-auto border border-slate-200">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className={thClass}>מספר הצעה</th>
                  <th className={thClass}>תאריך</th>
                  <th className={thClass}>פרטי לקוח</th>
                  <th className={thClass}>מספר מוזמנים/רשומות</th>
                  <th className={thClass}>מחיר לאישורי הגעה</th>
                  <th className={thClass}>קבלת מתנות באשראי</th>
                  <th className={thClass}>ניהול האירוע</th>
                  <th className={thClass}>סידורי הושבה</th>
                  <th className={thClass}>דיילים/דיילות</th>
                  <th className={thClass}>הערות</th>
                  <th className={thClass}>שלח שוב</th>
                  <th className={thClass}>צפה בהצעה</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((quote, index) => {
                  const rsvp =
                    quote.rsvpPrice ||
                    findServicePrice(quote.services, ['אישור', 'rsvp', 'הגעה']);
                  const gifts =
                    quote.giftsPrice ||
                    findServicePrice(quote.services, ['מתנ', 'אשראי', 'gift']);
                  const management =
                    quote.managementPrice ||
                    findServicePrice(quote.services, ['ניהול']);
                  const seating =
                    quote.seatingPrice ||
                    findServicePrice(quote.services, ['הושב', 'סידור']);
                  const hostesses =
                    quote.hostessesPrice ||
                    findServicePrice(quote.services, ['דייל']);

                  return (
                    <tr key={quote.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className={tdClass + ' font-bold text-amber-800'}>
                        {quote.id || index + 1}
                      </td>
                      <td className={tdClass}>{quote.date || '—'}</td>
                      <td className={tdClass}>
                        <div className="font-semibold text-slate-900">{quote.name || '—'}</div>
                        <div className="text-xs text-slate-500" dir="ltr">
                          {quote.phone || ''}
                        </div>
                        {quote.eventType && (
                          <div className="text-xs text-amber-700 mt-0.5">{quote.eventType}</div>
                        )}
                      </td>
                      <td className={tdClass}>{quote.guests || '—'}</td>
                      <td className={tdClass}>{rsvp}</td>
                      <td className={tdClass}>{gifts}</td>
                      <td className={tdClass}>{management}</td>
                      <td className={tdClass}>{seating}</td>
                      <td className={tdClass}>{hostesses}</td>
                      <td className={tdClass + ' max-w-[140px] truncate'} title={quote.notes || ''}>
                        {quote.notes || '—'}
                      </td>
                      <td className={tdClass}>
                        <button
                          onClick={() => resendQuote(quote)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                        >
                          שלח שוב
                        </button>
                      </td>
                      <td className={tdClass}>
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => exportToPDF(quote)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                          >
                            צפה
                          </button>
                          <button
                            onClick={() => startEdit(quote)}
                            className="bg-slate-500 hover:bg-slate-600 text-white text-xs font-bold px-2 py-1.5 rounded-lg"
                          >
                            ערוך
                          </button>
                          <button
                            onClick={() => deleteQuote(quote.id)}
                            className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-2 py-1.5 rounded-lg"
                          >
                            מחק
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {editingQuote && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl p-8 w-full max-w-lg my-8">
              <h2 className="text-2xl font-bold mb-6">ערוך הצעת מחיר</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">שם</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full border rounded-2xl px-4 py-3" />
                </div>
                <div>
                  <label className="block text-sm mb-1">טלפון</label>
                  <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full border rounded-2xl px-4 py-3" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm mb-1">סוג אירוע</label>
                  <input type="text" value={editForm.eventType} onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value })} className="w-full border rounded-2xl px-4 py-3" />
                </div>
                <div>
                  <label className="block text-sm mb-1">מספר מוזמנים/רשומות</label>
                  <input type="text" value={editForm.guests} onChange={(e) => setEditForm({ ...editForm, guests: e.target.value })} className="w-full border rounded-2xl px-4 py-3" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm mb-1">אישורי הגעה</label>
                    <input type="text" value={editForm.rsvpPrice} onChange={(e) => setEditForm({ ...editForm, rsvpPrice: e.target.value })} className="w-full border rounded-2xl px-3 py-3" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">מתנות באשראי</label>
                    <input type="text" value={editForm.giftsPrice} onChange={(e) => setEditForm({ ...editForm, giftsPrice: e.target.value })} className="w-full border rounded-2xl px-3 py-3" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">ניהול האירוע</label>
                    <input type="text" value={editForm.managementPrice} onChange={(e) => setEditForm({ ...editForm, managementPrice: e.target.value })} className="w-full border rounded-2xl px-3 py-3" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">סידורי הושבה</label>
                    <input type="text" value={editForm.seatingPrice} onChange={(e) => setEditForm({ ...editForm, seatingPrice: e.target.value })} className="w-full border rounded-2xl px-3 py-3" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">דיילים/דיילות</label>
                    <input type="text" value={editForm.hostessesPrice} onChange={(e) => setEditForm({ ...editForm, hostessesPrice: e.target.value })} className="w-full border rounded-2xl px-3 py-3" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">סה&quot;כ</label>
                    <input type="text" value={editForm.total} onChange={(e) => setEditForm({ ...editForm, total: e.target.value })} className="w-full border rounded-2xl px-3 py-3 font-bold" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">שירותים (שורה לכל שירות)</label>
                  <textarea value={editForm.servicesText} onChange={(e) => setEditForm({ ...editForm, servicesText: e.target.value })} className="w-full border rounded-2xl px-4 py-3 h-24" />
                </div>
                <div>
                  <label className="block text-sm mb-1">הערות</label>
                  <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full border rounded-2xl px-4 py-3 h-20" />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={saveEdit} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold">שמור</button>
                <button onClick={() => setEditingQuote(null)} className="flex-1 bg-gray-200 py-4 rounded-2xl font-bold">ביטול</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}