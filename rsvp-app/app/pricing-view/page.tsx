'use client';
import { useState, useEffect, useMemo } from 'react';
import { Calendar, Trash2, Edit2, Download, Send, Search } from 'lucide-react';

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
        (item.eventType || '').toLowerCase().includes(q)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4eb] via-white to-[#f5eede] py-12" dir="rtl">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-900">ההצעות שלי</h1>
          <p className="text-amber-700 mt-2">כל הצעות המחיר ששלחת</p>
        </div>

        <div className="relative mb-8 max-w-md mx-auto">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="חיפוש לפי שם / טלפון / סוג אירוע..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-amber-200 rounded-2xl pr-12 pl-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {filteredQuotes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow">
            <p className="text-2xl text-gray-400">
              {quotes.length === 0 ? 'עדיין לא שלחת הצעות מחיר' : 'לא נמצאו תוצאות לחיפוש'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredQuotes.map((quote) => (
              <div key={quote.id} className="bg-white rounded-3xl shadow p-8">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <Calendar className="text-amber-600" size={20} />
                      <span className="font-medium text-gray-500">{quote.date}</span>
                      {quote.status && (
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                          {quote.status}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mt-2">{quote.name || 'ללא שם'}</h3>
                    <p className="text-lg text-gray-600 mt-1">
                      {quote.eventType || '—'} {quote.phone ? `· ${quote.phone}` : ''}
                    </p>
                    {quote.total && (
                      <p className="text-amber-800 font-bold mt-2">סה&quot;כ: ₪{quote.total}</p>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEdit(quote)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-full" title="עריכה">
                      <Edit2 size={22} />
                    </button>
                    <button onClick={() => resendQuote(quote)} className="p-3 text-green-600 hover:bg-green-50 rounded-full" title="ווטסאפ">
                      <Send size={22} />
                    </button>
                    <button onClick={() => exportToPDF(quote)} className="p-3 text-purple-600 hover:bg-purple-50 rounded-full" title="PDF">
                      <Download size={22} />
                    </button>
                    <button onClick={() => deleteQuote(quote.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-full" title="מחיקה">
                      <Trash2 size={22} />
                    </button>
                  </div>
                </div>

                {(quote.services || []).length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm text-gray-500 mb-2">שירותים:</p>
                    <div className="flex flex-wrap gap-2">
                      {(quote.services || []).map((s, i) => (
                        <span key={i} className="bg-amber-100 text-amber-800 px-4 py-1 rounded-full text-sm">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
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

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm mb-1">לפני מע&quot;מ</label>
                    <input type="text" value={editForm.beforeVAT} onChange={(e) => setEditForm({ ...editForm, beforeVAT: e.target.value })} className="w-full border rounded-2xl px-3 py-3" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">מע&quot;מ</label>
                    <input type="text" value={editForm.vat} onChange={(e) => setEditForm({ ...editForm, vat: e.target.value })} className="w-full border rounded-2xl px-3 py-3" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">סה&quot;כ</label>
                    <input type="text" value={editForm.total} onChange={(e) => setEditForm({ ...editForm, total: e.target.value })} className="w-full border rounded-2xl px-3 py-3 font-bold" dir="ltr" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm mb-1">שירותים (שורה לכל שירות)</label>
                  <textarea
                    value={editForm.servicesText}
                    onChange={(e) => setEditForm({ ...editForm, servicesText: e.target.value })}
                    className="w-full border rounded-2xl px-4 py-3 h-28"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">סטטוס</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full border rounded-2xl px-4 py-3 bg-white">
                    <option value="נשלח">נשלח</option>
                    <option value="טיוטה">טיוטה</option>
                    <option value="אושר">אושר</option>
                    <option value="בוטל">בוטל</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1">הערות</label>
                  <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full border rounded-2xl px-4 py-3 h-24" />
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