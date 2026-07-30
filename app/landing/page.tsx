// @ts-nocheck
'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadGuests, saveGuests, updateGuestInSupabase } from '../../lib/guests';
import { supabase } from '../../lib/supabase.js';

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
    seeYou: 'נתראה בשמחה!',
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
    loading: 'טוען...',
    redirecting: 'מעביר לדף הנחיתה...',
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
    seeYou: 'See you at the celebration!',
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
    loading: 'Loading...',
    redirecting: 'Redirecting to the event page...',
  },
};

function findGuestIndex(saved: any[], searchCode: string) {
  if (!searchCode || !Array.isArray(saved)) return -1;
  const sc = String(searchCode).trim();
  return saved.findIndex((g: any) => {
    if (!g) return false;
    if (g.inviteCode != null && String(g.inviteCode) === sc) return true;
    if (g.code != null && String(g.code) === sc) return true;
    if (g.id != null && String(g.id) === sc) return true;
    if (g.phone) {
      const p = String(g.phone).replace(/\D/g, '');
      const c = sc.replace(/\D/g, '');
      if (p && c && p === c) return true;
    }
    return false;
  });
}

function getPreferredCover(eventId: string, event: any, imgParam?: string | null) {
  try {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const current =
      events.find((e: any) => String(e.id) === String(eventId)) || event || {};

    if (imgParam === '1' && (current?.coverUrl || event?.coverUrl)) {
      return current?.coverUrl || event?.coverUrl || '';
    }
    if (imgParam === '2' && (current?.coverUrl2 || event?.coverUrl2)) {
      return current?.coverUrl2 || event?.coverUrl2 || '';
    }

    const slot =
      Number(localStorage.getItem(`landing_cover_slot_${eventId}`)) === 2 ||
      current?.landingCover === 2
        ? 2
        : 1;
    if (slot === 2 && current?.coverUrl2) return current.coverUrl2;
    return current?.coverUrl || event?.coverUrl || '';
  } catch {
    return event?.coverUrl || '';
  }
}

function resolveRsvpMode(event: any) {
  if (event?.rsvpMode) return event.rsvpMode;
  const t = event?.eventType || '';
  if (t === '2 כפתורים') return '2 כפתורים';
  if (t === '3 כפתורים' || t === 'אחר 3') return '3 כפתורים';
  return 'רגיל';
}

function getEventTitlePrefix(event: any, lang: 'he' | 'en') {
  const type = event?.eventType || 'חתונה';
  if (lang === 'en') {
    if (type === 'בר מצוה') return 'The Bar Mitzvah of';
    if (type === 'בת מצוה') return 'The Bat Mitzvah of';
    if (type === 'בר ובת מצוה') return 'The Bar & Bat Mitzvah of';
    if (type === 'ברית') return 'The Brit of';
    if (type === 'בריתה') return 'The Brita of';
    if (type === 'כנס') return 'The event of';
    return 'The wedding of';
  }
  if (type === 'בר מצוה') return 'בר המצווה של';
  if (type === 'בת מצוה') return 'בת המצווה של';
  if (type === 'בר ובת מצוה') return 'בר ובת המצווה של';
  if (type === 'ברית') return 'הברית של';
  if (type === 'בריתה') return 'הבריתה של';
  if (type === 'כנס') return 'הכנס של';
  return 'החתונה של';
}

function LandingPageContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const code = searchParams.get('code') || searchParams.get('ref');
  const imgParam = searchParams.get('img');
  const [event, setEvent] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroMedia, setHeroMedia] = useState<{ type: 'video' | 'image'; url: string } | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<
    'none' | 'confirmed' | 'notFound' | 'general' | 'pending' | 'notComing'
  >('none');
  const [rsvpCount, setRsvpCount] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [showPersonalNote, setShowPersonalNote] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [lang, setLang] = useState<'he' | 'en'>('he');
  const [guestName, setGuestName] = useState('');
  const [externalRedirect, setExternalRedirect] = useState(false);

  const isEnglishEvent =
    event?.englishEvent === 'כן' ||
    event?.englishEvent === true ||
    event?.englishEvent === 'yes';

  const t = TEXTS[lang];
  const dir = lang === 'he' ? 'rtl' : 'ltr';

  const rsvpMode = resolveRsvpMode(event);
  const isTwoButtons = rsvpMode === '2 כפתורים';
  const isThreeButtons = rsvpMode === '3 כפתורים';

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
        const currentEvent = events.find((e: any) => String(e.id) === String(eventId));
        if (currentEvent && !cancelled) {
          setEvent(currentEvent);
          if (
            currentEvent.englishEvent === 'כן' ||
            currentEvent.englishEvent === true ||
            currentEvent.englishEvent === 'yes'
          ) {
            setLang('en');
          }

          if (
            currentEvent.useExternalLanding === 'כן' &&
            currentEvent.externalLandingUrl
          ) {
            setExternalRedirect(true);
            window.location.href = String(currentEvent.externalLandingUrl).trim();
            return;
          }
        }
      } catch (e) {
        console.error('load event local error', e);
      }

      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', Number(eventId))
          .maybeSingle();

        if (!error && data && !cancelled) {
          const mapped = {
            id: data.id,
            rsvpMode: data.rsvp_mode || data.rsvpMode || 'רגיל',
            welcomeLine: data.welcome_line || data.welcomeLine || '',
            useExternalLanding:
              data.use_external_landing || data.useExternalLanding || 'לא',
            externalLandingUrl:
              data.external_landing_url || data.externalLandingUrl || '',
            eventType: data.event_type || data.eventType || '',
            owners: data.owners || data.title || '',
            title: data.title || data.owners || '',
            hallName: data.hall_name || data.hallName || '',
            city: data.city || '',
            time: data.time || '19:30',
            eventDate: data.event_date || data.eventDate || '',
            fullDate: data.full_date || data.fullDate || data.event_date || '',
            englishEvent: data.english_event || data.englishEvent || 'לא',
            hasSeparation: data.has_separation || data.hasSeparation || 'לא',
            hasTransport: data.has_transport || data.hasTransport || 'לא',
            guestNotes: data.guest_notes || data.guestNotes || 'כן',
            coverUrl: data.cover_url || data.coverUrl || '',
            coverUrl2: data.cover_url2 || data.coverUrl2 || '',
          };
          setEvent((prev: any) => ({ ...(prev || {}), ...mapped }));
          if (mapped.englishEvent === 'כן' || mapped.englishEvent === true) {
            setLang('en');
          }
        }
      } catch (e) {
        console.warn('events table query failed', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    if (externalRedirect) return;

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 4000);

    (async () => {
      try {
        const list = await loadGuests(String(eventId));
        if (!cancelled) {
          setGuests(list);
          if (code) {
            const idx = findGuestIndex(list, String(code));
            if (idx !== -1) setGuestName(list[idx].name || '');
          }
        }
      } catch (e) {
        console.error('loadGuests error', e);
      } finally {
        if (!cancelled) setLoading(false);
        clearTimeout(timeoutId);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [eventId, code, externalRedirect]);

  useEffect(() => {
    if (!eventId || externalRedirect) return;

    let cancelled = false;

    (async () => {
      const preferred = getPreferredCover(String(eventId), event, imgParam);
      if (!cancelled && preferred) {
        setHeroMedia({ type: 'image', url: preferred });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('events')
          .select('cover_url')
          .eq('id', Number(eventId))
          .maybeSingle();

        if (!cancelled && !error && data?.cover_url) {
          setHeroMedia({ type: 'image', url: data.cover_url });
          return;
        }
      } catch (e) {
        console.warn('cover_url query failed', e);
      }

      if (!cancelled && event?.coverUrl) {
        setHeroMedia({ type: 'image', url: event.coverUrl });
        return;
      }

      try {
        const videos = JSON.parse(localStorage.getItem(`videos_event_${eventId}`) || '[]');
        if (videos.length > 0 && videos[0].url) {
          if (!cancelled) setHeroMedia({ type: 'video', url: videos[0].url });
          return;
        }
        const eventMedia = JSON.parse(localStorage.getItem(`eventpay-media_${eventId}`) || '[]');
        const firstImage = eventMedia.find((item: any) => item.type === 'image' && item.url);
        if (firstImage?.url) {
          if (!cancelled) setHeroMedia({ type: 'image', url: firstImage.url });
          return;
        }
      } catch {}

      if (!cancelled) {
        setHeroMedia({ type: 'image', url: '/chatan-kala.jpg' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventId, event?.coverUrl, event?.coverUrl2, event?.landingCover, externalRedirect, imgParam]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const persistGuestUpdate = async (updatedList: any[], guest: any) => {
    setGuests(updatedList);
    saveGuests(String(eventId), updatedList);
    try {
      await updateGuestInSupabase(guest, String(eventId));
    } catch (e) {
      console.warn('updateGuestInSupabase failed', e);
    }
  };

  const handleRsvp = async (count: number) => {
    if (!eventId) {
      alert(t.invalidLinkAlert);
      return;
    }
    if (!code) {
      setRsvpStatus('general');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const guestIndex = findGuestIndex(guests, String(code));
    if (guestIndex === -1) {
      setRsvpStatus('notFound');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const now = new Date().toISOString();
    const updated = [...guests];
    updated[guestIndex] = {
      ...updated[guestIndex],
      confirmed: String(count),
      confirmedCount: count,
      count: count,
      confirmedSource: 'link',
      confirmedAt: now,
    };

    await persistGuestUpdate(updated, updated[guestIndex]);

    setRsvpCount(count);
    setGuestName(updated[guestIndex].name || '');
    setRsvpStatus('confirmed');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (event?.hasSeparation === 'כן') {
      setTimeout(() => {
        window.location.href = `/separation?eventId=${eventId}&guestId=${updated[guestIndex].id}`;
      }, 1800);
    }
  };

  const handleNotComing = async () => {
    if (!eventId || !code) {
      setRsvpStatus('general');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const guestIndex = findGuestIndex(guests, String(code));
    if (guestIndex === -1) {
      setRsvpStatus('notFound');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const now = new Date().toISOString();
    const updated = [...guests];
    updated[guestIndex] = {
      ...updated[guestIndex],
      confirmed: 'לא מגיע',
      confirmedCount: 0,
      count: 0,
      confirmedSource: 'link',
      confirmedAt: now,
    };

    await persistGuestUpdate(updated, updated[guestIndex]);
    setRsvpStatus('notComing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUnknown = async () => {
    if (!eventId || !code) {
      setRsvpStatus('general');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const guestIndex = findGuestIndex(guests, String(code));
    if (guestIndex === -1) {
      setRsvpStatus('notFound');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const now = new Date().toISOString();
    const updated = [...guests];
    updated[guestIndex] = {
      ...updated[guestIndex],
      confirmed: 'ממתין',
      confirmedCount: 0,
      count: 0,
      confirmedSource: 'link',
      confirmedAt: now,
      notes:
        (updated[guestIndex].notes || '') +
        (updated[guestIndex].notes ? '\n' : '') +
        'המוזמן סימן: לא יודע כרגע',
    };

    await persistGuestUpdate(updated, updated[guestIndex]);
    setRsvpStatus('pending');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePersonalNoteSubmit = async () => {
    if (!personalNote.trim()) {
      alert(t.writeMessage);
      return;
    }
    if (code && eventId) {
      const guestIndex = findGuestIndex(guests, String(code));
      if (guestIndex !== -1) {
        const updated = [...guests];
        const existing = (updated[guestIndex].notes || '').trim();
        const noteText = `הערת מוזמן: ${personalNote.trim()}`;
        updated[guestIndex] = {
          ...updated[guestIndex],
          notes: existing ? `${existing}\n${noteText}` : noteText,
        };
        await persistGuestUpdate(updated, updated[guestIndex]);
      }
    }
    alert(t.messageSaved);
    setShowPersonalNote(false);
    setPersonalNote('');
    setRsvpStatus('confirmed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayTitle = event?.owners || event?.title || event?.hallName || t.ourEvent;
  const titlePrefix = getEventTitlePrefix(event, lang);

  if (!eventId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f0e6]" dir="rtl">
        <div className="text-center px-6">
          <h2 className="text-3xl font-bold text-red-600 mb-4">{TEXTS.he.invalidLink}</h2>
          <p className="text-slate-600">{TEXTS.he.missingDetails}</p>
        </div>
      </div>
    );
  }

  if (externalRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f0e6]" dir="rtl">
        <div className="text-xl text-slate-600 animate-pulse">{t.redirecting}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f0e6]" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#3f2a1e]/30 border-t-[#3f2a1e] rounded-full animate-spin" />
          <div className="text-lg text-slate-600">{t.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f0e6]" dir={dir}>
      {isEnglishEvent && (
        <div className="bg-[#2a1c14] text-white py-2.5 px-4 flex justify-center gap-2 text-sm sticky top-0 z-40">
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

      {/* כותרת */}
      <header className="bg-gradient-to-b from-[#3f2a1e] to-[#2f1f16] text-white py-7 sm:py-9 text-center px-4 shadow-lg">
        <p className="text-[11px] sm:text-xs tracking-[0.25em] uppercase opacity-70 mb-2 font-light">
          {lang === 'he' ? 'הזמנה לאירוע' : 'Event Invitation'}
        </p>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-wide leading-snug max-w-3xl mx-auto">
          {event?.owners ? (
            <>
              <span className="opacity-80">{titlePrefix}</span>
              <br className="sm:hidden" />
              <span className="font-semibold"> {event.owners}</span>
            </>
          ) : (
            displayTitle
          )}
        </h1>
        
      </header>

      {rsvpStatus !== 'none' ? (
        <div className="max-w-lg mx-auto px-5 py-12 sm:py-16 text-center">
          {rsvpStatus === 'confirmed' && (
            <div className="bg-white/90 border border-emerald-200 rounded-[2rem] p-8 sm:p-12 shadow-xl backdrop-blur">
              <div className="text-6xl sm:text-7xl mb-5">🎉</div>
              <h3 className="text-3xl sm:text-4xl font-bold text-emerald-800 mb-2">{t.thanks}</h3>
              
              <p className="text-xl sm:text-2xl text-emerald-700 mb-3">
                {t.confirmedFor}
                {rsvpCount} {t.guests}
              </p>
              <p className="text-lg text-emerald-600 font-medium">{t.seeYou}</p>
              {event?.hasSeparation === 'כן' && (
                <p className="text-sm text-emerald-600 mt-4 opacity-80">{t.redirectSeparation}</p>
              )}
            </div>
          )}

          {rsvpStatus === 'notComing' && (
            <div className="bg-white/90 border border-rose-200 rounded-[2rem] p-8 sm:p-12 shadow-xl">
              <div className="text-5xl sm:text-6xl mb-5">😔</div>
              <h3 className="text-2xl sm:text-3xl font-bold text-rose-800 mb-3">{t.sorryNotComing}</h3>
              <p className="text-lg text-rose-700">{t.thanksUpdate}</p>
            </div>
          )}

          {rsvpStatus === 'pending' && (
            <div className="bg-white/90 border border-sky-200 rounded-[2rem] p-8 sm:p-12 shadow-xl">
              <div className="text-5xl sm:text-6xl mb-5">📞</div>
              <h3 className="text-2xl sm:text-3xl font-bold text-sky-800 mb-3">{t.thanksShort}</h3>
              <p className="text-lg text-sky-700">{t.willContact}</p>
            </div>
          )}

          {rsvpStatus === 'notFound' && (
            <div className="bg-white/90 border border-rose-200 rounded-[2rem] p-8 sm:p-12 shadow-xl">
              <h3 className="text-2xl font-bold text-rose-700 mb-3">{t.guestNotFound}</h3>
              <p className="text-slate-600">{t.invalidCode}</p>
              <p className="text-xs text-slate-400 mt-3 font-mono">ref: {code}</p>
            </div>
          )}

          {rsvpStatus === 'general' && (
            <div className="bg-white/90 border border-amber-200 rounded-[2rem] p-8 sm:p-12 shadow-xl">
              <h3 className="text-2xl font-bold text-amber-800 mb-3">{t.generalLink}</h3>
              <p className="whitespace-pre-line text-slate-700">{t.generalLinkText}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* תמונה עם מסגרת בטוחה */}
          <div className="flex justify-center pt-6 sm:pt-10 pb-2 px-4">
            <div className="w-full max-w-[520px] sm:max-w-[640px] md:max-w-[760px]">
              {/* מסגרת חיצונית — לא נשברת עם גדלים שונים */}
              <div className="p-[3px] sm:p-1 rounded-[1.25rem] sm:rounded-[1.75rem] bg-gradient-to-br from-[#c4a574] via-[#e8d5b0] to-[#a67c52] shadow-2xl shadow-[#3f2a1e]/20">
                <div className="p-1.5 sm:p-2.5 rounded-[1.1rem] sm:rounded-[1.5rem] bg-[#f7f0e6]">
                  <div className="relative w-full aspect-[3/4] sm:aspect-[3/4] max-h-[78vh] rounded-[0.9rem] sm:rounded-[1.25rem] overflow-hidden bg-[#e8dfd0]">
                    {heroMedia?.type === 'video' ? (
                      <video
                        src={heroMedia.url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover object-center"
                      />
                    ) : (
                      <img
                        src={heroMedia?.url || '/chatan-kala.jpg'}
                        alt="Invitation"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* פרטי אירוע + כפתורים */}
          <div className="max-w-xl mx-auto px-5 pt-8 pb-16 text-center">
            <div className="mb-8 text-[#3f2a1e]">
              <div className="text-4xl sm:text-5xl font-semibold tracking-wide mb-2">
                {formatDate(event?.fullDate || event?.eventDate || event?.date)}
              </div>
              {event?.hallName && (
                <div className="text-2xl sm:text-3xl font-medium opacity-90">{event.hallName}</div>
              )}
              {event?.city && (
                <div className="text-lg sm:text-xl opacity-75 mt-0.5">{event.city}</div>
              )}
              <div className="text-base sm:text-lg opacity-70 mt-1">
                {t.atHour} {event?.time || '19:30'}
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-[#3f2a1e] leading-snug">
              {t.gladToSee}
            </h2>

            <div className="space-y-5">
              {isTwoButtons && (
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <button
                    onClick={() => handleRsvp(1)}
                    className="flex-1 sm:max-w-[220px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-2xl sm:text-3xl font-bold py-5 sm:ppy-6 sm:py-7 rounded-2xly-6 rounded-2xl shadow-lg shadow-emerald-900/20 transition-all"
                  >
                    {t.coming}
                  </button>
                  <button
                    onClick={handleNotComing}
                    className="flex-1 sm:max-w-[220px] bg-white hover:bg-rose-50 active:scale-[0.98] text-rose-600 text-xl stext-2xl sm:text-3xlm:text-2xl font-bold py-5 sm:py-6py-6 sm:py-7 rounded-2xl rounded-2xl border-2 border-rose-200 shadow-sm transition-all"
                  >
                    {t.notComing}
                  </button>
                </div>
              )}

              {isThreeButtons && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => handleRsvp(1)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-lg sm:text-xl font-bold py-5 rounded-2xl shadow-lg transition-all"
                  >
                    {t.coming1}
                  </button>
                  <button
                    onClick={() => handleRsvp(2)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-lg sm:text-xl font-bold py-5 rounded-2xl shadow-lg transition-all"
                  >
                    {t.coming2}
                  </button>
                  <button
                    onClick={handleNotComing}
                    className="flex-1 bg-white hover:bg-rose-50 active:scale-[0.98] text-rose-600 text-lg sm:text-xl font-bold py-5 rounded-2xl border-2 border-rose-200 transition-all"
                  >
                    {t.notComing}
                  </button>
                </div>
              )}

              {!isTwoButtons && !isThreeButtons && (
                <>
                  <p className="text-lg sm:text-xl text-[#3f2a1e]/80 font-medium">{t.howMany}</p>

                  <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleRsvp(num)}
                        className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] bg-[#3f2a1e] hover:bg-[#5a3d2c] active:scale-95 text-white text-2xl sm:text-3xl font-bold rounded-2xl shadow-md shadow-[#3f2a1e]/25 transition-all"
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowMore(!showMore)}
                    className="inline-flex items-center justify-center bg-amber-500/90 hover:bg-amber-600 text-white px-8 py-3 rounded-full text-base sm:text-lg font-medium shadow-md transition-all active:scale-[0.98]"
                  >
                    {t.moreThan5}
                  </button>

                  {showMore && (
                    <div className="flex flex-wrap gap-3 justify-center pt-2">
                      {[6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleRsvp(num)}
                          className="w-12 h-12 sm:w-14 sm:h-14 bg-[#3f2a1e] hover:bg-[#5a3d2c] active:scale-95 text-white text-xl font-bold rounded-2xl shadow transition-all"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 space-y-3 max-w-md mx-auto">
                    <button
                      onClick={handleNotComing}
                      className="w-full bg-white hover:bg-rose-50 text-rose-600 py-4 rounded-2xl text-base sm:text-lg font-semibold border border-rose-200 transition-all active:scale-[0.99]"
                    >
                      {t.notComing}
                    </button>
                    <button
                      onClick={handleUnknown}
                      className="w-full bg-white/70 hover:bg-white text-slate-600 py-4 rounded-2xl text-base sm:text-lg font-medium border border-slate-200 transition-all active:scale-[0.99]"
                    >
                      {t.unknown}
                    </button>
                    <button
                      onClick={() => setShowPersonalNote(true)}
                      className="w-full text-[#3f2a1e] hover:bg-[#3f2a1e]/5 py-3 rounded-2xl text-base font-medium border border-dashed border-[#3f2a1e]/30 transition-all"
                    >
                      {t.personalNote}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {showPersonalNote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[1.75rem] p-6 sm:p-8 w-full max-w-md shadow-2xl" dir={dir}>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 text-[#3f2a1e]">{t.personalMessage}</h3>
            <textarea
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              className="w-full h-36 sm:h-40 p-4 border border-slate-200 rounded-2xl mb-5 focus:outline-none focus:ring-2 focus:ring-[#3f2a1e]/30"
              placeholder={t.personalPlaceholder}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowPersonalNote(false)}
                className="flex-1 py-3 border border-slate-200 rounded-2xl font-medium text-slate-600"
              >
                {t.cancel}
              </button>
              <button
                onClick={handlePersonalNoteSubmit}
                className="flex-1 py-3 bg-[#3f2a1e] text-white rounded-2xl font-bold"
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
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f7f0e6]" dir="rtl">
          טוען...
        </div>
      }
    >
      <LandingPageContent />
    </Suspense>
  );
}