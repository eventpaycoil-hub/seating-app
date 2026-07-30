// @ts-nocheck
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getGuests, saveGuests } from '../../../../lib/guests';

const DEFAULT_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊',
  '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋',
  '🤗', '🤔', '🫡', '🤫', '🤭', '😮', '😲', '🥺', '😢', '😭',
  '🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🥂', '🍾', '🍷',
  '💍', '💎', '👰', '🤵', '💃', '🕺', '🎵', '🎶', '🎤', '🎧',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💞',
  '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💌', '🌹', '🥀',
  '✨', '🌟', '⭐', '💫', '🔥', '☀️', '🌙', '🌸', '🌺', '🌻',
  '🌼', '🌷', '💐', '🌿', '🕊️', '🦋', '🌈', '☁️', '🍀', '🎯',
  '👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '✌️', '🤞', '👋',
  '✅', '❌', '💯', '📌', '📍', '🏠', '🚗', '⏰', '📅', '📸',
];

function getEventInvitePhrase(event: any, en = false) {
  const owners = event?.owners || (en ? 'the hosts' : 'בעלי השמחה');
  const type = event?.eventType || 'חתונה';

  if (en) {
    if (type === 'בר מצוה') return `You are invited to the Bar Mitzvah of ${owners}`;
    if (type === 'בת מצוה') return `You are invited to the Bat Mitzvah of ${owners}`;
    if (type === 'בר ובת מצוה') return `You are invited to the Bar & Bat Mitzvah of ${owners}`;
    if (type === 'ברית') return `You are invited to the Brit of ${owners}`;
    if (type === 'בריתה') return `You are invited to the Brita of ${owners}`;
    if (type === 'כנס') return `You are invited to the event of ${owners}`;
    return `You are invited to the wedding of ${owners}`;
  }

  if (type === 'בר מצוה') return `הוזמנתם לבר המצווה של ${owners}`;
  if (type === 'בת מצוה') return `הוזמנתם לבת המצווה של ${owners}`;
  if (type === 'בר ובת מצוה') return `הוזמנתם לבר ובת המצווה של ${owners}`;
  if (type === 'ברית') return `הוזמנתם לברית של ${owners}`;
  if (type === 'בריתה') return `הוזמנתם לבריתה של ${owners}`;
  if (type === 'כנס') return `הוזמנתם לכנס של ${owners}`;
  return `הוזמנתם לחתונה של ${owners}`;
}

function getWelcomeBlock(event: any, en = false) {
  const line = (event?.welcomeLine || '').trim();
  if (line) {
    return en ? `We look forward to seeing you, ${line}` : `נשמח לראותכם: ${line}`;
  }

  const type = event?.eventType || 'חתונה';
  const g = (event?.groomParents || '').trim();
  const b = (event?.brideParents || '').trim();

  if ((type === 'חתונה' || type === 'אחר') && (g || b)) {
    if (en) {
      const parts = [];
      if (g) parts.push(`Groom's parents: ${g}`);
      if (b) parts.push(`Bride's parents: ${b}`);
      return parts.join('\n');
    }
    const parts = [];
    if (g) parts.push(`הורי החתן: ${g}.`);
    if (b) parts.push(`הורי הכלה: ${b}.`);
    return parts.join('\n');
  }
  return '';
}

function getShortEventNoun(event: any, en = false) {
  const type = event?.eventType || 'חתונה';
  if (en) {
    if (type === 'בר מצוה') return 'Bar Mitzvah';
    if (type === 'בת מצוה') return 'Bat Mitzvah';
    if (type === 'בר ובת מצוה') return 'Bar & Bat Mitzvah';
    if (type === 'ברית') return 'Brit';
    if (type === 'בריתה') return 'Brita';
    if (type === 'כנס') return 'event';
    return 'wedding';
  }
  if (type === 'בר מצוה') return 'בר המצווה';
  if (type === 'בת מצוה') return 'בת המצווה';
  if (type === 'בר ובת מצוה') return 'בר ובת המצווה';
  if (type === 'ברית') return 'הברית';
  if (type === 'בריתה') return 'הבריתה';
  if (type === 'כנס') return 'הכנס';
  return 'החתונה';
}

