'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function VenuePage() {
  const [address, setAddress] = useState('');
  const [hallName, setHallName] = useState('');
  const [links, setLinks] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('venueLinks') || '[]');
    setLinks(saved);
  }, []);

  const generateLinks = () => {
    if (!address.trim()) return alert('נא להזין כתובת');

    const encoded = encodeURIComponent(address);
    const wazeLink = `https://waze.com/ul?q=${encoded}&navigate=yes`;
    const googleLink = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;

    const newLink = {
      id: Date.now(),
      hallName: hallName.trim() || 'אולם כללי',
      address: address,
      waze: wazeLink,
      google: googleLink,
      date: new Date().toLocaleString('he-IL')
    };

    const updated = [newLink, ...links];
    setLinks(updated);
    localStorage.setItem('venueLinks', JSON.stringify(updated));

    alert('✅ נשמר בהצלחה!');
    setAddress('');
    setHallName('');
  };

  const deleteLink = (id) => {
    if (!confirm('למחוק את הרשומה?')) return;
    const updated = links.filter(l => l.id !== id);
    setLinks(updated);
    localStorage.setItem('venueLinks', JSON.stringify(updated));
  };

  const editLink = (link) => {
    const newHall = prompt("שם האולם:", link.hallName);
    const newAddress = prompt("כתובת:", link.address);
    if (newHall === null || newAddress === null) return;

    const encoded = encodeURIComponent(newAddress);
    const updated = links.map(l => {
      if (l.id === link.id) {
        return {
          ...l,
          hallName: newHall.trim(),
          address: newAddress,
          waze: `https://waze.com/ul?q=${encoded}&navigate=yes`,
          google: `https://www.google.com/maps/dir/?api=1&destination=${encoded}`
        };
      }
      return l;
    });

    setLinks(updated);
    localStorage.setItem('venueLinks', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-zinc-100 py-10" dir="rtl">
      <div className="max-w-6xl mx-auto px-6">
        {/* כותרת + כפתור חזרה */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <span className="text-5xl">🗺️</span>
            <h1 className="text-5xl font-bold">רשומות WAZE</h1>
          </div>
          <Link href="/event/1/guests" className="text-blue-600 hover:underline text-xl flex items-center gap-2">
            ← חזרה לרשימת המוזמנים
          </Link>
        </div>

        {/* טופס יצירה */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold mb-3">שם האולם</label>
              <input type="text" value={hallName} onChange={(e) => setHallName(e.target.value)} placeholder="למשל: טרויה" className="w-full p-5 border rounded-2xl" />
            </div>
            <div>
              <label className="block text-lg font-semibold mb-3">כתובת מלאה</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="רחוב הרצל 15, תל אביב" className="w-full p-5 border rounded-2xl" onKeyDown={(e) => e.key === 'Enter' && generateLinks()} />
            </div>
          </div>
          <button onClick={generateLinks} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl text-lg font-medium">
            צור ושמור קישורים
          </button>
        </div>

        {/* טבלה */}
        <h2 className="text-3xl font-bold mb-6">הקישורים השמורים</h2>
        {links.length === 0 ? (
          <p className="text-center text-gray-500 py-12">עדיין אין קישורים</p>
        ) : (
          <div className="bg-white rounded-3xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-5 text-right">מחק</th>
                  <th className="px-6 py-5 text-right">ערוך</th>
                  <th className="px-6 py-5 text-right">שם האולם</th>
                  <th className="px-6 py-5 text-right">כתובת</th>
                  <th className="px-6 py-5 text-center">WAZE</th>
                  <th className="px-6 py-5 text-center">Google</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id} className="border-t hover:bg-gray-50">
                    <td className="px-6 py-5">
                      <button onClick={() => deleteLink(link.id)} className="text-red-600 hover:text-red-700 text-xl">🗑</button>
                    </td>
                    <td className="px-6 py-5">
                      <button onClick={() => editLink(link)} className="text-green-600 hover:text-green-700 text-xl">✏️</button>
                    </td>
                    <td className="px-6 py-5 font-medium">{link.hallName}</td>
                    <td className="px-6 py-5 text-gray-600">{link.address}</td>
                    <td className="px-6 py-5 text-center">
                      <a href={link.waze} target="_blank" className="text-blue-600 hover:underline">פתח Waze</a>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <a href={link.google} target="_blank" className="text-green-600 hover:underline">פתח Google</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}