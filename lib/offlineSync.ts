// @ts-nocheck

const QUEUE_KEY = 'offline_sync_queue';

export function getPendingCount() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]').length;
  } catch {
    return 0;
  }
}

export function enqueueGuestUpdate(eventId: string, guest: any) {
  try {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    // אם אותו אורח כבר בתור – מחליפים בגרסה האחרונה
    const filtered = q.filter(
      (item: any) =>
        !(
          item.type === 'guest' &&
          String(item.eventId) === String(eventId) &&
          String(item.guest?.id) === String(guest?.id)
        )
    );
    filtered.push({
      type: 'guest',
      eventId: String(eventId),
      guest,
      at: Date.now(),
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('enqueue failed', e);
  }
}

export async function flushSyncQueue(updateGuestFn: (guest: any, eventId: string) => Promise<any>) {
  let q: any[] = [];
  try {
    q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    q = [];
  }

  if (!q.length) {
    return { ok: 0, fail: 0, pending: 0 };
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: 0, fail: q.length, pending: q.length, offline: true };
  }

  const remaining: any[] = [];
  let ok = 0;
  let fail = 0;

  for (const item of q) {
    try {
      if (item.type === 'guest' && item.guest) {
        await updateGuestFn(item.guest, String(item.eventId));
        ok++;
      } else {
        remaining.push(item);
      }
    } catch (e) {
      console.warn('sync item failed', e);
      remaining.push(item);
      fail++;
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { ok, fail, pending: remaining.length };
}