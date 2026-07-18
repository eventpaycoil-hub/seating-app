// lib/guests.ts

// ייצור קוד הזמנה ייחודי
export function generateInviteCode(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

// מנרמל מוזמן בודד - מוסיף id ו-inviteCode אם חסרים
export function normalizeGuest(guest: any) {
  return {
    ...guest,
    id: guest.id || Date.now() + Math.floor(Math.random() * 100000),
    inviteCode: guest.inviteCode || generateInviteCode(),
    confirmed: guest.confirmed ?? "",
    confirmedCount: guest.confirmedCount ?? 0,
    arrivedCount: guest.arrivedCount ?? 0,
  };
}

// מקבל את כל המוזמנים של אירוע + מנרמל אותם
export function getGuests(eventId: string | number): any[] {
  const key = `guests_event_${eventId}`;
  const saved = JSON.parse(localStorage.getItem(key) || '[]');
  return saved.map(normalizeGuest);
}

// שומר מוזמנים + מנרמל אותם לפני השמירה
export function saveGuests(eventId: string | number, guests: any[]) {
  const key = `guests_event_${eventId}`;
  const normalized = guests.map(normalizeGuest);
  localStorage.setItem(key, JSON.stringify(normalized));
}

// מוסיף מוזמן חדש בצורה בטוחה
export function addGuest(eventId: string | number, guestData: any) {
  const guests = getGuests(eventId);
  const newGuest = normalizeGuest(guestData);
  guests.push(newGuest);
  saveGuests(eventId, guests);
  return newGuest;
}