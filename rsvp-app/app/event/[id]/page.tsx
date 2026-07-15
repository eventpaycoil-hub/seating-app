'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function SMSPage() {
  const params = useParams();
  const eventId = params?.id || params?.eventId || "1";

  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [creditLink, setCreditLink] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const loadEvent = () => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const event = events.find((e: any) => e.id.toString() === eventId.toString());
    
    if (event) {
      setCurrentEvent(event);
      setCreditLink(event.creditLink || '');
    }
  };

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const templates = [
    { id: 1, title: "הודעה מס 1 אישור הגעה", content: `שלום *שם*,\nהוזמנתם לחתונה של ${currentEvent?.owners} ב"${currentEvent?.hallName}" ב${currentEvent?.city} בתאריך ${currentEvent?.eventDate} בשעה ${currentEvent?.time}.\nהורי החתן: ${currentEvent?.groomParents}.\nהורי הכלה: ${currentEvent?.brideParents}.\nנא לאשר הגעה.` },
    { id: 2, title: "הודעה מס 2 תזכורת", content: `שלום *שם*,\nהערב נפגשים בחתונה של ${currentEvent?.owners} ב"${currentEvent?.hallName}" ב${currentEvent?.city} בשעה ${currentEvent?.time}.\n*פירוט מקום הישיבה*.\nמצפים ומתרגשים.\nלניווט לחץ על הקישור.\n\nלהענקת מתנה באשראי לחצו כאן: ${creditLink || 'קישור לא הוגדר'}` },
    { id: 3, title: "הודעה מס 3 תודה", content: `היה לנו אירוע מדהים בזכותכם!\nתודה רבה שחגגתם איתנו!\nאוהבים ${currentEvent?.owners} ❤️` },
    { id: 4, title: "הודעה מס 4 הסעה", content: `אישרתם הגעה לחתונה של ${currentEvent?.owners}.\nלהצטרפות להסעה לחצו כאן.` },
    { id: 5, title: "הודעה מס 5 ברקוד", content: `לרישום מהיר בכניסה לאולם בחתונה של ${currentEvent?.owners} לחץ על הקישור.` },
    { id: 6, title: "הודעה מס 6 טרם אישרת", content: `שלום *שם*,\nטרם אישרתם הגעה לחתונה של ${currentEvent?.owners} בתאריך ${currentEvent?.eventDate}.` }
  ];

  const sendTest = (phone: string) => {
    if (!selectedTemplate) return alert("בחר תבנית");
    alert(`✅ בדיקה נשלחה ל-${phone}\n\n${selectedTemplate.content}`);
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">
            SMS - {currentEvent?.owners || 'אירוע'}
          </h1>
          <button 
            onClick={loadEvent}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium flex items-center gap-2"
          >
            🔄 עדכן פרטי אירוע
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl shadow p-8">
            <h2 className="text-2xl font-bold mb-6">התבניות שלי</h2>
            <div className="space-y-4">
              {templates.map(t => (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={`p-5 rounded-2xl cursor-pointer border-2 transition-all ${selectedTemplate?.id === t.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
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
                <div className="bg-gray-50 p-8 rounded-2xl text-lg leading-relaxed whitespace-pre-wrap">
                  {selectedTemplate.content}
                </div>

                <div className="mt-10 space-y-4">
                  <button onClick={() => sendTest("0505270152")} className="w-full bg-green-600 text-white py-5 rounded-2xl text-lg">שלח דוגמא לשמעון</button>
                  <button onClick={() => sendTest("0507666937")} className="w-full bg-green-600 text-white py-5 rounded-2xl text-lg">שלח דוגמא לנופר</button>
                </div>
              </>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-400 text-2xl">בחר תבנית מהרשימה</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}