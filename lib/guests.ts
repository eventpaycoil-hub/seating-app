// lib/guests.ts
import { supabase } from './supabase.js';

export function generateInviteCode(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export function normalizeGuest(guest: any) {
  if (!guest) return guest;

  const id = guest.id ?? Date.now() + Math.floor(Math.random() * 100000);

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
    confirmed: guest.confirmed ?? '',
    confirmedCount:
      guest.confirmedCount !== undefined && guest.confirmedCount !== null
        ? Number(guest.confirmedCount)
        : !isNaN(Number(guest.confirmed))
          ? Number(guest.confirmed)
          : 0,
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
  };
}

function toRow(g: any, eventId: string | number) {
  const n = normalizeGuest(g);
  const eid = Number(eventId);
  const idNum = Math.floor(Number(n.id));
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
    confirmed: n.confirmed || null,
    count: countValue,
    customer_expectation: n.customerExpectation || null,
    notes: n.notes || null,
    separation: n.separation || null,
    invite_code: n.inviteCode || null,
    arrived_count: Number(n.arrivedCount) || 0,
    confirmed_source: n.confirmedSource || null,
    confirmed_at: n.confirmedAt || null,
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
  });
}

/** מסיר כפילויות לפי id — שומר את האחרון */
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

/** קריאה סינכרונית מה-cache המקומי */
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

/**
 * מקור האמת: קודם Supabase, אחר כך cache מקומי.
 */
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

/**
 * שמירה: cache מקומי + upsert ל-Supabase
 */
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
  if (!valid.length) return;

  const rowsMap = new Map<number, any>();
  for (const g of valid) {
    const row = toRow(g, eid);
    if (!row.id || Number.isNaN(row.id)) continue;
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