'use client';
import { useState } from 'react';

const initialTables = [
  { id: 1, tableNumber: "1", name: "שולחן 1", seats: 12, arrived: 8, pending: 2, notSeated: 2 },
  { id: 2, tableNumber: "2", name: "שולחן 2", seats: 10, arrived: 10, pending: 0, notSeated: 0 },
  { id: 3, tableNumber: "3", name: "שולחן 3", seats: 12, arrived: 5, pending: 4, notSeated: 3 },
  { id: 4, tableNumber: "4", name: "שולחן 4", seats: 8, arrived: 8, pending: 0, notSeated: 0 },
  { id: 5, tableNumber: "5", name: "שולחן 5", seats: 12, arrived: 0, pending: 12, notSeated: 0 },
  { id: 13, tableNumber: "13", name: "שולחן 13", seats: 12, arrived: 6, pending: 6, notSeated: 0 },
  { id: 17, tableNumber: "17", name: "שולחן 17", seats: 12, arrived: 7, pending: 5, notSeated: 0 },
];

export default function TablesStatusPage() {
  const [tables, setTables] = useState(initialTables);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // desc = הכי הרבה פנויים קודם

  const totalSeats = tables.reduce((sum, t) => sum + t.seats, 0);
  const totalArrived = tables.reduce((sum, t) => sum + t.arrived, 0);
  const totalPending = tables.reduce((sum, t) => sum + t.pending, 0);
  const totalNotSeated = tables.reduce((sum, t) => sum + t.notSeated, 0);

  const sortByEmptySeats = () => {
    const newDirection = sortDirection === 'desc' ? 'asc' : 'desc';
    setSortDirection(newDirection);

    const sorted = [...tables].sort((a, b) => {
      const emptyA = a.seats - a.arrived;
      const emptyB = b.seats - b.arrived;
      return newDirection === 'desc' ? emptyB - emptyA : emptyA - emptyB;
    });

    setTables(sorted);
  };

  return (
    <div className="min-h-screen bg-[#f5e8c7] p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10 text-[#4a2c0f]">מצב שולחנות נוכחי</h1>

        {/* סטטיסטיקות כלליות */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl shadow text-center">
            <div className="text-4xl font-bold text-[#4a2c0f]">{totalSeats}</div>
            <div className="text-sm text-gray-600">סה"כ מקומות</div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow text-center">
            <div className="text-4xl font-bold text-green-600">{totalArrived}</div>
            <div className="text-sm text-gray-600">הגיעו</div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow text-center">
            <div className="text-4xl font-bold text-amber-600">{totalPending}</div>
            <div className="text-sm text-gray-600">טרם הגיעו</div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow text-center">
            <div className="text-4xl font-bold text-red-600">{totalNotSeated}</div>
            <div className="text-sm text-gray-600">לא הושבו</div>
          </div>
        </div>

        {/* טבלה */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="text-right py-5 px-6">שם שולחן</th>
                <th 
                  onClick={sortByEmptySeats}
                  className="text-center py-5 px-6 cursor-pointer hover:bg-gray-200 transition flex items-center justify-center gap-1"
                >
                  מספר שולחן 
                  <span className="text-xs">↓↑</span>
                </th>
                <th className="text-center py-5 px-6">מקומות ישיבה</th>
                <th className="text-center py-5 px-6">הגיעו</th>
                <th className="text-center py-5 px-6">טרם הגיעו</th>
                <th className="text-center py-5 px-6">לא הושבו</th>
                <th className="text-center py-5 px-6">הושב מוזמנים</th>
              </tr>
            </thead>
            <tbody>
              {tables.map(table => {
                const emptySeats = table.seats - table.arrived;
                return (
                  <tr key={table.id} className="border-b hover:bg-gray-50">
                    <td className="py-5 px-6 font-semibold">{table.name}</td>
                    <td className="py-5 px-6 text-center font-medium">{table.tableNumber}</td>
                    <td className="py-5 px-6 text-center font-medium">{table.seats}</td>
                    <td className="py-5 px-6 text-center text-green-600 font-bold">{table.arrived}</td>
                    <td className="py-5 px-6 text-center text-amber-600 font-bold">{table.pending}</td>
                    <td className="py-5 px-6 text-center text-red-600 font-bold">{emptySeats}</td>
                    <td className="py-5 px-6 text-center">
                      <div className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-medium">
                        {table.arrived}/{table.seats}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}