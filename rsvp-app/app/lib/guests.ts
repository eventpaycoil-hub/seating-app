// lib/guests.ts

export function normalizeGuest(guest: any) {
  if (!guest) return guest;

  // אם אין inviteCode – ניצור אחד יציב על בסיס ה-id
  if (!guest.inviteCode && guest.id) {
    // הופך את ה-id למחרוזת נקייה ויציבה
    guest.inviteCode = String(guest.id).replace(/\./g, '').slice(-12);
  }

  // תאימות לאחור
  if (!guest.code && guest.inviteCode) {
    guest.code = guest.inviteCode;
  }

  // ודא שיש confirmedCount
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

    // מנרמל + יוצר inviteCode יציב לכל מי שחסר
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
}