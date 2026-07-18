// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface PlacedTable {
  id: number;
  type: string;
  seats: number;
  x: number;
  y: number;
  tableNumber?: number;
  tableName?: string;
  assignedGuests: string[];
  angle?: number;
  isReserve?: boolean;
  isSpecial?: boolean;
}

const TABLE_TYPES = [
  { type: 'round', label: 'עגול', icon: '🔵' },
  { type: 'square', label: 'מרובע', icon: '🟦' },
  { type: 'rect', label: 'מלבן', icon: '🟫' },
  { type: 'knight', label: 'נחש', icon: '🟤' },
];

const SPECIAL_ITEMS = [
  { type: 'dj', label: 'DJ', icon: '🎧', width: 180, height: 100 },
  { type: 'dancefloor', label: 'רחבת ריקודים', icon: '💃', width: 220, height: 220 },
];

const DEMO_GUESTS = [
  'שמעון אברגל', 'נופר כהן', 'דני אסולין', 'דנה אסולין', 'גבי כהן', 'אליהו כהן',
  'מיכל לוי', 'יוסי כהן', 'רינה שמעוני', 'אבי גולדשטיין', 'סימה כהן', 'אורן לוי',
  'תמר כהן', 'דוד לוי', 'רחל שמעוני', 'יונתן אברגל'
];

