'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function WhatsAppTemplatesPage() {
  const [templates, setTemplates] = useState([
    { id: 1, name: "הזמנה ראשונית", content: "שלום *שם*, הוזמנתם לחתונה..." },
    { id: 2, name: "תזכורת הגעה", content: "שלום *שם*, מחר האירוע!..." },
    { id: 3, name: "תודה אחרי האירוע", content: "תודה רבה שהגעתם!..." },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customPhone, setCustomPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const sendToWhatsApp = (phone: string, message: string) => {
    if (!message) {
      alert("הזן הודעה");
      return;
    }
    const whatsappUrl = `https://wa.me/972${phone.replace(/\D/g, '').slice(1)}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    alert(`✅ נפתח WhatsApp ל-${phone}`);
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">תבניות ווטסאפ</h1>
          <Link href={`/event/1/guests`} className="text-blue-600 hover:underline">← חזרה לרשימת מוזמנים</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* רשימת תבניות */}
          <div className="bg-white rounded-3xl shadow p-8">
            <h2 className="text-2xl font-bold mb-6">התבניות שלי</h2>
            <div className="space-y-4">
              {templates.map(template => (
                <div 
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-6 border rounded-2xl cursor-pointer transition-all hover:shadow-md ${selectedTemplate?.id === template.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
                >
                  <div className="font-semibold text-lg mb-2">{template.name}</div>
                  <div className="text-sm text-gray-600 line-clamp-2">{template.content}</div>
                </div>
              ))}
            </div>
          </div>

          {/* תצוגה + שליחה */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow p-8">
            {selectedTemplate ? (
              <>
                <h2 className="text-2xl font-bold mb-6">{selectedTemplate.name}</h2>
                <div className="bg-gray-50 p-6 rounded-2xl text-gray-700 whitespace-pre-wrap mb-8 text-lg">
                  {selectedTemplate.content}
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">שלח תבנית זו</label>
                    <div className="flex gap-3">
                      <button onClick={() => sendToWhatsApp("0505270152", selectedTemplate.content)} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-medium">
                        לשמעון (050-5270152)
                      </button>
                      <button onClick={() => sendToWhatsApp("0507666937", selectedTemplate.content)} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-medium">
                        לנופר (050-7666937)
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4">שליחה חופשית</h3>
                    <input
                      type="tel"
                      placeholder="מספר טלפון (050-...)"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      className="w-full border rounded-2xl px-5 py-4 mb-3"
                    />
                    <textarea
                      placeholder="הודעה חופשית..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="w-full border rounded-2xl px-5 py-4 h-32 resize-y"
                    />
                    <button 
                      onClick={() => sendToWhatsApp(customPhone, customMessage || (selectedTemplate?.content || ''))}
                      className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-medium"
                    >
                      📱 שלח הודעה חופשית
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-400 text-xl">
                בחר תבנית מהרשימה
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}