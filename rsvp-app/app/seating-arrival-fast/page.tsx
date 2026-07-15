'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Plus, Printer } from 'lucide-react';

export default function SeatingArrivalFastPage() {
  const [allGuests, setAllGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  const totalExpected = 370;
  const arrivedCount = allGuests.reduce((sum, g) => sum + (g.arrivedCount || 0), 0);
  const notArrivedCount = totalExpected - arrivedCount;

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('arrivalGuests') || '[]');
    
    if (saved.length === 0) {
      const demoGuests = [
        { id: 1, name: "שירי עמר", phone: "0523714969", table: "43", arrivedCount: 0 },
        { id: 2, name: "שירי סגל", phone: "0532328418", table: "32", arrivedCount: 0 },
        { id: 3, name: "סני כחלון", phone: "0526785169", table: "16", arrivedCount: 0 },
        { id: 4, name: "שני ובעלה גרין", phone: "0508313411", table: "-", arrivedCount: 0 },
        { id: 5, name: "נועם ודביר", phone: "0501234567", table: "12", arrivedCount: 0 },
      ];
      setAllGuests(demoGuests);
      localStorage.setItem('arrivalGuests', JSON.stringify(demoGuests));
    } else {
      setAllGuests(saved);
    }
    
    setFilteredGuests([]);
  }, []);

  useEffect(() => {
    localStorage.setItem('arrivalGuests', JSON.stringify(allGuests));
  }, [allGuests]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredGuests([]);
      return;
    }
    const filtered = allGuests.filter(g =>
      g.name?.toLowerCase().includes(term.toLowerCase()) || g.phone?.includes(term)
    );
    setFilteredGuests(filtered);
  };

  const markArrival = (id, count) => {
    const updated = allGuests.map(guest => 
      guest.id === id ? { ...guest, arrivedCount: count } : guest
    );
    setAllGuests(updated);

    setSearchTerm('');
    setFilteredGuests([]);

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 80);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilteredGuests([]);
    searchInputRef.current?.focus();
  };

  const refresh = () => {
    setSearchTerm('');
    setFilteredGuests([]);
    searchInputRef.current?.focus();
  };

  const printPage = () => window.print();

  return (
    <div className="min-h-screen bg-[#f5e8c7] p-8">
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-amber-900">הושבה מהירה</h1>

        {/* 3 כרטיסיות סיכום */}
        <div className="flex justify-center gap-8 mb-12">
          <div className="bg-white px-10 py-6 rounded-3xl shadow text-center min-w-[260px]">
            <div className="text-sm text-gray-500 mb-1">סה"כ מוזמנים שאמורים להגיע</div>
            <div className="text-5xl font-bold text-blue-600">{totalExpected}</div>
          </div>

          <div className="bg-white px-10 py-6 rounded-3xl shadow text-center min-w-[260px]">
            <div className="text-sm text-gray-500 mb-1">סה"כ אורחים שכבר הגיעו</div>
            <div className="text-5xl font-bold text-green-600">{arrivedCount}</div>
          </div>

          <div className="bg-white px-10 py-6 rounded-3xl shadow text-center min-w-[260px]">
            <div className="text-sm text-gray-500 mb-1">סה"כ אורחים שעדיין לא הגיעו</div>
            <div className="text-5xl font-bold text-amber-600">{notArrivedCount}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-10 justify-center flex-wrap">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-6 top-5 text-gray-400" size={24} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="חיפוש שם או טלפון..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white border border-gray-300 rounded-3xl text-xl focus:outline-none focus:border-amber-600"
              autoFocus
            />
          </div>

          <button onClick={clearSearch} className="bg-white px-8 py-5 rounded-3xl shadow hover:bg-gray-100 font-medium">נקה</button>
          <button onClick={refresh} className="bg-white px-8 py-5 rounded-3xl shadow hover:bg-gray-100 flex items-center gap-2 font-medium"><RefreshCw size={20} /> רענן</button>
          <button onClick={() => alert('פותח טופס הוספה')} className="bg-emerald-600 text-white px-8 py-5 rounded-3xl shadow hover:bg-emerald-700 flex items-center gap-2 font-medium"><Plus size={20} /> הוסף מוזמן</button>
          <button onClick={printPage} className="bg-amber-600 text-white px-8 py-5 rounded-3xl shadow hover:bg-amber-700 flex items-center gap-2 font-medium"><Printer size={20} /> PDF</button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-amber-100">
              <tr>
                <th className="text-right py-5 px-8">שם וטלפון</th>
                <th className="text-center py-5 px-8">הגיע</th>
                <th className="text-center py-5 px-8">שולחן</th>
                <th className="text-center py-5 px-8">1 2 3 4 5</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.length > 0 ? filteredGuests.map(guest => (
                <tr key={guest.id} className="border-b hover:bg-amber-50">
                  <td className="py-6 px-8">
                    <div className="font-semibold text-xl">{guest.name}</div>
                    <div className="text-gray-600 font-mono">{guest.phone}</div>
                  </td>

                  <td className="py-6 px-8 text-center">
                    {guest.arrivedCount > 0 ? (
                      <button onClick={() => markArrival(guest.id, 0)} className="bg-emerald-600 text-white px-12 py-5 rounded-3xl font-bold text-2xl shadow hover:bg-emerald-700">
                        הגיע {guest.arrivedCount}
                      </button>
                    ) : (
                      <div className="text-5xl text-amber-400">⏳</div>
                    )}
                  </td>

                  <td className="py-6 px-8 text-center text-gray-600 font-medium text-xl">{guest.table || '-'}</td>

                  <td className="py-6 px-8">
                    <div className="flex gap-2 justify-center flex-wrap">
                      {[1,2,3,4,5].map(num => (
                        <button
                          key={num}
                          onClick={() => markArrival(guest.id, num)}
                          className={`w-14 h-14 rounded-2xl font-bold text-xl border-2 transition-all ${guest.arrivedCount === num 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-white border-gray-300 hover:bg-emerald-50'}`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-gray-500 text-xl">
                    {searchTerm ? 'לא נמצאו תוצאות' : 'חפש מוזמן...'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}