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
  tableNumber: number;
  assignedGuests?: string[];
  angle?: number;
  scale?: number;
  isReserve?: boolean;
  isSpecial?: boolean;
  guestSeats?: Record<string, number>;
}

const norm = (s: any) => String(s || '').trim().replace(/\s+/g, ' ');

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

  if (type === 'rect') {
    const isHorizontal = tableW >= tableH;
    let longCount = Math.floor(seats * 0.35);
    let shortCount = Math.floor((seats - longCount * 2) / 2);
    let remaining = seats - (longCount * 2 + shortCount * 2);
    if (remaining > 0) { longCount++; remaining--; }
    if (remaining > 0) { longCount++; remaining--; }
    if (remaining > 0) { shortCount++; remaining--; }
    if (remaining > 0) { shortCount++; remaining--; }

    if (isHorizontal) {
      for (let i = 0; i < longCount; i++) positions.push({ top: edge, left: ((i + 1) / (longCount + 1)) * tableW });
      for (let i = 0; i < shortCount; i++) positions.push({ top: ((i + 1) / (shortCount + 1)) * tableH, left: tableW - edge });
      for (let i = 0; i < longCount; i++) positions.push({ top: tableH - edge, left: tableW - ((i + 1) / (longCount + 1)) * tableW });
      for (let i = 0; i < shortCount; i++) positions.push({ top: tableH - ((i + 1) / (shortCount + 1)) * tableH, left: edge });
    } else {
      for (let i = 0; i < shortCount; i++) positions.push({ top: edge, left: ((i + 1) / (shortCount + 1)) * tableW });
      for (let i = 0; i < longCount; i++) positions.push({ top: ((i + 1) / (longCount + 1)) * tableH, left: tableW - edge });
      for (let i = 0; i < shortCount; i++) positions.push({ top: tableH - edge, left: tableW - ((i + 1) / (shortCount + 1)) * tableW });
      for (let i = 0; i < longCount; i++) positions.push({ top: tableH - ((i + 1) / (longCount + 1)) * tableH, left: edge });
    }
    return positions;
  }

  for (let i = 0; i < seats; i++) {
    const angle = (i / seats) * Math.PI * 2 - Math.PI / 2;
    const radiusX = tableW / 2 + 2;
    const radiusY = tableH / 2 + 2;
    positions.push({
      top: tableH / 2 + Math.sin(angle) * radiusY,
      left: tableW / 2 + Math.cos(angle) * radiusX,
    });
  }
  return positions;
};