export default function SeatingPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [placedTables, setPlacedTables] = useState<PlacedTable[]>([]);
  const [guests, setGuests] = useState<string[]>([]);
  const [eventTitle, setEventTitle] = useState('');

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTable, setEditingTable] = useState<PlacedTable | null>(null);
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [assignedSearch, setAssignedSearch] = useState('');
  const [hoveredTableId, setHoveredTableId] = useState<number | null>(null);
  const [showTableTypes, setShowTableTypes] = useState(false);
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [selectedSeatedGuests, setSelectedSeatedGuests] = useState<Set<string>>(new Set());
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState(12);

  const selectedTable = placedTables.find(t => t.id === selectedId);

  // === טעינת נתונים לפי אירוע ===
  useEffect(() => {
    const savedTables = localStorage.getItem('seatingTables');
    if (savedTables) setPlacedTables(JSON.parse(savedTables));

    if (eventId) {
      // טעינת שם האירוע
      try {
        const myEvents = JSON.parse(localStorage.getItem('myEvents') || '[]');
        const currentEvent = myEvents.find((e: any) => e.id.toString() === eventId);
        if (currentEvent) {
          setEventTitle(currentEvent.owners || currentEvent.title || '');
        }
      } catch (e) {}

      // טעינת מוזמנים של האירוע הספציפי
      const eventGuestsKey = `guests_event_${eventId}`;
      const eventGuests = localStorage.getItem(eventGuestsKey);
      if (eventGuests) {
        try {
          const parsed = JSON.parse(eventGuests);
          const loaded = parsed.map((g: any) => g.name).filter(Boolean);
          setGuests(loaded.length > 0 ? loaded : DEMO_GUESTS);
        } catch {
          setGuests(DEMO_GUESTS);
        }
      } else {
        setGuests(DEMO_GUESTS);
      }
    }
  }, [eventId]);

  useEffect(() => {
    localStorage.setItem('seatingTables', JSON.stringify(placedTables));
  }, [placedTables]);

  const seatedGuestsWithTable = placedTables.flatMap(table =>
    table.assignedGuests.map(guest => ({
      guest,
      tableNumber: table.tableNumber,
      tableName: table.tableName
    }))
  );

  const filteredUnassigned = guests.filter(g =>
    g.toLowerCase().includes(unassignedSearch.toLowerCase())
  );

  const filteredSeated = seatedGuestsWithTable.filter(item =>
    item.guest.toLowerCase().includes(assignedSearch.toLowerCase())
  );

  const addRegularTable = () => {
    const item = TABLE_TYPES[selectedTypeIndex];
    const newTable: PlacedTable = {
      id: Date.now(),
      type: item.type,
      seats: selectedSeats,
      x: 200 + Math.random() * 400,
      y: 150 + Math.random() * 300,
      tableNumber: placedTables.length + 1,
      assignedGuests: [],
      angle: 0,
      isReserve: false,
    };
    setPlacedTables(prev => [...prev, newTable]);
    setShowAddModal(false);
    setSelectedId(newTable.id);
  };

  const addSpecial = (item: typeof SPECIAL_ITEMS[0]) => {
    const newItem: PlacedTable = {
      id: Date.now(),
      type: item.type,
      seats: 0,
      x: 300 + Math.random() * 300,
      y: 200 + Math.random() * 200,
      assignedGuests: [],
      angle: 0,
      isSpecial: true,
    };
    setPlacedTables(prev => [...prev, newItem]);
  };

  const openEdit = (table: PlacedTable) => {
    setEditingTable({ ...table });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingTable) return;
    setPlacedTables(prev => prev.map(t => t.id === editingTable.id ? editingTable : t));
    setShowEditModal(false);
    setEditingTable(null);
  };

  const resetSelectedTable = () => {
    if (!selectedId) return;
    setPlacedTables(prev => prev.map(t => {
      if (t.id === selectedId) {
        const returnedGuests = [...t.assignedGuests];
        setGuests(prevGuests => [...prevGuests, ...returnedGuests]);
        return { ...t, assignedGuests: [] };
      }
      return t;
    }));
    setSelectedSeatedGuests(new Set());
  };

  const deleteTable = (id: number) => {
    const table = placedTables.find(t => t.id === id);
    if (!table) return;
    if (confirm('למחוק את השולחן?')) {
      setGuests(prev => [...prev, ...table.assignedGuests]);
      setPlacedTables(prev => prev.filter(t => t.id !== id));
      if (selectedId === id) setSelectedId(null);
      setSelectedSeatedGuests(new Set());
    }
  };

  const onDragStartTable = (id: number) => setDraggedId(id);

  const onDropTable = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedId === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(50, e.clientX - rect.left - 70);
    const y = Math.max(50, e.clientY - rect.top - 70);
    setPlacedTables(prev => prev.map(t => t.id === draggedId ? { ...t, x, y } : t));
    setDraggedId(null);
  };

  const toggleGuestSelection = (guest: string) => {
    const newSet = new Set(selectedGuests);
    if (newSet.has(guest)) newSet.delete(guest); else newSet.add(guest);
    setSelectedGuests(newSet);
  };

  const toggleSeatedGuestSelection = (guest: string) => {
    const newSet = new Set(selectedSeatedGuests);
    if (newSet.has(guest)) newSet.delete(guest); else newSet.add(guest);
    setSelectedSeatedGuests(newSet);
  };

  const assignSelectedGuests = () => {
    if (!selectedId || selectedGuests.size === 0) return alert("בחר שולחן וסמן מוזמנים");
    const guestsToAssign = Array.from(selectedGuests);
    setPlacedTables(prev => prev.map(t =>
      t.id === selectedId
        ? { ...t, assignedGuests: [...new Set([...t.assignedGuests, ...guestsToAssign])] }
        : t
    ));
    setGuests(prev => prev.filter(g => !selectedGuests.has(g)));
    setSelectedGuests(new Set());
  };

  const removeSelectedSeatedGuests = () => {
    if (!selectedId || selectedSeatedGuests.size === 0) return;
    const guestsToRemove = Array.from(selectedSeatedGuests);
    setPlacedTables(prev => prev.map(t =>
      t.id === selectedId
        ? { ...t, assignedGuests: t.assignedGuests.filter(g => !guestsToRemove.includes(g)) }
        : t
    ));
    setGuests(prev => [...prev, ...guestsToRemove]);
    setSelectedSeatedGuests(new Set());
  };

  const assignGuest = (guest: string) => {
    if (!selectedId) return alert("קודם בחר שולחן");
    setPlacedTables(prev => prev.map(t =>
      t.id === selectedId && !t.assignedGuests.includes(guest)
        ? { ...t, assignedGuests: [...t.assignedGuests, guest] }
        : t
    ));
    setGuests(prev => prev.filter(g => g !== guest));
  };

  const rotateTable = (id: number) => {
    setPlacedTables(prev => prev.map(t => t.id === id ? { ...t, angle: (t.angle || 0) + 90 } : t));
  };

  const returnAllGuests = () => {
    const eventGuestsKey = `guests_event_${eventId}`;
    const eventGuests = localStorage.getItem(eventGuestsKey);
    if (eventGuests) {
      try {
        const parsed = JSON.parse(eventGuests);
        const names = parsed.map((g: any) => g.name).filter(Boolean);
        setGuests(names.length > 0 ? names : DEMO_GUESTS);
      } catch {
        setGuests(DEMO_GUESTS);
      }
    } else {
      setGuests(DEMO_GUESTS);
    }

    setPlacedTables(prev => prev.map(t => ({ ...t, assignedGuests: [] })));
    setSelectedGuests(new Set());
    setSelectedSeatedGuests(new Set());
  };

  const hoveredTable = placedTables.find(t => t.id === hoveredTableId);
  const totalTables = placedTables.length;
  const totalSeats = placedTables.reduce((sum, t) => sum + t.seats, 0);
  const occupiedSeats = placedTables.reduce((sum, t) => sum + t.assignedGuests.length, 0);

  return (
    <div className="flex h-screen bg-slate-900 text-white flex-col" dir="rtl">
      {/* כותרת עליונה */}
      <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700 z-50">
        <div>
          <div className="text-emerald-400 text-sm">סקיצת שולחנות</div>
          <div className="text-2xl font-bold">{eventTitle || 'אירוע'}</div>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href={`/event/${eventId}/guests`}
            className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-3xl font-medium flex items-center gap-2"
          >
            ← חזרה לרשימת המוזמנים
          </Link>

          <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 rounded-3xl font-bold">+ הוסף שולחן</button>
          <button onClick={returnAllGuests} className="bg-amber-600 hover:bg-amber-700 px-6 py-3 rounded-3xl whitespace-nowrap">אפס סקיצה</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* תפריט שמאלי - מוזמנים */}
        <div className="w-72 bg-slate-800 border-l border-slate-700 flex flex-col">
          <div className="p-5 border-b border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">מוזמנים שלא הושבו ({guests.length})</h3>
              {selectedGuests.size > 0 && (
                <button onClick={assignSelectedGuests} className="text-xs bg-emerald-600 px-3 py-1 rounded-xl">העבר {selectedGuests.size}</button>
              )}
            </div>
            <input type="text" placeholder="🔍 חיפוש..." value={unassignedSearch} onChange={(e) => setUnassignedSearch(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3 mb-4 focus:outline-none focus:border-emerald-500" />

            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-2">
              {filteredUnassigned.map((guest, i) => (
                <div key={i} className="bg-slate-700 p-3 rounded-xl flex items-center gap-3 hover:bg-slate-600">
                  <input type="checkbox" checked={selectedGuests.has(guest)} onChange={() => toggleGuestSelection(guest)} className="w-5 h-5 accent-emerald-500" />
                  <div onClick={() => assignGuest(guest)} className="flex-1 cursor-pointer">{guest}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto">
            <button onClick={() => setShowTableTypes(!showTableTypes)} className="w-full bg-slate-700 hover:bg-slate-600 p-4 rounded-2xl font-bold mb-6">
              {showTableTypes ? 'הסתר' : 'הצג'} סוגי שולחנות
            </button>

            {showTableTypes && (
              <div className="space-y-3 mb-10">
                {TABLE_TYPES.map((item, i) => (
                  <div key={i} onClick={() => { setSelectedTypeIndex(i); addRegularTable(); }} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-2xl cursor-pointer flex items-center gap-4 text-sm transition-all active:scale-95">
                    <div className="text-4xl">{item.icon}</div>
                    <div>
                      <div className="font-bold">{item.label}</div>
                      <div className="text-emerald-400 text-xs">עד 50 כסאות</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-xl font-bold mb-4">אלמנטים</h2>
            <div className="space-y-3">
              {SPECIAL_ITEMS.map((item, i) => (
                <div key={i} onClick={() => addSpecial(item)} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-2xl cursor-pointer flex items-center gap-4 text-sm transition-all active:scale-95 relative">
                  <div className="text-4xl">{item.icon}</div>
                  <div className="font-bold">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* אזור הסקיצה */}
        <div className="flex-1 relative overflow-auto" onDrop={onDropTable} onDragOver={(e) => e.preventDefault()}
          style={{ backgroundColor: '#d4b48c', backgroundImage: 'linear-gradient(#c9a26e 1px, transparent 1px), linear-gradient(90deg, #c9a26e 1px, transparent 1px)', backgroundSize: '60px 60px' }}>

          {placedTables.map(table => (
            <div key={table.id} draggable onDragStart={() => onDragStartTable(table.id)}
              onClick={() => setSelectedId(table.id)}
              onMouseEnter={() => setHoveredTableId(table.id)}
              onMouseLeave={() => setHoveredTableId(null)}
              onContextMenu={(e) => { e.preventDefault(); openEdit(table); }}
              className={`absolute flex items-center justify-center cursor-move shadow-2xl select-none transition-all ${selectedId === table.id ? 'ring-4 ring-yellow-400 scale-105' : ''}`}
              style={{ 
                left: table.x, top: table.y, 
                width: table.isSpecial ? (table.type === 'dj' ? '180px' : '220px') : (table.type === 'rect' || table.seats >= 20 ? '280px' : '160px'),
                height: table.isSpecial ? (table.type === 'dj' ? '100px' : '220px') : (table.type === 'rect' || table.seats >= 20 ? '100px' : '160px'),
                borderRadius: table.type === 'round' ? '9999px' : (table.type === 'square' || table.type === 'dancefloor') ? '20px' : '8px',
                background: table.isSpecial ? (table.type === 'dj' ? '#1f2937' : '#334155') : (table.isReserve ? '#374151' : 'linear-gradient(135deg, #854d0e, #451a03)'),
                boxShadow: '0 15px 35px rgba(0,0,0,0.5), inset 0 4px 12px rgba(255,255,255,0.15)',
                border: table.isReserve ? '3px solid #9ca3af' : '3px solid #78350f'
              }}
            >
              {!table.isSpecial && table.tableNumber && <span className="font-black text-amber-100 drop-shadow-2xl text-4xl z-10 relative">{table.tableNumber}</span>}
              {table.isSpecial && <div className="text-6xl text-white/80 z-10">{table.type === 'dj' ? '🎧 DJ' : '💃'}</div>}
              {table.isReserve && !table.isSpecial && <div className="absolute text-8xl font-black text-white/30 z-0">R</div>}

              {!table.isSpecial && Array.from({ length: table.seats }).map((_, i) => {
                const isOccupied = i < table.assignedGuests.length;
                return (
                  <div key={i} className={`absolute w-7 h-8 border-2 rounded-md flex items-center justify-center text-xs font-bold shadow-md transition-all ${isOccupied ? 'bg-red-600 border-red-800 scale-110' : 'bg-amber-50 border-amber-900'}`}
                    style={{ top: `${50 + Math.sin((i / table.seats) * Math.PI * 2) * 47}%`, left: `${50 + Math.cos((i / table.seats) * Math.PI * 2) * 47}%`, transform: 'translate(-50%, -50%)' }}>
                    {isOccupied ? '👤' : '🪑'}
                  </div>
                );
              })}

              <button onClick={(e) => { e.stopPropagation(); deleteTable(table.id); }} className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-lg z-30">✕</button>
              {!table.isSpecial && (table.type === 'rect' || table.seats >= 20) && (
                <button onClick={(e) => { e.stopPropagation(); rotateTable(table.id); }} className="absolute -top-3 -left-3 bg-blue-600 hover:bg-blue-700 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-lg z-30">↻</button>
              )}
            </div>
          ))}

          {hoveredTable && hoveredTable.assignedGuests.length > 0 && (
            <div className="absolute bg-black/90 text-white text-sm p-4 rounded-2xl shadow-2xl pointer-events-none z-50 max-w-xs" style={{ left: hoveredTable.x + 120, top: hoveredTable.y - 90 }}>
              <div className="font-bold mb-2">שולחן {hoveredTable.tableNumber} {hoveredTable.isReserve ? '(רזרבה)' : ''}:</div>
              <ul className="list-disc list-inside space-y-1">
                {hoveredTable.assignedGuests.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* תפריט ימני */}
        {selectedTable && (
          <div className="w-80 bg-slate-800 border-l border-slate-700 p-6 overflow-y-auto">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">שולחן {selectedTable.tableNumber}</h2>
              <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            {selectedTable.tableName && <p className="text-emerald-400 mb-4 text-lg">{selectedTable.tableName}</p>}
            {selectedTable.isReserve && <div className="bg-gray-600 px-4 py-2 rounded-xl inline-block mb-6">רזרבה</div>}

            <div className="bg-slate-700 rounded-2xl p-6 mb-6">
              <div className="text-4xl font-bold mb-1">{selectedTable.assignedGuests.length} / {selectedTable.seats}</div>
              <div className="text-gray-400">{selectedTable.seats - selectedTable.assignedGuests.length} פנויים</div>
            </div>

            <button onClick={resetSelectedTable} className="w-full bg-orange-600 hover:bg-orange-700 py-3 rounded-2xl font-bold mb-4">אפס שולחן</button>

            {selectedTable.assignedGuests.length > 0 && (
              <>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold">יושבים בשולחן:</h3>
                  {selectedSeatedGuests.size > 0 && (
                    <button onClick={removeSelectedSeatedGuests} className="text-xs bg-red-600 px-3 py-1 rounded-xl">הסר {selectedSeatedGuests.size}</button>
                  )}
                </div>
                <div className="space-y-2 mb-6">
                  {selectedTable.assignedGuests.map((g, i) => (
                    <div key={i} className="bg-slate-700 p-3 rounded-xl flex items-center gap-3">
                      <input type="checkbox" checked={selectedSeatedGuests.has(g)} onChange={() => toggleSeatedGuestSelection(g)} className="w-5 h-5 accent-red-500" />
                      <div className="flex-1">{g}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-800 border-t border-slate-700 p-4 text-sm flex justify-between items-center">
        <div><strong>סיכום:</strong> {totalTables} שולחנות • {occupiedSeats}/{totalSeats} מושבים</div>
        <div className="text-emerald-400">לחץ ימני על שולחן = עריכה</div>
      </div>

      {/* מודל הוספה */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-3xl p-8 w-96">
            <h2 className="text-2xl font-bold mb-6 text-center">הוסף שולחן</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">צורה</label>
                <select value={selectedTypeIndex} onChange={(e) => setSelectedTypeIndex(parseInt(e.target.value))} className="w-full p-3 border rounded-xl">
                  {TABLE_TYPES.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">מספר כסאות (4-50)</label>
                <input type="range" min="4" max="50" step="2" value={selectedSeats} onChange={(e) => setSelectedSeats(parseInt(e.target.value))} className="w-full" />
                <div className="text-center text-4xl font-bold mt-4">{selectedSeats}</div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 border rounded-2xl">ביטול</button>
                <button onClick={addRegularTable} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold">הוסף</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* מודל עריכה */}
      {showEditModal && editingTable && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-3xl p-8 w-96">
            <h2 className="text-2xl font-bold mb-6">עריכת שולחן</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">מספר שולחן</label>
                <input type="number" value={editingTable.tableNumber || ''} onChange={(e) => setEditingTable({ ...editingTable, tableNumber: parseInt(e.target.value) || undefined })} className="w-full p-3 border rounded-xl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">שם שולחן</label>
                <input type="text" value={editingTable.tableName || ''} onChange={(e) => setEditingTable({ ...editingTable, tableName: e.target.value })} className="w-full p-3 border rounded-xl" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={editingTable.isReserve} onChange={(e) => setEditingTable({ ...editingTable, isReserve: e.target.checked })} className="w-5 h-5" />
                <label>שולחן רזרבה</label>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowEditModal(false); setEditingTable(null); }} className="flex-1 py-3 border rounded-2xl">ביטול</button>
                <button onClick={saveEdit} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold">שמור</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}