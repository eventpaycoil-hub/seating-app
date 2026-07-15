'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function InvitationPage() {
  const params = useParams();
  const eventId = params?.id as string;

  const [phone, setPhone] = useState('0546130804');
  const [attending, setAttending] = useState(true);
  const [guestCount, setGuestCount] = useState(4);
  const [dietary, setDietary] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const dietaryOptions = [
    'צמחוני', 'טבעוני', 'ללא גלוטן', 'ללא ביצים', 'ללא חלב', 'אלרגיה', 'כשר', 'ללא בשר'
  ];

  const toggleDietary = (item: string) => {
    if (dietary.includes(item)) {
      setDietary(dietary.filter(d => d !== item));
    } else {
      setDietary([...dietary, item]);
    }
  };

  const handleSubmit = () => {
    alert(`אישור הגעה נשלח בהצלחה!\nטלפון: ${phone}\nכמות: ${guestCount}\nסטטוס: ${attending ? 'מגיעים' : 'לא מגיעים'}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-white p-6" dir="rtl">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">בר המצווה של הקבוצה שלמה</h1>
          <p className="text-gray-600 mt-3">09/07/2026 • 18:00 • אולם האירועים</p>
        </div>

        <div className="mb-10">
          <label className="block text-sm font-medium mb-3">מספר טלפון</label>
          <input 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)}
            className="w-full text-4xl text-center p-8 border-2 border-gray-200 rounded-3xl focus:border-blue-500 focus:outline-none font-mono"
          />
        </div>

        <div className="mb-10">
          <label className="block text-sm font-medium mb-4">האם תגיעו?</label>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setAttending(true)} className={`py-8 rounded-3xl text-2xl font-bold transition ${attending ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100'}`}>כן, נגיע ❤️</button>
            <button onClick={() => setAttending(false)} className={`py-8 rounded-3xl text-2xl font-bold transition ${!attending ? 'bg-rose-600 text-white shadow-lg' : 'bg-gray-100'}`}>לא, מצטערים</button>
          </div>
        </div>

        {attending && (
          <div className="mb-10">
            <label className="block text-sm font-medium mb-4">כמה אנשים מגיעים?</label>
            <div className="flex gap-3 flex-wrap justify-center">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                <button key={n} onClick={() => setGuestCount(n)} className={`w-16 h-16 rounded-3xl text-3xl font-bold transition ${guestCount === n ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{n}</button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-10">
          <label className="block text-sm font-medium mb-4">בקשות מיוחדות / תזונה</label>
          <div className="flex flex-wrap gap-3">
            {dietaryOptions.map(item => (
              <button key={item} onClick={() => toggleDietary(item)} className={`px-6 py-4 rounded-3xl text-sm transition ${dietary.includes(item) ? 'bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>{item}</button>
            ))}
          </div>
        </div>

        <div className="mb-10">
          <label className="block text-sm font-medium mb-3">הערות נוספות</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full h-40 p-6 border border-gray-200 rounded-3xl focus:border-blue-500" placeholder="הערות, בקשות מיוחדות..." />
        </div>

        <button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-2xl font-bold py-7 rounded-3xl transition">
          שלח אישור הגעה
        </button>
      </div>
    </div>
  );
}