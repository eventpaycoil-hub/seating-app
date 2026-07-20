'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
  { type: 'knight', label: 'נחש', icon: '🐍' },
] as const;

const SPECIAL_ITEMS = [
  { type: 'dj', label: 'DJ', icon: '🎧', isSpecial: true },
  { type: 'dancefloor', label: 'רחבת ריקודים', icon: '💃', isSpecial: true },
] as const;

const GRID = 60;

export default function SeatingPage() {
  const params = useParams();
  const eventId = (params?.id as string) || '1';

  const [placedTables, setPlacedTables] = useState<PlacedTable[]>([]);
  const [guests, setGuests] = useState<string[]>([]);
  const [guestQtyMap, setGuestQtyMap] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState(12);
  const [hoveredTableId, setHoveredTableId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTable, setEditingTable] = useState<PlacedTable | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [showTableTypes, setShowTableTypes] = useState(false);
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [selectedSeatedGuests, setSelectedSeatedGuests] = useState<Set<string>>(new Set());
    const [isAdmin, setIsAdmin] = useState(false);
  const [seatingPerms, setSeatingPerms] = useState({
    addTables: false,
    deleteTable: false,
    rotateTable: false,
    moveTables: false,
    specialItems: false,
    resetSketch: false,
    editTableInfo: false,
  });

  useEffect(() => {
    setIsAdmin(localStorage.getItem('userRole') === 'admin');
    const saved = localStorage.getItem(`permissions_seating_${eventId}`);
    if (saved) {
      setSeatingPerms(prev => ({ ...prev, ...JSON.parse(saved) }));
    }
  }, [eventId]);

  // מנהל תמיד יכול הכל, לקוח לפי ההגדרות
  const can = (key: keyof typeof seatingPerms) => isAdmin || seatingPerms[key];

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
    if (currentEvent) setEventTitle(currentEvent.owners || currentEvent.title || '');

    const savedTables = localStorage.getItem(`seatingTables_${eventId}`);
    if (savedTables) setPlacedTables(JSON.parse(savedTables));

    const savedGuests = JSON.parse(localStorage.getItem(`guests_event_${eventId}`) || '[]');
    const qtyMap: Record<string, number> = {};
    const names: string[] = [];

    savedGuests.forEach((g: any) => {
      if (!g.name) return;
      const qty = Number(g.confirmed) || Number(g.confirmedCount) || Number(g.quantity) || 1;
      qtyMap[g.name] = qty;
      names.push(g.name);
    });

    setGuestQtyMap(qtyMap);

    const assigned = new Set<string>();
    if (savedTables) {
      JSON.parse(savedTables).forEach((t: PlacedTable) => {
        (t.assignedGuests || []).forEach((name: string) => assigned.add(name));
      });
    }
    setGuests(names.filter(n => !assigned.has(n)));
  }, [eventId]);

  useEffect(() => {
    localStorage.setItem(`seatingTables_${eventId}`, JSON.stringify(placedTables));
  }, [placedTables, eventId]);

  const getGuestQty = (name: string) => guestQtyMap[name] || 1;

  const getOccupiedSeats = (table: PlacedTable) => {
    return (table.assignedGuests || []).reduce((sum, name) => sum + getGuestQty(name), 0);
  };

  const snap = (v: number) => Math.round(v / GRID) * GRID;

  const addRegularTable = () => {
    const item = TABLE_TYPES[selectedTypeIndex];
    const newTable: PlacedTable = {
      id: Date.now(),
      type: item.type,
      seats: selectedSeats,
      x: snap(120 + Math.random() * 200),
      y: snap(80 + Math.random() * 120),
      tableNumber: placedTables.filter(t => !t.isSpecial).length + 1,
      assignedGuests: [],
      angle: 0,
      isReserve: false,
      isSpecial: false,
    };
    setPlacedTables(prev => [...prev, newTable]);
    setShowAddModal(false);
  };

  const addSpecial = (item: typeof SPECIAL_ITEMS[number]) => {
    const newTable: PlacedTable = {
      id: Date.now(),
      type: item.type,
      seats: 0,
      x: snap(120 + Math.random() * 200),
      y: snap(80 + Math.random() * 120),
      assignedGuests: [],
      isSpecial: true,
    };
    setPlacedTables(prev => [...prev, newTable]);
  };

  const deleteTable = (id: number) => {
    const table = placedTables.find(t => t.id === id);
    if (table && table.assignedGuests.length > 0) {
      setGuests(prev => [...prev, ...table.assignedGuests]);
    }
    setPlacedTables(prev => prev.filter(t => t.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const rotateTable = (id: number) => {
    setPlacedTables(prev =>
      prev.map(t => (t.id === id ? { ...t, angle: (t.angle || 0) === 0 ? 90 : 0 } : t))
    );
  };

  const onDragStartTable = (id: number) => setDraggedId(id);

  const onDropTable = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedId === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = snap(e.clientX - rect.left - 30);
    const y = snap(e.clientY - rect.top - 30);
    setPlacedTables(prev => prev.map(t => (t.id === draggedId ? { ...t, x, y } : t)));
    setDraggedId(null);
  };

  const assignGuest = (guestName: string) => {
    if (!selectedId) return;
    const table = placedTables.find(t => t.id === selectedId);
    if (!table || table.isSpecial) return;
    const qty = getGuestQty(guestName);
    if (getOccupiedSeats(table) + qty > table.seats) {
      alert('אין מספיק מקומות פנויים בשולחן');
      return;
    }
    setPlacedTables(prev =>
      prev.map(t =>
        t.id === selectedId
          ? { ...t, assignedGuests: [...t.assignedGuests, guestName] }
          : t
      )
    );
    setGuests(prev => prev.filter(g => g !== guestName));
  };

  const toggleGuestSelection = (name: string) => {
    setSelectedGuests(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const assignSelectedGuests = () => {
    if (!selectedId || selectedGuests.size === 0) return;
    const table = placedTables.find(t => t.id === selectedId);
    if (!table || table.isSpecial) return;

    let occupied = getOccupiedSeats(table);
    const toAssign: string[] = [];
    selectedGuests.forEach(name => {
      const qty = getGuestQty(name);
      if (occupied + qty <= table.seats) {
        toAssign.push(name);
        occupied += qty;
      }
    });

    if (toAssign.length === 0) {
      alert('אין מספיק מקומות');
      return;
    }

    setPlacedTables(prev =>
      prev.map(t =>
        t.id === selectedId
          ? { ...t, assignedGuests: [...t.assignedGuests, ...toAssign] }
          : t
      )
    );
    setGuests(prev => prev.filter(g => !toAssign.includes(g)));
    setSelectedGuests(new Set());
  };

  const toggleSeatedGuestSelection = (name: string) => {
    setSelectedSeatedGuests(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const removeSelectedSeatedGuests = () => {
    if (!selectedId || selectedSeatedGuests.size === 0) return;
    setPlacedTables(prev =>
      prev.map(t =>
        t.id === selectedId
          ? { ...t, assignedGuests: t.assignedGuests.filter(g => !selectedSeatedGuests.has(g)) }
          : t
      )
    );
    setGuests(prev => [...prev, ...Array.from(selectedSeatedGuests)]);
    setSelectedSeatedGuests(new Set());
  };

  const resetSelectedTable = () => {
    if (!selectedId) return;
    const table = placedTables.find(t => t.id === selectedId);
    if (!table) return;
    setGuests(prev => [...prev, ...table.assignedGuests]);
    setPlacedTables(prev =>
      prev.map(t => (t.id === selectedId ? { ...t, assignedGuests: [] } : t))
    );
  };

  const returnAllGuests = () => {
    if (!confirm('לאפס את כל הסקיצה? כל המוזמנים יחזרו לרשימה')) return;
    const allAssigned: string[] = [];
    placedTables.forEach(t => allAssigned.push(...t.assignedGuests));
    setGuests(prev => [...prev, ...allAssigned]);
    setPlacedTables([]);
    setSelectedId(null);
  };

  const openEdit = (table: PlacedTable) => {
    if (table.isSpecial) return;
    setEditingTable({ ...table });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingTable) return;
    setPlacedTables(prev =>
      prev.map(t => (t.id === editingTable.id ? { ...editingTable } : t))
    );
    setShowEditModal(false);
    setEditingTable(null);
  };

  const getSeatPositions = (type: string, seats: number, tableW: number, tableH: number) => {
    const positions: { top: number; left: number }[] = [];
    const edge = -1;

    if (type === 'square') {
      const perSide = Math.floor(seats / 4);
      const extra = seats % 4;
      for (let side = 0; side < 4; side++) {
        const count = perSide + (side < extra ? 1 : 0);
        for (let i = 0; i < count; i++) {
          const t = (i + 1) / (count + 1);
          if (side === 0) positions.push({ top: edge, left: t * tableW });
          else if (side === 1) positions.push({ top: t * tableH, left: tableW - edge });
          else if (side === 2) positions.push({ top: tableH - edge, left: tableW - t * tableW });
          else positions.push({ top: tableH - t * tableH, left: edge });
        }
      }
      return positions;
    }

    if (type === 'rect' || type === 'knight') {
      const isHorizontal = tableW >= tableH;
      let longCount = Math.floor(seats * 0.35);
      let shortCount = Math.floor((seats - longCount * 2) / 2);
      let remaining = seats - (longCount * 2 + shortCount * 2);
      if (remaining > 0) { longCount++; remaining--; }
      if (remaining > 0) { longCount++; remaining--; }
      if (remaining > 0) { shortCount++; remaining--; }
      if (remaining > 0) { shortCount++; remaining--; }

      if (isHorizontal) {
        for (let i = 0; i < longCount; i++) {
          const t = (i + 1) / (longCount + 1);
          positions.push({ top: edge, left: t * tableW });
        }
        for (let i = 0; i < shortCount; i++) {
          const t = (i + 1) / (shortCount + 1);
          positions.push({ top: t * tableH, left: tableW - edge });
        }
        for (let i = 0; i < longCount; i++) {
          const t = (i + 1) / (longCount + 1);
          positions.push({ top: tableH - edge, left: tableW - t * tableW });
        }
        for (let i = 0; i < shortCount; i++) {
          const t = (i + 1) / (shortCount + 1);
          positions.push({ top: tableH - t * tableH, left: edge });
        }
      } else {
        for (let i = 0; i < shortCount; i++) {
          const t = (i + 1) / (shortCount + 1);
          positions.push({ top: edge, left: t * tableW });
        }
        for (let i = 0; i < longCount; i++) {
          const t = (i + 1) / (longCount + 1);
          positions.push({ top: t * tableH, left: tableW - edge });
        }
        for (let i = 0; i < shortCount; i++) {
          const t = (i + 1) / (shortCount + 1);
          positions.push({ top: tableH - edge, left: tableW - t * tableW });
        }
        for (let i = 0; i < longCount; i++) {
          const t = (i + 1) / (longCount + 1);
          positions.push({ top: tableH - t * tableH, left: edge });
        }
      }
      return positions;
    }

    // עגול
   const rx = tableW * 0.51;
const ry = tableH * 0.51;
    for (let i = 0; i < seats; i++) {
      const angle = (i / seats) * Math.PI * 2 - Math.PI / 2;
      positions.push({
        top: tableH / 2 + Math.sin(angle) * ry,
        left: tableW / 2 + Math.cos(angle) * rx,
      });
    }
    return positions;
  };

  const selectedTable = placedTables.find(t => t.id === selectedId) || null;
  const totalSeats = placedTables.filter(t => !t.isSpecial).reduce((s, t) => s + t.seats, 0);
  const occupiedSeats = placedTables.reduce((s, t) => s + getOccupiedSeats(t), 0);
  const totalTables = placedTables.filter(t => !t.isSpecial).length;

  const filteredUnassigned = guests.filter(g =>
    g.toLowerCase().includes(unassignedSearch.toLowerCase())
  );
    return (
    <div className="min-h-screen flex flex-col" dir="rtl" style={{ background: '#1e293b' }}>
      {/* כותרת */}
      <div className="px-4 py-2.5 flex items-center gap-3 flex-wrap" style={{ background: '#0f172a' }}>
                <div className="flex gap-2">
          {can('resetSketch') && (
            <button
              onClick={returnAllGuests}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              אפס סקיצה
            </button>
          )}
          {can('addTables') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold"
            >
              + הוסף שולחן
            </button>
          )}
          <Link
            href={`/event/${eventId}/guests`}
            className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-xl text-sm font-bold"
          >
            ← חזרה לרשימת המוזמנים
          </Link>
        </div>
        <div className="mr-auto text-left">
          <div className="text-xs text-slate-400">סקיצת שולחנות</div>
          <div className="text-white font-bold text-lg">{eventTitle || 'אירוע'}</div>
        </div>
      </div>
      {/* 3 פאנלים – LTR כדי ששמאל=פרטים, ימין=מוזמנים */}
      <div className="flex flex-1 overflow-hidden" style={{ direction: 'ltr' }}>

        {/* ===== פאנל שמאלי – פרטי שולחן ===== */}
        <div className="w-56 flex flex-col border-r border-slate-700" style={{ background: '#1e293b', direction: 'rtl' }}>
          {selectedTable && !selectedTable.isSpecial ? (
            <div className="p-3 flex-1">
              <div className="flex justify-between items-center mb-2">
                <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-white text-lg">✕</button>
                <h3 className="font-bold text-white text-base">
                  שולחן {selectedTable.tableNumber}
                  {selectedTable.tableName ? ` – ${selectedTable.tableName}` : ''}
                </h3>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 text-center mb-3">
                <div className="text-2xl font-black text-white">
                  {selectedTable.seats} / {getOccupiedSeats(selectedTable)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  פנויים {selectedTable.seats - getOccupiedSeats(selectedTable)}
                </div>
              </div>
              <button
                onClick={resetSelectedTable}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl text-sm font-bold mb-3"
              >
                אפס שולחן
              </button>
              {selectedSeatedGuests.size > 0 && (
                <button
                  onClick={removeSelectedSeatedGuests}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 py-1.5 rounded-lg text-xs font-bold mb-2"
                >
                  הסר ({selectedSeatedGuests.size})
                </button>
              )}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {selectedTable.assignedGuests.length === 0 ? (
                  <p className="text-slate-500 text-center text-xs py-3">אין מוזמנים</p>
                ) : (
                  selectedTable.assignedGuests.map(name => (
                    <label key={name} className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-lg cursor-pointer hover:bg-slate-700 text-xs text-white">
                      <input
                        type="checkbox"
                        checked={selectedSeatedGuests.has(name)}
                        onChange={() => toggleSeatedGuestSelection(name)}
                        className="w-3.5 h-3.5"
                      />
                      <span>{name}</span>
                      <span className="text-slate-400 mr-auto">({getGuestQty(name)})</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-slate-500 text-xs flex-1 flex items-center justify-center">
              לחץ על שולחן לפרטים
            </div>
          )}
        </div>

        {/* ===== רצפה ===== */}
        <div
          className="flex-1 relative overflow-auto"
          onDrop={onDropTable}
          onDragOver={(e) => e.preventDefault()}
          style={{
            backgroundColor: '#d4b48c',
            backgroundImage: `
              linear-gradient(#c9a87a 1px, transparent 1px),
              linear-gradient(90deg, #c9a87a 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        >
          {placedTables.map(table => {
            const occupied = getOccupiedSeats(table);
            const isWide = table.type === 'rect' || table.type === 'knight';
            const isRound = table.type === 'round';
            const isRotated = (table.angle || 0) === 90;
            const seats = table.seats;

            let tableW = 55;
let tableH = 55;

if (table.isSpecial) {
  tableW = table.type === 'dj' ? 92 : 110;
  tableH = table.type === 'dj' ? 55 : 110;
} else if (table.type === 'round') {
  if (seats <= 10) { tableW = 46; tableH = 46; }
  else if (seats <= 12) { tableW = 55; tableH = 55; }
  else if (seats <= 16) { tableW = 74; tableH = 74; }
  else { tableW = 92; tableH = 92; }
} else if (table.type === 'square') {
  if (seats <= 8) { tableW = 46; tableH = 46; }
  else if (seats <= 12) { tableW = 55; tableH = 55; }
  else { tableW = 74; tableH = 74; }
} else if (table.type === 'rect' || table.type === 'knight') {
  if (seats >= 20) {
    tableW = 55;
    tableH = 110;
  } else if (seats >= 14) {
    tableW = 52;
    tableH = 83;
  } else {
    tableW = 46;
    tableH = 64;
  }
}

            if (isRotated && !table.isSpecial) {
              const tmp = tableW;
              tableW = tableH;
              tableH = tmp;
            }

            const seatPositions = !table.isSpecial
              ? getSeatPositions(table.type, table.seats, tableW, tableH)
              : [];

            return (
              <div
                key={table.id}
                draggable
                onDragStart={() => onDragStartTable(table.id)}
                onClick={() => setSelectedId(table.id)}
                onMouseEnter={() => setHoveredTableId(table.id)}
                onMouseLeave={() => setHoveredTableId(null)}
                onContextMenu={(e) => { e.preventDefault(); openEdit(table); }}
                className={`absolute cursor-move select-none ${selectedId === table.id ? 'z-20' : 'z-10'}`}
                style={{
                  left: table.x,
                  top: table.y,
                  width: tableW,
                  height: tableH,
                }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    borderRadius: isRound ? '9999px' : 10,
                    background: table.isSpecial
                      ? (table.type === 'dj' ? '#1f2937' : '#334155')
                      : table.isReserve
                        ? '#fecaca'
                        : '#f5e6c8',
                    border: selectedId === table.id
                      ? '3px solid #f59e0b'
                      : table.isReserve
                        ? '2px solid #ef4444'
                        : '2.5px solid #78350f',
                    boxShadow: selectedId === table.id
                      ? '0 0 0 3px rgba(245,158,11,0.4), 0 4px 12px rgba(0,0,0,0.3)'
                      : '0 3px 10px rgba(0,0,0,0.25)',
                  }}
                >
                  {!table.isSpecial && (
                    <span
                      className="font-black"
                      style={{ fontSize: 15, color: table.isReserve ? '#991b1b' : '#78350f' }}
                    >
                      {table.tableNumber}
                    </span>
                  )}
                  {table.isSpecial && (
                    <span className="text-2xl text-white/80">
                      {table.type === 'dj' ? '🎧' : '💃'}
                    </span>
                  )}
                  {table.isReserve && !table.isSpecial && (
                    <span className="absolute text-2xl font-black text-red-400/40">R</span>
                  )}

                  {!table.isSpecial && seatPositions.map((pos, i) => {
  const isOccupied = i < occupied;
  const chairSize = table.seats >= 20 ? 7 : table.seats >= 14 ? 8 : 10;
  return (
    <div
      key={i}
      className="absolute"
      style={{
        top: pos.top - 2,
        left: pos.left - 2,
        transform: 'translate(-50%, -50%)',
        width: chairSize,
        height: chairSize,
        borderRadius: '50%',
        background: isOccupied ? '#dc2626' : '#fffbeb',
        border: isOccupied ? '2px solid #991b1b' : '2px solid #92400e',
        boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
      }}
    />
  );
})}
                </div>

 {can('deleteTable') && (
  <button
    onClick={(e) => { e.stopPropagation(); deleteTable(table.id); }}
    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow z-30"
  >
    ✕
  </button>
)}

{can('rotateTable') && !table.isSpecial && isWide && (
  <button
    onClick={(e) => { e.stopPropagation(); rotateTable(table.id); }}
    className="absolute -top-2 -left-2 bg-blue-600 hover:bg-blue-700 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow z-30"
  >
    ↻
  </button>
)}

                {hoveredTableId === table.id && table.assignedGuests.length > 0 && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
                    {table.assignedGuests.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
                {/* ===== פאנל ימני – מוזמנים ===== */}
        <div className="w-64 flex flex-col" style={{ background: '#1e293b', direction: 'rtl' }}>
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b border-slate-700">
              <h3 className="font-bold text-white text-sm mb-2">
                מוזמנים שלא הושבו ({guests.length})
              </h3>
              <input
                type="text"
                placeholder="חיפוש..."
                value={unassignedSearch}
                onChange={(e) => setUnassignedSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 mb-2"
              />
              {selectedGuests.size > 0 && selectedId && (
                <button
                  onClick={assignSelectedGuests}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg text-xs font-bold mb-2"
                >
                  הושב {selectedGuests.size} לשולחן
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredUnassigned.length === 0 ? (
                <p className="text-center text-slate-500 text-xs py-6">אין מוזמנים</p>
              ) : (
                filteredUnassigned.map(name => (
                  <div
                    key={name}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 p-2 rounded-lg cursor-pointer"
                    onClick={() => selectedId && assignGuest(name)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGuests.has(name)}
                      onChange={(e) => { e.stopPropagation(); toggleGuestSelection(name); }}
                      className="w-3.5 h-3.5"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xs text-white">{name}</span>
                    <span className="text-slate-400 text-xs mr-auto">({getGuestQty(name)})</span>
                  </div>
                ))
              )}
            </div>
          </div>

        {(can('addTables') || can('specialItems')) && (
          <div className="p-3 border-t border-slate-700 space-y-2">
            {can('addTables') && (
              <button
                onClick={() => setShowTableTypes(v => !v)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-xl text-xs font-bold"
              >
                {showTableTypes ? 'הסתר סוגי שולחנות' : 'הצג סוגי שולחנות'}
              </button>
            )}

            {showTableTypes && (
              <div className="space-y-1">
                {TABLE_TYPES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedTypeIndex(i); setShowAddModal(true); }}
                    className="w-full flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg text-xs"
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            )}

            {SPECIAL_ITEMS.map((t, i) => (
              <button
                key={i}
                onClick={() => addSpecial(t)}
                className="w-full flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl text-xs font-medium"
              >
                <span className="text-lg">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="text-xs text-slate-400 pt-2 border-t border-slate-700 text-center px-3 pb-3">
          סיכום: {totalTables} שולחנות · {occupiedSeats}/{totalSeats} מושבים
        </div>
      </div>
    </div>

      {/* מודל הוספת שולחן */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-80 shadow-2xl border border-slate-600" dir="rtl">
            <h2 className="text-lg font-bold mb-4 text-white">הוסף שולחן</h2>
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1 text-slate-300">צורה</label>
              <select
                value={selectedTypeIndex}
                onChange={(e) => setSelectedTypeIndex(parseInt(e.target.value))}
                className="w-full p-2 border border-slate-600 rounded-xl text-sm bg-slate-900 text-white"
              >
                {TABLE_TYPES.map((t, i) => (
                  <option key={i} value={i}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1 text-slate-300">מספר כסאות: {selectedSeats}</label>
              <input
                type="range"
                min="4"
                max="50"
                step="2"
                value={selectedSeats}
                onChange={(e) => setSelectedSeats(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 border border-slate-600 rounded-xl text-sm text-slate-300">ביטול</button>
              <button onClick={addRegularTable} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold">הוסף</button>
            </div>
          </div>
        </div>
      )}

      {/* מודל עריכה */}
      {showEditModal && editingTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-80 shadow-2xl border border-slate-600" dir="rtl">
            <h2 className="text-lg font-bold mb-4 text-white">עריכת שולחן</h2>
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1 text-slate-300">מספר שולחן</label>
              <input
                type="number"
                value={editingTable.tableNumber || ''}
                onChange={(e) => setEditingTable({ ...editingTable, tableNumber: parseInt(e.target.value) || 0 })}
                className="w-full p-2 border border-slate-600 rounded-xl text-sm bg-slate-900 text-white"
              />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1 text-slate-300">שם שולחן</label>
              <input
                type="text"
                value={editingTable.tableName || ''}
                onChange={(e) => setEditingTable({ ...editingTable, tableName: e.target.value })}
                className="w-full p-2 border border-slate-600 rounded-xl text-sm bg-slate-900 text-white"
              />
            </div>

            {/* רזרבה – רק למנהל */}
            {isAdmin && (
              <label className="flex items-center gap-2 mb-4 text-sm text-white">
                <input
                  type="checkbox"
                  checked={!!editingTable.isReserve}
                  onChange={(e) => setEditingTable({ ...editingTable, isReserve: e.target.checked })}
                />
                שולחן רזרבה
              </label>
            )}

                        <div className="flex gap-2">
              <button onClick={() => setShowEditModal(false)} className="flex-1 py-2 border border-slate-600 rounded-xl text-sm text-slate-300">ביטול</button>
              <button onClick={saveEdit} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold">שמור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}