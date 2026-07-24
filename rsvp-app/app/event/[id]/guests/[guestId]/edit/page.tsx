'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { saveGuests } from '../../../../../lib/guests';
function isPending(g: any) {
  return !g.confirmed || g.confirmed === '' || g.confirmed === 'לא ידוע' || g.confirmed === 'ממתין';
}

function matchesQueue(g: any, queue: string | null) {
  if (!g?.name || !String(g.name).trim()) return false;
  const phone = (g.phone || '').toString().trim();
  if (!phone) return false;
  if (queue === 'unknownEmpty') {
    return isPending(g) && (!g.notes || String(g.notes).trim() === '');
  }
  if (queue === 'unknown') {
    return isPending(g) && g.notes && String(g.notes).trim() !== '';
  }
  return false;
}

export default function EditGuestPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = params?.id as string;
  const guestId = params?.guestId as string;
  const queue = searchParams.get('queue');

  const [guest, setGuest] = useState<any>({});
  const [event, setEvent] = useState<any>({});
  const [transportOptions, setTransportOptions] = useState<any[]>([]);
  const [hasSeparation, setHasSeparation] = useState(false);
  const [hasTransport, setHasTransport] = useState(false);
  const [isClientMode, setIsClientMode] = useState(false);

  const [genderMode, setGenderMode] = useState<'simple' | 'custom'>('simple');
  const [menCount, setMenCount] = useState(0);
  const [womenCount, setWomenCount] = useState(0);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const clientMode = localStorage.getItem('clientMode') === 'true';
    setIsClientMode(role === 'client' || clientMode);
  }, []);

  useEffect(() => {
    const guestsKey = `guests_event_${eventId}`;
    const savedGuests = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    let foundGuest = savedGuests.find((g: any) => g.id.toString() === guestId);

    if (foundGuest) {
      const status = foundGuest.confirmed;
      const isNumber = status && !isNaN(Number(status)) && Number(status) >= 1 && Number(status) <= 16;

      if (!status || status === '' || status === 'לא מגיע' || !isNumber) {
        if (status !== 'לא מגיע' && status !== 'לא ידוע' && !isNumber) {
          foundGuest = { ...foundGuest, confirmed: 'לא ידוע', count: 0 };
          const updated = savedGuests.map((g: any) =>
            g.id.toString() === guestId ? foundGuest : g
          );
          localStorage.setItem(guestsKey, JSON.stringify(updated));
        }
      }
      setGuest(foundGuest);

      const sep = (foundGuest.separation || '').toString().trim();
      if (sep && sep !== 'גבר' && sep !== 'אישה' && sep !== 'זוג') {
        setGenderMode('custom');
        const menMatch = sep.match(/(\d+)\s*גבר/);
        const womenMatch = sep.match(/(\d+)\s*איש/);
        if (menMatch) setMenCount(parseInt(menMatch[1]));
        if (womenMatch) setWomenCount(parseInt(womenMatch[1]));
      }
    } else {
      setGuest({ confirmed: 'לא ידוע', count: 0 });
    }

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
    if (currentEvent) {
      setEvent(currentEvent);
      setHasSeparation(currentEvent.hasSeparation === 'כן');
      setHasTransport(currentEvent.hasTransport === 'כן');
    }

    const savedTransport = localStorage.getItem(`transport_options_${eventId}`);
    if (savedTransport) {
      try {
        const parsed = JSON.parse(savedTransport);
        setTransportOptions(parsed.filter((o: any) => o.name && o.name.trim() !== ''));
      } catch {}
    }

    const allGuests = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    const fromGuests = allGuests
      .map((g: any) => (g.group || '').toString().trim())
      .filter((g: string) => g !== '');

    let fromStorage: string[] = [];
    try {
      const saved = localStorage.getItem(`groups_event_${eventId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        fromStorage = (Array.isArray(parsed) ? parsed : [])
          .map((item: any) => {
            if (typeof item === 'string') return item.trim();
            if (item && typeof item === 'object')
              return (item.name || item.title || item.label || '').toString().trim();
            return '';
          })
          .filter(Boolean);
      }
    } catch {}

    const defaults = ['משפחה', 'חברים', 'עבודה', 'שכנים', 'חברי ילדות', 'לקוחות'];
    const unique = Array.from(new Set([...defaults, ...fromStorage, ...fromGuests])).filter(Boolean);
    setAvailableGroups(unique);
  }, [eventId, guestId]);

  const goNextOrList = () => {
    if (!queue) {
      router.push(`/event/${eventId}/guests`);
      return;
    }
    const guestsKey = `guests_event_${eventId}`;
    const all = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    const idx = all.findIndex((g: any) => g.id.toString() === guestId.toString());
    for (let i = idx + 1; i < all.length; i++) {
      if (matchesQueue(all[i], queue)) {
        router.push(`/event/${eventId}/guests/${all[i].id}/edit?queue=${queue}`);
        return;
      }
    }
    router.push(`/event/${eventId}/guests`);
  };

    const saveGuestField = (updatedGuest: any) => {
    setGuest(updatedGuest);
    const guestsKey = `guests_event_${eventId}`;
    let savedGuests = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    savedGuests = savedGuests.map((g: any) =>
      g.id.toString() === guestId ? updatedGuest : g
    );
    // localStorage + Supabase (ברקע)
    saveGuests(eventId, savedGuests);
  };

    const addToNotes = (text: string) => {
    const date = new Date().toLocaleString('he-IL');
    const newNote = `${text} - ${date}`;
    const updated = {
      ...guest,
      notes: guest.notes ? `${guest.notes}\n${newNote}` : newNote,
    };
    saveGuestField(updated);
  };
    

  const resetToUnknown = () => {
    saveGuestField({ ...guest, count: 0, confirmed: 'לא ידוע' });
  };

  const setCountAndConfirm = (num: number) => {
    const updatedGuest = { ...guest, count: num, confirmed: num.toString() };
    saveGuestField(updatedGuest);
    goNextOrList();
  };

  const markAsNotComing = () => {
    const updatedGuest = { ...guest, count: 0, confirmed: 'לא מגיע' };
    saveGuestField(updatedGuest);
    goNextOrList();
  };

  const handleTransportChange = (value: string) => {
    saveGuestField({ ...guest, transportation: value });
  };

  const handleGenderSimple = (value: string) => {
    setGenderMode('simple');
    saveGuestField({ ...guest, separation: value });
  };

  const handleGenderCustom = () => setGenderMode('custom');

  const saveCustomGender = () => {
    if (menCount === 0 && womenCount === 0) {
      alert('נא לבחור לפחות אדם אחד');
      return;
    }
        const parts = [];
    if (menCount > 0) parts.push(menCount === 1 ? '1 גבר' : `${menCount} גברים`);
    if (womenCount > 0) parts.push(womenCount === 1 ? '1 אישה' : `${womenCount} נשים`);
    saveGuestField({ ...guest, separation: parts.join(' + ') });
  };

  const saveAndGoBack = () => {
    saveGuestField(guest);
    goNextOrList();
  };

  const callPhone = () => window.open(`tel:${guest.phone}`);

  const quickActions = [
    'אין מענה',
    'תא קולי',
    'שיחה ממתינה',
    'מס לא מחובר',
    'טעות במספר',
    'להתקשר מחדש',
    'תחילת שבוע',
    'יאושר בהודעה',
    'אפס הערה',
    'ספרה מיותרת',
    'חסרה ספרה',
    'להתקשר בעוד ימים',
    'יחזרו אלינו',
    'אירוע אחר',
    'להתקשר ביום א',
    'להתקשר ביום ב',
    'להתקשר ביום ג',
    'להתקשר ביום ד',
    'להתקשר ביום ה',
    'ההודעה נמסרה',
    'לא יודע עדיין',
    'לא יודעת עדיין',
    'נשלח וואצאפ',
  ];

  const getDayOfWeek = () => {
    if (event.day && event.day.length > 3) return event.day;
    if (event.fullDate) {
      try {
        const d = new Date(event.fullDate);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('he-IL', { weekday: 'long' });
        }
      } catch {}
    }
    return event.day || '';
  };

  const formatFullDate = () => {
    if (event.fullDate && event.fullDate.includes('-')) {
      const [y, m, d] = event.fullDate.split('-');
      return `${d}/${m}/${y}`;
    }
    if (event.date) return event.date;
    return '';
  };

  const currentTransport = guest.transportation || guest.transport || '';
  const currentGender = guest.separation || '';

  if (isClientMode) {
    return (
      <div className="min-h-screen bg-[#f5f0e6] p-6" dir="rtl">
        <div className="max-w-xl mx-auto">
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline text-sm mb-6 inline-block">
            ← חזרה לרשימה
          </Link>
          <div className="bg-white rounded-3xl p-8 shadow space-y-5">
            <h1 className="text-2xl font-bold mb-2">עריכת מוזמן</h1>
            <div>
              <label className="block text-sm text-gray-500 mb-1">שם</label>
              <input value={guest.name || ''} onChange={(e) => setGuest({ ...guest, name: e.target.value })} className="w-full p-3 border rounded-2xl" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">טלפון</label>
              <input value={guest.phone || ''} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} className="w-full p-3 border rounded-2xl" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">קבוצה</label>
              <select value={guest.group || ''} onChange={(e) => setGuest({ ...guest, group: e.target.value })} className="w-full p-3 border rounded-2xl">
                <option value="">בחר קבוצה...</option>
                {availableGroups.map((g) => (
                  <option key={String(g)} value={String(g)}>{String(g)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">צפי לקוח</label>
              <input value={guest.customerExpectation || ''} onChange={(e) => setGuest({ ...guest, customerExpectation: e.target.value })} className="w-full p-3 border rounded-2xl" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-2">אישור הגעה</label>
              <div className="flex gap-3 mb-3">
                <button type="button" onClick={resetToUnknown} className={`flex-1 py-3 rounded-2xl font-bold border-2 ${guest.confirmed === 'לא ידוע' ? 'bg-amber-500 text-white border-amber-600' : 'bg-white border-gray-300'}`}>לא ידוע</button>
                <button type="button" onClick={markAsNotComing} className={`flex-1 py-3 rounded-2xl font-bold border-2 ${guest.confirmed === 'לא מגיע' ? 'bg-red-500 text-white border-red-600' : 'bg-white border-gray-300'}`}>לא מגיע</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => (
                  <button key={num} type="button" onClick={() => setCountAndConfirm(num)} className={`w-12 h-12 rounded-full font-bold border-2 ${String(guest.count) === String(num) || guest.confirmed === String(num) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300'}`}>{num}</button>
                ))}
              </div>
            </div>
            {hasTransport && (
              <div>
                <label className="block text-sm text-gray-500 mb-1">הסעה</label>
                <select value={currentTransport} onChange={(e) => handleTransportChange(e.target.value)} className="w-full p-3 border rounded-2xl">
                  <option value="">בחר הסעה...</option>
                  {transportOptions.map((opt) => (
                    <option key={opt.id} value={`${opt.name}${opt.time ? ' - ' + opt.time : ''}`}>{opt.name}{opt.time ? ` (${opt.time})` : ''}</option>
                  ))}
                  <option value="לא תודה אגיע עצמאית">לא תודה אגיע עצמאית</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-500 mb-1">הערות</label>
              <textarea value={guest.notes || ''} onChange={(e) => setGuest({ ...guest, notes: e.target.value })} className="w-full h-24 p-3 border rounded-2xl" placeholder="הערות..." />
            </div>
            <button type="button" onClick={saveAndGoBack} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-xl font-bold">עדכן!</button>
          </div>
        </div>
      </div>
    );
  }

  // ===== מנהל =====
  return (
    <div className="min-h-screen bg-[#f5f0e6] px-4 py-3" dir="rtl">
      <div className="max-w-[1500px] mx-auto space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline text-sm">
            ← חזרה לרשימה
          </Link>
          {queue && (
            <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">
              מצב חיוג · {queue === 'unknownEmpty' ? 'לא ידוע (כתום)' : 'לא ידוע (אפור)'}
            </span>
          )}
        </div>

        {/* טלפון + שם | פרטי אירוע כמו בתמונה */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="w-full lg:w-[320px] flex-shrink-0 space-y-2">
            <div
              onClick={callPhone}
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white rounded-2xl px-5 py-4 flex flex-col items-center shadow-lg"
            >
              <div className="text-xl font-bold mb-1 text-center leading-tight">{guest.name || '—'}</div>
              <div className="text-xs opacity-80">טלפון · לחץ לחיוג</div>
              <div className="text-4xl font-bold tracking-widest mt-1">{guest.phone || '—'}</div>
            </div>
            <input
              type="tel"
              dir="ltr"
              value={guest.phone || ''}
              onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
              onBlur={() => saveGuestField({ ...guest, phone: guest.phone || '' })}
              placeholder="050-0000000"
              className="w-full py-2.5 px-3 border border-gray-300 rounded-xl text-base font-mono text-center focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex-1 bg-white rounded-2xl px-6 py-4 shadow text-right text-[15px] leading-7">
            <div className="font-bold text-lg text-slate-900">{event.owners || '—'}</div>
            <div>{formatFullDate()}</div>
            <div>&quot;{event.hallName || event.venue || '—'}&quot;</div>
            <div>{event.city || '—'}</div>
            <div>{getDayOfWeek()}</div>
            <div>{event.time || '—'}</div>
            <div className="text-blue-700 mt-1">הורי חתן: {event.groomParents || '—'}</div>
            <div className="text-blue-700">הורי כלה: {event.brideParents || '—'}</div>
          </div>
        </div>

        {/* פעולות מהירות */}
        <div className="bg-white rounded-2xl px-3 py-2.5 shadow">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5">
            {quickActions.map((text, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addToNotes(text)}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs py-2 px-1 rounded-xl active:scale-[0.98]"
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow space-y-3">
            <div className="text-sm text-gray-500">כמות אנשים</div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetToUnknown}
                className={`flex-1 py-3 rounded-2xl font-bold text-lg border-2 transition-all ${
                  guest.confirmed === 'לא ידוע'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-lg'
                    : 'bg-white border-gray-300 hover:border-amber-400 hover:bg-amber-50'
                }`}
              >
                לא ידוע
              </button>
              <button
                type="button"
                onClick={markAsNotComing}
                className={`flex-1 py-3 rounded-2xl font-bold text-lg border-2 transition-all ${
                  guest.confirmed === 'לא מגיע'
                    ? 'bg-red-500 text-white border-red-600 shadow-lg'
                    : 'bg-white border-gray-300 hover:border-red-400 hover:bg-red-50'
                }`}
              >
                לא מגיע
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 16 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCountAndConfirm(num)}
                  className={`w-12 h-12 rounded-full text-lg font-bold border-2 transition ${
                    guest.count === num || guest.confirmed === String(num)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">הערות</label>
              <textarea
                value={guest.notes || ''}
                onChange={(e) => setGuest({ ...guest, notes: e.target.value })}
                className="w-full h-16 p-2 border rounded-xl text-sm resize-none"
                placeholder="הערות..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-2xl px-4 py-3 shadow flex items-center gap-3">
              <label className="text-sm text-gray-500 whitespace-nowrap">קבוצה</label>
              <select
                value={guest.group || ''}
                onChange={(e) => saveGuestField({ ...guest, group: e.target.value })}
                className="flex-1 p-2.5 border rounded-xl text-base"
              >
                <option value="">בחר קבוצה...</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {hasTransport && (
              <div className="bg-white rounded-2xl px-4 py-3 shadow flex items-center gap-3">
                <label className="text-sm text-gray-500 whitespace-nowrap">הסעה</label>
                <select
                  value={currentTransport}
                  onChange={(e) => handleTransportChange(e.target.value)}
                  className="flex-1 p-2.5 border rounded-xl text-base"
                >
                  <option value="">בחר הסעה...</option>
                  {transportOptions.map((opt) => (
                    <option key={opt.id} value={`${opt.name}${opt.time ? ' - ' + opt.time : ''}`}>
                      {opt.name}{opt.time ? ` (${opt.time})` : ''}
                    </option>
                  ))}
                  <option value="לא תודה אגיע עצמאית">לא תודה אגיע עצמאית</option>
                </select>
              </div>
            )}

            {hasSeparation && (
              <div className="bg-white rounded-2xl px-4 py-3 shadow">
                {genderMode === 'simple' && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-gray-500">מגדר</span>
                    {['גבר', 'אישה', 'זוג'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleGenderSimple(opt)}
                        className={`px-4 py-2 rounded-xl font-bold border-2 ${
                          currentGender === opt
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                    <button type="button" onClick={handleGenderCustom} className="px-3 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-600">
                      אחר
                    </button>
                  </div>
                )}
                {genderMode === 'custom' && (
                  <div className="flex flex-wrap gap-2 items-center text-sm">
                    <span>גברים:</span>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <button key={`m${num}`} type="button" onClick={() => setMenCount(num)} className={`w-9 h-9 rounded-full font-bold border-2 ${menCount === num ? 'bg-[#3f2a1e] text-white border-[#3f2a1e]' : 'bg-white border-gray-300'}`}>{num}</button>
                    ))}
                    <span className="mr-2">נשים:</span>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <button key={`w${num}`} type="button" onClick={() => setWomenCount(num)} className={`w-9 h-9 rounded-full font-bold border-2 ${womenCount === num ? 'bg-[#3f2a1e] text-white border-[#3f2a1e]' : 'bg-white border-gray-300'}`}>{num}</button>
                    ))}
                    <button type="button" onClick={() => setGenderMode('simple')} className="px-3 py-1.5 border rounded-xl">ביטול</button>
                    <button type="button" onClick={saveCustomGender} className="px-3 py-1.5 bg-purple-600 text-white rounded-xl font-bold">שמור</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center pt-1 pb-2">
          <button
            type="button"
            onClick={saveAndGoBack}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-16 py-3.5 rounded-2xl text-xl font-bold shadow"
          >
            {queue ? 'עדכן והמשך למוזמן הבא' : 'עדכן והמשך'}
          </button>
        </div>
      </div>
    </div>
  );
}