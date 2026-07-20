// @ts-nocheck
'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, Download } from 'lucide-react';

export default function GuestsArrivedPage() {
  const params = useParams();
  const eventId = String(params.id || '1');

  const [guests, setGuests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'arrived' | 'not-arrived'>('all');

  useEffect(() => {
    const key = `guests_event_${eventId}`;
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    setGuests(Array.isArray(saved) ? saved : []);
  }, [eventId]);

  // האם הגיע – לפי שדות נפוצים אצלך
  const isArrived = (g: any) => {
    if (g.arrived === true || g.arrived === 'כן') return true;
    if (Number(g.arrivedCount) > 0) return true;
    if (g.status === 'הגיע') return true;
    return false;
  };

  const withFlags = useMemo(() => {
    return guests
      .filter((g) => g.name && String(g.name).trim())
      .map((g) => ({
        ...g,
        arrivedFlag: isArrived(g),
        tableLabel: g.table || g.tableNumber || g.seatTable || '-',
      }));
  }, [guests]);

  const filteredGuests = useMemo(() => {
    return withFlags.filter((guest) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        String(guest.name || '').toLowerCase().includes(q) ||
        String(guest.phone || '').includes(q);

      if (filter === 'arrived') return matchesSearch && guest.arrivedFlag;
      if (filter === 'not-arrived') return matchesSearch && !guest.arrivedFlag;
      return matchesSearch;
    });
  }, [withFlags, searchTerm, filter]);

  const arrivedCount = withFlags.filter((g) => g.arrivedFlag).length;
  const notArrivedCount = withFlags.length - arrivedCount;

  const downloadExcel = (type: 'arrived' | 'not-arrived' | 'all') => {
    const data = withFlags.filter((guest) => {
      if (type === 'arrived') return guest.arrivedFlag;
      if (type === 'not-arrived') return !guest.arrivedFlag;
      return true;
    });

    let excelContent = '<html><head><meta charset="UTF-8"></head><body><table border="1">\n';
    excelContent += '<tr><th>מספר</th><th>שם</th><th>טלפון</th><th>סטטוס</th><th>מיקום</th><th>הגיע</th></tr>\n';

    data.forEach((guest, i) => {
      excelContent += `<tr>
        <td>${guest.id ?? i + 1}</td>
        <td>${guest.name || ''}</td>
        <td>${guest.phone || ''}</td>
        <td>${guest.arrivedFlag ? 'הגיע' : 'לא הגיע'}</td>
        <td>${guest.tableLabel}</td>
        <td>${guest.arrivedFlag ? 'כן' : 'לא'}</td>
      </tr>\n`;
    });

    excelContent += '</table></body></html>';

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download =
      type === 'arrived'
        ? 'אורחים_שהגיעו.xls'
        : type === 'not-arrived'
        ? 'אורחים_שלא_הגיעו.xls'
        : 'כל_האורחים.xls';
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f5e8c7] p-8" dir="rtl">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href={`/event/${eventId}/guests`} className="text-[#4a2c0f] hover:underline">
            ← חזרה לדף ראשי
          </Link>
          <h1 className="text-4xl font-bold text-[#4a2c0f]">אורחים שהגיעו לאירוע</h1>
          <div className="text-sm text-gray-600">
            הגיעו: <strong className="text-green-700">{arrivedCount}</strong> · לא הגיעו:{' '}
            <strong className="text-red-700">{notArrivedCount}</strong>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="w-96 space-y-6 shrink-0">
            <div className="relative">
              <Search className="absolute left-4 top-4 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="חיפוש שם או טלפון..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:border-[#4a2c0f]"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={() => downloadExcel('arrived')}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700"
              >
                <Download size={18} />
                הורד רשימת מי שהגיעו
              </button>
              <button
                onClick={() => downloadExcel('not-arrived')}
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700"
              >
                <Download size={18} />
                הורד רשימת מי שלא הגיעו
              </button>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => setFilter('arrived')}
                className={`px-8 py-3 rounded-full font-medium ${
                  filter === 'arrived' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                אורחים שהגיעו ({arrivedCount})
              </button>
              <button
                onClick={() => setFilter('not-arrived')}
                className={`px-8 py-3 rounded-full font-medium ${
                  filter === 'not-arrived' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                אורחים שלא הגיעו ({notArrivedCount})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-8 py-3 rounded-full font-medium ${
                  filter === 'all' ? 'bg-[#4a2c0f] text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                הכל ({withFlags.length})
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="text-right py-4 px-6 font-medium">#</th>
                    <th className="text-right py-4 px-6 font-medium">שם</th>
                    <th className="text-right py-4 px-6 font-medium">טלפון</th>
                    <th className="text-right py-4 px-6 font-medium">סטטוס</th>
                    <th className="text-right py-4 px-6 font-medium">מיקום</th>
                    <th className="text-center py-4 px-6 font-medium">הגיע</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-gray-400 text-xl">
                        אין תוצאות
                      </td>
                    </tr>
                  ) : (
                    filteredGuests.map((guest, i) => (
                      <tr key={guest.id ?? i} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium">#{guest.id ?? i + 1}</td>
                        <td className="py-4 px-6">{guest.name}</td>
                        <td className="py-4 px-6 text-gray-600 font-mono" dir="ltr">
                          {guest.phone}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              guest.arrivedFlag
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {guest.arrivedFlag ? 'הגיע' : 'לא הגיע'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-600">{guest.tableLabel}</td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-block w-6 h-6 rounded-full ${
                              guest.arrivedFlag ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}