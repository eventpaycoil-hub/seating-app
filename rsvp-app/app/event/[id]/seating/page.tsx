'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type TableType = 'round12' | 'round10' | 'square12' | 'rectangle14' | 'knights24' | 'dj' | 'dancefloor' | 'custom';

interface PlacedTable {
  id: number;
  type: TableType;
  label?: string;
  position: number;
  span: number;
  occupiedSeats: number;
}

interface CustomTable {
  id: number;
  type: string;
  label: string;
  seats: number;
  shape: string;
}

export default function SeatingPlanner() {
  const GRID_SIZE = 80;
  const router = useRouter();
  const [placedTables, setPlacedTables] = useState<PlacedTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [customTables, setCustomTables] = useState<CustomTable[]>([]);
  const [availableGuests, setAvailableGuests] = useState([
    "דוד כהן", "שרה לוי", "יוסי גולד", "מיכל אברהם", "אבי כהן", "רחל כהן", "משה אברהם",
    "יונתן לוי", "תמר כהן", "איתן גולד", "נועה אברהם", "שלומי כהן", "ליאור כהן", "אורית לוי",
    "דניאל אברהם", "מירי גולד", "עמית כהן", "נועם לוי", "גלית כהן", "אלון אברהם"
  ]);

  // טעינה
  useEffect(() => {
    const savedTables = localStorage.getItem('seatingTables');
    const savedCustom = localStorage.getItem('customTables');
    const savedGuests = localStorage.getItem('availableGuests');

    if (savedTables) setPlacedTables(JSON.parse(savedTables));
    if (savedCustom) setCustomTables(JSON.parse(savedCustom));
    if (savedGuests) setAvailableGuests(JSON.parse(savedGuests));
  }, []);

  useEffect(() => {
    localStorage.setItem('seatingTables', JSON.stringify(placedTables));
  }, [placedTables]);

  const standardTables = [
    { type: 'square12' as const,   label: 'מרובע 12',   seats: 12, icon: '⬛' },
    { type: 'round12' as const,    label: 'עגול 12',    seats: 12, icon: '⚪' },
    { type: 'round10' as const,    label: 'עגול 10',    seats: 10, icon: '⚪' },
    { type: 'rectangle14' as const,label: 'מלבני 14',   seats: 14, icon: '▭' },
    { type: 'knights24' as const,  label: 'אבירים 24',  seats: 24, icon: '▭' },
    { type: 'dj' as const,         label: 'DJ',         seats: 0,  icon: '🎧' },
    { type: 'dancefloor' as const, label: 'רחבת ריקודים', seats: 0, icon: '💃' },
  ];

  const allAvailableTables = [
    ...standardTables,
    ...customTables.map(c => ({
      type: 'custom' as const,
      label: c.label,
      seats: c.seats,
      icon: c.shape === 'עגול' ? '⚪' : '⬛'
    }))
  ];

  const handleDragStartFromSidebar = (e: React.DragEvent, table: any) => {
    e.dataTransfer.setData('tableType', table.type);
    e.dataTransfer.setData('isNew', 'true');
    if (table.label) e.dataTransfer.setData('customLabel', table.label);
    if (table.seats) e.dataTransfer.setData('customSeats', table.seats);
  };

  const handleDrop = (e: React.DragEvent, newPosition: number) => {
    e.preventDefault();
    const guestName = e.dataTransfer.getData('guestName');

    if (guestName) {
      const tableIndex = placedTables.findIndex(t => t.position === newPosition);
      if (tableIndex !== -1) {
        const updatedTables = [...placedTables];
        updatedTables[tableIndex] = {
          ...updatedTables[tableIndex],
          occupiedSeats: Math.min((updatedTables[tableIndex].occupiedSeats || 0) + 1, 12)
        };
        setPlacedTables(updatedTables);

        setAvailableGuests(prev => prev.filter(name => name !== guestName));
      }
      return;
    }

    const isNew = e.dataTransfer.getData('isNew') === 'true';

    if (isNew) {
      const type = e.dataTransfer.getData('tableType') as TableType;
      const label = e.dataTransfer.getData('customLabel');
      const span = type === 'knights24' ? 2 : 1;

      for (let i = 0; i < span; i++) {
        if (newPosition + i >= GRID_SIZE || placedTables.some(t => t.position === newPosition + i)) {
          alert('אין מספיק מקום כאן');
          return;
        }
      }

      setPlacedTables([...placedTables, { 
        id: Date.now(), 
        type, 
        label: label || undefined,
        position: newPosition, 
        span, 
        occupiedSeats: 0 
      }]);
    } else {
      const tableId = parseInt(e.dataTransfer.getData('tableId'));
      const tableIndex = placedTables.findIndex(t => t.id === tableId);
      if (tableIndex === -1) return;

      const table = placedTables[tableIndex];
      const oldPosition = table.position;

      for (let i = 0; i < table.span; i++) {
        if (newPosition + i >= GRID_SIZE || 
            (newPosition + i !== oldPosition && placedTables.some(t => t.position === newPosition + i))) {
          alert('אין מספיק מקום כאן');
          return;
        }
      }

      const updatedTables = [...placedTables];
      updatedTables[tableIndex] = { ...table, position: newPosition };
      setPlacedTables(updatedTables);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const removeTable = (id: number) => {
    setPlacedTables(placedTables.filter(t => t.id !== id));
  };

  const openGuests = (tableId: number) => {
    setSelectedTable(tableId);
  };

  const addNewTable = () => {
    router.push('/addtable');
  };

  return (
    <div className="flex h-screen bg-[#f8f5f0] text-[#333] overflow-hidden">
      
      {/* תפריט ימין */}
      <div className="w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto flex-shrink-0">
        <h2 className="text-xl font-bold mb-6 text-center text-[#2c2218]">סוגי שולחנות</h2>

        <div className="space-y-3">
          {allAvailableTables.map((table, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStartFromSidebar(e, table)}
              className="group flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl cursor-grab active:cursor-grabbing hover:border-[#d4b88a] hover:shadow transition-all"
            >
              <div className="text-4xl text-[#3c2f1e] group-hover:scale-110 transition-transform">
                {table.icon}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-base text-[#2c2218]">{table.label}</div>
                {table.seats > 0 && <div className="text-sm text-gray-500">{table.seats} מושבים</div>}
              </div>
            </div>
          ))}
        </div>

        <div 
          onClick={addNewTable}
          className="mt-8 flex items-center justify-center text-4xl text-white bg-[#2c2218] hover:bg-[#3c2f1e] rounded-2xl py-5 cursor-pointer transition-all active:scale-95"
        >
          +
        </div>
      </div>

      {/* רצפת האולם */}
      <div className="flex-1 p-4 bg-[#f8f5f0] overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-medium flex items-center gap-2">
            ← חזרה לרשימת המוזמנים
          </button>

          <h1 className="text-3xl font-bold text-[#2c2218]">רצפת האולם - סידור הושבה</h1>

          <div className="relative w-72">
            <input 
              type="text" 
              placeholder="חיפוש מוזמנים..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:border-[#d4b88a]"
            />
            <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
          </div>
        </div>

        <div className="grid grid-cols-10 gap-1 bg-[#2c2218] p-4 rounded-3xl border border-[#3c2f1e] w-full h-[calc(100vh-160px)]">
          {Array.from({ length: GRID_SIZE }).map((_, index) => {
            const table = placedTables.find(t => 
              t.position === index || (t.span === 2 && t.position + 1 === index)
            );

            const isSecondCell = table?.span === 2 && table.position + 1 === index;

            return (
              <div
                key={index}
                draggable={!!table && !isSecondCell}
                onDragStart={(e) => table && !isSecondCell && handleDragStartFromFloor(e, table.id)}
                onDrop={(e) => handleDrop(e, index)}
                onDragOver={handleDragOver}
                onClick={() => table && openGuests(table.id)}
                className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold border transition-all cursor-pointer relative
                  ${table 
                    ? 'bg-[#d4b88a] text-[#3c2f1e] border-[#3c2f1e] shadow-md' 
                    : 'bg-[#3c2f1e] hover:bg-[#4a3a2a]'
                  } ${isSecondCell ? 'opacity-0 pointer-events-none' : ''}`}
              >
                {table && !isSecondCell && (
                  <div className="w-full h-full flex flex-col items-center justify-center relative">
                    <div 
                      onClick={(e) => { e.stopPropagation(); removeTable(table.id); }}
                      className="absolute top-1 right-1 text-red-600 text-xs font-bold cursor-pointer hover:text-red-800 z-10"
                    >
                      ✕
                    </div>

                    <div className={`text-3xl mb-1 ${table.type === 'knights24' ? 'text-4xl' : ''}`}>
                      {table.label ? table.label[0] : tableTypes.find(t => t.type === table.type)?.icon}
                    </div>
                    
                    <div className="flex gap-0.5 text-[6px] text-[#3c2f1e] opacity-80 flex-wrap justify-center">
                      {Array.from({ length: Math.floor((tableTypes.find(t => t.type === table.type)?.seats || 12) / 4) }).map((_, i) => (
                        <span key={i} className={i < (table.occupiedSeats || 0) ? 'text-red-600' : ''}>⬜</span>
                      ))}
                    </div>
                    
                    <div className="text-xs mt-1">#{table.id.toString().slice(-4)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* לוח מוזמנים */}
      {selectedTable && (
        <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
            <h2 className="text-xl font-bold">מוזמנים שלא הושבו ({availableGuests.length})</h2>
            <button onClick={() => setSelectedTable(null)} className="text-red-600 text-2xl">✕</button>
          </div>

          <input 
            type="text" 
            placeholder="חפש מוזמנים" 
            className="w-full p-3 border border-gray-300 rounded-2xl mb-6"
          />

          <div className="space-y-6">
            <div>
              <div className="font-semibold text-blue-600 mb-2">חברים אחים ({availableGuests.length})</div>
              <div className="space-y-2">
                {availableGuests.map((name, i) => (
                  <div 
                    key={i}
                    draggable
                    onDragStart={(e) => handleDragStartGuest(e, name)}
                    className="bg-gray-50 p-3 rounded-xl cursor-grab active:cursor-grabbing border border-gray-200 hover:bg-blue-50"
                  >
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}