export default function SeatingViewPage() {
  const params = useParams();
  const eventId = (params?.id as string) || '1';

  const [tables, setTables] = useState<PlacedTable[]>([]);
  const [rotation, setRotation] = useState(0);
  const [eventTitle, setEventTitle] = useState('');
  const [arrivedMap, setArrivedMap] = useState<Record<string, number>>({});
  const [guestQtyMap, setGuestQtyMap] = useState<Record<string, number>>({});
  const [winSize, setWinSize] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    const update = () => setWinSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const specific = localStorage.getItem(`seatingTables_${eventId}`);
    const general = localStorage.getItem('seatingTables');
    const raw = specific || general;
    if (raw) {
      try {
        setTables(JSON.parse(raw));
      } catch {
        setTables([]);
      }
    }

    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const ev = events.find((e: any) => e.id?.toString() === eventId.toString());
    if (ev) setEventTitle(ev.owners || ev.title || '');

    const savedGuests = JSON.parse(
      localStorage.getItem(`guests_event_${eventId}`) || '[]'
    );

    const map: Record<string, number> = {};
    const qtyMap: Record<string, number> = {};

    (savedGuests || []).forEach((g: any) => {
      if (!g?.name) return;
      const name = norm(g.name);
      map[name] = Number(g.arrivedCount) || 0;
      const q =
        Number(g.count) || Number(g.quantity) || Number(g.confirmed) || 1;
      qtyMap[name] = isNaN(q) ? 1 : q;
    });

    try {
      const arrivedList = JSON.parse(
        localStorage.getItem(`arrived_event_${eventId}`) || '[]'
      );
      (arrivedList || []).forEach((g: any) => {
        if (!g?.name) return;
        const n = Number(g.arrivedCount) || 0;
        if (n > 0) map[norm(g.name)] = n;
      });
    } catch {}

    setArrivedMap(map);
    setGuestQtyMap(qtyMap);
  }, [eventId]);

  const cycleRotation = () => setRotation((prev) => (prev + 90) % 360);

  const getOccupiedSeats = (table: PlacedTable) => {
    if (!table.assignedGuests?.length) return 0;
    return table.assignedGuests.reduce((sum, name) => {
      const key = norm(name);
      return sum + (table.guestSeats?.[name] ?? table.guestSeats?.[key] ?? guestQtyMap[key] ?? 1);
    }, 0);
  };

  const getArrivedSeats = (table: PlacedTable) => {
    if (!table.assignedGuests?.length) return 0;
    return table.assignedGuests.reduce((sum, name) => {
      const key = norm(name);
      if ((arrivedMap[key] || 0) > 0) {
        return sum + (table.guestSeats?.[name] ?? table.guestSeats?.[key] ?? guestQtyMap[key] ?? 1);
      }
      return sum;
    }, 0);
  };

  let maxX = 800;
  let maxY = 600;
  tables.forEach((t) => {
    const w = t.type === 'rect' ? 90 : 70;
    const h = t.type === 'rect' ? 100 : 70;
    maxX = Math.max(maxX, (t.x || 0) + w + 40);
    maxY = Math.max(maxY, (t.y || 0) + h + 40);
  });
  const canvasW = Math.max(900, maxX);
  const canvasH = Math.max(700, maxY);

  const isSideways = rotation % 180 === 90;
   const isMobile = winSize.w < 768;
  const pad = isMobile ? 56 : 24;
  const viewScale = Math.min(
    (winSize.w - pad) / (isSideways ? canvasH : canvasW),
    (winSize.h - pad) / (isSideways ? canvasW : canvasH),
    1.2
  );

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-hidden" dir="rtl">
           <div className="absolute top-2 left-2 right-2 z-50 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <Link
            href={`/event/${eventId}/seating`}
            className="bg-white/95 hover:bg-white text-slate-800 px-3 py-2 sm:px-4 rounded-xl shadow-lg font-bold text-xs sm:text-sm"
          >
            ← חזרה
          </Link>
          <button
            type="button"
            onClick={cycleRotation}
            className="bg-white/95 hover:bg-white text-slate-800 px-3 py-2 sm:px-4 rounded-xl shadow-lg font-bold text-xs sm:text-sm"
          >
            🔄 {rotation}°
          </button>
        </div>
        {eventTitle ? (
          <div className="mr-auto pointer-events-auto bg-black/55 text-white px-3 py-1.5 rounded-xl text-xs sm:text-sm max-w-[55%] truncate">
            {eventTitle}
          </div>
        ) : null}
      </div>

      <div className="w-full h-full overflow-hidden flex items-center justify-center">
        <div
          className="relative transition-transform duration-500"
          style={{
            width: canvasW,
            height: canvasH,
            transform: `scale(${viewScale}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            backgroundColor: '#c4a574',
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        >
          {tables.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-700 text-xl">
              אין שולחנות — בנה קודם בסקיצה
            </div>
          ) : (
            tables.map((table) => {
              const occupied = getOccupiedSeats(table);
              const arrivedSeats = getArrivedSeats(table);
              const isRound = table.type === 'round';
              const isRotated = (table.angle || 0) === 90;

              let tableW = 55;
              let tableH = 55;
              if (table.isSpecial) {
                tableW = table.type === 'dj' ? 92 : 110;
                tableH = table.type === 'dj' ? 55 : 110;
              } else if (table.type === 'round' || table.type === 'square') {
                tableW = 55;
                tableH = 55;
              } else if (table.type === 'rect') {
                tableW = 52;
                tableH = 83;
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
                  className="absolute select-none"
                  style={{
                    left: table.x,
                    top: table.y,
                    width: tableW,
                    height: tableH,
                    transform: `scale(${table.scale || 1})`,
                    transformOrigin: 'center center',
                  }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      borderRadius: isRound ? '9999px' : 10,
                      background: table.isSpecial
                        ? table.type === 'dj'
                          ? '#1f2937'
                          : '#334155'
                        : table.isReserve
                        ? '#ef4444'
                        : '#f5e6c8',
                      border: table.isReserve
                        ? '3px solid #991b1b'
                        : '2.5px solid #78350f',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
                    }}
                  >
                    {!table.isSpecial && (
                      <span
                        className="font-black"
                        style={{
                          fontSize: 15,
                          color: table.isReserve ? '#fff' : '#78350f',
                        }}
                      >
                        {table.tableNumber}
                      </span>
                    )}
                    {table.isSpecial && (
                      <div className="flex flex-col items-center">
                        <span className="text-2xl text-white/80">
                          {table.type === 'dj' ? '🎧' : '💃'}
                        </span>
                        <span className="text-[10px] text-white font-bold">
                          {table.type === 'dj' ? 'DJ' : 'רחבת ריקודים'}
                        </span>
                      </div>
                    )}
                    {table.isReserve && !table.isSpecial && (
                      <span className="absolute text-2xl font-black text-white/40">
                        R
                      </span>
                    )}

                    {!table.isSpecial &&
                      seatPositions.map((pos, i) => {
                        const isArrived = i < arrivedSeats;
                        const isOccupied = i < occupied;
                        const chairSize =
                          table.seats >= 20 ? 7 : table.seats >= 14 ? 8 : 10;
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
                              background: isArrived
                                ? '#3b82f6'
                                : isOccupied
                                ? '#dc2626'
                                : '#fffbeb',
                              border: isArrived
                                ? '2px solid #1d4ed8'
                                : isOccupied
                                ? '2px solid #991b1b'
                                : '2px solid #92400e',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                            }}
                          />
                        );
                      })}
                  </div>

                  {!table.isSpecial && (
  <div
    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-bold"
    style={{
      top: '100%',
      marginTop: 4,
      fontSize: 11,
      background: 'rgba(255,255,255,0.9)',
      padding: '1px 7px',
      borderRadius: 6,
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
    }}
  >
    <span style={{ color: '#ffffff', textShadow: '0 0 2px #000' }}>{table.seats}</span>
    <span style={{ color: '#64748b' }}>/</span>
    <span style={{ color: '#dc2626' }}>{occupied}</span>
    <span style={{ color: '#64748b' }}>/</span>
    <span style={{ color: '#2563eb' }}>{arrivedSeats}</span>
  </div>
)}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}