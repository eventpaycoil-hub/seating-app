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
    const noTransport = searchParams.get('noTransport') === '1';
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
    const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
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
          if (currentEvent.useExternalLanding === 'כן' && currentEvent.externalLandingUrl) {
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
            useExternalLanding: data.use_external_landing || data.useExternalLanding || 'לא',
            externalLandingUrl: data.external_landing_url || data.externalLandingUrl || '',
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
          if (mapped.englishEvent === 'כן' || mapped.englishEvent === true) setLang('en');
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
      if (!cancelled) setHeroMedia({ type: 'image', url: '/chatan-kala.jpg' });
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

    // קישור ציבורי — בלי ref
    if (!code) {
      const name = walkInName.trim();
      const phone = walkInPhone.trim();
      if (!name || !phone) {
        alert(lang === 'en' ? 'Please enter name and phone' : 'נא להזין שם וטלפון');
        return;
      }

      const now = new Date().toISOString();
      const phoneNorm = phone.replace(/\D/g, '');
      let guestIndex = guests.findIndex((g: any) => {
        const gp = String(g.phone || '').replace(/\D/g, '');
        return gp && phoneNorm && gp === phoneNorm;
      });

      let guest: any;
      const updated = [...guests];

      if (guestIndex === -1) {
        guest = {
          id: Date.now() + Math.random(),
          name,
          phone,
          quantity: String(count),
          confirmed: String(count),
          confirmedCount: count,
          count,
          notes: 'נוסף מקישור כללי',
          group: '',
          inviteCode: String(Date.now()).slice(-10),
          confirmedSource: 'public-link',
          confirmedAt: now,
        };
        updated.push(guest);
        guestIndex = updated.length - 1;
      } else {
        guest = {
          ...updated[guestIndex],
          name: name || updated[guestIndex].name,
          phone: phone || updated[guestIndex].phone,
          confirmed: String(count),
          confirmedCount: count,
          count,
          confirmedSource: 'public-link',
          confirmedAt: now,
        };
        updated[guestIndex] = guest;
      }

      await persistGuestUpdate(updated, guest);
      setRsvpCount(count);
      setGuestName(guest.name || name);
      setRsvpStatus('confirmed');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      let eventHasTransport =
        event?.hasTransport === 'כן' ||
        event?.hasTransport === true ||
        event?.has_transport === 'כן';
      let eventHasSeparation =
        event?.hasSeparation === 'כן' || event?.has_separation === 'כן';

      try {
        const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
        const ev = events.find((e: any) => String(e.id) === String(eventId));
        if (ev) {
          if (ev.hasTransport === 'כן' || ev.hasTransport === true || ev.has_transport === 'כן') {
            eventHasTransport = true;
          }
          if (ev.hasSeparation === 'כן' || ev.has_separation === 'כן') {
            eventHasSeparation = true;
          }
        }
      } catch {}

      const ref = guest.inviteCode || guest.id;
      if (eventHasSeparation) {
        setTimeout(() => {
          window.location.replace(
            `/separation?eventId=${eventId}&guestId=${guest.id}&ref=${encodeURIComponent(String(ref))}`
          );
        }, 1200);
        return;
      }
      if (eventHasTransport && !noTransport) {
        setTimeout(() => {
          window.location.replace(
            `/transport?eventId=${eventId}&ref=${encodeURIComponent(String(ref))}`
          );
        }, 1200);
      }
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

    const guest = updated[guestIndex];

    let eventHasTransport =
      event?.hasTransport === 'כן' ||
      event?.hasTransport === true ||
      event?.hasTransport === 'yes' ||
      event?.has_transport === 'כן' ||
      event?.has_transport === true;

    let eventHasSeparation =
      event?.hasSeparation === 'כן' || event?.has_separation === 'כן';

    try {
      const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
      const ev = events.find((e: any) => String(e.id) === String(eventId));
      if (ev) {
        if (ev.hasTransport === 'כן' || ev.hasTransport === true || ev.has_transport === 'כן') {
          eventHasTransport = true;
        }
        if (ev.hasSeparation === 'כן' || ev.has_separation === 'כן') {
          eventHasSeparation = true;
        }
      }
    } catch {}

    if (eventHasSeparation) {
      setTimeout(() => {
        window.location.replace(
          `/separation?eventId=${eventId}&guestId=${guest.id}`
        );
      }, 1200);
      return;
    }

    if (eventHasTransport) {
      setTimeout(() => {
        window.location.replace(
          `/transport?eventId=${eventId}&ref=${encodeURIComponent(String(guest.inviteCode || guest.id))}`
        );
      }, 1200);
    }
  };

  const handleNotComing = async () => {
    if (!eventId) {
      alert(t.invalidLinkAlert);
      return;
    }

    if (!code) {
      const name = walkInName.trim();
      const phone = walkInPhone.trim();
      if (!name || !phone) {
        alert(lang === 'en' ? 'Please enter name and phone' : 'נא להזין שם וטלפון');
        return;
      }
      const now = new Date().toISOString();
      const phoneNorm = phone.replace(/\D/g, '');
      let guestIndex = guests.findIndex((g: any) => {
        const gp = String(g.phone || '').replace(/\D/g, '');
        return gp && phoneNorm && gp === phoneNorm;
      });
      const updated = [...guests];
      let guest: any;
      if (guestIndex === -1) {
        guest = {
          id: Date.now() + Math.random(),
          name,
          phone,
          quantity: '0',
          confirmed: 'לא מגיע',
          confirmedCount: 0,
          count: 0,
          notes: 'נוסף מקישור כללי',
          group: '',
          inviteCode: String(Date.now()).slice(-10),
          confirmedSource: 'public-link',
          confirmedAt: now,
        };
        updated.push(guest);
      } else {
        guest = {
          ...updated[guestIndex],
          name: name || updated[guestIndex].name,
          confirmed: 'לא מגיע',
          confirmedCount: 0,
          count: 0,
          confirmedSource: 'public-link',
          confirmedAt: now,
        };
        updated[guestIndex] = guest;
      }
      await persistGuestUpdate(updated, guest);
      setRsvpStatus('notComing');
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
      if (!code) {
        alert(lang === 'en' ? 'Please use the personal link for this option' : 'לאפשרות זו יש להשתמש בקישור האישי');
      }
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
      <div className="min-h-screen flex items-center justify-center bg-[#f8f1e3]" dir="rtl">
        <div className="text-center px-6">
          <h2 className="text-3xl font-bold text-red-600 mb-4">{TEXTS.he.invalidLink}</h2>
          <p>{TEXTS.he.missingDetails}</p>
        </div>
      </div>
    );
  }

  if (externalRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f1e3]" dir="rtl">
        <div className="text-2xl text-gray-600">{t.redirecting}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f1e3]" dir="rtl">
        <div className="text-2xl text-gray-600">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f1e3]" dir={dir}>
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

      <div className="bg-[#3f2a1e] text-white py-6 text-center px-4">
        <h1 className="text-3xl sm:text-5xl font-light tracking-wide">
          {event?.owners ? `${titlePrefix} ${event.owners}` : displayTitle}
        </h1>
      </div>

      {rsvpStatus !== 'none' ? (
        <div className="max-w-xl mx-auto px-6 py-16 text-center">
          {rsvpStatus === 'confirmed' && (
            <div className="bg-green-50 border-2 border-green-300 rounded-3xl p-12 shadow-xl">
              <div className="text-7xl mb-6">🎉</div>
              <h3 className="text-4xl font-bold text-green-800 mb-3">{t.thanks}</h3>
              <p className="text-2xl text-green-700 mb-4">
                {t.confirmedFor}
                {rsvpCount} {t.guests}
              </p>
              <p className="text-xl text-green-600 font-medium">{t.seeYou}</p>
              {event?.hasSeparation === 'כן' ? (
                <p className="text-sm text-green-600 mt-4">{t.redirectSeparation}</p>
              ) : event?.hasTransport === 'כן' || event?.hasTransport === true ? (
                <p className="text-sm text-green-600 mt-4">
                  {lang === 'en' ? 'Redirecting to transport selection...' : 'מעביר אותך לבחירת הסעה...'}
                </p>
              ) : null}
            </div>
          )}
          {rsvpStatus === 'notComing' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-12 shadow-xl">
              <div className="text-6xl mb-6">😔</div>
              <h3 className="text-3xl font-bold text-red-800 mb-3">{t.sorryNotComing}</h3>
              <p className="text-xl text-red-700">{t.thanksUpdate}</p>
            </div>
          )}
          {rsvpStatus === 'pending' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-12 shadow-xl">
              <div className="text-6xl mb-6">📞</div>
              <h3 className="text-3xl font-bold text-blue-800 mb-3">{t.thanksShort}</h3>
              <p className="text-xl text-blue-700">{t.willContact}</p>
            </div>
          )}
          {rsvpStatus === 'notFound' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-12 shadow-xl">
              <h3 className="text-2xl font-bold text-red-700 mb-4">{t.guestNotFound}</h3>
              <p>{t.invalidCode}</p>
              <p className="text-sm text-gray-500 mt-3">ref: {code}</p>
            </div>
          )}
          {rsvpStatus === 'general' && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-8 shadow-xl text-right">
              <h3 className="text-2xl font-bold text-amber-800 mb-2">
                {lang === 'en' ? 'Guest details' : 'פרטי המוזמן'}
              </h3>
              <p className="text-amber-700 mb-6 text-sm">
                {lang === 'en'
                  ? 'Enter your name and phone to confirm attendance'
                  : 'הזינו שם וטלפון כדי לאשר הגעה'}
              </p>
              <label className="block text-sm font-medium mb-1">
                {lang === 'en' ? 'Full name' : 'שם מלא'}
              </label>
              <input
                type="text"
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                className="w-full border rounded-2xl px-4 py-3 mb-4 text-lg"
                placeholder={lang === 'en' ? 'Your name' : 'השם המלא'}
              />
              <label className="block text-sm font-medium mb-1">
                {lang === 'en' ? 'Phone' : 'טלפון'}
              </label>
              <input
                type="tel"
                value={walkInPhone}
                onChange={(e) => setWalkInPhone(e.target.value)}
                className="w-full border rounded-2xl px-4 py-3 mb-6 text-lg"
                placeholder="050-..."
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setRsvpStatus('none')}
                className="w-full bg-[#3f2a1e] text-white py-3 rounded-2xl font-bold"
              >
                {lang === 'en' ? 'Continue' : 'המשך לאישור הגעה'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-center pt-6 pb-2 px-3 sm:px-6">
            <div className="w-full max-w-[1100px]">
              <div className="p-[3px] rounded-3xl bg-gradient-to-br from-[#c4a574] via-[#e8d5b0] to-[#a67c52] shadow-2xl">
                <div className="p-2 rounded-[1.35rem] bg-[#f8f1e3]">
                  <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden bg-[#e8dfd0]">
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

          <div className="max-w-2xl mx-auto px-5 pt-5 pb-12 text-center">
            <div className="mb-6 text-[#3f2a1e]">
              <div className="text-4xl font-semibold mb-2 tracking-wide">
                {formatDate(event?.fullDate || event?.eventDate || event?.date)}
              </div>
              <div className="text-2xl mb-1">{event?.hallName}</div>
              {event?.city && <div className="text-xl mb-1">{event.city}</div>}
              <div className="text-xl">
                {t.atHour} {event?.time || '19:30'}
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-[#3f2a1e]">{t.gladToSee}</h2>

            {/* שדות לקישור ציבורי */}
            {!code && (
              <div className="mb-8 max-w-md mx-auto space-y-3 text-right">
                <input
                  type="text"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full border-2 border-[#c4a574] rounded-2xl px-4 py-3 text-lg"
                  placeholder={lang === 'en' ? 'Full name' : 'שם מלא'}
                />
                <input
                  type="tel"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full border-2 border-[#c4a574] rounded-2xl px-4 py-3 text-lg"
                  placeholder="050-..."
                  dir="ltr"
                />
              </div>
            )}

            <div className="space-y-6">
              {isTwoButtons && (
                <div className="flex flex-col sm:flex-row gap-5 justify-center">
                  <button
                    onClick={() => handleRsvp(1)}
                    className="flex-1 max-w-xs mx-auto bg-emerald-600 hover:bg-emerald-700 text-white text-2xl font-bold py-8 rounded-3xl shadow-lg active:scale-95 transition-all"
                  >
                    {t.coming}
                  </button>
                  <button
                    onClick={handleNotComing}
                    className="flex-1 max-w-xs mx-auto bg-red-500 hover:bg-red-600 text-white text-2xl font-bold py-8 rounded-3xl shadow-lg active:scale-95 transition-all"
                  >
                    {t.notComing}
                  </button>
                </div>
              )}

              {isThreeButtons && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => handleRsvp(1)}
                    className="flex-1 max-w-xs mx-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold py-7 rounded-3xl shadow-lg active:scale-95 transition-all"
                  >
                    {t.coming1}
                  </button>
                  <button
                    onClick={() => handleRsvp(2)}
                    className="flex-1 max-w-xs mx-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold py-7 rounded-3xl shadow-lg active:scale-95 transition-all"
                  >
                    {t.coming2}
                  </button>
                  <button
                    onClick={handleNotComing}
                    className="flex-1 max-w-xs mx-auto bg-red-500 hover:bg-red-600 text-white text-xl font-bold py-7 rounded-3xl shadow-lg active:scale-95 transition-all"
                  >
                    {t.notComing}
                  </button>
                </div>
              )}

              {!isTwoButtons && !isThreeButtons && (
                <>
                  <p className="text-xl mb-2">{t.howMany}</p>
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
                    <div className="flex flex-wrap gap-4 justify-center pt-2">
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

                  <div className="pt-2 max-w-md mx-auto space-y-3">
                    <button
                      onClick={handleNotComing}
                      className="w-full bg-red-100 hover:bg-red-200 text-red-700 py-4 rounded-2xl text-lg font-medium transition-all"
                    >
                      {t.notComing}
                    </button>
                    <button
                      onClick={handleUnknown}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-2xl text-lg font-medium transition-all"
                    >
                      {t.unknown}
                    </button>
                    <button
                      onClick={() => setShowPersonalNote(true)}
                      className="w-full px-8 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-2xl text-lg font-medium transition-all"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md" dir={dir}>
            <h3 className="text-2xl font-bold mb-4">{t.personalMessage}</h3>
            <textarea
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              className="w-full h-40 p-4 border rounded-2xl mb-6"
              placeholder={t.personalPlaceholder}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowPersonalNote(false)} className="flex-1 py-3 border rounded-2xl">
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
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: '#f5f0e6' }}
        />
      }
    >
      <LandingPageContent />
    </Suspense>
  );
}