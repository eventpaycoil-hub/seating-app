// @ts-nocheck
'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getGuests } from '../lib/guests';

const TEXTS = {
  he: {
    invalidLink: 'קישור לא תקין',
    missingDetails: 'הקישור חסר פרטים.',
    weddingOf: 'החתונה של',
    ourEvent: 'האירוע שלנו',
    atHour: 'בשעה',
    gladToSee: 'נשמח מאוד לראותכם בשמחתנו!',
    coming: 'מגיע',
    notComing: 'לא מגיע',
    coming1: 'מגיע 1',
    coming2: 'נגיע 2',
    howMany: 'כמה אורחים תגיעו?',
    moreThan5: 'יותר מ-5',
    unknown: 'לא יודע כרגע, צרו איתי קשר בעוד מספר ימים',
    personalNote: 'מעוניין לענות בנוסח אישי',
    thanks: 'תודה רבה!',
    confirmedFor: 'אישרת הגעה ל-',
    guests: 'אורחים',
    redirectSeparation: 'מעביר אותך לבחירת הפרדה...',
    sorryNotComing: 'מצטערים שלא תוכלו להגיע',
    thanksUpdate: 'תודה על העדכון',
    thanksShort: 'תודה!',
    willContact: 'ניצור איתך קשר בהמשך כדי לתאם.',
    guestNotFound: 'לא נמצא מוזמן',
    invalidCode: 'הקוד שהוזן אינו תקף לאירוע זה.',
    generalLink: 'קישור כללי',
    generalLinkText: 'הקישור הזה הוא כללי.\nהקישור האישי שלך נשלח אליך ב-SMS.',
    personalMessage: 'הודעה אישית',
    personalPlaceholder: 'כתוב כאן את ההודעה האישית שלך...',
    cancel: 'ביטול',
    send: 'שלח',
    writeMessage: 'נא לכתוב הודעה',
    messageSaved: 'ההודעה נשמרה בהצלחה!',
    invalidLinkAlert: 'קישור לא תקין',
  },
  en: {
    invalidLink: 'Invalid link',
    missingDetails: 'This link is missing details.',
    weddingOf: 'The wedding of',
    ourEvent: 'Our Event',
    atHour: 'at',
    gladToSee: 'We would be delighted to celebrate with you!',
    coming: 'Attending',
    notComing: 'Not attending',
    coming1: '1 guest',
    coming2: '2 guests',
    howMany: 'How many guests will attend?',
    moreThan5: 'More than 5',
    unknown: "Not sure yet — please contact me in a few days",
    personalNote: 'Reply with a personal message',
    thanks: 'Thank you!',
    confirmedFor: 'You confirmed attendance for ',
    guests: 'guests',
    redirectSeparation: 'Redirecting to seating preference...',
    sorryNotComing: "We're sorry you can't make it",
    thanksUpdate: 'Thank you for letting us know',
    thanksShort: 'Thank you!',
    willContact: "We'll be in touch soon to coordinate.",
    guestNotFound: 'Guest not found',
    invalidCode: 'This code is not valid for this event.',
    generalLink: 'General link',
    generalLinkText: 'This is a general link.\nYour personal link was sent to you by SMS.',
    personalMessage: 'Personal message',
    personalPlaceholder: 'Write your personal message here...',
    cancel: 'Cancel',
    send: 'Send',
    writeMessage: 'Please write a message',
    messageSaved: 'Message saved successfully!',
    invalidLinkAlert: 'Invalid link',
  },
};

function LandingPageContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const code = searchParams.get('code') || searchParams.get('ref');

  const [event, setEvent] = useState<any>(null);
  const [heroMedia, setHeroMedia] = useState<{ type: 'video' | 'image'; url: string } | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<'none' | 'confirmed' | 'notFound' | 'general' | 'pending' | 'notComing'>('none');
  const [rsvpCount, setRsvpCount] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [showPersonalNote, setShowPersonalNote] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [lang, setLang] = useState<'he' | 'en'>('he');

  const isEnglishEvent =
    event?.englishEvent === 'כן' ||
    event?.englishEvent === true ||
    event?.englishEvent === 'yes';

  const t = TEXTS[lang];
  const dir = lang === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (!eventId) return;
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
    if (currentEvent) {
      setEvent(currentEvent);
      // ברירת מחדל לאנגלית רק אם מסומן אירוע באנגלית
      if (
        currentEvent.englishEvent === 'כן' ||
        currentEvent.englishEvent === true ||
        currentEvent.englishEvent === 'yes'
      ) {
        setLang('en');
      }
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    const videos = JSON.parse(localStorage.getItem(`videos_event_${eventId}`) || '[]');
    if (videos.length > 0) {
      setHeroMedia({ type: 'video', url: videos[0].url });
      return;
    }

    const globalMedia = JSON.parse(localStorage.getItem('eventpay-media') || '[]');
    const firstImage = globalMedia.find((item: any) => item.type === 'image');

    if (firstImage) {
      setHeroMedia({ type: 'image', url: firstImage.url });
    } else {
      setHeroMedia({ type: 'image', url: '/chatan-kala.jpg' });
    }
  }, [eventId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const findGuestIndex = (saved: any[], searchCode: string) => {
    return saved.findIndex(
      (g: any) =>
        g.inviteCode === searchCode ||
        g.code === searchCode ||
        String(g.id) === searchCode ||
        (g.name && g.name.toLowerCase().includes(searchCode.toLowerCase()))
    );
  };

  const handleRsvp = (count: number) => {
    if (!eventId) {
      alert(t.invalidLinkAlert);
      return;
    }

    if (!code) {
      setRsvpStatus('general');
      return;
    }

    let saved: any[] = getGuests(String(eventId));
    const guestIndex = findGuestIndex(saved, code);

    if (guestIndex === -1) {
      setRsvpStatus('notFound');
      return;
    }

    saved[guestIndex].confirmed = count;
    saved[guestIndex].confirmedCount = count;
    saved[guestIndex].count = count;

    const key = `guests_event_${eventId}`;
    localStorage.setItem(key, JSON.stringify(saved));

    setRsvpCount(count);
    setRsvpStatus('confirmed');

    if (event?.hasSeparation === 'כן') {
      setTimeout(() => {
        window.location.href = `/separation?eventId=${eventId}&guestId=${saved[guestIndex].id}`;
      }, 1500);
    }
  };

  const handleNotComing = () => {
    if (!eventId || !code) {
      setRsvpStatus('general');
      return;
    }

    let saved: any[] = getGuests(String(eventId));
    const guestIndex = findGuestIndex(saved, code);

    if (guestIndex === -1) {
      setRsvpStatus('notFound');
      return;
    }

    saved[guestIndex].confirmed = 'לא מגיע';
    saved[guestIndex].confirmedCount = 0;
    saved[guestIndex].count = 0;

    const key = `guests_event_${eventId}`;
    localStorage.setItem(key, JSON.stringify(saved));

    setRsvpStatus('notComing');
  };

  const handleUnknown = () => {
    if (!eventId || !code) {
      setRsvpStatus('general');
      return;
    }

    let saved: any[] = getGuests(String(eventId));
    const guestIndex = findGuestIndex(saved, code);

    if (guestIndex === -1) {
      setRsvpStatus('notFound');
      return;
    }

    saved[guestIndex].confirmed = 'לא ידוע';
    saved[guestIndex].confirmedCount = 0;

    const key = `guests_event_${eventId}`;
    localStorage.setItem(key, JSON.stringify(saved));

    setRsvpStatus('pending');
  };

  const handlePersonalNoteSubmit = () => {
    if (!personalNote.trim()) {
      alert(t.writeMessage);
      return;
    }

    if (code && eventId) {
      let saved: any[] = getGuests(String(eventId));
      const guestIndex = findGuestIndex(saved, code);

      if (guestIndex !== -1) {
        saved[guestIndex].notes = personalNote;
        const key = `guests_event_${eventId}`;
        localStorage.setItem(key, JSON.stringify(saved));
      }
    }

    alert(t.messageSaved);
    setShowPersonalNote(false);
    setPersonalNote('');
    setRsvpStatus('confirmed');
  };

  const eventType = event?.eventType || '';
  const isTwoButtons = eventType === '2 כפתורים' || eventType === 'אחר';
  const isThreeButtons = eventType === '3 כפתורים' || eventType === 'אחר 2';

  if (!eventId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f1e3]" dir="rtl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-4">{TEXTS.he.invalidLink}</h2>
          <p>{TEXTS.he.missingDetails}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f1e3]" dir={dir}>
      {/* מתג שפה – רק אם מסומן אירוע באנגלית */}
      {isEnglishEvent && (
        <div className="bg-[#2a1c14] text-white py-2 px-4 flex justify-center gap-2 text-sm">
          <button
            onClick={() => setLang('he')}
            className={`px-4 py-1.5 rounded-full font-medium transition ${
              lang === 'he' ? 'bg-white text-[#3f2a1e]' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            עברית
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-4 py-1.5 rounded-full font-medium transition ${
              lang === 'en' ? 'bg-white text-[#3f2a1e]' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            English
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#3f2a1e] text-white py-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-light tracking-widest">
          {event?.owners
            ? `${t.weddingOf} ${event.owners}`
            : t.ourEvent}
        </h1>
      </div>

      {/* Hero */}
      <div className="flex justify-center pt-8 pb-4">
        <div className="w-full max-w-[1100px] px-4">
          <div className="relative w-full aspect-[3/2] rounded-3xl overflow-hidden shadow-2xl">
            {heroMedia?.type === 'video' ? (
              <video
                src={heroMedia.url}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <img
                src={heroMedia?.url || '/chatan-kala.jpg'}
                alt="Invitation"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-6 pb-16 text-center">
        {/* פרטי האירוע */}
        <div className="mb-10 text-[#3f2a1e]">
          <div className="text-4xl font-semibold mb-3 tracking-wide">
            {formatDate(event?.fullDate || event?.eventDate || event?.date)}
          </div>
          <div className="text-2xl mb-1.5">{event?.hallName}</div>
          {event?.city && <div className="text-xl mb-1.5">{event.city}</div>}
          <div className="text-xl">
            {t.atHour} {event?.time || '19:30'}
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-[#3f2a1e]">
          {t.gladToSee}
        </h2>

        {/* בחירת כמות */}
        {rsvpStatus === 'none' && (
          <div className="space-y-6">
            {isTwoButtons && (
              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <button
                  onClick={() => handleRsvp(1)}
                  className="flex-1 max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white text-2xl font-bold py-8 rounded-3xl shadow-lg active:scale-95 transition-all"
                >
                  {t.coming}
                </button>
                <button
                  onClick={handleNotComing}
                  className="flex-1 max-w-xs bg-red-500 hover:bg-red-600 text-white text-2xl font-bold py-8 rounded-3xl shadow-lg active:scale-95 transition-all"
                >
                  {t.notComing}
                </button>
              </div>
            )}

            {isThreeButtons && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => handleRsvp(1)}
                  className="flex-1 max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold py-7 rounded-3xl shadow-lg active:scale-95 transition-all"
                >
                  {t.coming1}
                </button>
                <button
                  onClick={() => handleRsvp(2)}
                  className="flex-1 max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold py-7 rounded-3xl shadow-lg active:scale-95 transition-all"
                >
                  {t.coming2}
                </button>
                <button
                  onClick={handleNotComing}
                  className="flex-1 max-w-xs bg-red-500 hover:bg-red-600 text-white text-xl font-bold py-7 rounded-3xl shadow-lg active:scale-95 transition-all"
                >
                  {t.notComing}
                </button>
              </div>
            )}

            {!isTwoButtons && !isThreeButtons && (
              <>
                <p className="text-xl">{t.howMany}</p>

                <div className="flex flex-wrap gap-4 justify-center">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleRsvp(num)}
                      className="w-20 h-20 bg-[#3f2a1e] hover:bg-[#5c4033] text-white text-3xl font-bold rounded-full active:scale-95 transition-all shadow-lg"
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowMore(!showMore)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-10 py-3 rounded-2xl text-lg font-medium"
                >
                  {t.moreThan5}
                </button>

                {showMore && (
                  <div className="flex flex-wrap gap-4 justify-center pt-4 border-t">
                    {[6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleRsvp(num)}
                        className="w-16 h-16 bg-[#3f2a1e] hover:bg-[#5c4033] text-white text-2xl font-bold rounded-full active:scale-95"
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                )}

                <div className="pt-4">
                  <button
                    onClick={handleNotComing}
                    className="w-full max-w-md mx-auto bg-red-100 hover:bg-red-200 text-red-700 py-4 rounded-2xl text-lg font-medium transition-all mb-3"
                  >
                    {t.notComing}
                  </button>
                  <button
                    onClick={handleUnknown}
                    className="w-full max-w-md mx-auto bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-2xl text-lg font-medium transition-all"
                  >
                    {t.unknown}
                  </button>
                </div>

                <button
                  onClick={() => setShowPersonalNote(true)}
                  className="mt-4 px-8 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-2xl text-lg font-medium transition-all"
                >
                  {t.personalNote}
                </button>
              </>
            )}
          </div>
        )}

        {rsvpStatus === 'confirmed' && (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-12">
            <div className="text-7xl mb-6">🎉</div>
            <h3 className="text-3xl font-bold text-green-800 mb-2">{t.thanks}</h3>
            <p className="text-xl text-green-700">
              {t.confirmedFor}
              {rsvpCount} {t.guests}
            </p>
            {event?.hasSeparation === 'כן' && (
              <p className="text-sm text-green-600 mt-3">{t.redirectSeparation}</p>
            )}
          </div>
        )}

        {rsvpStatus === 'notComing' && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-12">
            <div className="text-6xl mb-6">😔</div>
            <h3 className="text-3xl font-bold text-red-800 mb-3">{t.sorryNotComing}</h3>
            <p className="text-xl text-red-700">{t.thanksUpdate}</p>
          </div>
        )}

        {rsvpStatus === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-12">
            <div className="text-6xl mb-6">📞</div>
            <h3 className="text-3xl font-bold text-blue-800 mb-3">{t.thanksShort}</h3>
            <p className="text-xl text-blue-700">{t.willContact}</p>
          </div>
        )}

        {rsvpStatus === 'notFound' && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-12">
            <h3 className="text-2xl font-bold text-red-700 mb-4">{t.guestNotFound}</h3>
            <p>{t.invalidCode}</p>
          </div>
        )}

        {rsvpStatus === 'general' && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-12">
            <h3 className="text-2xl font-bold text-amber-700 mb-4">{t.generalLink}</h3>
            <p className="whitespace-pre-line">{t.generalLinkText}</p>
          </div>
        )}
      </div>

      {showPersonalNote && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4" dir={dir}>
            <h3 className="text-2xl font-bold mb-4">{t.personalMessage}</h3>
            <textarea
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              className="w-full h-40 p-4 border rounded-2xl mb-6"
              placeholder={t.personalPlaceholder}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowPersonalNote(false)}
                className="flex-1 py-3 border rounded-2xl"
              >
                {t.cancel}
              </button>
              <button
                onClick={handlePersonalNoteSubmit}
                className="flex-1 py-3 bg-[#3f2a1e] text-white rounded-2xl"
              >
                {t.send}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">טוען...</div>}>
      <LandingPageContent />
    </Suspense>
  );
}