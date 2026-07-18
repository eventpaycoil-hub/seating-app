'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function LandingPageContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');
  const code = searchParams.get('code') || searchParams.get('ref');

  const [event, setEvent] = useState<any>(null);
  const [heroMedia, setHeroMedia] = useState<{ type: 'video' | 'image'; url: string } | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<'none' | 'confirmed' | 'notFound' | 'general' | 'pending'>('none');
  const [rsvpCount, setRsvpCount] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [showPersonalNote, setShowPersonalNote] = useState(false);
  const [personalNote, setPersonalNote] = useState('');

  // טעינת פרטי האירוע
  useEffect(() => {
    if (!eventId) return;
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
    if (currentEvent) setEvent(currentEvent);
  }, [eventId]);

  // טעינת מדיה
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

  // אישור עם מספר אורחים
  const handleRsvp = (count: number) => {
    if (!eventId) {
      alert('קישור לא תקין');
      return;
    }

    if (!code) {
      setRsvpStatus('general');
      return;
    }

    const key = `guests_event_${eventId}`;
    let saved: any[] = JSON.parse(localStorage.getItem(key) || '[]');

    const guestIndex = saved.findIndex((g: any) => 
      g.inviteCode === code || g.code === code
    );

    if (guestIndex === -1) {
      setRsvpStatus('notFound');
      return;
    }

    saved[guestIndex].confirmed = count;
    saved[guestIndex].confirmedCount = count;
    saved[guestIndex].arrivedCount = count;

    localStorage.setItem(key, JSON.stringify(saved));

    setRsvpCount(count);
    setRsvpStatus('confirmed');
  };

  // כפתור "לא יודע כרגע"
  const handleUnknown = () => {
    if (!eventId || !code) {
      setRsvpStatus('general');
      return;
    }

    const key = `guests_event_${eventId}`;
    let saved: any[] = JSON.parse(localStorage.getItem(key) || '[]');

    const guestIndex = saved.findIndex((g: any) => 
      g.inviteCode === code || g.code === code
    );

    if (guestIndex === -1) {
      setRsvpStatus('notFound');
      return;
    }

    saved[guestIndex].confirmed = 'לא ידוע';
    saved[guestIndex].confirmedCount = 0;

    localStorage.setItem(key, JSON.stringify(saved));

    setRsvpStatus('pending');
  };

  const handlePersonalNoteSubmit = () => {
    if (!personalNote.trim()) {
      alert('נא לכתוב הודעה');
      return;
    }

    if (code && eventId) {
      const key = `guests_event_${eventId}`;
      let saved: any[] = JSON.parse(localStorage.getItem(key) || '[]');
      const guestIndex = saved.findIndex((g: any) => g.inviteCode === code || g.code === code);

      if (guestIndex !== -1) {
        saved[guestIndex].notes = personalNote;
        localStorage.setItem(key, JSON.stringify(saved));
      }
    }

    alert('ההודעה נשמרה בהצלחה!');
    setShowPersonalNote(false);
    setPersonalNote('');
    setRsvpStatus('confirmed');
  };

  if (!eventId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f1e3]" dir="rtl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-4">קישור לא תקין</h2>
          <p>הקישור חסר פרטים.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f1e3]" dir="rtl">
      
      {/* Header */}
      <div className="bg-[#3f2a1e] text-white py-6 text-center">
        <h1 className="text-5xl font-light tracking-widest">
          {event?.owners ? `החתונה של ${event.owners}` : 'האירוע שלנו'}
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
                alt="הזמנה" 
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
            {formatDate(event?.fullDate || event?.date)}
          </div>
          <div className="text-2xl mb-1.5">{event?.hallName}</div>
          {event?.city && <div className="text-xl mb-1.5">{event.city}</div>}
          <div className="text-xl">בשעה {event?.time || '19:30'}</div>
        </div>

        <h2 className="text-4xl font-bold mb-10 text-[#3f2a1e]">
          נשמח מאוד לראותכם בשמחתנו!
        </h2>

        {/* בחירת כמות */}
        {rsvpStatus === 'none' && (
          <div className="space-y-6">
            <p className="text-xl">כמה אורחים תגיעו?</p>

            <div className="flex flex-wrap gap-4 justify-center">
              {[1,2,3,4,5].map(num => (
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
              יותר מ-5
            </button>

            {showMore && (
              <div className="flex flex-wrap gap-4 justify-center pt-4 border-t">
                {[6,7,8,9,10].map(num => (
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

            {/* כפתור "לא יודע כרגע" */}
            <div className="pt-4">
              <button
                onClick={handleUnknown}
                className="w-full max-w-md mx-auto bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 rounded-2xl text-lg font-medium transition-all"
              >
                לא יודע כרגע, צרו איתי קשר בעוד מספר ימים
              </button>
            </div>

            {/* כפתור הערה אישית */}
            <button
              onClick={() => setShowPersonalNote(true)}
              className="mt-4 px-8 py-3 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-2xl text-lg font-medium transition-all"
            >
              מעוניין לענות בנוסח אישי
            </button>
          </div>
        )}

        {/* הצלחה */}
        {rsvpStatus === 'confirmed' && (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-12">
            <div className="text-7xl mb-6">🎉</div>
            <h3 className="text-3xl font-bold text-green-800 mb-2">תודה רבה!</h3>
            <p className="text-xl text-green-700">אישרת הגעה ל-{rsvpCount} אורחים</p>
          </div>
        )}

        {/* לא יודע כרגע */}
        {rsvpStatus === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-12">
            <div className="text-6xl mb-6">📞</div>
            <h3 className="text-3xl font-bold text-blue-800 mb-3">תודה!</h3>
            <p className="text-xl text-blue-700">ניצור איתך קשר בהמשך כדי לתאם.</p>
          </div>
        )}

        {/* לא נמצא */}
        {rsvpStatus === 'notFound' && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-12">
            <h3 className="text-2xl font-bold text-red-700 mb-4">לא נמצא מוזמן</h3>
            <p>הקוד שהוזן אינו תקף לאירוע זה.</p>
          </div>
        )}

        {/* קישור כללי */}
        {rsvpStatus === 'general' && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-12">
            <h3 className="text-2xl font-bold text-amber-700 mb-4">קישור כללי</h3>
            <p>הקישור הזה הוא כללי.<br />הקישור האישי שלך נשלח אליך ב-SMS.</p>
          </div>
        )}
      </div>

      {/* מודל הערה אישית */}
      {showPersonalNote && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold mb-4">הודעה אישית</h3>
            <textarea
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              className="w-full h-40 p-4 border rounded-2xl mb-6"
              placeholder="כתוב כאן את ההודעה האישית שלך..."
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowPersonalNote(false)} 
                className="flex-1 py-3 border rounded-2xl"
              >
                ביטול
              </button>
              <button 
                onClick={handlePersonalNoteSubmit} 
                className="flex-1 py-3 bg-[#3f2a1e] text-white rounded-2xl"
              >
                שלח
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