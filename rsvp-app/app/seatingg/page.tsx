'use client';
import { useState } from 'react';
import Link from 'next/link';

interface Guest {
  id: number;
  name: string;
}

interface Table {
  id: number;
  tableNumber: number;
  name: string;
  image: string;
  width: number;
  height: number;
  gridX: number;
  gridY: number;
  angle: number;
  seats: Guest[];
  totalSeats: number;
  type: 'table' | 'dancefloor' | 'dj';
}

const GRID_SIZE = 60;
const COLS = 25;
const ROWS = 15;

export default function SeatingPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [unassignedGuests, setUnassignedGuests] = useState<Guest[]>([
    { id: 1, name: "שמעון אבר" },
    { id: 2, name: "שרה כהן" },
    { id: 3, name: "דוד לוי" },
    { id: 4, name: "רחל מור" },
    { id: 5, name: "יוסי כהן" },
    { id: 6, name: "מיכל אברהם" },
    { id: 7, name: "אבי גולן" },
    { id: 8, name: "נועה לוי" },
  ]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [nextTableNumber, setNextTableNumber] = useState(1);
  const [hoveredTableId, setHoveredTableId] = useState<number | null>(null);

  const tableOptions = [
    { name: 'עגול 10', image: '/tables/round-10.png', width: 75, height: 75, totalSeats: 10 },
    { name: 'עגול 12', image: '/tables/round-12.png', width: 85, height: 85, totalSeats: 12 },
    { name: 'מלבני ארוך 24', image: '/tables/long-24-horizontal.png', width: 170, height: 85, totalSeats: 24 },
    { name: 'מלבני ארוך 24 (אנכי)', image: '/tables/long-24-vertical.png', width: 85, height: 170, totalSeats: 24 },
  ];

  const addTable = (option: typeof tableOptions[0]) => {
    const newTable: Table = {
      id: Date.now(),
      tableNumber: nextTableNumber,
      name: option.name,
      image: option.image,
      width: option.width,
      height: option.height,
      gridX: 8,
      gridY: 6,
      angle: 0,
      seats: [],
      totalSeats: option.totalSeats,
      type: 'table',
    };
    setTables(prev => [...prev, newTable]);
    setNextTableNumber(prev => prev + 1);
  };

  const addSpecial = (name: string, width: number, height: number, type: 'dancefloor' | 'dj') => {
    const newItem: Table = {
      id: Date.now(),
      tableNumber: type === 'dancefloor' ? 0 : -1,
      name,
      image: '',
      width,
      height,
      gridX: 10,
      gridY: 8,
      angle: 0,
      seats: [],
      totalSeats: 0,
      type,
    };
    setTables(prev => [...prev, newItem]);
  };

  const assignGuestToTable = (guestId: number, tableId: number) => {
    const guest = unassignedGuests.find(g => g.id === guestId);
    if (!guest) return;

    setTables(prev => prev.map(table => {
      if (table.id === tableId && table.seats.length < table.totalSeats) {
        return { ...table, seats: [...table.seats, guest] };
      }
      return table;
    }));

    setUnassignedGuests(prev => prev.filter(g => g.id !== guestId));
  };

  const deleteTable = (id: number) => setTables(prev => prev.filter(t => t.id !== id));

  const rotateTable = (id: number) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, angle: (t.angle + 90) % 360 } : t));
  };

  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    const tableIndex = tables.findIndex(t => t.id === id);
    if (tableIndex === -1) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startGridX = tables[tableIndex].gridX;
    const startGridY = tables[tableIndex].gridY;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = Math.round((moveEvent.clientX - startX) / GRID_SIZE);
      const deltaY = Math.round((moveEvent.clientY - startY) / GRID_SIZE);

      setTables(prev => {
        const newTables = [...prev];
        newTables[tableIndex] = {
          ...newTables[tableIndex],
          gridX: Math.max(0, Math.min(COLS - 4, startGridX + deltaX)),
          gridY: Math.max(0, Math.min(ROWS - 4, startGridY + deltaY)),
        };
        return newTables;
      });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div className="min-h-screen bg-[#f5e8c7] p-8 flex gap-8">
      {/* תפריט שולחנות */}
      <div className="w-80 bg-white rounded-3xl shadow-xl p-6 h-fit sticky top-8">
        <h3 className="font-bold text-2xl mb-6 text-center">בחר שולחן</h3>
        <div className="grid grid-cols-2 gap-4">
          {tableOptions.map((option, i) => (
            <div key={i} onClick={() => addTable(option)} className="cursor-pointer text-center border-4 border-[#4a2c0f] rounded-2xl p-3 hover:bg-gray-50">
              <img src={option.image} alt={option.name} className="mx-auto h-20 object-contain" />
              <div className="text-sm mt-2 font-medium">{option.name}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t">
          <h4 className="font-medium text-center mb-4">אלמנטים מיוחדים</h4>
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => addSpecial('רחבת ריקודים', 180, 180, 'dancefloor')} className="cursor-pointer text-center border-4 border-indigo-600 bg-indigo-50 rounded-2xl p-4 hover:bg-indigo-100">
              <div className="h-16 flex items-center justify-center text-5xl">🕺</div>
              <div className="text-sm font-medium mt-2">רחבת ריקודים</div>
            </div>
            <div onClick={() => addSpecial('DJ', 140, 80, 'dj')} className="cursor-pointer text-center border-4 border-purple-600 bg-purple-50 rounded-2xl p-4 hover:bg-purple-100">
              <div className="h-16 flex items-center justify-center text-5xl">🎧</div>
              <div className="text-sm font-medium mt-2">DJ</div>
            </div>
          </div>
        </div>

        {/* כפתור + גדול */}
        <div className="mt-8">
          <Link 
            href="http://localhost:3000/addtable" 
            className="block w-full bg-[#4a2c0f] hover:bg-[#3a220c] text-white py-8 rounded-3xl text-center text-2xl font-bold transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3"
          >
            + הוסף שולחן חדש
          </Link>
        </div>
      </div>

      {/* רצפה */}
      <div className="flex-1">
        <div 
          className="relative border-[22px] border-[#4a2c0f] rounded-[60px] overflow-hidden shadow-2xl" 
          style={{ 
            height: `${ROWS * GRID_SIZE}px`, 
            width: '100%',
            maxWidth: '1450px',
            backgroundColor: '#d4b48c',
            backgroundImage: `repeating-linear-gradient(#c9a26e 0px, #c9a26e 1px, transparent 1px, transparent ${GRID_SIZE}px), repeating-linear-gradient(90deg, #c9a26e 0px, #c9a26e 1px, transparent 1px, transparent ${GRID_SIZE}px)`
          }}
        >
          {tables.map(table => {
            const x = table.gridX * GRID_SIZE;
            const y = table.gridY * GRID_SIZE;
            const isSpecial = table.type !== 'table';
            return (
              <div
                key={table.id}
                className="absolute cursor-move select-none group"
                style={{
                  left: x,
                  top: y,
                  width: table.width,
                  height: table.height,
                  transform: `rotate(${table.angle}deg)`,
                  backgroundColor: isSpecial ? (table.type === 'dancefloor' ? '#4f46e5' : '#7c3aed') : 'transparent',
                  borderRadius: isSpecial ? '16px' : '0',
                }}
                onMouseDown={(e) => handleMouseDown(e, table.id)}
                onClick={() => table.type === 'table' && setSelectedTableId(table.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  if (table.type === 'table') {
                    e.preventDefault();
                    const guestId = parseInt(e.dataTransfer.getData('guestId'));
                    assignGuestToTable(guestId, table.id);
                  }
                }}
                onMouseEnter={() => table.type === 'table' && setHoveredTableId(table.id)}
                onMouseLeave={() => setHoveredTableId(null)}
              >
                {table.type === 'table' ? (
                  <img src={table.image} alt={table.name} className="w-full h-full object-contain drop-shadow-2xl pointer-events-none" style={{ background: 'transparent' }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-5xl font-bold opacity-90">
                    {table.name}
                  </div>
                )}

                {table.type === 'table' && (
                  <>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-[#4a2c0f] rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                      {table.tableNumber}
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs bg-white px-3 py-1 rounded border border-[#4a2c0f] font-medium">
                      {table.seats.length}/{table.totalSeats}
                    </div>
                  </>
                )}

                {hoveredTableId === table.id && table.type === 'table' && table.seats.length > 0 && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-4 py-2 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none max-w-xs">
                    {table.seats.map(g => g.name).join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* תפריט מוזמנים */}
      {selectedTableId && (
        <div className="w-80 bg-white rounded-3xl shadow-xl p-6 h-fit sticky top-8">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold text-xl">מוזמנים שלא הושבו</h3>
            <button onClick={() => setSelectedTableId(null)} className="text-gray-500 hover:text-black">✕</button>
          </div>
          <div className="space-y-2 max-h-[70vh] overflow-auto">
            {unassignedGuests.length === 0 ? (
              <p className="text-center text-gray-500 py-10">כל המוזמנים הושבו!</p>
            ) : (
              unassignedGuests.map(guest => (
                <div 
                  key={guest.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('guestId', guest.id.toString())}
                  onClick={() => assignGuestToTable(guest.id, selectedTableId)}
                  className="bg-gray-100 hover:bg-gray-200 p-4 rounded-2xl cursor-grab active:cursor-grabbing transition-colors border border-gray-300"
                >
                  {guest.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}