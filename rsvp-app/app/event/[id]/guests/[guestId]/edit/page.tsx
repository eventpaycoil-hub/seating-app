'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function EditGuestPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;
  const guestId = params?.guestId as string;

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

        // טעינת קבוצות קיימות
    const allGuests = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    const fromGuests = allGuests
      .map((g: any) => (g.group || '').toString().trim())
      .filter((g: string) => g !== '');

    let fromStorage: string[] = [];
    try {
      const saved = localStorage.getItem(`groups_event_${eventId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        fromStorage = (Array.isArray(parsed) ? parsed : []).map((item: any) => {
          if (typeof item === 'string') return item.trim();
          if (item && typeof item === 'object') return (item.name || item.title || item.label || '').toString().trim();
          return '';
        }).filter(Boolean);
      }
    } catch {}

    const defaults = ['משפחה', 'חברים', 'עבודה', 'שכנים', 'חברי ילדות', 'לקוחות'];
    const unique = Array.from(new Set([...defaults, ...fromStorage, ...fromGuests])).filter(Boolean);
    setAvailableGroups(unique);
  }, [eventId, guestId]);

  const saveGuestField = (updatedGuest: any) => {
    setGuest(updatedGuest);
    const guestsKey = `guests_event_${eventId}`;
    let savedGuests = JSON.parse(localStorage.getItem(guestsKey) || '[]');
    savedGuests = savedGuests.map((g: any) =>
      g.id.toString() === guestId ? updatedGuest : g
    );
    localStorage.setItem(guestsKey, JSON.stringify(savedGuests));
  };

  const addToNotes = (text: string) => {
    const date = new Date().toLocaleString('he-IL');
    const newNote = `${text} - ${date}`;
    saveGuestField({
      ...guest,
      notes: guest.notes ? `${guest.notes}\n${newNote}` : newNote
    });
  };

  const resetToUnknown = () => {
    saveGuestField({ ...guest, count: 0, confirmed: 'לא ידוע' });
  };

  const setCountAndConfirm = (num: number) => {
    const updatedGuest = { ...guest, count: num, confirmed: num.toString() };
    saveGuestField(updatedGuest);
    router.push(`/event/${eventId}/guests`);
  };

  const markAsNotComing = () => {
    const updatedGuest = { ...guest, count: 0, confirmed: 'לא מגיע' };
    saveGuestField(updatedGuest);
    router.push(`/event/${eventId}/guests`);
  };

  const handleTransportChange = (value: string) => {
    saveGuestField({ ...guest, transportation: value });
  };

  const handleGenderSimple = (value: string) => {
    setGenderMode('simple');
    saveGuestField({ ...guest, separation: value });
  };

  const handleGenderCustom = () => {
    setGenderMode('custom');
  };

  const saveCustomGender = () => {
    if (menCount === 0 && womenCount === 0) {
      alert('נא לבחור לפחות אדם אחד');
      return;
    }
    const parts = [];
    if (menCount > 0) parts.push(`${menCount} גבר${menCount > 1 ? 'ים' : ''}`);
    if (womenCount > 0) parts.push(`${womenCount} איש${womenCount > 1 ? 'ות' : 'ה'}`);
    saveGuestField({ ...guest, separation: parts.join(' + ') });
  };

  const saveAndGoBack = () => {
    saveGuestField(guest);
    router.push(`/event/${eventId}/guests`);
  };

  const callPhone = () => window.open(`tel:${guest.phone}`);

  const quickActions = [
    "אין מענה", "תא קולי", "שיחה ממתינה", "מס לא מחובר",
    "טעות במספר", "להתקשר מחדש", "תחילת שבוע", "יאושר בהודעה",
    "אפס הערה", "ספרה מיותרת", "חסרה ספרה", "להתקשר בעוד ימים",
    "יחזרו אלינו", "אירוע אחר", "להתקשר ביום א", "להתקשר ביום ב",
    "להתקשר ביום ג", "להתקשר ביום ד", "להתקשר ביום ה", "ההודעה נמסרה",
    "לא יודע עדיין", "לא יודעת עדיין", "נשלח וואצאפ"
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

  const currentTransport = guest.transportation || guest.transport || '';
  const currentGender = guest.separation || '';

  // ===== תצוגת לקוח מצומצמת =====
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
              <input
                value={guest.name || ''}
                onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                className="w-full p-3 border rounded-2xl"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">טלפון</label>
              <input
                value={guest.phone || ''}
                onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                className="w-full p-3 border rounded-2xl"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">קבוצה</label>
              <select
                value={guest.group || ''}
                onChange={(e) => setGuest({ ...guest, group: e.target.value })}
                className="w-full p-3 border rounded-2xl"
              >
                <option value="">בחר קבוצה...</option>
                {availableGroups.map((g) => (
  <option key={String(g)} value={String(g)}>{String(g)}</option>
))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-1">צפי לקוח</label>
              <input
                value={guest.customerExpectation || ''}
                onChange={(e) => setGuest({ ...guest, customerExpectation: e.target.value })}
                className="w-full p-3 border rounded-2xl"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-500 mb-2">אישור הגעה</label>
              <div className="flex gap-3 mb-3">
                <button
                  type="button"
                  onClick={resetToUnknown}
                  className={`flex-1 py-3 rounded-2xl font-bold border-2 ${
                    guest.confirmed === 'לא ידוע'
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  לא ידוע
                </button>
                <button
                  type="button"
                  onClick={markAsNotComing}
                  className={`flex-1 py-3 rounded-2xl font-bold border-2 ${
                    guest.confirmed === 'לא מגיע'
                      ? 'bg-red-500 text-white border-red-600'
                      : 'bg-white border-gray-300'
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
                    className={`w-12 h-12 rounded-full font-bold border-2 ${
                      String(guest.count) === String(num) || guest.confirmed === String(num)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {hasTransport && (
              <div>
                <label className="block text-sm text-gray-500 mb-1">הסעה</label>
                <select
                  value={currentTransport}
                  onChange={(e) => handleTransportChange(e.target.value)}
                  className="w-full p-3 border rounded-2xl"
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

            <div>
              <label className="block text-sm text-gray-500 mb-1">הערות</label>
              <textarea
                value={guest.notes || ''}
                onChange={(e) => setGuest({ ...guest, notes: e.target.value })}
                className="w-full h-24 p-3 border rounded-2xl"
                placeholder="הערות..."
              />
            </div>

            <button
              type="button"
              onClick={saveAndGoBack}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-xl font-bold"
            >
              עדכן!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== תצוגת מנהל מלאה =====
  return (
    <div className="min-h-screen bg-[#f5f0e6] p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <Link href={`/event/${eventId}/guests`} className="text-blue-600 hover:underline text-sm mb-4 inline-block">← חזרה לרשימה</Link>

        <div className="flex flex-col lg:flex-row gap-5 mb-6">
          <div onClick={callPhone} className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white rounded-3xl p-7 flex flex-col items-center justify-center shadow-lg w-full lg:w-[420px] flex-shrink-0">
            <div className="text-base opacity-80">טלפון</div>
            <div className="text-5xl font-bold tracking-widest mt-1">{guest.phone}</div>
            <div className="text-xs mt-2 opacity-70">לחץ להתקשר ב-Zoiper</div>
          </div>

          <div className="flex-1 bg-white rounded-3xl p-6 shadow text-sm">
            <div className="text-2xl font-bold mb-4">{guest.name}</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <div><span className="font-semibold">בעלי השמחה:</span> {event.owners}</div>
              <div><span className="font-semibold">תאריך:</span> {event.date}</div>
              <div><span className="font-semibold">אולם:</span> {event.hallName || event.venue}</div>
              <div><span className="font-semibold">עיר:</span> {event.city}</div>
              <div><span className="font-semibold">שעה:</span> {event.time}</div>
              <div><span className="font-semibold">יום:</span> {getDayOfWeek()}</div>
              <div className="col-span-2 pt-2 border-t text-blue-700">הורי חתן: {event.groomParents}</div>
              <div className="col-span-2 text-blue-700">הורי כלה: {event.brideParents}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow mb-6">
          <div className="font-bold mb-4 text-lg">פעולות מהירות</div>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 text-sm">
            {quickActions.map((text, i) => (
              <button key={i} onClick={() => addToNotes(text)} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-2.5 rounded-xl active:scale-[0.98]">
                {text}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow">
            <div className="text-sm text-gray-500 mb-3">כמות אנשים</div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={resetToUnknown}
                className={`flex-1 py-3.5 rounded-2xl font-bold text-lg border-2 transition-all cursor-pointer ${guest.confirmed === 'לא ידוע' 
                  ? 'bg-amber-500 text-white border-amber-600 scale-[1.04] shadow-lg' 
                  : 'bg-white border-gray-300 hover:border-amber-400 hover:bg-amber-50'}`}
              >
                לא ידוע
              </button>

              <button
                onClick={markAsNotComing}
                className={`flex-1 py-3.5 rounded-2xl font-bold text-lg border-2 transition-all cursor-pointer ${guest.confirmed === 'לא מגיע' 
                  ? 'bg-red-500 text-white border-red-600 scale-[1.04] shadow-lg' 
                  : 'bg-white border-gray-300 hover:border-red-400 hover:bg-red-50'}`}
              >
                לא מגיע
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 16 }, (_, i) => i + 1).map(num => (
                <button key={num} onClick={() => setCountAndConfirm(num)} className={`w-14 h-14 rounded-full text-xl font-bold border-2 transition ${guest.count === num || guest.confirmed === String(num) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-gray-300'}`}>
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-5">

            {/* קבוצה */}
            <div className="bg-white rounded-3xl p-5 shadow">
              <label className="block text-sm text-gray-500 mb-2">קבוצה</label>
              <select
                value={guest.group || ''}
                onChange={(e) => saveGuestField({ ...guest, group: e.target.value })}
                className="w-full p-3 border rounded-2xl"
              >
                <option value="">בחר קבוצה...</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {hasTransport && (
              <div className="bg-white rounded-3xl p-5 shadow">
                <label className="block text-sm text-gray-500 mb-2">הסעה</label>
                <select 
                  value={currentTransport} 
                  onChange={(e) => handleTransportChange(e.target.value)} 
                  className="w-full p-3 border rounded-2xl"
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
              <div className="bg-white rounded-3xl p-5 shadow">
                <label className="block text-sm text-gray-500 mb-3">בחר מגדר</label>

                {genderMode === 'simple' && (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {['גבר', 'אישה', 'זוג'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleGenderSimple(opt)}
                          className={`py-3 rounded-2xl font-bold border-2 transition-all ${
                            currentGender === opt
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white border-gray-300 hover:border-purple-400'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleGenderCustom}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-purple-400 hover:text-purple-700"
                    >
                      אחר (בחירה מותאמת)
                    </button>
                    {currentGender && currentGender !== 'גבר' && currentGender !== 'אישה' && currentGender !== 'זוג' && (
                      <div className="mt-2 text-center text-purple-700 font-medium">{currentGender}</div>
                    )}
                  </>
                )}

                {genderMode === 'custom' && (
                  <div className="space-y-5">
                    <div>
                      <div className="text-center font-bold mb-2">גברים</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {[0,1,2,3,4,5,6,7,8].map(num => (
                          <button
                            key={num}
                            onClick={() => setMenCount(num)}
                            className={`w-12 h-12 rounded-full font-bold border-2 ${
                              menCount === num ? 'bg-[#3f2a1e] text-white border-[#3f2a1e]' : 'bg-white border-gray-300'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-center font-bold mb-2">נשים</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {[0,1,2,3,4,5,6,7,8].map(num => (
                          <button
                            key={num}
                            onClick={() => setWomenCount(num)}
                            className={`w-12 h-12 rounded-full font-bold border-2 ${
                              womenCount === num ? 'bg-[#3f2a1e] text-white border-[#3f2a1e]' : 'bg-white border-gray-300'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(menCount > 0 || womenCount > 0) && (
                      <div className="bg-purple-50 rounded-2xl p-3 text-center text-purple-800 font-medium">
                        {menCount > 0 && `${menCount} גבר${menCount > 1 ? 'ים' : ''}`}
                        {menCount > 0 && womenCount > 0 && ' + '}
                        {womenCount > 0 && `${womenCount} איש${womenCount > 1 ? 'ות' : 'ה'}`}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setGenderMode('simple')}
                        className="flex-1 py-3 border rounded-2xl"
                      >
                        ביטול
                      </button>
                      <button
                        onClick={saveCustomGender}
                        className="flex-1 py-3 bg-purple-600 text-white rounded-2xl font-bold"
                      >
                        שמור
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-3xl p-5 shadow">
              <label className="block text-sm text-gray-500 mb-2">הערות</label>
              <textarea 
                value={guest.notes || ''} 
                onChange={(e) => setGuest({ ...guest, notes: e.target.value })} 
                className="w-full h-28 p-4 border rounded-2xl text-sm" 
                placeholder="הערות..."
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button 
            onClick={saveAndGoBack} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-20 py-4 rounded-2xl text-xl font-medium"
          >
            עדכן והמשך
          </button>
        </div>
      </div>
    </div>
  );
}