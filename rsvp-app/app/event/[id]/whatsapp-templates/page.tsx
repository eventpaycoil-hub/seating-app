'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function WhatsAppTemplatesPage() {
  const params = useParams();
  const eventId = params.id || "1";

  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [templates, setTemplates] = useState([
    { 
      id: 1, 
      name: "הזמנה ראשונית", 
      content: "שלום *שם*,\n\nהוזמנתם לחתונה של [שם בעלי השמחה] ב[שם האולם] בתאריך [תאריך].\n\nנשמח לראותכם!" 
    },
    { 
      id: 2, 
      name: "תזכורת הגעה", 
      content: "שלום *שם*,\n\nמחר/היום האירוע של [שם בעלי השמחה]!\nנשמח לראותכם." 
    },
    { 
      id: 3, 
      name: "תודה אחרי האירוע", 
      content: "תודה רבה שהגעתם לאירוע של [שם בעלי השמחה]!\nהיה מדהים לראות אתכם." 
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [customPhone, setCustomPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // טעינת פרטי האירוע
  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const event = events.find((e: any) => e.id.toString() === eventId.toString());
    if (event) setCurrentEvent(event);
  }, [eventId]);

  const sendToWhatsApp = (phone: string, message: string) => {
    if (!message) {
      alert("הזן הודעה");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/972${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">תבניות ווטסאפ</h1>
          <Link 
            href={`/event/${eventId}/guests`} 
            className="text-blue-600 hover:underline text-lg"
          >
            ← חזרה לרשימת מוזמנים
          </Link>
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
                      <button 
                        onClick={() => sendToWhatsApp("0505270152", selectedTemplate.content)} 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-medium"
                      >
                        לשמעון (050-5270152)
                      </button>
                      <button 
                        onClick={() => sendToWhatsApp("0507666937", selectedTemplate.content)} 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-medium"
                      >
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
                      onClick={() => sendToWhatsApp(customPhone, customMessage || selectedTemplate.content)}
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