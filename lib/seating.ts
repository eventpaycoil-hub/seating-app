import { supabase } from './supabase.js';

export function getSeatingKey(eventId: string | number) {
  return `seatingTables_${eventId}`;
}

export function getSeatingLocal(eventId: string | number): any[] {
  try {
    const raw = localStorage.getItem(getSeatingKey(eventId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSeatingLocal(eventId: string | number, tables: any[]) {
  localStorage.setItem(getSeatingKey(eventId), JSON.stringify(tables || []));
}

export async function saveSeatingToSupabase(eventId: string | number, tables: any[]) {
  const eid = Number(eventId);
  const payload = {
    event_id: eid,
    tables_json: JSON.stringify(tables || []),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('seating')
    .upsert(payload, { onConflict: 'event_id' });

  if (error) {
    console.warn('Supabase seating save error:', error.message);
  } else {
    console.log('✅ סקיצה נשמרה ב-Supabase');
  }
}

export async function fetchSeatingFromSupabase(eventId: string | number): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('seating')
      .select('tables_json')
      .eq('event_id', Number(eventId))
      .maybeSingle();

    if (error) {
      console.warn('Supabase seating fetch error:', error.message);
      return null;
    }
    if (!data?.tables_json) return null;

    const parsed = JSON.parse(data.tables_json);
    return Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    console.warn('fetchSeatingFromSupabase failed', e);
    return null;
  }
}

/** שמירה מקומית + ענן */
export function saveSeating(eventId: string | number, tables: any[]) {
  saveSeatingLocal(eventId, tables);
  saveSeatingToSupabase(eventId, tables).catch(() => {});
}

/** טעינה: קודם ענן, אחרת מקומי. מעדכן local אחרי fetch */
export async function loadSeating(eventId: string | number): Promise<any[]> {
  const eid = String(eventId);

  try {
    const remote = await fetchSeatingFromSupabase(eid);
    if (Array.isArray(remote) && remote.length > 0) {
      saveSeatingLocal(eid, remote);
      console.log('✅ סקיצה מ-Supabase:', remote.length, 'שולחנות');
      return remote;
    }
  } catch (e) {
    console.warn('loadSeating remote failed', e);
  }

  const local = getSeatingLocal(eid);
  console.log('סקיצה מ-local:', local.length, 'שולחנות');
  return local;
}