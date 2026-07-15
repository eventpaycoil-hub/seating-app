'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [rsvpCount, setRsvpCount] = useState(0);
  const [showPersonalNote, setShowPersonalNote] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'none' | 'confirmed' | 'declined'>('none');
  const [showMore, setShowMore] = useState(false);
  const [heroMedia, setHeroMedia] = useState(null);

  const brideGroom = "פנינה & סהר";
  const date = "09.07.2026";
  const hall = "סרה - בית שמש";
  const time = "19:30";

  // טעינת וידאו/תמונה מה-localStorage
  useEffect(() => {
    const savedVideos = JSON.parse(localStorage.getItem('videos_event_1') || '[]'); // שנה ל-eventId אם צריך
    if (savedVideos.length > 0) {
      setHeroMedia({ type: 'video', url: savedVideos[0].url });
    }
  }, []);

  const handleRsvp = (count: number) => {
    setRsvpCount(count);
    setRsvpStatus('confirmed');
    setShowMore(false);
    setTimeout(() => {
      alert(`תודה רבה! אישרת ${count} אורחים.`);
    }, 300);
  };

  const handleDecline = () => {
    setRsvpStatus('declined');
    setRsvpCount(0);
    alert('תודה על התשובה. נשמח לראותכם בשמחות הבאות!');
  };

  return (
    <div className="min-h-screen bg-[#f8f1e3] font-sans" dir="rtl">
      {/* Header */}
      <div className="bg-[#3f2a1e] text-white py-6 text-center">
        <h1 className="text-5xl font-light tracking-widest">{brideGroom}</h1>
        <p className="text-2xl mt-3">מתחתנים</p>
      </div>

      {/* Hero - תמונה או וידאו */}
      <div className="relative h-[75vh]">
        {heroMedia?.type === 'video' ? (
          <video 
            src={heroMedia.url} 
            autoPlay 
            loop 
            muted 
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <Image 
            src="/chatan-kala.jpg" 
            alt="חתן וכלה" 
            fill 
            className="object-cover" 
            priority 
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
        
        <div className="absolute inset-0 flex items-center justify-center text-white text-center px-6">
          <div>
            <div className="text-6xl font-light mb-6">{date}</div>
            <div className="text-3xl mb-8">{hall}</div>
            <div className="text-2xl">בשעה {time}</div>
          </div>
        </div>
      </div>

      {/* RSVP Section */}
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-bold mb-10">נשמח מאוד לראותכם בשמחתנו!</h2>

        {rsvpStatus === 'none' && (
          <div className="space-y-8">
            <p className="text-xl">כמה אורחים תגיעו?</p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              {[1,2,3,4,5].map(num => (
                <button
                  key={num}
                  onClick={() => handleRsvp(num)}
                  className="bg-[#3f2a1e] hover:bg-[#5c4033] text-white w-20 h-20 rounded-2xl text-2xl font-bold transition-all active:scale-95"
                >
                  {num}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowMore(!showMore)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-10 py-3 rounded-2xl text-lg font-medium transition-all"
            >
              יותר מ-5
            </button>

            {showMore && (
              <div className="flex flex-wrap gap-4 justify-center pt-4 border-t">
                {[6,7,8,9,10].map(num => (
                  <button
                    key={num}
                    onClick={() => handleRsvp(num)}
                    className="bg-[#3f2a1e] hover:bg-[#5c4033] text-white w-16 h-16 rounded-2xl text-xl font-bold transition-all active:scale-95"
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}

            <button 
              onClick={handleDecline}
              className="mx-auto block bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl text-lg font-medium transition-all"
            >
              לא מגיע
            </button>

            <button 
              onClick={() => setShowPersonalNote(true)}
              className="block mx-auto text-blue-600 underline mt-6 text-lg font-medium"
            >
              מעוניין לענות בנוסח אישי
            </button>
          </div>
        )}

        {rsvpStatus === 'confirmed' && (
          <div className="bg-green-50 border border-green-200 rounded-3xl p-12">
            <div className="text-7xl mb-6">🎉</div>
            <h3 className="text-3xl font-bold text-green-800">תודה רבה!</h3>
            <p className="text-xl text-green-700 mt-4">אישרת {rsvpCount} אורחים</p>
            <p className="mt-8 text-gray-600">נשמח לראותכם באירוע</p>
          </div>
        )}

        {rsvpStatus === 'declined' && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-12">
            <div className="text-6xl mb-6">💕</div>
            <h3 className="text-3xl font-bold text-red-800">תודה על התשובה</h3>
            <p className="text-xl text-red-700 mt-4">נשמח לראותכם בשמחות הבאות</p>
          </div>
        )}
      </div>

      {/* Personal Note Modal */}
      {showPersonalNote && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-10 w-full max-w-lg">
            <h3 className="text-2xl font-bold mb-6">הודעה אישית</h3>
            <textarea 
              value={personalNote} 
              onChange={(e) => setPersonalNote(e.target.value)}
              className="w-full h-48 p-4 border rounded-2xl mb-6"
              placeholder="כתוב כאן את ההודעה האישית..."
            />
            <div className="flex gap-4">
              <button onClick={() => setShowPersonalNote(false)} className="flex-1 py-4 border rounded-2xl">ביטול</button>
              <button onClick={() => {
                alert('ההודעה נשלחה בהצלחה!');
                setShowPersonalNote(false);
                setPersonalNote('');
              }} className="flex-1 py-4 bg-[#3f2a1e] text-white rounded-2xl">שלח הודעה</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#3f2a1e] text-white py-12 text-center">
        <p className="text-sm">© 2026 EventPay • כל הזכויות שמורות</p>
      </footer>
    </div>
  );
}