'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getGuests, saveGuests } from '../../../lib/guests';

export default function SMSPage() {
  const params = useParams();
  const eventId = params.id || "1";

  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [seatingTables, setSeatingTables] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editedMessage, setEditedMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const event = events.find((e: any) => e.id.toString() === eventId.toString());
    if (event) setCurrentEvent(event);

    const normalizedGuests = getGuests(String(eventId));
    setGuests(normalizedGuests);
    saveGuests(String(eventId), normalizedGuests);

    const seating = JSON.parse(localStorage.getItem('seatingTables') || '[]');
    setSeatingTables(seating);
  }, [eventId]);

  const [selectedGuestIds, setSelectedGuestIds] = useState<number[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedForSMS');
      if (saved) {
        setSelectedGuestIds(JSON.parse(saved));
      }
    }
  }, []);

  const activeGuest = useMemo(() => {
    if (selectedGuestIds.length > 0) {
      return guests.find(g => selectedGuestIds.includes(g.id)) || guests[0];
    }
    return guests[0];
  }, [guests, selectedGuestIds]);

  // המרת תאריך מ-2026-08-05 ל-08/05/2026
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    // אם כבר בפורמט יום/חודש/שנה
    if (dateStr.includes('/')) return dateStr;
    
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getTableNumberForGuest = (guestName: string): number | null => {
    for (const table of seatingTables) {
      if (table.assignedGuests && table.assignedGuests.includes(guestName)) {
        return table.tableNumber || null;
      }
    }
    return null;
  };

  // בניית הודעה דינמית
  const buildDynamicMessage = (template: any) => {
    if (!template) return '';
    let message = template.content;

    // החלפת שם
    if (activeGuest?.name && [1, 2, 6].includes(template.id)) {
      message = message.replace(/\*שם\*/g, activeGuest.name);
    }

    // קישורי אישור הגעה (תבניות 1 ו-6)
    if (template.id === 1 || template.id === 6) {
      const eventIdForLink = currentEvent?.id || eventId || '1';
      const guestCode = activeGuest?.inviteCode || 'TEST123';
      const rsvplink = `http://localhost:3000/landing?eventId=${eventIdForLink}&ref=${guestCode}`;
      
      message = message.replace(/\*guestId\*/g, guestCode);
      message = message.replace(/\*RSVP_LINK\*/g, rsvplink);
      message = message.replace(/ref=\*guestId\*/g, `ref=${guestCode}`);
    }

    // ===== תבנית 2 - תזכורת =====
    if (template.id === 2) {
      // 1. סידורי הושבה
      const isSeatingEnabled = currentEvent?.seatingArrangement === 'כן';
      
      if (isSeatingEnabled && activeGuest?.name) {
        const tableNum = getTableNumberForGuest(activeGuest.name);
        if (tableNum) {
          // כמה אנשים המוזמן עצמו מביא (לא כמה יושבים בשולחן)
          const peopleCount = Number(activeGuest.confirmed) || 
                              Number(activeGuest.confirmedCount) || 
                              Number(activeGuest.quantity) || 1;

          let seatingText = '';
          if (peopleCount === 1) seatingText = `הנך יושב בשולחן מספר ${tableNum}`;
          else if (peopleCount === 2) seatingText = `שניכם יושבים בשולחן מספר ${tableNum}`;
          else seatingText = `כולכם (${peopleCount}) יושבים בשולחן מספר ${tableNum}`;
          
          message = message.replace(/\*פירוט מקום הישיבה\*/g, seatingText);
        } else {
          message = message.replace(/\*פירוט מקום הישיבה\*/g, 'מקום הישיבה יפורט בהמשך');
        }
      } else {
        // אם אין סידורי הושבה – מוחקים את כל השורה
        message = message.replace(/\n?\*פירוט מקום הישיבה\*\.?/g, '');
      }

      // 2. קישור אשראי (מתנה)
      const creditLink = currentEvent?.creditLink?.trim();
      if (creditLink) {
        message = message.replace(
          /\*CREDIT_LINK\*/g,
          `\n\nלהענקת מתנה בכרטיס אשראי לחצו:\n${creditLink}`
        );
      } else {
        message = message.replace(/\n?\*CREDIT_LINK\*/g, '');
      }

      // 3. קישור WAZE נקי
      const hall = currentEvent?.hallName || '';
      const city = currentEvent?.city || '';
      const wazeQuery = encodeURIComponent(`${hall} ${city}`.trim());
      const wazeLink = `https://waze.com/ul?q=${wazeQuery}`;
      message = message.replace(/\*WAZE_LINK\*/g, wazeLink);
    }

    return message;
  };

  const templates = useMemo(() => {
    const formattedDate = formatDate(
      currentEvent?.eventDate || currentEvent?.fullDate || currentEvent?.date || ''
    );

    return [
      {
        id: 1,
        title: "הודעה מס 1 אישור הגעה",
        content: `שלום *שם*,\n\nהוזמנתם לחתונה של ${currentEvent?.owners || 'החתן והכלה'} ב"${currentEvent?.hallName || 'האולם'}" ב${currentEvent?.city || ''} בתאריך ${formattedDate} בשעה ${currentEvent?.time || ''}.\n\nהורי החתן: ${currentEvent?.groomParents || ''}.\nהורי הכלה: ${currentEvent?.brideParents || ''}.\n\nנא לאשר הגעה או אי הגעה:\n\n👉 אישור הגעה: *RSVP_LINK*`
      },
      {
        id: 2,
        title: "הודעה מס 2 תזכורת",
        content: `שלום *שם*,\n\nהערב נפגשים בחתונה של ${currentEvent?.owners || 'החתן והכלה'} ב"${currentEvent?.hallName || 'האולם'}" ב${currentEvent?.city || ''} בשעה ${currentEvent?.time || ''}.\n\n*פירוט מקום הישיבה*\n\nמצפים ומתרגשים!\n\nלניווט לחצו כאן:\n*WAZE_LINK**CREDIT_LINK*`
      },
      {
        id: 3,
        title: "הודעה מס 3 תודה",
        content: `היה לנו אירוע מדהים בזכותכם!\nתודה רבה שחגגתם איתנו!\nשנתראה רק בשמחות.\nאוהבים ${currentEvent?.owners || 'החתן והכלה'} ❤️`
      },
      {
        id: 4,
        title: "הודעה מס 4 הסעה",
        content: `אישרתם הגעה לחתונה של ${currentEvent?.owners || 'החתן והכלה'}.\n\nלהצטרפות להסעה לחצו כאן:\n\nבחר הסעה: http://localhost:3000/transport?eventId=${eventId}`
      },
      {
        id: 5,
        title: "הודעה מס 5 ברקוד",
        content: `לרישום מהיר בכניסה לאולם בחתונה של ${currentEvent?.owners || 'החתן והכלה'}:\n\nהצג QR כניסה: http://localhost:3000/qr/${eventId}?guest=*guestId*`
      },
      {
        id: 6,
        title: "הודעה מס 6 טרם אישרת",
        content: `שלום *שם*,\n\nטרם אישרתם הגעה לחתונה של ${currentEvent?.owners || 'החתן והכלה'} ב"${currentEvent?.hallName || 'האולם'}" ב${currentEvent?.city || ''} בתאריך ${formattedDate} בשעה ${currentEvent?.time || ''}.\n\nהורי החתן: ${currentEvent?.groomParents || ''}.\nהורי הכלה: ${currentEvent?.brideParents || ''}.\n\nנא לאשר הגעה:\n\nאישור הגעה: *RSVP_LINK*`
      }
    ];
  }, [currentEvent, eventId]);

  // כשבוחרים תבנית
  const handleSelectTemplate = (t: any) => {
    setSelectedTemplate(t);
    const built = buildDynamicMessage(t);
    setEditedMessage(built);
    setIsEditing(false);
    setShowEmojiPicker(false);
  };

  // הוספת אימוג'י
  const addEmoji = (emoji: string) => {
    setEditedMessage(prev => prev + emoji);
  };

  const emojis = [
    '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊',
    '😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋',
    '😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐',
    '🤨','😐','😑','😶','😏','😒','🙄','😬','😮‍💨','🤥',
    '😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮',
    '🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕',
    '😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧',
    '😨','😰','😥','😢','😭','😱','😖','😣','😞','😓',
    '😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀',
    '☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺',
    '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
    '❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️',
    '✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐',
    '⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐',
    '🎉','🎊','🎈','🎁','🏆','🥇','🥈','🥉','⚽','🏀',
    '🔥','⭐','🌟','✨','💫','💥','💢','💦','💨','🕊️',
    '🌸','🌺','🌹','🌷','🌻','🌼','💐','🍀','🌿','☘️'
  ];

  const sendRealSMS = async (phone: string) => {
    if (!selectedTemplate) return alert("בחר תבנית קודם");
    if (!editedMessage.trim()) return alert("ההודעה ריקה");

    setIsSending(true);
    setSendingTo(phone);

    try {
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: editedMessage }),
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
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline">
            ← חזרה לרשימת מוזמנים
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* רשימת תבניות */}
          <div className="bg-white rounded-3xl shadow p-8">
            <h2 className="text-2xl font-bold mb-6">התבניות שלי</h2>
            <div className="space-y-3">
              {templates.map(t => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className={`p-4 rounded-2xl cursor-pointer transition ${
                    selectedTemplate?.id === t.id
                      ? 'bg-blue-50 border border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">{t.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* תצוגה + עריכה */}
          <div className="bg-white rounded-3xl shadow p-8">
            {selectedTemplate ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold">{selectedTemplate.title}</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-medium"
                    >
                      {showEmojiPicker ? 'סגור סמיילים' : '😊 סמיילים'}
                    </button>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl font-medium"
                    >
                      {isEditing ? 'סגור עריכה' : '✏️ ערוך'}
                    </button>
                  </div>
                </div>

                {/* בורר סמיילים */}
                {showEmojiPicker && (
                  <div className="mb-6 bg-white border rounded-2xl p-4 shadow-inner max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-10 gap-2">
                      {emojis.map((emoji, i) => (
                        <button
                          key={i}
                          onClick={() => addEmoji(emoji)}
                          className="text-2xl hover:scale-125 transition p-1 rounded-lg hover:bg-gray-100"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isEditing ? (
                  <textarea
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    className="w-full h-96 p-6 border-2 border-amber-300 rounded-2xl text-lg leading-relaxed resize-y focus:outline-none focus:border-amber-500"
                    dir="rtl"
                  />
                ) : (
                  <div className="bg-gray-50 p-8 rounded-2xl text-gray-700 whitespace-pre-wrap mb-8 text-lg min-h-[400px] border overflow-hidden break-words">
                    {editedMessage}
                  </div>
                )}

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