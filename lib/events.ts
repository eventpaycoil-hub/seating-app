// @ts-ignore
import { supabase } from './supabase.js';

export type DbEvent = {
  id?: number | string | null;
  owners?: string | null;
  title?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  full_date?: string | null;
  time?: string | null;
  day?: string | null;
  hall_name?: string | null;
  city?: string | null;
  groom_parents?: string | null;
  bride_parents?: string | null;
  email?: string | null;
  price?: string | null;
  deposit?: string | null;
  service_type?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
  credit_link?: string | null;
  has_separation?: string | null;
  has_transport?: string | null;
  seating_arrangement?: string | null;
  nufar_event?: string | null;
  qr_code?: string | null;
  guest_notes?: string | null;
  show_seating_link?: string | null;
  sms_service?: string | null;
  steward_service?: string | null;
  username?: string | null;
  password?: string | null;
  client_phone?: string | null;
  rsvp_mode?: string | null;
  welcome_line?: string | null;
  use_external_landing?: string | null;
  external_landing_url?: string | null;
  transport_options?: any;
  created_at?: string | null;
  updated_at?: string | null;
};

/** המרה משורת DB לפורמט הישן שהאתר מצפה לו */
export function dbToAppEvent(row: DbEvent) {
  return {
    id: row.id,
    title: row.title || row.owners || '',
    owners: row.owners || '',
    eventType: row.event_type || '',
    hallName: row.hall_name || '',
    city: row.city || '',
    eventDate: row.event_date || '',
    fullDate: row.full_date || row.event_date || '',
    time: row.time || '19:30',
    day: row.day || '',
    groomParents: row.groom_parents || '',
    brideParents: row.bride_parents || '',
    email: row.email || '',
    price: row.price || '',
    deposit: row.deposit || '',
    serviceType: row.service_type || '',
    notes: row.notes || '',
    isActive: !!row.is_active,
    creditLink: row.credit_link || '',
          hasSeparation: row.has_separation || 'לא',
      hasTransport: row.has_transport || 'לא',
            seatingArrangement: row.seating_arrangement || 'לא',
      nufarEvent: row.nufar_event || 'לא',
      qrCode: row.qr_code || 'כן',
      guestNotes: row.guest_notes || 'כן',
      showSeatingLink: row.show_seating_link || 'לא',
      smsService: row.sms_service || 'כן',
      stewardService: row.steward_service || 'לא',
      
      username: row.username || '',
      password: row.password || '',
      clientPhone: row.client_phone || '',
  };
}

/** המרה מהפורמט של האתר ל־DB */
export function appToDbEvent(event: any): Partial<DbEvent> {
  return {
    id: event.id,
    title: event.title || event.owners || null,
    owners: event.owners || null,
    event_type: event.eventType || event.event_type || null,
    hall_name: event.hallName || event.hall_name || null,
    city: event.city || null,
    event_date: event.eventDate || event.event_date || null,
    full_date: event.fullDate || event.full_date || event.eventDate || null,
    time: event.time || null,
    day: event.day || null,
    groom_parents: event.groomParents || event.groom_parents || null,
    bride_parents: event.brideParents || event.bride_parents || null,
    email: event.email || null,
    price: event.price?.toString?.() ?? event.price ?? null,
    deposit: event.deposit?.toString?.() ?? event.deposit ?? null,
    service_type: event.serviceType || event.service_type || null,
    notes: event.notes || null,
    is_active: !!(event.isActive ?? event.is_active),
    credit_link: event.creditLink || event.credit_link || null,
    has_separation: event.hasSeparation || event.has_separation || 'לא',
    has_transport: event.hasTransport || event.has_transport || 'לא',
    seating_arrangement: event.seatingArrangement || event.seating_arrangement || null,
          nufar_event: event.nufarEvent || event.nufar_event || null,
    qr_code: event.qrCode || event.qr_code || null,
    guest_notes: event.guestNotes || event.guest_notes || null,
    show_seating_link: event.showSeatingLink || event.show_seating_link || null,
    sms_service: event.smsService || event.sms_service || null,
    steward_service: event.stewardService || event.steward_service || null,
    username: event.username || null,
    password: event.password || null,
    client_phone: event.clientPhone || event.client_phone || null,
  };
}

export async function fetchAllEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error('fetchAllEvents', error);
    return [];
  }
  return (data || []).map(dbToAppEvent);
}

export async function fetchEventById(id: string | number) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', Number(id))
    .maybeSingle();

  if (error) {
    console.error('fetchEventById', error);
    return null;
  }
  return data ? dbToAppEvent(data) : null;
}

export async function upsertEvent(event: any) {
  const row = appToDbEvent(event);
  const { data, error } = await supabase
    .from('events')
    .upsert(row, { onConflict: 'id' })
    .select()
    .maybeSingle();

  if (error) {
    console.error('upsertEvent', error);
    throw error;
  }
  return data ? dbToAppEvent(data) : null;
}

export async function deleteEventById(id: string | number) {
  const { error } = await supabase.from('events').delete().eq('id', Number(id));
  if (error) {
    console.error('deleteEventById', error);
    throw error;
  }
}