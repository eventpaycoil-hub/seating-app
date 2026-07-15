'use client';
import { useState, useEffect } from 'react';
import { Calendar, Trash2, Edit2, Download, Send } from 'lucide-react';

interface Quote {
  id: number;
  date: string;
  name: string;
  phone: string;
  eventType: string;
  status: string;
  services: string[];
  notes?: string;
  beforeVAT?: string;
  vat?: string;
  total?: string;
}

export default function MyQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    const saved = localStorage.getItem('eventpay-quotes');
    if (saved) setQuotes(JSON.parse(saved));
  }, []);

  const saveToLocal = (updatedQuotes: Quote[]) => {
    localStorage.setItem('eventpay-quotes', JSON.stringify(updatedQuotes));
    setQuotes(updatedQuotes);
  };

  const deleteQuote = (id: number) => {
    saveToLocal(quotes.filter(q => q.id !== id));
  };

  const startEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setEditForm({ name: quote.name, phone: quote.phone, eventType: quote.eventType, notes: quote.notes || '' });
  };

  const saveEdit = () => {
    if (!editingQuote) return;
    const updated = quotes.map(q => q.id === editingQuote.id ? { ...q, ...editForm, date: new Date().toLocaleDateString('he-IL') } : q);
    saveToLocal(updated);
    setEditingQuote(null);
    alert('✅ ההצעה עודכנה!');
  };

  const resendQuote = (quote: Quote) => {
    const message = `*הצעת מחיר - EventPay*%0A%0A*שם:* ${quote.name}%0A*טלפון:* ${quote.phone}%0A*סוג אירוע:* ${quote.eventType}%0A%0A${quote.services.join('%0A')}`;
    window.open(`https://wa.me/972${quote.phone.replace(/\D/g,'').slice(-9)}?text=${message}`, '_blank');
  };

  const exportToPDF = (quote: Quote) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

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
        <div class="info">
          <strong>תאריך:</strong> ${quote.date}<br><br>
          <strong>שם:</strong> ${quote.name}<br>
          <strong>טלפון:</strong> ${quote.phone}<br>
          <strong>סוג אירוע:</strong> ${quote.eventType}
        </div>
        <div>
          <strong>שירותים:</strong><br><br>
          ${quote.services.map(s => `<div class="service">• ${s}</div>`).join('')}
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
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4eb] via-white to-[#f5eede] py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-amber-900">ההצעות שלי</h1>
          <p className="text-amber-700 mt-2">כל ההצעות המחיר ששלחת</p>
        </div>

        {quotes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow">
            <p className="text-2xl text-gray-400">עדיין לא שלחת הצעות מחיר</p>
          </div>
        ) : (
          <div className="space-y-6">
            {quotes.map((quote) => (
              <div key={quote.id} className="bg-white rounded-3xl shadow p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3">
                      <Calendar className="text-amber-600" />
                      <span className="font-medium text-gray-500">{quote.date}</span>
                    </div>
                    <h3 className="text-2xl font-bold mt-2">{quote.name}</h3>
                    <p className="text-lg text-gray-600 mt-1">{quote.eventType}</p>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => startEdit(quote)} className="p-3 text-blue-600 hover:bg-blue-50 rounded-full">
                      <Edit2 size={24} />
                    </button>
                    <button onClick={() => resendQuote(quote)} className="p-3 text-green-600 hover:bg-green-50 rounded-full">
                      <Send size={24} />
                    </button>
                    <button onClick={() => exportToPDF(quote)} className="p-3 text-purple-600 hover:bg-purple-50 rounded-full">
                      <Download size={24} />
                    </button>
                    <button onClick={() => deleteQuote(quote.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-full">
                      <Trash2 size={24} />
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-2">שירותים:</p>
                  <div className="flex flex-wrap gap-2">
                    {quote.services.map((s, i) => (
                      <span key={i} className="bg-amber-100 text-amber-800 px-4 py-1 rounded-full text-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingQuote && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-10 w-full max-w-lg">
              <h2 className="text-2xl font-bold mb-6">ערוך הצעת מחיר</h2>
              <div className="space-y-5">
                <div><label>שם</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full border rounded-2xl px-4 py-3" /></div>
                <div><label>טלפון</label><input type="text" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full border rounded-2xl px-4 py-3" /></div>
                <div><label>סוג אירוע</label><input type="text" value={editForm.eventType} onChange={(e) => setEditForm({...editForm, eventType: e.target.value})} className="w-full border rounded-2xl px-4 py-3" /></div>
                <div><label>הערות</label><textarea value={editForm.notes} onChange={(e) => setEditForm({...editForm, notes: e.target.value})} className="w-full border rounded-2xl px-4 py-3 h-24" /></div>
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