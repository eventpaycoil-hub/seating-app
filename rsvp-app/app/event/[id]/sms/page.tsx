// @ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function SMSPage() {
  const params = useParams();
  const eventId = params.id || "1";

  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [seatingTables, setSeatingTables] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const event = events.find((e: any) => e.id.toString() === eventId.toString());
    if (event) setCurrentEvent(event);

    const guestsKey = `guests_event_${eventId}`;
    const savedGuests = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    setGuests(savedGuests);

    const seating = JSON.parse(localStorage.getItem('seatingTables') || '[]');
    setSeatingTables(seating);
  }, [eventId]);

  const selectedGuestIds = useMemo(() => {
    const saved = localStorage.getItem('selectedForSMS');
    return saved ? JSON.parse(saved) : [];
  }, []);

  const activeGuest = useMemo(() => {
    if (selectedGuestIds.length > 0) {
      return guests.find(g => selectedGuestIds.includes(g.id)) || guests[0];
    }
    return guests[0];
  }, [guests, selectedGuestIds]);

  const getTableNumberForGuest = (guestName: string): number | null => {
    for (const table of seatingTables) {
      if (table.assignedGuests && table.assignedGuests.includes(guestName)) {
        return table.tableNumber || null;
      }
    }
    return null;
  };

  // === בניית הודעה דינמית ===
  const buildDynamicMessage = (template: any) => {
    if (!template) return '';
    if (!activeGuest) return template.content;

    let message = template.content;
    const guestName = activeGuest.name;

    // החלפת שם (רק בהודעות 1,2,6)
    if ([1, 2, 6].includes(template.id)) {
      message = message.replace(/\*שם\*/g, guestName);
    }

    // === החלפת פירוט מקום ישיבה - רק בהודעה 2 ===
    if (template.id === 2) {
      const isSeatingEnabled = currentEvent?.seatingArrangement === 'כן';

      if (isSeatingEnabled) {
        const tableNum = getTableNumberForGuest(guestName);

        if (tableNum) {
          const table = seatingTables.find(t => t.tableNumber === tableNum);
          const peopleCount = table?.assignedGuests?.length || 1;

          let seatingText = '';
          if (peopleCount === 1) {
            seatingText = `הנך יושב בשולחן מספר ${tableNum}`;
          } else if (peopleCount === 2) {
            seatingText = `שניכם יושבים בשולחן מספר ${tableNum}`;
          } else {
            seatingText = `כולכם (${peopleCount}) יושבים בשולחן מספר ${tableNum}`;
          }

          message = message.replace(/\*פירוט מקום הישיבה\*/g, seatingText);
        } else {
          // אם אין שולחן אבל כן עושים הושבה
          message = message.replace(/\*פירוט מקום הישיבה\*/g, 'מקום הישיבה יפורט בהמשך');
        }
      } else {
        // אם לא עושים הושבה בכלל - מוחקים את השורה לגמרי
        message = message.replace(/\n?\*פירוט מקום הישיבה\*\.?/g, '');
      }
    }

    return message;
  };

  // === התבניות המלאות ===
  const templates = useMemo(() => [
    { 
      id: 1, 
      title: "הודעה מס 1 אישור הגעה", 
      content: `שלום *שם*,\n\nהוזמנתם לחתונה של ${currentEvent?.owners || 'החתן והכלה'} ב"${currentEvent?.hallName || 'האולם'}" ב${currentEvent?.city || ''} בתאריך ${currentEvent?.eventDate || currentEvent?.fullDate || currentEvent?.date || ''} בשעה ${currentEvent?.time || ''}.\n\nהורי החתן: ${currentEvent?.groomParents || ''}.\nהורי הכלה: ${currentEvent?.brideParents || ''}.\n\nנא לאשר הגעה או אי הגעה:\n\nאישור הגעה: https://seating-app-dusky.vercel.app/landing?ref=*guestId*` 
    },
    { 
      id: 2, 
      title: "הודעה מס 2 תזכורת", 
      content: `שלום *שם*,\n\nהערב נפגשים בחתונה של ${currentEvent?.owners || 'החתן והכלה'} ב"${currentEvent?.hallName || 'האולם'}" ב${currentEvent?.city || ''} בשעה ${currentEvent?.time || ''}.\n\n*פירוט מקום הישיבה*.\n\nמצפים ומתרגשים!\n\nלניווט: https://waze.com/ul?q=${currentEvent?.hallName || ''}` 
    },
    { 
      id: 3, 
      title: "הודעה מס 3 תודה", 
      content: `היה לנו אירוע מדהים בזכותכם!\nתודה רבה שחגגתם איתנו!\nשנתראה רק בשמחות.\nאוהבים ${currentEvent?.owners || 'החתן והכלה'} ❤️` 
    },
    { 
      id: 4, 
      title: "הודעה מס 4 הסעה", 
      content: `אישרתם הגעה לחתונה של ${currentEvent?.owners || 'החתן והכלה'}.\n\nלהצטרפות להסעה לחצו כאן:\n\nבחר הסעה: https://seating-app-dusky.vercel.app/transport?event=${eventId}` 
    },
    { 
      id: 5, 
      title: "הודעה מס 5 ברקוד", 
      content: `לרישום מהיר בכניסה לאולם בחתונה של ${currentEvent?.owners || 'החתן והכלה'}:\n\nהצג QR כניסה: https://seating-app-dusky.vercel.app/qr/${eventId}?guest=*guestId*` 
    },
    { 
      id: 6, 
      title: "הודעה מס 6 טרם אישרת", 
      content: `שלום *שם*,\n\nטרם אישרתם הגעה לחתונה של ${currentEvent?.owners || 'החתן והכלה'} ב"${currentEvent?.hallName || 'האולם'}" ב${currentEvent?.city || ''} בתאריך ${currentEvent?.eventDate || currentEvent?.fullDate || currentEvent?.date || ''} בשעה ${currentEvent?.time || ''}.\n\nהורי החתן: ${currentEvent?.groomParents || ''}.\nהורי הכלה: ${currentEvent?.brideParents || ''}.\n\nנא לאשר הגעה:\n\nאישור הגעה: https://seating-app-dusky.vercel.app/landing?ref=*guestId*` 
    }
  ], [currentEvent, eventId]);

  const previewMessage = selectedTemplate ? buildDynamicMessage(selectedTemplate) : '';

  const sendRealSMS = async (phone: string) => {
    if (!selectedTemplate) return alert("בחר תבנית קודם");

    setIsSending(true);
    setSendingTo(phone);

    const finalMessage = buildDynamicMessage(selectedTemplate);

    try {
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: finalMessage }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ נשלח בהצלחה ל-${phone}`);
      } else {
        alert('❌ שגיאה בשליחה');
      }
    } catch {
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
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline">← חזרה לרשימת מוזמנים</Link>
        </div>

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
                  {previewMessage}
                </div>

                <div className="space-y-4 mt-8">
                  <button 
                    onClick={() => sendRealSMS("0505270152")} 
                    disabled={isSending}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-5 rounded-2xl font-medium text-lg"
                  >
                    {isSending && sendingTo === "0505270152" ? '⏳ שולח לשמעון...' : '📱 שלח דוגמא לשמעון (050-5270152)'}
                  </button>

                  <button 
                    onClick={() => sendRealSMS("0507666937")} 
                    disabled={isSending}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-5 rounded-2xl font-medium text-lg"
                  >
                    {isSending && sendingTo === "0507666937" ? '⏳ שולח לנופר...' : '📱 שלח דוגמא לנופר (050-7666937)'}
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