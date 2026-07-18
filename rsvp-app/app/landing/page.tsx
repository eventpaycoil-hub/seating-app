'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LandingPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || searchParams.get('guestId');
  const eventId = searchParams.get('eventId') || '1';

  const [event, setEvent] = useState<any>(null);
  const [guest, setGuest] = useState<any>(null);
  const [heroMedia, setHeroMedia] = useState<{ type: 'video' | 'image'; url: string } | null>(null);

  const [rsvpStatus, setRsvpStatus] = useState<'none' | 'confirmed' | 'declined' | 'later'>('none');
  const [rsvpCount, setRsvpCount] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [showPersonalNote, setShowPersonalNote] = useState(false);
  const [personalNote, setPersonalNote] = useState('');

  // טעינת פרטי האירוע
  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
    if (currentEvent) setEvent(currentEvent);
  }, [eventId]);

  // טעינת מוזמן
  useEffect(() => {
    if (!ref) return;
    const saved = JSON.parse(localStorage.getItem(`guests_event_${eventId}`) || '[]');
    const found = saved.find((g: any) => g.id.toString() === ref.toString());
    if (found) setGuest(found);
  }, [ref, eventId]);

  // טעינת מדיה (סרטון > גלריה)
  useEffect(() => {
    const videos = JSON.parse(localStorage.getItem(`videos_event_${eventId}`) || '[]');
    if (videos.length > 0) {
      setHeroMedia({ type: 'video', url: videos[0].url });
      return;
    }
    const gallery = JSON.parse(localStorage.getItem(`gallery_event_${eventId}`) || '[]');
    if (gallery.length > 0) {
      setHeroMedia({ type: 'image', url: gallery[0].url });
    } else {
      setHeroMedia({ type: 'image', url: '/chatan-kala.jpg' });
    }
  }, [eventId]);

  // עדכון הערת מוזמן
  const updateGuestNote = (text: string) => {
    if (!guest || !ref) return;
    const saved = JSON.parse(localStorage.getItem(`guests_event_${eventId}`) || '[]');
    const updated = saved.map((g: any) =>
      g.id.toString() === ref.toString() ? { ...g, notes: `הערת מוזמן: ${text}` } : g
    );
    localStorage.setItem(`guests_event_${eventId}`, JSON.stringify(updated));
  };

  const handleRsvp = (count: number) => {
    setRsvpCount(count);
    setRsvpStatus('confirmed');
    setShowMore(false);
  };

  const handleDecline = () => {
    setRsvpStatus('declined');
    updateGuestNote('לא מגיע');
  };

  const handleLater = () => {
    setRsvpStatus('later');
    updateGuestNote('איני יודע כעת נא ליצור קשר בעוד כמה ימים');
  };

  const handlePersonalNoteSubmit = () => {
    if (!personalNote.trim()) return alert('נא לכתוב הודעה');
    updateGuestNote(personalNote);
    alert('ההודעה נשמרה בהצלחה!');
    setShowPersonalNote(false);
    setPersonalNote('');
  };

  // יצירת כותרת דינמית
  const getEventTitle = () => {
    if (!event) return 'האירוע שלנו';
    
    const owners = event.owners || 'בעלי השמחה';
    const type = event.eventType || 'אירוע';

    if (type.includes('בר מצוה') || type.includes('בר מצווה')) {
      return `${owners} חוגג בר מצוה`;
    }
    if (type.includes('בת מצוה') || type.includes('בת מצווה')) {
      return `${owners} חוגגת בת מצוה`;
    }
    if (type.includes('חתונה')) {
      return `חתונת ${owners}`;
    }
    return `${owners} - ${type}`;
  };

  return (
    <div className="min-h-screen bg-[#f8f1e3]" dir="rtl">
      {/* Header דינמי */}
      <div className="bg-[#3f2a1e] text-white py-6 text-center">
        <h1 className="text-5xl font-light tracking-widest">{getEventTitle()}</h1>
        {event?.eventType && (
          <p className="text-2xl mt-2 opacity-90">{event.eventType}</p>
        )}
      </div>

      {/* Hero */}
      <div className="relative h-[75vh]">
        {heroMedia?.type === 'video' ? (
          <video src={heroMedia.url} autoPlay loop muted className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <img src={heroMedia?.url} alt="הזמנה" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-center px-6">
          <div>
            <div className="text-6xl font-light mb-4">{event?.fullDate || event?.date || 'תאריך האירוע'}</div>
            <div className="text-3xl mb-2">{event?.hallName || 'מקום האירוע'}</div>
            {event?.city && <div className="text-2xl mb-2">{event.city}</div>}
            <div className="text-2xl">בשעה {event?.time || '19:30'}</div>
          </div>
        </div>
      </div>

      {/* תוכן */}
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-bold mb-10">נשמח מאוד לראותכם בשמחתנו!</h2>

        {rsvpStatus === 'none' && (
          <div className="space-y-8">
            <p className="text-xl">כמה אורחים תגיעו?</p>

            <div className="flex flex-wrap gap-4 justify-center">
              {[1,2,3,4,5].map(num => (
                <button key={num} onClick={() => handleRsvp(num)} className="bg-[#3f2a1e] hover:bg-[#5c4033] text-white w-20 h-20 rounded-2xl text-2xl font-bold active:scale-95 transition-all">
                  {num}
                </button>
              ))}
            </div>

            <button onClick={() => setShowMore(!showMore)} className="bg-amber-600 hover:bg-amber-700 text-white px-10 py-3 rounded-2xl text-lg font-medium">
              יותר מ-5
            </button>

            {showMore && (
              <div className="flex flex-wrap gap-4 justify-center pt-4 border-t">
                {[6,7,8,9,10].map(num => (
                  <button key={num} onClick={() => handleRsvp(num)} className="bg-[#3f2a1e] hover:bg-[#5c4033] text-white w-16 h-16 rounded-2xl text-xl font-bold active:scale-95 transition-all">
                    {num}
                  </button>
                ))}
              </div>
            )}

            <button onClick={handleDecline} className="mx-auto block bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl text-lg font-medium mt-4">
              לא מגיע
            </button>

            <button onClick={handleLater} className="mx-auto block bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-2xl text-lg font-medium mt-3">
              איני יודע כעת נא ליצור קשר בעוד כמה ימים
            </button>

            <button onClick={() => setShowPersonalNote(true)} className="block mx-auto text-blue-600 underline mt-6 text-lg">
              מעוניין לענות בנוסח אישי
            </button>
          </div>
        )}

        {/* הודעות סיום */}
        {rsvpStatus === 'confirmed' && (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-12">
            <div className="text-7xl mb-6">🎉</div>
            <h3 className="text-3xl font-bold text-green-800">תודה רבה!</h3>
            <p className="text-xl text-green-700 mt-4">אישרת {rsvpCount} אורחים</p>
          </div>
        )}

        {rsvpStatus === 'declined' && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-12">
            <div className="text-6xl mb-6">💕</div>
            <h3 className="text-3xl font-bold text-red-800">תודה על התשובה</h3>
          </div>
        )}

        {rsvpStatus === 'later' && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-12">
            <div className="text-6xl mb-6">⏳</div>
            <h3 className="text-3xl font-bold">תודה!</h3>
            <p className="mt-4 text-lg">ניצור איתך קשר בהמשך</p>
          </div>
        )}
      </div>

      {/* מודל הודעה אישית */}
      {showPersonalNote && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold mb-4">הודעה אישית</h3>
            <textarea value={personalNote} onChange={(e) => setPersonalNote(e.target.value)} className="w-full h-40 p-4 border rounded-2xl mb-6" placeholder="כתוב כאן את ההודעה האישית..." />
            <div className="flex gap-3">
              <button onClick={() => setShowPersonalNote(false)} className="flex-1 py-3 border rounded-2xl">ביטול</button>
              <button onClick={handlePersonalNoteSubmit} className="flex-1 py-3 bg-[#3f2a1e] text-white rounded-2xl">שלח</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}