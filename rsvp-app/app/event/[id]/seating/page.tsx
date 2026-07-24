// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { fetchSeatingFromSupabase, saveSeating } from '../../../lib/seating';

import { getGuests, fetchGuestsFromSupabase } from '../../../lib/guests';
interface PlacedTable {
  id: number;
  type: string;
  seats: number;
  x: number;
  y: number;
  tableNumber?: number;
  tableName?: string;
  assignedGuests: string[];
  guestSeats?: Record<string, number>;
  angle?: number;
  isReserve?: boolean;
  isSpecial?: boolean;
  scale?: number;
}

interface UnassignedGuest {
  name: string;
  qty: number;
  group: string;
}

const TABLE_TYPES = [
  { type: 'round', label: 'עגול', icon: '🔵' },
  { type: 'square', label: 'מרובע', icon: '🟦' },
  { type: 'rect', label: 'מלבן', icon: '🟫' },
] as const;

const SPECIAL_ITEMS = [
  { type: 'dj', label: 'DJ', icon: '🎧', isSpecial: true },
  { type: 'dancefloor', label: 'רחבת ריקודים', icon: '💃', isSpecial: true },
] as const;

const GRID = 68;

export default function SeatingPage() {
  const params = useParams();
  const eventId = (params?.id as string) || '1';

  const [placedTables, setPlacedTables] = useState<PlacedTable[]>([]);
  const [guests, setGuests] = useState<UnassignedGuest[]>([]);
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
  const [tablesLoaded, setTablesLoaded] = useState(false);
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [selectedSeatedGuests, setSelectedSeatedGuests] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [newTables, setNewTables] = useState<any[]>([]);
  const [draggedNewTable, setDraggedNewTable] = useState<any>(null);
  const [seatingPerms, setSeatingPerms] = useState({
    addTables: false,
    deleteTable: false,
    rotateTable: false,
    moveTables: false,
    specialItems: false,
    resetSketch: false,
    editTableInfo: false,
  });
  const [arrivedMap, setArrivedMap] = useState<Record<string, number>>({});
  const [resizingId, setResizingId] = useState<number | null>(null);

  const floorRef = useRef<HTMLDivElement>(null);
  const touchDragRef = useRef<{ id: number; offsetX: number; offsetY: number } | null>(null);
  // שמירת קבוצה מקורית לכל מוזמן – כדי שלא יאבד בהחזרה לשולחן
  const guestMetaRef = useRef<Record<string, { group: string }>>({});
  const resizeStart = useRef({ x: 0, y: 0, scale: 1 });
  useEffect(() => {
    setIsAdmin(localStorage.getItem('userRole') === 'admin');
    const saved = localStorage.getItem(`permissions_seating_${eventId}`);
    if (saved) setSeatingPerms((prev) => ({ ...prev, ...JSON.parse(saved) }));
  }, [eventId]);

  const can = (key: keyof typeof seatingPerms) => isAdmin || seatingPerms[key];

      useEffect(() => {
    let cancelled = false;

    async function load() {
      setTablesLoaded(false);
      const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
      const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
      if (currentEvent) setEventTitle(currentEvent.owners || currentEvent.title || '');

      // שולחנות
      let tables: PlacedTable[] = [];
      const cloudTables = await fetchSeatingFromSupabase(eventId);
      if (cancelled) return;

      if (cloudTables && cloudTables.length > 0) {
        tables = cloudTables as PlacedTable[];
        localStorage.setItem(`seatingTables_${eventId}`, JSON.stringify(tables));
      } else {
        const savedTables = localStorage.getItem(`seatingTables_${eventId}`);
        tables = savedTables ? JSON.parse(savedTables) : [];
      }

      setPlacedTables(tables);
      localStorage.setItem('seatingTables', JSON.stringify(tables));
      setTablesLoaded(true);
      // מוזמנים
      let savedGuests: any[] = [];
      const cloudGuests = await fetchGuestsFromSupabase(eventId);
      if (cancelled) return;

            if (cloudGuests && cloudGuests.length > 0) {
        savedGuests = cloudGuests;
        localStorage.setItem(`guests_event_${eventId}`, JSON.stringify(cloudGuests));
      } else {
        savedGuests = getGuests(eventId);
      }

      const map: Record<string, number> = {};
      (savedGuests || []).forEach((g: any) => {
        if (g?.name) map[g.name] = Number(g.arrivedCount) || 0;
      });
      setArrivedMap(map);

      const qtyMap: Record<string, number> = {};
      const list: UnassignedGuest[] = [];
      const assigned = new Set<string>();
      tables.forEach((t) => (t.assignedGuests || []).forEach((name: string) => assigned.add(name)));

      const meta: Record<string, { group: string }> = {};
      savedGuests.forEach((g: any) => {
        if (!g.name || !g.name.trim()) return;
        const status = (g.confirmed ?? '').toString().trim();
        const confirmedNum = Number(status);
        if (isNaN(confirmedNum) || confirmedNum < 1 || confirmedNum > 16) return;

        const num = Number(g.count) || Number(g.quantity) || confirmedNum || 1;
        const group = (g.group || '').trim() || 'ללא קבוצה';
        meta[g.name] = { group };
        qtyMap[g.name] = num;
        if (!assigned.has(g.name)) {
          list.push({ name: g.name, qty: num, group });
        }
      });
      guestMetaRef.current = meta;
      setGuestQtyMap(qtyMap);
      setGuests(list);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

    useEffect(() => {
    if (!eventId || !tablesLoaded) return;
    localStorage.setItem(`seatingTables_${eventId}`, JSON.stringify(placedTables));
    localStorage.setItem('seatingTables', JSON.stringify(placedTables));
    saveSeating(eventId, placedTables);
  }, [placedTables, eventId, tablesLoaded]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('newTables') || '[]');
      if (Array.isArray(saved)) setNewTables(saved);
    } catch {
      setNewTables([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('newTables', JSON.stringify(newTables));
  }, [newTables]);

  const getGuestQty = (name: string) => guestQtyMap[name] || 1;

  const getSeatedQty = (table: PlacedTable, name: string) =>
    table.guestSeats?.[name] ?? getGuestQty(name);

  const getOccupiedSeats = (table: PlacedTable) =>
    (table.assignedGuests || []).reduce(
      (sum, name) => sum + (table.guestSeats?.[name] ?? getGuestQty(name)),
      0
    );

  // מחזיר קבוצה שמורה – לא מאבד בהחזרה מהשולחן
  const addRegularTable = () => {
    const item = TABLE_TYPES[selectedTypeIndex];
    setPlacedTables((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: item.type,
        seats: selectedSeats,
        x: snap(120 + Math.random() * 200),
        y: snap(80 + Math.random() * 120),
        tableNumber: prev.filter((t) => !t.isSpecial).length + 1,
        assignedGuests: [],
        guestSeats: {},
        angle: 0,
        isReserve: false,
        isSpecial: false,
        scale: 1,
      },
    ]);
    setShowAddModal(false);
  };

  const addSpecial = (item: (typeof SPECIAL_ITEMS)[number]) => {
    setPlacedTables((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: item.type,
        seats: 0,
        x: snap(120 + Math.random() * 200),
        y: snap(80 + Math.random() * 120),
        assignedGuests: [],
        isSpecial: true,
        scale: 1,
      },
    ]);
  };

  const deleteTable = (id: number) => {
    if (!can('deleteTable')) return;
    const table = placedTables.find((t) => t.id === id);
    if (table && table.assignedGuests.length > 0) {
      setGuests((prev) => {
        let next = [...prev];
        table.assignedGuests.forEach((name) => {
          const qty = getSeatedQty(table, name);
          const existing = next.find((g) => g.name === name);
          const group = getGuestGroup(name, existing?.group);
          if (existing) {
            next = next.map((g) =>
              g.name === name ? { ...g, qty: g.qty + qty, group } : g
            );
          } else {
            next.push({ name, qty, group });
          }
        });
        return next;
      });
    }
    setPlacedTables((prev) => prev.filter((t) => t.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

    const rotateTable = (id: number) => {
    if (!can('rotateTable')) return;
    setPlacedTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, angle: (t.angle || 0) === 0 ? 90 : 0 } : t))
    );
  };

  const onResizeStart = (e: React.MouseEvent, table: PlacedTable) => {
    if (!isAdmin) return;
    e.stopPropagation();
    e.preventDefault();
    setResizingId(table.id);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      scale: table.scale || 1,
    };
  };

  useEffect(() => {
    if (resizingId === null) return;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStart.current.x;
      const next = Math.min(1.9, Math.max(0.55, resizeStart.current.scale + dx / 120));
      setPlacedTables((prev) =>
        prev.map((t) => (t.id === resizingId ? { ...t, scale: next } : t))
      );
    };

    const onUp = () => setResizingId(null);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizingId]);

  const onDragStartTable = (id: number) => {
    if (!can('moveTables') && !isAdmin) return;
    setDraggedId(id);
    setDraggedNewTable(null);
  };

  const onDragStartNewTable = (table: any) => {
    setDraggedNewTable(table);
    setDraggedId(null);
  };

  const placeNewTableOnFloor = (e: any) => {
    if (!draggedNewTable) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPlacedTables((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        type: draggedNewTable.type,
        seats: draggedNewTable.seats,
        tableNumber: draggedNewTable.tableNumber,
        tableName: draggedNewTable.label,
        x: Math.max(0, e.clientX - rect.left - 30),
        y: Math.max(0, e.clientY - rect.top - 30),
        assignedGuests: [],
        guestSeats: {},
        angle: 0,
        isSpecial: false,
        isReserve: false,
        scale: 1,
      },
    ]);
    setNewTables((prev) => prev.filter((t) => t.id !== draggedNewTable.id));
    setDraggedNewTable(null);
  };

  const calcSize = (table: PlacedTable) => {
    let tableW = 55;
    let tableH = 55;
    if (table.isSpecial) {
      tableW = table.type === 'dj' ? 92 : 110;
      tableH = table.type === 'dj' ? 55 : 110;
    } else if (table.type === 'rect') {
      tableW = 52;
      tableH = 83;
      if ((table.angle || 0) === 90) {
        const tmp = tableW;
        tableW = tableH;
        tableH = tmp;
      }
    }
    return { tableW, tableH };
  };

  const onDropTable = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedId === null) return;
    if (!can('moveTables') && !isAdmin) {
      setDraggedId(null);
      return;
    }
    const table = placedTables.find((t) => t.id === draggedId);
    if (!table) {
      setDraggedId(null);
      return;
    }
    const { tableW, tableH } = calcSize(table);
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    const x = Math.round(centerX / GRID - 0.5) * GRID + GRID / 2 - tableW / 2;
    const y = Math.round(centerY / GRID - 0.5) * GRID + GRID / 2 - tableH / 2;
    setPlacedTables((prev) => prev.map((t) => (t.id === draggedId ? { ...t, x, y } : t)));
    setDraggedId(null);
  };

  const onTouchStartTable = (e: React.TouchEvent, id: number) => {
    if (!can('moveTables') && !isAdmin) return;
    const table = placedTables.find((t) => t.id === id);
    if (!table || !floorRef.current) return;
    const touch = e.touches[0];
    const rect = floorRef.current.getBoundingClientRect();
    touchDragRef.current = {
      id,
      offsetX: touch.clientX - rect.left - table.x,
      offsetY: touch.clientY - rect.top - table.y,
    };
    setDraggedId(id);
    setSelectedId(id);
  };

  const onTouchMoveFloor = (e: React.TouchEvent) => {
    if (!touchDragRef.current || !floorRef.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = floorRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left - touchDragRef.current.offsetX;
    const y = touch.clientY - rect.top - touchDragRef.current.offsetY;
    const id = touchDragRef.current.id;
    setPlacedTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, x: Math.max(0, x), y: Math.max(0, y) } : t))
    );
  };

  const onTouchEndFloor = () => {
    if (!touchDragRef.current) return;
    const id = touchDragRef.current.id;
    const table = placedTables.find((t) => t.id === id);
    if (table) {
      const { tableW, tableH } = calcSize(table);
      const x = Math.round((table.x + tableW / 2) / GRID - 0.5) * GRID + GRID / 2 - tableW / 2;
      const y = Math.round((table.y + tableH / 2) / GRID - 0.5) * GRID + GRID / 2 - tableH / 2;
      setPlacedTables((prev) => prev.map((t) => (t.id === id ? { ...t, x, y } : t)));
    }
    touchDragRef.current = null;
    setDraggedId(null);
  };

  const assignGuest = (guestName: string) => {
    if (!selectedId) return;
    const table = placedTables.find((t) => t.id === selectedId);
    if (!table || table.isSpecial) return;
    const qty = getGuestQty(guestName);
    if (getOccupiedSeats(table) + qty > table.seats) {
      alert('אין מספיק מקומות פנויים בשולחן');
      return;
    }
    setPlacedTables((prev) =>
      prev.map((t) =>
        t.id === selectedId
          ? {
              ...t,
              assignedGuests: [...t.assignedGuests, guestName],
              guestSeats: { ...(t.guestSeats || {}), [guestName]: qty },
            }
          : t
      )
    );
    setGuests((prev) => prev.filter((g) => g.name !== guestName));
  };

  const toggleGuestSelection = (name: string) => {
    setSelectedGuests((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const assignSelectedGuests = () => {
    if (!selectedId || selectedGuests.size === 0) return;
    const table = placedTables.find((t) => t.id === selectedId);
    if (!table || table.isSpecial) return;
    let occupied = getOccupiedSeats(table);
    const toAssign: string[] = [];
    selectedGuests.forEach((name) => {
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
    setPlacedTables((prev) =>
      prev.map((t) => {
        if (t.id !== selectedId) return t;
        const nextSeats = { ...(t.guestSeats || {}) };
        toAssign.forEach((name) => {
          nextSeats[name] = getGuestQty(name);
        });
        return {
          ...t,
          assignedGuests: [...t.assignedGuests, ...toAssign],
          guestSeats: nextSeats,
        };
      })
    );
    setGuests((prev) => prev.filter((g) => !toAssign.includes(g.name)));
    setSelectedGuests(new Set());
  };

  const toggleSeatedGuestSelection = (name: string) => {
    setSelectedSeatedGuests((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const removeSelectedSeatedGuests = () => {
    if (!selectedId || selectedSeatedGuests.size === 0) return;
    const table = placedTables.find((t) => t.id === selectedId);
    if (!table) return;
    const names = Array.from(selectedSeatedGuests);
    setPlacedTables((prev) =>
      prev.map((t) => {
        if (t.id !== selectedId) return t;
        const nextSeats = { ...(t.guestSeats || {}) };
        names.forEach((n) => delete nextSeats[n]);
        return {
          ...t,
          assignedGuests: t.assignedGuests.filter((g) => !selectedSeatedGuests.has(g)),
          guestSeats: nextSeats,
        };
      })
    );
    setGuests((prev) => {
      let next = [...prev];
      names.forEach((name) => {
        const qty = getSeatedQty(table, name);
        const existing = next.find((g) => g.name === name);
        const group = getGuestGroup(name, existing?.group);
        if (existing) {
          next = next.map((g) =>
            g.name === name ? { ...g, qty: g.qty + qty, group } : g
          );
        } else {
          next.push({ name, qty, group });
        }
      });
      return next;
    });
    setSelectedSeatedGuests(new Set());
  };

  const decreaseOneSeat = (name: string) => {
    if (!selectedId) return;
    const table = placedTables.find((t) => t.id === selectedId);
    if (!table) return;
    const current = getSeatedQty(table, name);
    if (current <= 0) return;

    if (current === 1) {
      setPlacedTables((prev) =>
        prev.map((t) => {
          if (t.id !== selectedId) return t;
          const nextSeats = { ...(t.guestSeats || {}) };
          delete nextSeats[name];
          return {
            ...t,
            assignedGuests: t.assignedGuests.filter((g) => g !== name),
            guestSeats: nextSeats,
          };
        })
      );
    } else {
      setPlacedTables((prev) =>
        prev.map((t) =>
          t.id === selectedId
            ? { ...t, guestSeats: { ...(t.guestSeats || {}), [name]: current - 1 } }
            : t
        )
      );
    }

    setGuests((prev) => {
      const existing = prev.find((g) => g.name === name);
      const group = getGuestGroup(name, existing?.group);
      if (existing) {
        return prev.map((g) =>
          g.name === name ? { ...g, qty: g.qty + 1, group } : g
        );
      }
      return [...prev, { name, qty: 1, group }];
    });
  };

  const removeGuestFully = (name: string) => {
    if (!selectedId) return;
    const table = placedTables.find((t) => t.id === selectedId);
    if (!table) return;
    const qty = getSeatedQty(table, name);
    setPlacedTables((prev) =>
      prev.map((t) => {
        if (t.id !== selectedId) return t;
        const nextSeats = { ...(t.guestSeats || {}) };
        delete nextSeats[name];
        return {
          ...t,
          assignedGuests: t.assignedGuests.filter((g) => g !== name),
          guestSeats: nextSeats,
        };
      })
    );
    setGuests((prev) => {
      const existing = prev.find((g) => g.name === name);
      const group = getGuestGroup(name, existing?.group);
      if (existing) {
        return prev.map((g) =>
          g.name === name ? { ...g, qty: g.qty + qty, group } : g
        );
      }
      return [...prev, { name, qty, group }];
    });
    setSelectedSeatedGuests((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  const resetSelectedTable = () => {
    if (!selectedId) return;
    const table = placedTables.find((t) => t.id === selectedId);
    if (!table) return;
    setGuests((prev) => {
      let next = [...prev];
      table.assignedGuests.forEach((name) => {
        const qty = getSeatedQty(table, name);
        const existing = next.find((g) => g.name === name);
        const group = getGuestGroup(name, existing?.group);
        if (existing) {
          next = next.map((g) =>
            g.name === name ? { ...g, qty: g.qty + qty, group } : g
          );
        } else {
          next.push({ name, qty, group });
        }
      });
      return next;
    });
    setPlacedTables((prev) =>
      prev.map((t) =>
        t.id === selectedId ? { ...t, assignedGuests: [], guestSeats: {} } : t
      )
    );
  };

  const returnAllGuests = () => {
    if (!confirm('לאפס את כל הסקיצה? כל המוזמנים יחזרו לרשימה')) return;
    setGuests((prev) => {
      let next = [...prev];
      placedTables.forEach((table) => {
        table.assignedGuests.forEach((name) => {
          const qty = getSeatedQty(table, name);
          const existing = next.find((g) => g.name === name);
          const group = getGuestGroup(name, existing?.group);
          if (existing) {
            next = next.map((g) =>
              g.name === name ? { ...g, qty: g.qty + qty, group } : g
            );
          } else {
            next.push({ name, qty, group });
          }
        });
      });
      return next;
    });
    setPlacedTables([]);
    setSelectedId(null);
  };
    const openEdit = (table: PlacedTable) => {
    if (table.isSpecial) return;
    if (!can('editTableInfo') && !isAdmin) return;
    setEditingTable({ ...table });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingTable) return;
    const occupied = getOccupiedSeats(editingTable);
    if (editingTable.seats < occupied) {
      alert(`לא ניתן להקטין מתחת ל-${occupied}`);
      return;
    }
    setPlacedTables((prev) =>
      prev.map((t) => (t.id === editingTable.id ? { ...editingTable } : t))
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

  const selectedTable = placedTables.find((t) => t.id === selectedId) || null;
  const totalSeats = placedTables.filter((t) => !t.isSpecial).reduce((s, t) => s + t.seats, 0);
  const occupiedSeats = placedTables.reduce((s, t) => s + getOccupiedSeats(t), 0);
  const totalTables = placedTables.filter((t) => !t.isSpecial).length;
  const unassignedPeople = guests.reduce((s, g) => s + g.qty, 0);
  const filteredUnassigned = guests.filter(
    (g) =>
      g.name.toLowerCase().includes(unassignedSearch.toLowerCase()) ||
      g.group.toLowerCase().includes(unassignedSearch.toLowerCase())
  );

  const groupedGuests = useMemo(() => {
    const map: Record<string, UnassignedGuest[]> = {};
    filteredUnassigned.forEach((g) => {
      if (!map[g.group]) map[g.group] = [];
      map[g.group].push(g);
    });
    return Object.entries(map).sort(([a], [b]) => {
      if (a === 'ללא קבוצה') return 1;
      if (b === 'ללא קבוצה') return -1;
      return a.localeCompare(b, 'he');
    });
  }, [filteredUnassigned]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div className="min-h-screen flex flex-col" dir="rtl" style={{ background: '#1e293b' }}>
      <div className="px-4 py-2.5 flex items-center gap-3 flex-wrap" style={{ background: '#0f172a' }}>
        <div className="flex gap-2">
          {can('resetSketch') && (
            <button onClick={returnAllGuests} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
              אפס סקיצה
            </button>
          )}
          {can('addTables') && (
            <button onClick={() => setShowAddModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
              + הוסף שולחן
            </button>
          )}
          <Link href={`/event/${eventId}/guests`} className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-xl text-sm font-bold">
            ← חזרה לרשימת המוזמנים
          </Link>
        </div>
        <div className="mr-auto text-left">
          <div className="text-xs text-slate-400">סקיצת שולחנות</div>
          <div className="text-white font-bold text-lg">{eventTitle || 'אירוע'}</div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ direction: 'ltr' }}>
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
              <button onClick={resetSelectedTable} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl text-sm font-bold mb-3">
                אפס שולחן
              </button>
              {selectedSeatedGuests.size > 0 && (
                <button onClick={removeSelectedSeatedGuests} className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 py-1.5 rounded-lg text-xs font-bold mb-2">
                  הסר ({selectedSeatedGuests.size})
                </button>
              )}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {selectedTable.assignedGuests.length === 0 ? (
                  <p className="text-slate-500 text-center text-xs py-3">אין מוזמנים</p>
                ) : (
                  selectedTable.assignedGuests.map((name) => (
                    <div key={name} className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-lg text-xs text-white">
                      <input
                        type="checkbox"
                        checked={selectedSeatedGuests.has(name)}
                        onChange={() => toggleSeatedGuestSelection(name)}
                        className="w-3.5 h-3.5"
                      />
                      <span className="flex-1 truncate">{name}</span>
                      <span className="text-slate-400">({getSeatedQty(selectedTable, name)})</span>
                      <button
                        type="button"
                        title="הורד 1"
                        onClick={(e) => { e.stopPropagation(); decreaseOneSeat(name); }}
                        className="w-6 h-6 rounded-md bg-slate-700 hover:bg-amber-600 text-white font-bold"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        title="הסר הכל"
                        onClick={(e) => { e.stopPropagation(); removeGuestFully(name); }}
                        className="w-6 h-6 rounded-md bg-slate-700 hover:bg-red-600 text-white font-bold text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
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

        <div
          ref={floorRef}
          className="flex-1 relative overflow-auto"
          onDrop={(e) => {
            if (draggedNewTable) placeNewTableOnFloor(e);
            else onDropTable(e);
          }}
          onDragOver={(e) => e.preventDefault()}
          onTouchMove={onTouchMoveFloor}
          onTouchEnd={onTouchEndFloor}
          style={{
            backgroundColor: '#d4b48c',
            backgroundImage: `
              linear-gradient(#c9a87a 1px, transparent 1px),
              linear-gradient(90deg, #c9a87a 1px, transparent 1px)
            `,
            backgroundSize: `${GRID}px ${GRID}px`,
            touchAction: 'none',
          }}
        >
          {placedTables.map((table) => {
            const occupied = getOccupiedSeats(table);
            const isWide = table.type === 'rect';
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
                draggable={can('moveTables') || isAdmin}
                onDragStart={() => onDragStartTable(table.id)}
                onTouchStart={(e) => onTouchStartTable(e, table.id)}
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
                  transform: `scale(${table.scale || 1})`,
                  transformOrigin: 'center center',
                }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    borderRadius: isRound ? '9999px' : 10,
                    background: table.isSpecial
                      ? table.type === 'dj' ? '#1f2937' : '#334155'
                      : table.isReserve
                      ? '#ef4444'
                      : '#f5e6c8',
                    border: selectedId === table.id
                      ? '3px solid #f59e0b'
                      : table.isReserve
                      ? '3px solid #991b1b'
                      : '2.5px solid #78350f',
                    boxShadow: selectedId === table.id
                      ? '0 0 0 3px rgba(245,158,11,0.4), 0 4px 12px rgba(0,0,0,0.3)'
                      : '0 3px 10px rgba(0,0,0,0.25)',
                  }}
                >
                  {!table.isSpecial && (
                    <span className="font-black" style={{ fontSize: 15, color: table.isReserve ? '#fff' : '#78350f' }}>
                      {table.tableNumber}
                    </span>
                  )}
                  {table.isSpecial && (
                    <div className="flex flex-col items-center">
                      <span className="text-2xl text-white/80">{table.type === 'dj' ? '🎧' : '💃'}</span>
                      <span className="text-[10px] text-white font-bold">{table.type === 'dj' ? 'DJ' : 'רחבת ריקודים'}</span>
                    </div>
                  )}
                  {table.isReserve && !table.isSpecial && (
                    <span className="absolute text-2xl font-black text-white/40">R</span>
                  )}
                                    {!table.isSpecial &&
                    seatPositions.map((pos, i) => {
                      const arrivedSeats = (table.assignedGuests || []).reduce((sum, name) => {
                        if ((arrivedMap[name] || 0) > 0) {
                          return sum + (table.guestSeats?.[name] ?? getGuestQty(name));
                        }
                        return sum;
                      }, 0);
                      const isArrived = i < arrivedSeats;
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
                            background: isArrived ? '#3b82f6' : isOccupied ? '#dc2626' : '#fffbeb',
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
                {isAdmin && !table.isSpecial && (
                  <div
                    onMouseDown={(e) => onResizeStart(e, table)}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -bottom-1 -left-1 w-4 h-4 bg-amber-500 border-2 border-white rounded-sm cursor-se-resize z-40 shadow"
                    title="הגדל / הקטן"
                  />
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
                <div className="w-64 flex flex-col" style={{ background: '#1e293b', direction: 'rtl' }}>
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b border-slate-700">
              <h3 className="font-bold text-white text-sm mb-2">מוזמנים שאישרו ({unassignedPeople})</h3>
              <input
                type="text"
                placeholder="חיפוש..."
                value={unassignedSearch}
                onChange={(e) => setUnassignedSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 mb-2"
              />
              {selectedGuests.size > 0 && selectedId && (
                <button onClick={assignSelectedGuests} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg text-xs font-bold mb-2">
                  הושב {selectedGuests.size} לשולחן
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {groupedGuests.length === 0 ? (
                <p className="text-center text-slate-500 text-xs py-6">אין מוזמנים שאישרו</p>
              ) : (
                groupedGuests.map(([group, list]) => {
                  const isCollapsed = collapsedGroups[group];
                  const groupTotal = list.reduce((s, g) => s + g.qty, 0);
                  return (
                    <div key={group} className="mb-1">
                      <button type="button" onClick={() => toggleGroup(group)} className="w-full flex items-center gap-2 bg-slate-700/80 hover:bg-slate-600 text-white px-2 py-2 rounded-lg text-xs font-bold">
                        <span>{isCollapsed ? '▶' : '▼'}</span>
                        <span className="flex-1 text-right">{group}</span>
                        <span className="text-slate-400 font-normal">({groupTotal})</span>
                      </button>
                      {!isCollapsed && (
                        <div className="mt-1 space-y-1 pr-1">
                          {list.map((g) => (
                            <div
                              key={g.name}
                              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 p-2 rounded-lg cursor-pointer"
                              onClick={() => selectedId && assignGuest(g.name)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedGuests.has(g.name)}
                                onChange={(e) => { e.stopPropagation(); toggleGuestSelection(g.name); }}
                                className="w-3.5 h-3.5"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="text-xs text-white">{g.name}</span>
                              <span className="text-slate-400 text-xs mr-auto">({g.qty})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {(can('addTables') || can('specialItems')) && (
            <div className="p-3 border-t border-slate-700 space-y-2">
              {can('addTables') && (
                <button onClick={() => setShowTableTypes((v) => !v)} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-xl text-xs font-bold">
                  {showTableTypes ? 'הסתר סוגי שולחנות' : 'הצג סוגי שולחנות'}
                </button>
              )}
              {showTableTypes && (
                <div className="space-y-1">
                  {TABLE_TYPES.map((t, i) => (
                    <button key={i} onClick={() => { setSelectedTypeIndex(i); setShowAddModal(true); }} className="w-full flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg text-xs">
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {can('specialItems') &&
                SPECIAL_ITEMS.map((t, i) => (
                  <button key={i} onClick={() => addSpecial(t)} className="w-full flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl text-xs font-medium">
                    <span className="text-lg">{t.icon}</span>
                    <span className="font-bold">{t.label}</span>
                  </button>
                ))}
            </div>
          )}

          <div className="p-3 border-t border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white text-xs">שולחנות חדשים ({newTables.length})</h3>
              {newTables.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('לנקות את כל השולחנות החדשים?')) {
                      setNewTables([]);
                      localStorage.removeItem('newTables');
                    }
                  }}
                  className="text-[10px] text-rose-400 hover:text-rose-300"
                >
                  נקה
                </button>
              )}
            </div>
            {newTables.length === 0 ? (
              <p className="text-slate-500 text-[11px] text-center py-2">אין שולחנות ממתינים</p>
            ) : (
              <>
                <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
                  {newTables.map((t) => (
                    <div key={t.id} draggable onDragStart={() => onDragStartNewTable(t)} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg text-xs cursor-grab active:cursor-grabbing">
                      <span>{t.type === 'round' ? '🔵' : t.type === 'square' ? '🟦' : '🟫'}</span>
                      <span className="flex-1">#{t.tableNumber} · {t.label || `${t.seats} כסאות`}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (!confirm(`להשליך ${newTables.length} שולחנות לרצפה?`)) return;
                    const cols = 6;
                    const placed = newTables.map((t, i) => ({
                      id: Date.now() + i + Math.random(),
                      type: t.type,
                      seats: t.seats,
                      tableNumber: t.tableNumber,
                      tableName: t.label,
                      x: 40 + (i % cols) * 90,
                      y: 40 + Math.floor(i / cols) * 100,
                      assignedGuests: [],
                      guestSeats: {},
                      angle: 0,
                      isSpecial: false,
                      isReserve: false,
                      scale: 1,
                    }));
                    setPlacedTables((prev) => [...prev, ...placed]);
                    setNewTables([]);
                    localStorage.removeItem('newTables');
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-xl text-xs font-bold mb-2"
                >
                  ⚡ השלך הכל לסקיצה
                </button>
              </>
            )}
            <Link href={`/addtable?eventId=${eventId}`} className="mt-1 block w-full text-center bg-emerald-700 hover:bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold">
              + הוספת שולחנות מרובים
            </Link>
          </div>
          <div className="text-xs text-slate-400 pt-2 border-t border-slate-700 text-center px-3 pb-3">
            סיכום: {totalTables} שולחנות · {occupiedSeats}/{totalSeats} מושבים
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-80 shadow-2xl border border-slate-600" dir="rtl">
            <h2 className="text-lg font-bold mb-4 text-white">הוסף שולחן</h2>
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1 text-slate-300">צורה</label>
              <select value={selectedTypeIndex} onChange={(e) => setSelectedTypeIndex(parseInt(e.target.value))} className="w-full p-2 border border-slate-600 rounded-xl text-sm bg-slate-900 text-white">
                {TABLE_TYPES.map((t, i) => (
                  <option key={i} value={i}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1 text-slate-300">מספר כסאות: {selectedSeats}</label>
              <input type="range" min="4" max="50" step="2" value={selectedSeats} onChange={(e) => setSelectedSeats(parseInt(e.target.value))} className="w-full" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-2 border border-slate-600 rounded-xl text-sm text-slate-300">ביטול</button>
              <button onClick={addRegularTable} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold">הוסף</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-80 shadow-2xl border border-slate-600" dir="rtl">
            <h2 className="text-lg font-bold mb-4 text-white">עריכת שולחן</h2>
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1 text-slate-300">מספר שולחן</label>
              <input type="number" value={editingTable.tableNumber || ''} onChange={(e) => setEditingTable({ ...editingTable, tableNumber: parseInt(e.target.value) || 0 })} className="w-full p-2 border border-slate-600 rounded-xl text-sm bg-slate-900 text-white" />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1 text-slate-300">שם שולחן</label>
              <input type="text" value={editingTable.tableName || ''} onChange={(e) => setEditingTable({ ...editingTable, tableName: e.target.value })} className="w-full p-2 border border-slate-600 rounded-xl text-sm bg-slate-900 text-white" placeholder="למשל: חברים כלה" />
            </div>
            {(isAdmin || can('editTableInfo')) && (
              <div className="mb-3">
                <label className="block text-xs font-medium mb-1 text-slate-300">מספר כסאות (תפוסים: {getOccupiedSeats(editingTable)})</label>
                <input type="number" min={getOccupiedSeats(editingTable)} max={50} value={editingTable.seats} onChange={(e) => setEditingTable({ ...editingTable, seats: parseInt(e.target.value) || 0 })} className="w-full p-2 border border-slate-600 rounded-xl text-sm bg-slate-900 text-white" />
              </div>
            )}
            {isAdmin && (
              <label className="flex items-center gap-2 mb-4 text-sm text-white">
                <input type="checkbox" checked={!!editingTable.isReserve} onChange={(e) => setEditingTable({ ...editingTable, isReserve: e.target.checked })} />
                שולחן רזרבה (יופיע באדום)
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