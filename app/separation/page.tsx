'use client';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SeparationContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '1';
  const guestId = searchParams.get('guestId');

  const [eventData, setEventData] = useState<any>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [chosenOption, setChosenOption] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [menCount, setMenCount] = useState(0);
  const [womenCount, setWomenCount] = useState(0);

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const current = events.find((e: any) => e.id.toString() === eventId.toString());
    if (current) setEventData(current);
  }, [eventId]);

  const saveChoice = (text: string) => {
    if (guestId) {
      const key = `guests_event_${eventId}`;
      let guests = JSON.parse(localStorage.getItem(key) || '[]');
      guests = guests.map((g: any) =>
        g.id.toString() === guestId ? { ...g, separation: text } : g
      );
      localStorage.setItem(key, JSON.stringify(guests));
    }

    setChosenOption(text);
    setShowThankYou(true);
  };

  const handleSimpleChoice = (option: string) => {
    saveChoice(option);
  };

  const handleCustomSave = () => {
    if (menCount === 0 && womenCount === 0) {
      alert('נא לבחור לפחות אדם אחד');
      return;
    }

    const parts = [];
    if (menCount > 0) parts.push(`${menCount} גבר${menCount > 1 ? 'ים' : ''}`);
    if (womenCount > 0) parts.push(`${womenCount} איש${womenCount > 1 ? 'ות' : 'ה'}`);

    saveChoice(parts.join(' + '));
  };

  // מסך תודה
  if (showThankYou) {
    return (
      <div className="min-h-screen bg-[#f8f1e3] flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="text-7xl mb-6">🙏</div>
          <h2 className="text-3xl font-bold text-[#3f2a1e] mb-4">תודה על בחירתך!</h2>
          <p className="text-xl text-gray-700 mb-8">הבחירה נרשמה בהצלחה באירוע.</p>
          
          <div className="bg-[#f8f1e3] rounded-2xl p-5 mb-8">
            <p className="text-lg font-medium text-[#5c4033]">{chosenOption}</p>
          </div>

          <Link 
            href={`/event/${eventId}/guests`} 
            className="inline-block bg-[#3f2a1e] hover:bg-[#2c2118] text-white px-10 py-4 rounded-2xl text-lg font-medium transition-all"
          >
            סיום
          </Link>
        </div>
      </div>
    );
  }

  // מסך בחירה מותאמת
  if (showCustom) {
    return (
      <div className="min-h-screen bg-[#f8f1e3] py-12" dir="rtl">
        <div className="max-w-lg mx-auto px-6">
          <button 
            onClick={() => setShowCustom(false)}
            className="text-blue-600 hover:underline mb-8 inline-block"
          >
            ← חזרה
          </button>

          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2">בחירה מותאמת</h1>
            <p className="text-gray-600">בחר כמה גברים וכמה נשים</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 space-y-8">
            {/* גברים */}
            <div>
              <div className="text-xl font-bold mb-4 text-center">גברים</div>
              <div className="flex flex-wrap gap-3 justify-center">
                {[0,1,2,3,4,5,6,7,8].map(num => (
                  <button
                    key={num}
                    onClick={() => setMenCount(num)}
                    className={`w-14 h-14 rounded-full text-xl font-bold border-2 transition-all ${
                      menCount === num 
                        ? 'bg-[#3f2a1e] text-white border-[#3f2a1e]' 
                        : 'bg-white border-gray-300 hover:border-[#3f2a1e]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* נשים */}
            <div>
              <div className="text-xl font-bold mb-4 text-center">נשים</div>
              <div className="flex flex-wrap gap-3 justify-center">
                {[0,1,2,3,4,5,6,7,8].map(num => (
                  <button
                    key={num}
                    onClick={() => setWomenCount(num)}
                    className={`w-14 h-14 rounded-full text-xl font-bold border-2 transition-all ${
                      womenCount === num 
                        ? 'bg-[#3f2a1e] text-white border-[#3f2a1e]' 
                        : 'bg-white border-gray-300 hover:border-[#3f2a1e]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* סיכום */}
            {(menCount > 0 || womenCount > 0) && (
              <div className="bg-[#f8f1e3] rounded-2xl p-4 text-center text-lg font-medium">
                {menCount > 0 && `${menCount} גבר${menCount > 1 ? 'ים' : ''}`}
                {menCount > 0 && womenCount > 0 && ' + '}
                {womenCount > 0 && `${womenCount} איש${womenCount > 1 ? 'ות' : 'ה'}`}
              </div>
            )}

            <button
              onClick={handleCustomSave}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl text-xl font-bold"
            >
              אישור בחירה
            </button>
          </div>
        </div>
      </div>
    );
  }

  // מסך בחירה ראשי
  return (
    <div className="min-h-screen bg-[#f8f1e3] py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">בחירת ישיבה בהפרדה</h1>
          <p className="text-2xl text-gray-800">{eventData?.owners || 'האירוע'}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold mb-2">איך תגיעו?</h2>
            <p className="text-gray-600">לחץ על האופציה המתאימה</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <button
              onClick={() => handleSimpleChoice('גבר')}
              className="p-10 rounded-3xl border-2 border-gray-200 hover:border-[#d4a017] hover:bg-[#fff8e1] transition-all active:scale-[0.98]"
            >
              <div className="text-5xl mb-4">👨</div>
              <div className="text-2xl font-bold text-gray-900">גבר</div>
            </button>

            <button
              onClick={() => handleSimpleChoice('אישה')}
              className="p-10 rounded-3xl border-2 border-gray-200 hover:border-[#d4a017] hover:bg-[#fff8e1] transition-all active:scale-[0.98]"
            >
              <div className="text-5xl mb-4">👩</div>
              <div className="text-2xl font-bold text-gray-900">אישה</div>
            </button>

            <button
              onClick={() => handleSimpleChoice('זוג')}
              className="p-10 rounded-3xl border-2 border-gray-200 hover:border-[#d4a017] hover:bg-[#fff8e1] transition-all active:scale-[0.98]"
            >
              <div className="text-5xl mb-4">👫</div>
              <div className="text-2xl font-bold text-gray-900">זוג</div>
            </button>
          </div>

          {/* בחירה מותאמת */}
          <button
            onClick={() => setShowCustom(true)}
            className="w-full p-6 rounded-3xl border-2 border-dashed border-gray-300 hover:border-[#3f2a1e] hover:bg-gray-50 text-gray-700 text-xl font-medium transition-all"
          >
            בחירה אחרת (למשל 1 גבר + 2 נשים)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SeparationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xl">טוען...</div>}>
      <SeparationContent />
    </Suspense>
  );
}