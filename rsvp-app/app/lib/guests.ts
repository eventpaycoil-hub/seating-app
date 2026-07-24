// app/lib/guests.ts
import { supabase } from '@/lib/supabase';

export function normalizeGuest(guest: any) {
  if (!guest) return guest;

  if (!guest.inviteCode && guest.id) {
    guest.inviteCode = String(guest.id).replace(/\./g, '').slice(-12);
  }

  if (!guest.code && guest.inviteCode) {
    guest.code = guest.inviteCode;
  }

  if (guest.confirmed !== undefined && guest.confirmedCount === undefined) {
    const num = Number(guest.confirmed);
    guest.confirmedCount = isNaN(num) ? 0 : num;
  }

  return guest;
}

export function getGuests(eventId: string | number): any[] {
  if (!eventId) return [];

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

export function saveGuests(eventId: string | number, guests: any[]) {
  if (!eventId) return;

  const key = `guests_event_${eventId}`;
  localStorage.setItem(key, JSON.stringify(guests));

  syncGuestsToSupabase(eventId, guests).catch((err) => {
    console.warn('Supabase guests sync failed:', err);
  });
}

async function syncGuestsToSupabase(eventId: string | number, guests: any[]) {
  const eid = Number(eventId);

  const { error: delError } = await supabase
    .from('guests')
    .delete()
    .eq('event_id', eid);

  if (delError) {
    console.warn('Supabase delete guests error:', delError.message);
  }

  if (!guests.length) return;

  const rows = guests
    .filter((g) => g.name && String(g.name).trim() !== '')
    .map((g) => ({
      id: Math.floor(Number(g.id)) || Date.now(),
      event_id: eid,
      name: String(g.name).trim(),
      phone: g.phone || null,
      quantity: g.quantity || null,
      guest_group: g.group || null,
      transportation: g.transportation || null,
      confirmed: g.confirmed || null,
      count: g.confirmedCount ?? g.count ?? null,
      customer_expectation: g.customerExpectation || null,
      notes: g.notes || null,
      separation: g.separation || null,
    }));

  if (!rows.length) return;

  const { error } = await supabase.from('guests').insert(rows);

  if (error) {
    console.warn('Supabase insert guests error:', error.message);
  } else {
    console.log('✅ מוזמנים נשמרו גם ב-Supabase:', rows.length);
  }
}

export async function fetchGuestsFromSupabase(eventId: string | number): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', Number(eventId));

    if (error) {
      console.warn('Supabase fetch guests error:', error.message);
      return null;
    }
    if (!data || !data.length) return null;

    return data.map((row: any) =>
      normalizeGuest({
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
      })
    );
  } catch (e) {
    console.warn('fetchGuestsFromSupabase failed', e);
    return null;
  }
}
export async function updateGuestInSupabase(guest: any, eventId: string | number) {
  if (!guest?.id) return;

   const countValue =
    Number(guest.count) ||
    Number(guest.confirmedCount) ||
    Number(guest.quantity) ||
    Number(guest.confirmed) ||
    1;

  const { error } = await supabase
    .from('guests')
    .update({
      name: guest.name || null,
      phone: guest.phone || null,
      quantity: guest.quantity ?? countValue,
      guest_group: guest.group || null,
      transportation: guest.transportation || null,
      confirmed: guest.confirmed || null,
      count: countValue,
      customer_expectation: guest.customerExpectation || null,
      notes: guest.notes || null,
      separation: guest.separation || null,
    })
    .eq('id', Math.floor(Number(guest.id)))
    .eq('event_id', Number(eventId));

  if (error) {
    console.warn('Supabase update guest error:', error.message);
  }
}