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
    // אם העמודות האלה קיימות ב-Supabase — מצוין. אם לא, נסיר בהמשך.
    invite_code: n.inviteCode || null,
    arrived_count: Number(n.arrivedCount) || 0,
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
  });
}

/** קריאה סינכרונית מה-cache המקומי (כדי לא לשבור דפים קיימים) */
export function getGuests(eventId: string | number): any[] {
  if (!eventId) return [];
  if (typeof window === 'undefined') return [];

  const key = `guests_event_${eventId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    const guests = JSON.parse(raw);
    if (!Array.isArray(guests)) return [];
    return guests.map(normalizeGuest);
  } catch (e) {
    console.error('Error parsing guests', e);
    return [];
  }
}

/**
 * מקור האמת: קודם Supabase, אחר כך cache מקומי.
 * קרא לזה ב-useEffect של דפי מוזמנים / סריקה / SMS.
 */
export async function loadGuests(eventId: string | number): Promise<any[]> {
  if (!eventId) return [];

  const key = `guests_event_${eventId}`;
  const eid = Number(eventId);

  // 1) Supabase
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', eid);

    if (!error && Array.isArray(data) && data.length > 0) {
      const guests = data.map(fromRow);
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(guests));
      }
      console.log('✅ loadGuests from Supabase:', guests.length);
      return guests;
    }
  } catch (e) {
    console.warn('loadGuests supabase failed', e);
  }

  // 2) cache מקומי
  const local = getGuests(eventId);
  if (local.length) {
    console.log('⚠️ loadGuests from localStorage:', local.length);
    return local;
  }

  console.log('❌ loadGuests empty', eventId);
  return [];
}

/**
 * שמירה: cache מקומי + upsert ל-Supabase (בלי למחוק הכל!)
 */
export function saveGuests(eventId: string | number, guests: any[]) {
  if (!eventId) return;

  const normalized = (guests || []).map(normalizeGuest);
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

  const rows = valid.map((g) => toRow(g, eid));

  // upsert לפי id — שומר מזהים יציבים
  const { error } = await supabase.from('guests').upsert(rows, {
    onConflict: 'id',
  });

  if (error) {
    console.warn('Supabase upsert guests error:', error.message, error);
    return;
  }

  console.log('✅ מוזמנים נשמרו ב-Supabase (upsert):', rows.length);

  // מחיקת מוזמנים שנמחקו אצלנו ולא קיימים יותר ברשימה
  try {
    const ids = rows.map((r) => r.id);
    const { data: existing } = await supabase
      .from('guests')
      .select('id')
      .eq('event_id', eid);

    if (existing?.length) {
      const toDelete = existing
        .map((r: any) => r.id)
        .filter((id: number) => !ids.includes(id));

      if (toDelete.length) {
        await supabase.from('guests').delete().in('id', toDelete);
        console.log('🗑️ נמחקו מ-Supabase:', toDelete.length);
      }
    }
  } catch (e) {
    console.warn('cleanup delete failed', e);
  }
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