export default function SMSPage() {
  const params = useParams();
  const eventId = params.id || '1';

  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [seatingTables, setSeatingTables] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editedMessage, setEditedMessage] = useState('');
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [selectedGuestIds, setSelectedGuestIds] = useState<number[]>([]);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [customEmojis, setCustomEmojis] = useState<string[]>([]);
  const [newEmoji, setNewEmoji] = useState('');
  const [useGuestName, setUseGuestName] = useState(false);
    const [landingImage, setLandingImage] = useState<1 | 2>(1);

  const emojis = useMemo(
    () => [...DEFAULT_EMOJIS, ...customEmojis],
    [customEmojis]
  );

  const isEnglishEvent =
    currentEvent?.englishEvent === 'כן' ||
    currentEvent?.englishEvent === true ||
    currentEvent?.englishEvent === 'yes';

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sms_custom_emojis') || '[]');
      if (Array.isArray(saved)) setCustomEmojis(saved);
    } catch {}
  }, []);

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const event = events.find((e: any) => e.id.toString() === eventId.toString());
    if (event) setCurrentEvent(event);

    (async () => {
      const { loadGuests } = await import('../../../../lib/guests');
      const list = await loadGuests(String(eventId));
      setGuests(list);
    })();

    const seating = JSON.parse(localStorage.getItem('seatingTables') || '[]');
    setSeatingTables(seating);
  }, [eventId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedForSMS');
      if (saved) {
        try {
          setSelectedGuestIds(JSON.parse(saved));
        } catch {}
      }
    }
  }, []);

  const selectedGuestsList = useMemo(() => {
    return guests.filter(
      (g) =>
        selectedGuestIds.includes(g.id) ||
        selectedGuestIds.includes(String(g.id)) ||
        selectedGuestIds.includes(Number(g.id))
    );
  }, [guests, selectedGuestIds]);

  const activeGuest = useMemo(() => {
    if (selectedGuestsList.length > 0) return selectedGuestsList[0];
    return null;
  }, [guests, selectedGuestsList]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
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

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') return window.location.origin;
    return 'https://www.eventpay1.co.il';
  };

  const buildDynamicMessage = (template: any, guestOverride?: any) => {
    if (!template) return '';
    let message = template.content;
    const guest = guestOverride || activeGuest;
    const en = isEnglishEvent;

    if (template.id === 4) {
      const eventIdForLink = currentEvent?.id || eventId || '1';
      const guestCode = guest?.inviteCode || guest?.id || '';
      const transportLink = `${getBaseUrl()}/transport?eventId=${eventIdForLink}&ref=${guestCode}`;
      message = message.replace(/\*TRANSPORT_LINK\*/g, transportLink);
    }

    // שם אורח / משפחה וחברים — בלי "שלום" לפני משפחה וחברים
    if ([1, 2, 6].includes(template.id)) {
      if (useGuestName && guest?.name) {
        message = message.replace(/\*שם\*/g, guest.name);
        message = message.replace(/\*name\*/g, guest.name);
      } else if (en) {
        message = message.replace(/Hi \*name\*,?\s*/gi, 'Dear family and friends,\n\n');
        message = message.replace(/\*name\*/g, 'family and friends');
      } else {
        message = message.replace(/שלום \*שם\*,?\s*/g, 'משפחה וחברים יקרים,\n\n');
        message = message.replace(/\*שם\*/g, 'משפחה וחברים יקרים');
      }
    }

    if (template.id === 1 || template.id === 6) {
      const eventIdForLink = currentEvent?.id || eventId || '1';
      const guestCode = guest?.inviteCode || guest?.id || 'TEST123';

      let rsvplink = '';
      if (
        currentEvent?.useExternalLanding === 'כן' &&
        currentEvent?.externalLandingUrl
      ) {
        rsvplink = String(currentEvent.externalLandingUrl).trim();
      } else {
                rsvplink = `${getBaseUrl()}/landing?eventId=${eventIdForLink}&ref=${guestCode}&img=${landingImage}`;
      }

      message = message.replace(/\*guestId\*/g, String(guestCode));
      message = message.replace(/\*RSVP_LINK\*/g, rsvplink);
      message = message.replace(/ref=\*guestId\*/g, `ref=${guestCode}`);
    }

    if (template.id === 2) {
      const isSeatingEnabled = currentEvent?.seatingArrangement === 'כן';

      if (isSeatingEnabled && guest?.name) {
        const tableNum = getTableNumberForGuest(guest.name);
        if (tableNum) {
          const peopleCount =
            Number(guest.confirmed) ||
            Number(guest.confirmedCount) ||
            Number(guest.quantity) ||
            1;

          let seatingText = '';
          if (en) {
            if (peopleCount === 1) seatingText = `You are seated at table number ${tableNum}`;
            else if (peopleCount === 2)
              seatingText = `Both of you are seated at table number ${tableNum}`;
            else
              seatingText = `All of you (${peopleCount}) are seated at table number ${tableNum}`;
          } else {
            if (peopleCount === 1) seatingText = `הנך יושב בשולחן מספר ${tableNum}`;
            else if (peopleCount === 2)
              seatingText = `שניכם יושבים בשולחן מספר ${tableNum}`;
            else seatingText = `כולכם (${peopleCount}) יושבים בשולחן מספר ${tableNum}`;
          }

          message = message.replace(/\*פירוט מקום הישיבה\*/g, seatingText);
          message = message.replace(/\*SEATING_DETAIL\*/g, seatingText);
        } else {
          const fallback = en ? 'Seating details will follow' : 'מקום הישיבה יפורט בהמשך';
          message = message.replace(/\*פירוט מקום הישיבה\*/g, fallback);
          message = message.replace(/\*SEATING_DETAIL\*/g, fallback);
        }
      } else {
        message = message.replace(/\n?\*פירוט מקום הישיבה\*\.?/g, '');
        message = message.replace(/\n?\*SEATING_DETAIL\*\.?/g, '');
      }

      const creditLink = currentEvent?.creditLink?.trim();
      if (creditLink) {
        const creditBlock = en
          ? `\n\nTo send a gift by credit card:\n${creditLink}`
          : `\n\nלהענקת מתנה בכרטיס אשראי לחצו:\n${creditLink}`;
        message = message.replace(/\*CREDIT_LINK\*/g, creditBlock);
      } else {
        message = message.replace(/\n?\*CREDIT_LINK\*/g, '');
      }

      const hall = currentEvent?.hallName || '';
      const city = currentEvent?.city || '';
      const wazeQuery = encodeURIComponent(`${hall} ${city}`.trim());
      const wazeLink = `https://waze.com/ul?q=${wazeQuery}`;
      message = message.replace(/\*WAZE_LINK\*/g, wazeLink);
    }

    if (template.id === 5) {
      const guestCode = guest?.id || guest?.inviteCode || '';
      const phone = String(guest?.phone || '').replace(/\D/g, '');
      const name = guest?.name || '';

      message = message.replace(/\*guestId\*/g, String(guestCode));
      message = message.replace(/\*PHONE\*/g, phone);
      message = message.replace(/\*NAME\*/g, encodeURIComponent(name));
    }

    return message;
  };

  const templates = useMemo(() => {
    const formattedDate = formatDate(
      currentEvent?.eventDate || currentEvent?.fullDate || currentEvent?.date || ''
    );
    const owners = currentEvent?.owners || (isEnglishEvent ? 'the couple' : 'החתן והכלה');
    const hall = currentEvent?.hallName || (isEnglishEvent ? 'the venue' : 'האולם');
    const city = currentEvent?.city || '';
    const time = currentEvent?.time || '';
    const invite = getEventInvitePhrase(currentEvent, isEnglishEvent);
    const welcome = getWelcomeBlock(currentEvent, isEnglishEvent);
    const noun = getShortEventNoun(currentEvent, isEnglishEvent);
    // פעם אחת בלבד — אם יש welcome מפורט, לא מוסיפים עוד "נשמח לראותכם"
    const welcomeBlock = welcome ? `\n\n${welcome}` : (isEnglishEvent ? '' : '\n\nנשמח לראותכם!');
    const base =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://www.eventpay1.co.il';

    if (isEnglishEvent) {
      return [
        {
          id: 1,
          title: 'Message 1 – RSVP',
          content: `Hi *name*,\n\n${invite} at "${hall}" in ${city} on ${formattedDate} at ${time}.${welcomeBlock}\n\nPlease confirm attendance:\n\n👉 Confirm here:\n*RSVP_LINK*`,
        },
        {
          id: 2,
          title: 'Message 2 – Reminder',
          content: `Hi *name*,\n\nTonight we celebrate the ${noun} of ${owners} at "${hall}" in ${city} at ${time}.\n\n*SEATING_DETAIL*\n\nLooking forward to seeing you!\n\nDirections:\n*WAZE_LINK*\n*CREDIT_LINK*`,
        },
        {
          id: 3,
          title: 'Message 3 – Thank you',
          content: `What an amazing celebration thanks to you!\nThank you for celebrating with us!\nSee you at the next happy occasion.\nLove, ${owners} ❤️`,
        },
        {
          id: 4,
          title: 'Message 4 – Transport',
          content: `You confirmed attendance at the ${noun} of ${owners}.\n\nTo join transportation click here:\n*TRANSPORT_LINK*`,
        },
        {
          id: 5,
          title: 'Message 5 – QR code',
          content: `For quick check-in at the ${noun} of ${owners}:\n\nShow entrance QR:\n${base}/qr/*guestId*?eventId=${eventId}`,
        },
        {
          id: 6,
          title: 'Message 6 – Not yet confirmed',
          content: `Hi *name*,\n\nYou have not yet confirmed attendance for the ${noun} of ${owners} at "${hall}" in ${city} on ${formattedDate} at ${time}.${welcomeBlock}\n\nPlease confirm:\n\n👉 Confirm here:\n*RSVP_LINK*`,
        },
      ];
    }

    return [
      {
        id: 1,
        title: 'הודעה מס 1 אישור הגעה',
        content: `שלום *שם*,\n\n${invite} ב"${hall}" ב${city} בתאריך ${formattedDate} בשעה ${time}.${welcomeBlock}\n\n👇 נא לאשר הגעה או אי הגעה — לחצו על הקישור:\n*RSVP_LINK*`,
      },
      {
        id: 2,
        title: 'הודעה מס 2 תזכורת',
        content: `שלום *שם*,\n\nהערב נפגשים ב${noun} של ${owners} ב"${hall}" ב${city} בשעה ${time}.\n\n*פירוט מקום הישיבה*\n\nמצפים ומתרגשים!\n\nלניווט לחצו כאן:\n*WAZE_LINK*\n*CREDIT_LINK*`,
      },
      {
        id: 3,
        title: 'הודעה מס 3 תודה',
        content: `היה לנו אירוע מדהים בזכותכם!\nתודה רבה שחגגתם איתנו!\nשנתראה רק בשמחות.\nאוהבים ${owners} ❤️`,
      },
      {
        id: 4,
        title: 'הודעה מס 4 הסעה',
        content: `אישרתם הגעה ל${noun} של ${owners}.\n\nלהצטרפות להסעה לחצו כאן:\n*TRANSPORT_LINK*`,
      },
      {
        id: 5,
        title: 'הודעה מס 5 ברקוד',
        content: `לרישום מהיר בכניסה לאולם ב${noun} של ${owners}:\n\nהצג QR כניסה:\n${base}/qr/*guestId*?eventId=${eventId}&phone=*PHONE*&name=*NAME*`,
      },
      {
        id: 6,
        title: 'הודעה מס 6 טרם אישרת',
        content: `שלום *שם*,\n\nטרם אישרתם הגעה ל${noun} של ${owners} ב"${hall}" ב${city} בתאריך ${formattedDate} בשעה ${time}.${welcomeBlock}\n\nנא לאשר הגעה:\n\n👉 לאישור הגעה לחצו על הקישור:\n*RSVP_LINK*`,
      },
    ];
  }, [currentEvent, eventId, isEnglishEvent]);

  useEffect(() => {
    setSelectedTemplate(null);
    setEditedMessage('');
    setIsEditing(false);
  }, [isEnglishEvent, currentEvent?.eventType, currentEvent?.welcomeLine]);

  useEffect(() => {
    if (!selectedTemplate) return;
    if (![1, 2, 6].includes(selectedTemplate.id)) return;
    if (isEditing) return;
    setEditedMessage(buildDynamicMessage(selectedTemplate));
    }, [useGuestName, activeGuest, selectedTemplate?.id, landingImage]);

  const handleSelectTemplate = (t: any) => {
    setSelectedTemplate(t);
    const built = buildDynamicMessage(t);
    setEditedMessage(built);
    setIsEditing(false);
    setShowEmojiPicker(false);
    setBulkResult(null);
  };

  const addEmoji = (emoji: string) => {
    if (!isEditing) setIsEditing(true);

    const el = messageRef.current;
    if (!el) {
      setEditedMessage((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart ?? editedMessage.length;
    const end = el.selectionEnd ?? editedMessage.length;
    const next = editedMessage.slice(0, start) + emoji + editedMessage.slice(end);
    setEditedMessage(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const addCustomEmoji = () => {
    const e = newEmoji.trim();
    if (!e) return;
    if (emojis.includes(e)) {
      alert('הסמייל כבר קיים ברשימה');
      return;
    }
    const updated = [...customEmojis, e];
    setCustomEmojis(updated);
    localStorage.setItem('sms_custom_emojis', JSON.stringify(updated));
    setNewEmoji('');
  };

  const sendRealSMS = async (phone: string) => {
    if (!selectedTemplate) return alert(isEnglishEvent ? 'Select a template first' : 'בחר תבנית קודם');
    if (!editedMessage.trim()) return alert(isEnglishEvent ? 'Message is empty' : 'ההודעה ריקה');

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
        alert(isEnglishEvent ? `✅ Sent to ${phone}` : `✅ נשלח בהצלחה ל-${phone}`);
      } else {
        alert(isEnglishEvent ? '❌ Send failed' : '❌ שגיאה בשליחה');
      }
    } catch {
      alert(isEnglishEvent ? 'Network error' : 'שגיאת רשת');
    } finally {
      setIsSending(false);
      setSendingTo(null);
    }
  };

  const sendToSelected = async () => {
    if (!selectedTemplate) return alert('בחר תבנית קודם');
    if (selectedGuestsList.length === 0) return alert('לא נבחרו מוזמנים');

    const withPhone = selectedGuestsList.filter((g) => g.phone && String(g.phone).trim());
    if (withPhone.length === 0) return alert('למסומנים אין מספרי טלפון');

    if (!confirm(`לשלוח SMS ל־${withPhone.length} מוזמנים?`)) return;

    setIsSending(true);
    setSendingTo('bulk');
    setBulkResult(null);

    const items = withPhone.map((g) => ({
      phone: String(g.phone).trim(),
      message: isEditing ? editedMessage : buildDynamicMessage(selectedTemplate, g),
    }));

    try {
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();

      if (data.success) {
        setBulkResult(
          `✅ נשלח ל־${data.sent || items.length} מוזמנים` +
            (data.failed ? ` | נכשלו: ${data.failed}` : '')
        );
        localStorage.removeItem('selectedForSMS');
        setSelectedGuestIds([]);
      } else {
        setBulkResult(
          `❌ שגיאה: ${typeof data.error === 'string' ? data.error : JSON.stringify(data.error || data)}`
        );
      }
    } catch (e: any) {
      setBulkResult(`❌ שגיאת רשת: ${e?.message || ''}`);
    } finally {
      setIsSending(false);
      setSendingTo(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">תבניות SMS</h1>
            {isEnglishEvent && (
              <p className="text-sm text-blue-600 mt-1 font-medium">
                🌐 אירוע באנגלית – התבניות מוצגות באנגלית
              </p>
            )}
            {currentEvent?.eventType && (
              <p className="text-sm text-slate-500 mt-1">
                סוג אירוע: {currentEvent.eventType}
                {currentEvent.welcomeLine ? ` · ${currentEvent.welcomeLine}` : ''}
              </p>
            )}
          </div>
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline">
            ← חזרה לרשימת מוזמנים
          </Link>
        </div>

        {selectedGuestsList.length > 0 && (
          <div className="mb-6 p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-300">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-bold text-emerald-800 text-lg">
                  נבחרו {selectedGuestsList.length} מוזמנים לשליחה
                </div>
                <div className="text-sm text-emerald-700 mt-1">
                  {selectedGuestsList
                    .slice(0, 8)
                    .map((g) => g.name)
                    .join(' · ')}
                  {selectedGuestsList.length > 8 ? ` ועוד ${selectedGuestsList.length - 8}...` : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={sendToSelected}
                disabled={isSending || !selectedTemplate}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow"
              >
                {isSending && sendingTo === 'bulk'
                  ? '⏳ שולח למסומנים...'
                  : `📱 שלח למסומנים (${selectedGuestsList.length})`}
              </button>
            </div>
            {!selectedTemplate && (
              <p className="text-amber-700 text-sm mt-3">בחר תבנית משמאל כדי להפעיל שליחה</p>
            )}
          </div>
        )}

        {bulkResult && (
          <div className="mb-6 p-4 rounded-2xl bg-white border text-lg whitespace-pre-wrap">
            {bulkResult}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl shadow p-8">
            <h2 className="text-2xl font-bold mb-6">התבניות שלי</h2>
            <div className="space-y-3">
              {templates.map((t) => (
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

          <div className="bg-white rounded-3xl shadow p-8">
            {selectedTemplate ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">{selectedTemplate.title}</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl font-medium"
                    >
                      {showEmojiPicker ? 'סגור' : '😊'}
                    </button>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl font-medium"
                    >
                      {isEditing ? 'סגור עריכה' : '✏️ ערוך'}
                    </button>
                  </div>
                </div>

                {[1, 2, 6].includes(selectedTemplate.id) && (
                  <div className="mb-4 p-4 rounded-2xl bg-slate-50 border flex items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      {useGuestName
                        ? isEnglishEvent
                          ? 'Using guest name from list'
                          : 'משתמש בשם האורח מהרשימה'
                        : isEnglishEvent
                          ? 'Default: family and friends'
                          : 'ברירת מחדל: משפחה וחברים יקרים'}
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <span className="text-sm font-medium">
                        {isEnglishEvent ? 'Use guest name' : 'שם האורח'}
                      </span>
                      <input
                        type="checkbox"
                        checked={useGuestName}
                        onChange={(e) => {
                          setUseGuestName(e.target.checked);
                          setIsEditing(false);
                        }}
                        className="w-5 h-5"
                      />
                    </label>
                  </div>
                )}
                {[1, 6].includes(selectedTemplate.id) && (
                  <div className="mb-4 p-4 rounded-2xl bg-amber-50 border flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-gray-700 font-medium">
                      תמונה בדף הנחיתה לקישור הזה
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLandingImage(1);
                          setIsEditing(false);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border ${
                          landingImage === 1
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        תמונה 1
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLandingImage(2);
                          setIsEditing(false);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border ${
                          landingImage === 2
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        תמונה 2
                      </button>
                    </div>
                  </div>
                )}
                {showEmojiPicker && (
                  <div className="mb-6 bg-white border rounded-2xl p-4 shadow-inner">
                    <div className="grid grid-cols-10 gap-2 max-h-40 overflow-y-auto">
                      {emojis.map((emoji, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => addEmoji(emoji)}
                          className="text-2xl hover:scale-125 transition p-1 rounded-lg hover:bg-gray-100"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2 items-center border-t pt-4">
                      <input
                        type="text"
                        value={newEmoji}
                        onChange={(e) => setNewEmoji(e.target.value)}
                        placeholder="הדבק סמייל כאן 😊"
                        className="flex-1 border rounded-2xl px-4 py-3 text-2xl text-center"
                        maxLength={8}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomEmoji();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addCustomEmoji}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-medium whitespace-nowrap"
                      >
                        ＋ הוסף סמייל
                      </button>
                    </div>
                  </div>
                )}

                {isEditing ? (
                  <textarea
                    ref={messageRef}
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    className="w-full h-96 p-6 border-2 border-amber-300 rounded-2xl text-lg leading-relaxed resize-y focus:outline-none focus:border-amber-500"
                    dir={isEnglishEvent ? 'ltr' : 'rtl'}
                    style={{ caretColor: '#000' }}
                  />
                ) : (
                  <div
                    className="bg-gray-50 p-8 rounded-2xl text-gray-700 whitespace-pre-wrap mb-8 text-lg min-h-[400px] border overflow-hidden break-words"
                    dir={isEnglishEvent ? 'ltr' : 'rtl'}
                  >
                    {editedMessage}
                  </div>
                )}

                <div className="space-y-4 mt-8">
                  {selectedGuestsList.length > 0 && (
                    <button
                      type="button"
                      onClick={sendToSelected}
                      disabled={isSending}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white py-5 rounded-2xl font-bold text-lg"
                    >
                      {isSending && sendingTo === 'bulk'
                        ? '⏳ שולח למסומנים...'
                        : `📱 שלח למסומנים (${selectedGuestsList.length})`}
                    </button>
                  )}

                  <button
                    onClick={() => sendRealSMS('0505270152')}
                    disabled={isSending}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-5 rounded-2xl font-medium text-lg"
                  >
                    {isSending && sendingTo === '0505270152'
                      ? '⏳ שולח לשמעון...'
                      : '📱 שלח דוגמא לשמעון (050-5270152)'}
                  </button>

                  <button
                    onClick={() => sendRealSMS('0507666937')}
                    disabled={isSending}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-5 rounded-2xl font-medium text-lg"
                  >
                    {isSending && sendingTo === '0507666937'
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