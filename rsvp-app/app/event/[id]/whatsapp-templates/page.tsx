'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function WhatsAppTemplatesPage() {
  const params = useParams();
  const eventId = (params?.id as string) || '1';

  const [templates, setTemplates] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [customPhone, setCustomPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const loadFromHeyy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await res.json();

      if (!data.success) {
        setError(
          data.message ||
            data.error?.message ||
            JSON.stringify(data.error || data) ||
            'שגיאה בטעינה מ-Heyy'
        );
        setTemplates([]);
        return;
      }

      setTemplates(data.templates || []);
      setLastUpdate(new Date().toLocaleString('he-IL'));
      if ((data.templates || []).length === 0) {
        setError('לא נמצאו תבניות בחשבון Heyy (או שה-API עדיין לא מחזיר נתונים)');
      }
    } catch (e: any) {
      setError(e.message || 'שגיאת רשת');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFromHeyy();
  }, []);

  const sendWhatsApp = (phone: string, message: string) => {
    if (!phone || !message) {
      alert('חסר מספר או הודעה');
      return;
    }
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '972' + clean.slice(1);
    if (!clean.startsWith('972')) clean = '972' + clean;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-6 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">תבניות וואטסאפ (Heyy)</h1>
            {lastUpdate && (
              <p className="text-sm text-gray-500 mt-1">עודכן לאחרונה: {lastUpdate}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadFromHeyy}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-2xl font-bold"
            >
              {loading ? '⏳ טוען...' : '🔄 רענון תבניות מ-Heyy'}
            </button>
            <Link
              href={`/event/${eventId}/guests`}
              className="bg-white border px-6 py-3 rounded-2xl text-blue-600 hover:bg-blue-50"
            >
              ← חזרה למוזמנים
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
            <div className="font-bold mb-1">הערה</div>
            <div className="text-sm whitespace-pre-wrap">{error}</div>
            <div className="text-xs mt-2 text-amber-700">
              כש-Heyy יתקנו את ה-API — לחץ שוב על רענון והתבניות יופיעו כאן.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* רשימת תבניות */}
          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">
              התבניות שלי {templates.length > 0 && `(${templates.length})`}
            </h2>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {templates.length === 0 && !loading && (
                <p className="text-gray-400 text-center py-10">אין תבניות להצגה</p>
              )}
              {templates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelected(t);
                    setCustomMessage(t.content || '');
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                    selected?.id === t.id
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">{t.name}</div>
                  {t.status && (
                    <div className="text-xs text-gray-500 mt-1">סטטוס: {t.status}</div>
                  )}
                  <div className="text-sm text-gray-600 line-clamp-2 mt-2">{t.content}</div>
                </div>
              ))}
            </div>
          </div>

          {/* תצוגה + שליחה */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow p-6">
            {selected ? (
              <>
                <h2 className="text-2xl font-bold mb-4">{selected.name}</h2>
                <div className="bg-gray-50 p-5 rounded-2xl whitespace-pre-wrap text-gray-800 mb-6 min-h-[120px]">
                  {selected.content}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">מספר לשליחה</label>
                    <input
                      type="tel"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="050-..."
                      className="w-full border rounded-2xl px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">הודעה (ניתן לערוך)</label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="w-full border rounded-2xl px-4 py-3 h-32"
                    />
                  </div>
                  <button
                    onClick={() => sendWhatsApp(customPhone, customMessage)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold text-lg"
                  >
                    📱 פתח וואטסאפ עם ההודעה
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    כרגע נפתח wa.me (ידני). אחרי ש-Heyy יעבוד – נוסיף שליחה ישירה מה-API.
                  </p>
                </div>
              </>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-400 text-xl">
                בחר תבנית מהרשימה או לחץ רענון
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}