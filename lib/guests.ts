// lib/guests.ts
import { supabase } from './supabase.js';

export function generateInviteCode(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export function normalizeGuest(guest: any) {
  if (!guest) return guest;

  const id =
    guest.id ??
    Date.now() * 1000000 +
      Math.floor(Math.random() * 1000000) +
      Math.floor(Math.random() * 100000) +
      Math.floor(Math.random() * 10000);

  // --- סטטוס אישור הגעה ---
  let confirmed = guest.confirmed ?? '';
  const confStr = String(confirmed).trim();

  let confirmedCount =
    guest.confirmedCount !== undefined && guest.confirmedCount !== null
      ? Number(guest.confirmedCount)
      : 0;

  if (confStr === '0' || confStr === 'לא מגיע' || /^no$/i.test(confStr) || confStr === 'לא') {
    confirmed = 'לא מגיע';
    confirmedCount = 0;
  } else if (
    confStr === '' ||
    /^unknown$/i.test(confStr) ||
    confStr === 'לא ידוע' ||
    confStr === 'ממתין'
  ) {
    confirmed = 'לא ידוע';
    confirmedCount = 0;
  } else if (!isNaN(Number(confStr)) && Number(confStr) >= 1) {
    confirmed = String(Number(confStr));
    confirmedCount = Number(confStr);
  } else if (!isNaN(Number(guest.confirmedCount)) && Number(guest.confirmedCount) >= 1) {
    confirmed = String(Number(guest.confirmedCount));
    confirmedCount = Number(guest.confirmedCount);
  } else if (confStr) {
    // ערך לא מוכר → ממתין
    confirmed = 'לא ידוע';
    confirmedCount = 0;
  }

  return {
    ...guest,
    id,
    inviteCode:
      guest.inviteCode ||
      guest.code ||
      String(id).replace(/\./g, '').slice(-12),
    code:
      guest.code ||
      guest.inviteCode ||
      String(id).replace(/\./g, '').slice(-12),
    confirmed,
    confirmedCount,
    arrivedCount: Number(guest.arrivedCount) || 0,
    quantity: guest.quantity ?? '',
    group: guest.group ?? guest.guest_group ?? '',
    phone: guest.phone ?? '',
    name: guest.name ?? '',
    notes: guest.notes ?? '',
    transportation: guest.transportation ?? '',
    customerExpectation: guest.customerExpectation ?? guest.customer_expectation ?? '',
    separation: guest.separation ?? '',
    confirmedSource: guest.confirmedSource ?? guest.confirmed_source ?? null,
    confirmedAt: guest.confirmedAt ?? guest.confirmed_at ?? null,
    needsTransport: guest.needsTransport ?? guest.needs_transport ?? false,
  };
}

function toRow(g: any, eventId: string | number) {
  const n = normalizeGuest(g);
  const eid = Number(eventId);
  const idNum = Number(n.id);
if (!Number.isFinite(idNum) || idNum <= 0) {
  // אם משום מה אין ID תקין – צור חדש
  return null as any;
}
  const countValue =
    Number(n.confirmedCount) ||
    Number(n.count) ||
    Number(n.quantity) ||
    (!isNaN(Number(n.confirmed)) ? Number(n.confirmed) : 0) ||
    0;

  return {
    id: idNum,
    event_id: eid,
    name: String(n.name || '').trim(),
    phone: n.phone || null,
    quantity: n.quantity || null,
    guest_group: n.group || null,
    transportation: n.transportation || null,
    confirmed: (() => {
  const c = String(n.confirmed ?? '').trim();
  if (c === '0' || c === 'לא מגיע') return 'לא מגיע';
  if (!c || /^unknown$/i.test(c) || c === 'לא ידוע' || c === 'ממתין') return 'לא ידוע';
  return c || null;
})(),
    count: countValue,
    customer_expectation: n.customerExpectation || null,
    notes: n.notes || null,
    separation: n.separation || null,
    invite_code: n.inviteCode || null,
    arrived_count: Number(n.arrivedCount) || 0,
    confirmed_source: n.confirmedSource || null,
    confirmed_at: n.confirmedAt || null,
    needs_transport: n.needsTransport === true,
  };
}

function fromRow(row: any) {
  return normalizeGuest({
    id: row.id,
    name: row.name || '',
    phone: row.phone || '',
    quantity: row.quantity || '',
    group: row.guest_group || '',
    transportation: row.transportation || '',
    confirmed: row.confirmed || '',
    customerExpectation: row.customer_expectation || '',
    notes: row.notes || '',
    separation: row.separation || '',
    confirmedCount: row.count ?? 0,
    inviteCode: row.invite_code || undefined,
    code: row.invite_code || undefined,
    arrivedCount: row.arrived_count ?? 0,
    confirmedSource: row.confirmed_source || null,
    confirmedAt: row.confirmed_at || null,
    needsTransport: row.needs_transport === true,
  });
}

function dedupeById(guests: any[]): any[] {
  const map = new Map<string, any>();
  for (const g of guests || []) {
    if (!g) continue;
    const id = g.id != null ? String(Math.floor(Number(g.id)) || g.id) : '';
    if (!id || id === 'NaN') continue;
    map.set(id, g);
  }
  return Array.from(map.values());
}

export function getGuests(eventId: string | number): any[] {
  if (!eventId) return [];
  if (typeof window === 'undefined') return [];

  const key = `guests_event_${eventId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    const guests = JSON.parse(raw);
    if (!Array.isArray(guests)) return [];
    return dedupeById(guests.map(normalizeGuest));
  } catch (e) {
    console.error('Error parsing guests', e);
    return [];
  }
}

export async function loadGuests(eventId: string | number): Promise<any[]> {
  if (!eventId) return [];

  const key = `guests_event_${eventId}`;
  const eid = Number(eventId);

  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', eid);

    if (!error && Array.isArray(data) && data.length > 0) {
      const guests = dedupeById(data.map(fromRow));
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(guests));
      }
      console.log('✅ loadGuests from Supabase:', guests.length);
      return guests;
    }
  } catch (e) {
    console.warn('loadGuests supabase failed', e);
  }

  const local = getGuests(eventId);
  if (local.length) {
    console.log('⚠️ loadGuests from localStorage:', local.length);
    return local;
  }

  console.log('❌ loadGuests empty', eventId);
  return [];
}

export function saveGuests(eventId: string | number, guests: any[]) {
  if (!eventId) return;

  const normalized = dedupeById((guests || []).map(normalizeGuest));
  const key = `guests_event_${eventId}`;

  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(normalized));
  }

  syncGuestsToSupabase(eventId, normalized).catch((err) => {
    console.warn('Supabase guests sync failed:', err);
  });
}

async function syncGuestsToSupabase(eventId: string | number, guests: any[]) {
  const eid = Number(eventId);
  const valid = guests.filter((g) => g.name && String(g.name).trim() !== '');

  // 1. מביא את כל ה-IDs הקיימים בענן לאירוע הזה
  const { data: existingRows, error: fetchError } = await supabase
    .from('guests')
    .select('id')
    .eq('event_id', eid);

  if (fetchError) {
    console.warn('Supabase fetch ids error:', fetchError.message);
  }

  const existingIds = new Set((existingRows || []).map((r: any) => Number(r.id)));
  const newIds = new Set(valid.map((g) => Number(g.id)).filter((id) => !Number.isNaN(id)));

  // 2. מוחק מהענן את מה שכבר לא קיים ברשימה
  const toDelete = [...existingIds].filter((id) => !newIds.has(id));
  if (toDelete.length > 0) {
    const { error: delError } = await supabase
      .from('guests')
      .delete()
      .eq('event_id', eid)
      .in('id', toDelete);

    if (delError) {
      console.warn('Supabase delete error:', delError.message);
    } else {
      console.log('🗑 נמחקו מ-Supabase:', toDelete.length);
    }
  }

  // 3. Upsert של מה שנשאר
  if (!valid.length) return;

  const rowsMap = new Map<number, any>();
  for (const g of valid) {
  const row = toRow(g, eid);
  if (!row || !row.id || Number.isNaN(row.id)) continue;
  rowsMap.set(row.id, row);
}
  const rows = Array.from(rowsMap.values());
  if (!rows.length) return;

  const { error } = await supabase.from('guests').upsert(rows, {
    onConflict: 'id',
  });

  if (error) {
    console.warn('Supabase upsert guests error:', error.message, error);
    return;
  }

  console.log('✅ מוזמנים נשמרו ב-Supabase (upsert):', rows.length);
}

export async function fetchGuestsFromSupabase(
  eventId: string | number
): Promise<any[] | null> {
  const list = await loadGuests(eventId);
  return list.length ? list : null;
}

export async function updateGuestInSupabase(guest: any, eventId: string | number) {
  if (!guest?.id) return;

  const row = toRow(guest, eventId);

  const { error } = await supabase
    .from('guests')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    console.warn('Supabase update guest error:', error.message);
  }
}

export function addGuest(eventId: string | number, guestData: any) {
  const guests = getGuests(eventId);
  const newGuest = normalizeGuest(guestData);
  guests.push(newGuest);
  saveGuests(eventId, guests);
  return newGuest;
}