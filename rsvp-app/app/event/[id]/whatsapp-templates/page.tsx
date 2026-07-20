'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function WhatsAppTemplatesPage() {
  const params = useParams();
  const eventId = params.id || "1";

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [customPhone, setCustomPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const templates = [
    { 
      id: 1, 
      name: "הזמנה ראשונית", 
      content: "שלום *שם*, הוזמנתם לחתונה שלנו! נשמח לראותכם." 
    },
    { 
      id: 2, 
      name: "תזכורת הגעה", 
      content: "שלום *שם*, מחר האירוע! מקווים לראותכם." 
    },
    { 
      id: 3, 
      name: "תודה אחרי האירוע", 
      content: "תודה רבה שהגעתם! היה מדהים." 
    },
  ];

    /** המרה לפורמט WhatsApp: רק ספרות + קידומת מדינה */
  const toWhatsAppNumber = (phone: string): string => {
    if (!phone) return '';
    let p = phone.trim();

    // בינלאומי עם +
    if (p.startsWith('+')) {
      return p.slice(1).replace(/\D/g, '');
    }

    // רק ספרות
    p = p.replace(/\D/g, '');

    // ישראלי שמתחיל ב-0 → 972...
    if (p.startsWith('0')) {
      return '972' + p.slice(1);
    }

    // כבר עם 972
    if (p.startsWith('972')) {
      return p;
    }

    // 9 ספרות שמתחילות ב-5 (בלי 0)
    if (p.length === 9 && p.startsWith('5')) {
      return '972' + p;
    }

    return p;
  };

  const sendToWhatsApp = (phone: string, message: string) => {
    if (!phone.trim()) {
      alert('הזן מספר טלפון');
      return;
    }
    if (!message) {
      alert('הזן הודעה');
      return;
    }

    const waNumber = toWhatsAppNumber(phone);
    if (!waNumber || waNumber.length < 8) {
      alert('מספר טלפון לא תקין');
      return;
    }

    const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">תבניות ווטסאפ</h1>
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline">← חזרה לרשימת מוזמנים</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* רשימת תבניות */}
          <div className="bg-white rounded-3xl shadow p-8">
            <h2 className="text-2xl font-bold mb-6">התבניות שלי</h2>
            
            <div className="space-y-3">
              {templates.map(template => (
                <div 
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-5 rounded-2xl cursor-pointer border-2 transition-all ${selectedTemplate?.id === template.id ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="font-semibold text-lg">{template.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* תצוגה + שליחה */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow p-8">
            {selectedTemplate ? (
              <>
                <h2 className="text-3xl font-bold mb-6">{selectedTemplate.name}</h2>
                
                <div className="bg-gray-50 p-6 rounded-2xl text-gray-700 whitespace-pre-wrap mb-8 min-h-[200px] border">
                  {selectedTemplate.content}
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">שליחה חופשית</h3>
                  
                  <input
                    type="tel"
                    placeholder="מספר טלפון (050... או +1...)"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="w-full border rounded-2xl px-5 py-4 mb-3"
                  />
                  
                  <textarea
                    placeholder="הודעה חופשית (או השתמש בתבנית למעלה)..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full border rounded-2xl px-5 py-4 h-32 resize-y mb-4"
                  />
                  
                  <button 
                    onClick={() => sendToWhatsApp(customPhone, customMessage || selectedTemplate.content)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-medium text-lg"
                  >
                    📱 שלח בווטסאפ
                  </button>
                </div>
              </>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-400 text-2xl">
                בחר תבנית מהרשימה משמאל
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}