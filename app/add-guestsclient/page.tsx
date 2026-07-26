'use client';
import { useState } from 'react';
import { UserPlus, AlertCircle } from 'lucide-react';

interface Guest {
  id: number;
  group: string;
  name: string;
  phone: string;
}

export default function AddGuestsPage() {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [addedGuests, setAddedGuests] = useState<Guest[]>([]);

  const groups = [
    'משפחת החתן',
    'משפחת הכלה',
    'חברים',
    'עבודה',
    'אחר'
  ];

  const validatePhone = (phoneNumber: string): boolean => {
    // רק ספרות, בדיוק 10 ספרות
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return cleanPhone.length === 10;
  };

  const addGuest = () => {
    setError('');

    if (!selectedGroup) {
      setError('נא לבחור קבוצה');
      return;
    }
    if (!guestName.trim()) {
      setError('נא להזין שם אורח');
      return;
    }
    if (!validatePhone(phone)) {
      setError('העלו מס סלולרי בן 10 ספרות ללא רווחים או מקפים');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');

    const newGuest: Guest = {
      id: Date.now(),
      group: selectedGroup,
      name: guestName.trim(),
      phone: cleanPhone
    };

    setAddedGuests([newGuest, ...addedGuests]);
    
    // ניקוי שדות
    setGuestName('');
    setPhone('');
  };

  const notifyAdmin = () => {
    if (addedGuests.length === 0) {
      alert('לא הוספת מוזמנים עדיין');
      return;
    }

    // כאן אפשר לשלוח לשרת / להנהלה
    alert(`✅ תודה! עדכנו את הנהלת האתר.\n\nהוספת ${addedGuests.length} מוזמנים חדשים.\nהנהלת האתר תשלח להם הודעה לאישור הגעה בקרוב.`);
    
    // אפשר לנקות את הרשימה אחרי שליחה
    // setAddedGuests([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4eb] via-white to-[#f5eede] py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-amber-900">הוספת מוזמנים</h1>
          <p className="text-amber-700 mt-2">הוסף מוזמנים לקבוצות</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-10">
          {/* בחירת קבוצה */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">בחר קבוצה</label>
            <select 
              value={selectedGroup} 
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full border border-gray-300 rounded-2xl px-5 py-4 text-lg"
            >
              <option value="">-- בחר קבוצה --</option>
              {groups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>

          {/* שם אורח */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">שם האורח</label>
            <input 
              type="text" 
              value={guestName} 
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full border border-gray-300 rounded-2xl px-5 py-4 text-lg" 
              placeholder="שם פרטי ומשפחה" 
            />
          </div>

          {/* טלפון */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">טלפון</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-2xl px-5 py-4 text-lg" 
              placeholder="0501234567" 
              maxLength={10}
            />
            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-2xl">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* כפתור הוספה */}
          <button 
            onClick={addGuest}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-2xl py-5 rounded-3xl flex items-center justify-center gap-3 hover:brightness-110 transition"
          >
            <UserPlus size={28} /> הוסף מוזמן
          </button>

          {/* טקסט עדכון הנהלה */}
          <div className="mt-10 text-center text-gray-600 leading-relaxed">
            אחר שהוספתם את כל המוזמנים שרציתם להוסיף בפעימה זו,{' '}
            <button 
              onClick={notifyAdmin}
              className="text-amber-600 font-bold underline hover:text-amber-700"
            >
              לחצו כאן
            </button>{' '}
            על מנת לעדכן את הנהלת האתר שהוספתם את המוזמנים החדשים והנהלת האתר תשלח להם הודעה לאישור הגעה בקרוב.
          </div>
        </div>

        {/* רשימת מוזמנים שהוספו בפעימה זו */}
        {addedGuests.length > 0 && (
          <div className="mt-10 bg-white rounded-3xl shadow p-8">
            <h3 className="font-bold text-xl mb-6">מוזמנים שהוספת בפעימה זו ({addedGuests.length})</h3>
            <div className="space-y-4">
              {addedGuests.map(guest => (
                <div key={guest.id} className="flex justify-between items-center bg-gray-50 p-5 rounded-2xl">
                  <div>
                    <p className="font-medium">{guest.name}</p>
                    <p className="text-sm text-gray-500">{guest.group} • {guest.phone}</p>
                  </div>
                  <button 
                    onClick={() => setAddedGuests(addedGuests.filter(g => g.id !== guest.id))}
                    className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-sm"
                  >
                    הסר
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}