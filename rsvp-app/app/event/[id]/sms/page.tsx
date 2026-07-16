'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SMSPage() {
  const params = useParams();
  const eventId = params.id || "1";

  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const event = events.find((e: any) => e.id.toString() === eventId.toString());
    if (event) setCurrentEvent(event);
  }, [eventId]);

  const updateEventDetails = () => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const event = events.find((e: any) => e.id.toString() === eventId.toString());
    if (event) {
      setCurrentEvent(event);
      alert('✅ פרטי האירוע עודכנו!');
    } else {
      alert('❌ לא נמצא אירוע עם ID זה');
    }
  };

  const templates = useMemo(() => [
    { 
      id: 1, 
      title: "הודעה מס 1 אישור הגעה", 
      content: `שלום *שם*,\n\nהוזמנתם לחתונה של ${currentEvent?.owners || 'החתן והכלה'} ב"${currentEvent?.hallName || 'האולם'}" ב${currentEvent?.city || ''} בתאריך ${currentEvent?.eventDate || currentEvent?.fullDate || currentEvent?.date || ''} בשעה ${currentEvent?.time || ''}.\n\nהורי החתן: ${currentEvent?.groomParents || ''}.\nהורי הכלה: ${currentEvent?.brideParents || ''}.\n\nנא לאשר הגעה או אי הגעה:\n\n👉 אישור הגעה: https://seating-app-dusky.vercel.app/landing?ref=*guestId*` 
    },
    { 
      id: 2, 
      title: "הודעה מס 2 תזכורת", 
      content: `שלום *שם*,\n\nהערב נפגשים בחתונה של ${currentEvent?.owners || 'החתן והכלה'} ב"${currentEvent?.hallName || 'האולם'}" ב${currentEvent?.city || ''} בשעה ${currentEvent?.time || ''}.\n\n*פירוט מקום הישיבה*.\n\nמצפים ומתרגשים!\n\nלניווט: https://waze.com/ul?q=${encodeURIComponent(currentEvent?.hallName || '')}` 
    },
    { 
      id: 3, 
      title: "הודעה מס 3 תודה", 
      content: `היה לנו אירוע מדהים בזכותכם!\nתודה רבה שחגגתם איתנו!\nשנתראה רק בשמחות.\nאוהבים ${currentEvent?.owners || 'החתן והכלה'} ❤️` 
    },
    { 
      id: 4, 
      title: "הודעה מס 4 הסעה", 
      content: `אישרתם הגעה לחתונה של ${currentEvent?.owners || 'החתן והכלה'}.\n\nלהצטרפות להסעה לחצו כאן:\n\n👉 בחר הסעה: https://seating-app-dusky.vercel.app/transport?event=${eventId}` 
    },
    { 
      id: 5, 
      title: "הודעה מס 5 ברקוד", 
      content: `לרישום מהיר בכניסה לאולם בחתונה של ${currentEvent?.owners || 'החתן והכלה'}:\n\n👉 הצג QR כניסה: https://seating-app-dusky.vercel.app/qr/${eventId}?guest=*guestId*` 
    },
    { 
      id: 6, 
      title: "הודעה מס 6 טרם אישרת", 
      content: `שלום *שם*,\n\nטרם אישרתם הגעה לחתונה של ${currentEvent?.owners || 'החתן והכלה'} ב"${currentEvent?.hallName || 'האולם'}" ב${currentEvent?.city || ''} בתאריך ${currentEvent?.eventDate || currentEvent?.fullDate || currentEvent?.date || ''} בשעה ${currentEvent?.time || ''}.\n\nהורי החתן: ${currentEvent?.groomParents || ''}.\nהורי הכלה: ${currentEvent?.brideParents || ''}.\n\nנא לאשר הגעה:\n\n👉 אישור הגעה: https://seating-app-dusky.vercel.app/landing?ref=*guestId*` 
    }
  ], [currentEvent, eventId]);

  const emojis = ['❤️','🎉','🙏','😊','🚀','🕊️','💐','✨','🙌','🎊','👍','👏','🥳','🌟','💖','🙂','😍','🎈','🏆','🔥','👑','🔔','📍','🗓️','⏰','📞','📲','💌'];

  const addEmoji = (emoji: string) => {
    if (selectedTemplate) {
      const newContent = selectedTemplate.content + ' ' + emoji;
      setSelectedTemplate({ ...selectedTemplate, content: newContent });
    }
  };

  const sendRealSMS = async (phone: string) => {
    if (!selectedTemplate) {
      alert("בחר תבנית קודם");
      return;
    }

    setIsSending(true);
    setSendingTo(phone);
    setLastResult(null);

    try {
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          message: selectedTemplate.content,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setLastResult(`✅ נשלח בהצלחה ל-${phone}`);
        alert(`✅ ההודעה נשלחה בהצלחה למספר ${phone}`);
      } else {
        setLastResult(`❌ שגיאה`);
        alert(`❌ שגיאה בשליחה`);
      }
    } catch (err: any) {
      setLastResult(`❌ שגיאת רשת`);
      alert('שגיאת רשת');
    } finally {
      setIsSending(false);
      setSendingTo(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">תבניות SMS</h1>
          <div className="flex gap-4">
            <button 
              onClick={updateEventDetails}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium flex items-center gap-2"
            >
              🔄 עדכן פרטי אירוע
            </button>
            <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline flex items-center">← חזרה לרשימת מוזמנים</Link>
          </div>
        </div>

        {lastResult && (
          <div className={`mb-6 p-4 rounded-2xl text-center font-medium ${lastResult.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {lastResult}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl shadow p-8">
            <h2 className="text-2xl font-bold mb-6">התבניות שלי</h2>
            <div className="space-y-3">
              {templates.map(t => (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`p-4 rounded-2xl cursor-pointer transition ${selectedTemplate?.id === t.id ? 'bg-blue-50 border border-blue-500' : 'hover:bg-gray-50'}`}
                >
                  <div className="font-semibold">{t.title}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow p-8">
            {selectedTemplate ? (
              <>
                <h2 className="text-3xl font-bold mb-6">{selectedTemplate.title}</h2>
                
                <div className="bg-gray-50 p-8 rounded-2xl text-gray-700 whitespace-pre-wrap mb-8 text-lg min-h-[400px] border">
                  {selectedTemplate.content}
                </div>

                <div className="mt-6">
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-blue-600"
                  >
                    {showEmojiPicker ? '🔼 הסתר סמיילים' : '😀 הצג סמיילים'}
                  </button>

                  {showEmojiPicker && (
                    <div className="mt-4 bg-white border rounded-3xl p-6 shadow-inner max-h-80 overflow-y-auto">
                      <div className="grid grid-cols-8 gap-3">
                        {emojis.map((emoji, i) => (
                          <button
                            key={i}
                            onClick={() => addEmoji(emoji)}
                            className="text-4xl hover:scale-125 active:scale-110 transition p-3 rounded-2xl hover:bg-gray-100"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 mt-8">
                  <button 
                    onClick={() => sendRealSMS("0505270152")} 
                    disabled={isSending}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-5 rounded-2xl font-medium text-lg"
                  >
                    {isSending && sendingTo === "0505270152" 
                      ? '⏳ שולח לשמעון...' 
                      : '📱 שלח דוגמא לשמעון (050-5270152)'}
                  </button>

                  <button 
                    onClick={() => sendRealSMS("0507666937")} 
                    disabled={isSending}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-5 rounded-2xl font-medium text-lg"
                  >
                    {isSending && sendingTo === "0507666937" 
                      ? '⏳ שולח לנופר...' 
                      : '📱 שלח דוגמא לנופר (050-7666937)'}
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