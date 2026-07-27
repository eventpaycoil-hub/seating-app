// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Html5Qrcode } from 'html5-qrcode';
import { loadSeating, getSeatingLocal } from '../../../../lib/seating';
import {
  getGuests,
  loadGuests,
  saveGuests,
  fetchGuestsFromSupabase,
  updateGuestInSupabase,
  normalizeGuest,
} from '../../../../lib/guests';

export default function CheckinPage() {
  const params = useParams();
  const eventId = String(
    Array.isArray(params?.id) ? params.id[0] : params?.id || '1'
  );

  const [backHref, setBackHref] = useState(`/event/${eventId}/guests`);
  const [lastScanned, setLastScanned] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [voiceOn, setVoiceOn] = useState(true);
  const [facingMode, setFacingMode] = useState('environment');
  const [localCount, setLocalCount] = useState(0);
  const [presenceOnly, setPresenceOnly] = useState(false); // ← חדש
  const scannerRef = useRef(null);
  const processingRef = useRef(false);
  const resultTimerRef = useRef(null);

  const normName = (s) =>
    String(s || '')
      .trim()
      .replace(/\s+/g, ' ');

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get('from');
    if (from === 'seating-arrival') {
      setBackHref(`/event/${eventId}/seating-arrival`);
    } else if (from === 'seating-arrival-fast') {
      setBackHref(`/event/${eventId}/seating-arrival-fast`);
    } else {
      setBackHref(`/event/${eventId}/guests`);
    }
  }, [eventId]);

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const ev = events.find((e) => String(e.id) === String(eventId));
    if (ev) setEventTitle(ev.owners || ev.title || '');

    // ← טעינת מצב נוכחות בלבד פעם אחת
           const raw = ev?.presenceOnly;
    const on =
      String(raw ?? '').includes('כן') ||
      raw === true ||
      raw === 'true';
    setPresenceOnly(!!on);
    console.log('INIT presenceOnly', eventId, raw, on);

    const savedVoice = localStorage.getItem('checkin_voice');
    if (savedVoice === '0') setVoiceOn(false);
    else if (savedVoice === '1') setVoiceOn(true);

    const savedCam = localStorage.getItem('checkin_camera');
    if (savedCam === 'user' || savedCam === 'environment') setFacingMode(savedCam);

    (async () => {
      try {
        const list = await loadGuests(String(eventId));
        setLocalCount(Array.isArray(list) ? list.length : 0);
      } catch {
        setLocalCount(0);
      }
      try {
        const specific = localStorage.getItem(`seatingTables_${eventId}`);
        if (!specific) {
          const general = localStorage.getItem('seatingTables');
          if (general) localStorage.setItem(`seatingTables_${eventId}`, general);
        }
      } catch {}
    })();

    return () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    };
  }, [eventId]);

  const speakTable = (tableNumber, name) => {
    if (!voiceOn) return;
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const text =
        tableNumber != null
          ? `שולחן מספר ${tableNumber}`
          : `${name || 'אורח'}, טרם הושב לשולחן`;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'he-IL';
      u.rate = 0.95;
      u.volume = 1;
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const stopScanner = async () => {
    try {
      if (resultTimerRef.current) {
        clearTimeout(resultTimerRef.current);
        resultTimerRef.current = null;
      }
      if (scannerRef.current) {
        const st = scannerRef.current.getState?.();
        if (st === 2) await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {}
    setScanning(false);
    setStatus('');
  };

  const findTable = async (guestName: string): Promise<number | null> => {
    const name = String(guestName || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    if (!name || !eventId) return null;

    const sources: any[] = [];

    try {
      const { loadSeating } = await import('../../../../lib/seating');
      const cloud = await loadSeating(String(eventId));
      if (Array.isArray(cloud)) sources.push(...cloud);
    } catch (e) {
      console.log('loadSeating', e);
    }

    for (const key of [
      `seatingTables_${eventId}`,
      'seatingTables',
      'seatingTables_v2',
    ]) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) sources.push(...arr);
      } catch {}
    }

    for (const table of sources) {
      const list = table?.assignedGuests;
      if (!Array.isArray(list)) continue;
      const hit = list.some(
        (g: string) =>
          String(g || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ') === name
      );
      if (hit && table.tableNumber != null) {
        return Number(table.tableNumber);
      }
    }
    return null;
  };

  const findGuest = (guests, ref, phoneFromQr = '', nameFromQr = '') => {
    const r = String(ref || '').trim();
    const rDigits = r.replace(/\D/g, '');
    const phoneQ = String(phoneFromQr || '').replace(/\D/g, '');

    const normNameLower = (s) =>
      String(s || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

    let nameQ = String(nameFromQr || '').trim();
    try {
      nameQ = decodeURIComponent(nameQ);
    } catch {}
    nameQ = normNameLower(nameQ);

    if (r) {
      const found = guests.find((g) => {
        const id = String(g.id ?? '');
        const invite = String(g.inviteCode ?? '').trim();
        const code = String(g.code ?? '').trim();
        const idDigits = id.replace(/\D/g, '');
        return (
          invite === r ||
          code === r ||
          id === r ||
          (idDigits && rDigits && idDigits === rDigits)
        );
      });
      if (found) return found;
    }

    if (phoneQ.length >= 9) {
      const found = guests.find((g) => {
        const p = String(g.phone ?? '').replace(/\D/g, '');
        if (!p) return false;
        return (
          p === phoneQ ||
          p.endsWith(phoneQ.slice(-9)) ||
          phoneQ.endsWith(p.slice(-9))
        );
      });
      if (found) return found;
    }

    if (nameQ.length >= 2) {
      let found = guests.find((g) => normNameLower(g.name) === nameQ);
      if (found) return found;
      found = guests.find((g) => normNameLower(g.name).includes(nameQ));
      if (found) return found;
    }

    return null;
  };
      const markArrived = async (guest, guests) => {
    const fromConfirmed = Number(guest.confirmed);
    const qty =
      !isNaN(fromConfirmed) && fromConfirmed >= 1
        ? fromConfirmed
        : Number(guest.confirmedCount) ||
          Number(guest.count) ||
          Number(guest.quantity) ||
          1;

    const updatedGuest = {
      ...guest,
      arrivedCount: qty,
      arrivedAt: new Date().toISOString(),
      notes: guest.notes
        ? `${guest.notes} | הגיע ${new Date().toLocaleTimeString('he-IL')}`
        : `הגיע ${new Date().toLocaleTimeString('he-IL')}`,
    };

    saveGuests(
      eventId,
      guests.map((g) =>
        String(g.id) === String(guest.id) ? updatedGuest : g
      )
    );

    try {
      const key = `arrived_event_${eventId}`;
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = (prev || []).filter(
        (g) => String(g.name || '').trim() !== String(guest.name || '').trim()
      );
      filtered.push({
        name: guest.name,
        id: guest.id,
        arrivedCount: qty,
        arrivedAt: updatedGuest.arrivedAt,
      });
      localStorage.setItem(key, JSON.stringify(filtered));
    } catch {}

    try {
      await updateGuestInSupabase(updatedGuest, eventId);
    } catch {}

    return qty;
  };

  const processPayload = async (decodedText) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setStatus('מפענח...');
    setError('');

    try {
      const raw = String(decodedText || '').trim();
      setLastScanned(raw);

      let refValue = '';
      let phoneValue = '';
      let nameValue = '';

      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          refValue =
            parsed.ref ||
            parsed.code ||
            parsed.inviteCode ||
            parsed.guestId ||
            parsed.Guest ||
            parsed.guest ||
            parsed.id ||
            '';
          phoneValue = parsed.phone || '';
          nameValue = parsed.name || '';
        } else if (parsed != null) {
          refValue = String(parsed);
        }
      } catch {}

      if (!refValue && raw.includes('http')) {
        try {
          const u = new URL(raw);
          refValue =
            u.searchParams.get('ref') ||
            u.searchParams.get('code') ||
            u.searchParams.get('guestId') ||
            u.searchParams.get('guest') ||
            u.searchParams.get('id') ||
            '';
          phoneValue = u.searchParams.get('phone') || phoneValue;
          nameValue = u.searchParams.get('name') || nameValue;
          if (!refValue) {
            const parts = u.pathname.split('/').filter(Boolean);
            refValue = parts[parts.length - 1] || '';
          }
        } catch {}
      }

      if (!refValue && raw.includes('|') && raw.includes(':')) {
        const parts = raw.split('|');
        for (const part of parts) {
          const idx = part.indexOf(':');
          if (idx === -1) continue;
          const key = part.slice(0, idx).trim().toLowerCase();
          const val = part.slice(idx + 1).trim();
          if (
            ['guest', 'guestid', 'ref', 'id', 'code', 'invitecode'].includes(key) &&
            val
          ) {
            refValue = val;
          }
          if (key === 'phone' && val) phoneValue = val;
          if (key === 'name' && val) nameValue = val;
        }
      }

      if (!refValue && raw.length > 3) {
        refValue = raw;
      }

      if (!refValue && !phoneValue && !nameValue) {
        setError('ברקוד בלי מזהה:\n' + raw.slice(0, 150));
        processingRef.current = false;
        return;
      }

      let guests = await loadGuests(String(eventId));
      if (!Array.isArray(guests) || guests.length === 0) {
        try {
          guests = await fetchGuestsFromSupabase(String(eventId));
          if (Array.isArray(guests) && guests.length > 0) {
            saveGuests(String(eventId), guests);
          }
        } catch {}
      }
      setLocalCount(Array.isArray(guests) ? guests.length : 0);

      const guest = findGuest(guests || [], refValue, phoneValue, nameValue);

      if (!guest) {
        const sample = (guests || [])
          .slice(0, 5)
          .map((g) => `${g.name}:${String(g.phone || '').slice(-4)}`)
          .join(' | ');
        setError(
          `לא נמצא מוזמן\nקוד: ${refValue}\nטלפון: ${phoneValue || '-'}\nשם: ${nameValue || '-'}\nנטענו: ${(guests || []).length}\nדוגמאות: ${sample}`
        );
        processingRef.current = false;
        return;
      }

      const already = Number(guest.arrivedCount) > 0;
      const qty = already
        ? Number(guest.arrivedCount)
        : await markArrived(guest, guests);

      // presenceOnly מגיע מה-state (נטען ב-useEffect)
      console.log('SCAN presenceOnly=', presenceOnly);

      const guestQty =
        Number(guest.confirmed) ||
        Number(guest.confirmedCount) ||
        Number(guest.quantity) ||
        Number(qty) ||
        1;

      let tableNumber: number | null = null;
      if (!presenceOnly) {
        tableNumber = await findTable(guest.name);
      }

      setResult({
        name: guest.name,
        tableNumber: presenceOnly ? null : tableNumber,
        alreadyArrived: already,
        qty: guestQty,
        presenceOnly: !!presenceOnly,
      });
      setStatus('');

      if (presenceOnly) {
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(
            `ברקוד זה מיועד ל ${guestQty} אורחים`
          );
          u.lang = 'he-IL';
          u.rate = 0.9;
          window.speechSynthesis.speak(u);
        } catch {}
      } else {
        speakTable(tableNumber, guest.name);
      }

      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      resultTimerRef.current = setTimeout(() => {
        setResult(null);
        setLastScanned('');
        setStatus('כוון לברקוד בטלפון של המוזמן');
        processingRef.current = false;
      }, 4000);
    } catch (e) {
      setError(e?.message || 'שגיאה');
      processingRef.current = false;
    }
  };

  const startScanner = async () => {
    setResult(null);
    setError('');
    setLastScanned('');
    setStatus('טוען מוזמנים...');
    processingRef.current = false;

    try {
      let list = await loadGuests(String(eventId));
      if (!Array.isArray(list) || list.length === 0) {
        list = await fetchGuestsFromSupabase(String(eventId));
        if (Array.isArray(list) && list.length > 0) {
          saveGuests(String(eventId), list);
        }
      }
      const n = Array.isArray(list) ? list.length : 0;
      setLocalCount(n);
      if (n === 0) {
        setError(
          'לא נטענו מוזמנים לאירוע ' +
            eventId +
            '.\nפתח רשימת מוזמנים, רענן, וחזור לכאן.'
        );
        setStatus('');
        return;
      }
    } catch {
      setError('שגיאה בטעינת מוזמנים');
      setStatus('');
      return;
    }

    setStatus('מכין מצלמה...');
    setScanning(true);

    await new Promise((r) => setTimeout(r, 400));

    try {
      await stopScanner();
      setScanning(true);
      processingRef.current = false;
      await new Promise((r) => setTimeout(r, 200));

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      const config = { fps: 8, qrbox: { width: 250, height: 250 } };

      const onSuccess = (decoded) => {
        if (processingRef.current) return;
        processPayload(decoded);
      };
      const onFail = () => {};

      let started = false;
      let lastErr = null;
      const preferred = facingMode;
      const fallback = preferred === 'user' ? 'environment' : 'user';

      try {
        await scanner.start({ facingMode: preferred }, config, onSuccess, onFail);
        started = true;
      } catch (e) {
        lastErr = e;
      }

      if (!started) {
        try {
          await scanner.start({ facingMode: fallback }, config, onSuccess, onFail);
          started = true;
          setFacingMode(fallback);
          localStorage.setItem('checkin_camera', fallback);
        } catch (e) {
          lastErr = e;
        }
      }

      if (!started) {
        try {
          const cams = await Html5Qrcode.getCameras();
          if (cams?.length) {
            const preferFront = preferred === 'user';
            const cam =
              cams.find((c) =>
                preferFront
                  ? /front|user|face/i.test(c.label)
                  : /back|rear|environment/i.test(c.label)
              ) || cams[0];
            await scanner.start(cam.id, config, onSuccess, onFail);
            started = true;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!started) {
        const name = lastErr?.name || '';
        const msg = lastErr?.message || '';
        let text = 'לא ניתן לפתוח מצלמה';
        if (name === 'NotAllowedError')
          text = 'המצלמה נחסמה. בהגדרות הדפדפן אשר גישה למצלמה ורענן.';
        else if (name === 'NotFoundError') text = 'לא נמצאה מצלמה במכשיר';
        else if (name === 'NotReadableError')
          text = 'המצלמה תפוסה ע״י אפליקציה אחרת. סגור אותה ונסה שוב.';
        else if (msg) text = msg;

        setError(text);
        setScanning(false);
        setStatus('');
        return;
      }

      setStatus('כוון לברקוד בטלפון של המוזמן');
    } catch (e) {
      setError(e?.message || 'שגיאת מצלמה');
      setScanning(false);
      setStatus('');
    }
  };

  const switchCamera = async () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    localStorage.setItem('checkin_camera', next);
    if (scanning) {
      await stopScanner();
      setTimeout(() => startScanner(), 350);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4" dir="rtl">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href={backHref} className="text-slate-300 hover:text-white">
            ← חזרה
          </Link>
          <div className="text-sm text-slate-400">{eventTitle}</div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">סריקת כניסה</h1>

                <p className="text-center text-sm mb-2" style={{ color: presenceOnly ? '#34d399' : '#f87171' }}>
          DEBUG presenceOnly = {String(presenceOnly)}
        </p>

        {/* חיווי מצב נוכחות */}
        {presenceOnly && (
          <p className="text-center text-sm text-emerald-400 mb-4 font-bold">
            מצב: נוכחות בלבד (בלי שולחן)
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <button
            onClick={() => {
              const next = !voiceOn;
              setVoiceOn(next);
              localStorage.setItem('checkin_voice', next ? '1' : '0');
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              voiceOn ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            {voiceOn ? '🔊 קריאת שולחן דלוקה' : '🔇 קריאת שולחן כבויה'}
          </button>

          <button
            onClick={switchCamera}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-700 text-white"
          >
            {facingMode === 'user' ? '📱 מצלמה קדמית' : '📷 מצלמה אחורית'}
          </button>
        </div>

        {status && (
          <p className="text-center text-emerald-400 mb-4 text-sm">{status}</p>
        )}

        {lastScanned && !result && (
          <div className="mb-4 p-3 bg-slate-800 rounded-xl text-xs break-all text-amber-300">
            נסרק: {lastScanned}
          </div>
        )}

        {!scanning && !result && (
          <button
            onClick={startScanner}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-2xl font-bold py-8 rounded-3xl mb-6"
          >
            📷 התחל סריקה
          </button>
        )}

        <div className={scanning ? 'block' : 'hidden'}>
          <div
            id="qr-reader"
            className="rounded-2xl overflow-hidden bg-black w-full mb-4"
            style={{ minHeight: '55vh' }}
          />
          <button
            onClick={stopScanner}
            className="w-full bg-slate-700 py-4 rounded-2xl mb-4"
          >
            עצור
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400 text-red-200 p-4 rounded-2xl text-center text-sm whitespace-pre-wrap mb-4">
            {error}
            <button
              onClick={() => {
                setError('');
                startScanner();
              }}
              className="block w-full mt-3 bg-red-600 py-3 rounded-xl"
            >
              נסה שוב
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl px-8 py-10 text-center w-full max-w-lg shadow-2xl">
            {result.alreadyArrived && (
              <div className="text-amber-600 font-bold mb-3 text-2xl">
                כבר נרשם כהגיע
              </div>
            )}

            <div className="text-4xl font-bold mb-2">{result.name}</div>

            <div className="text-xl text-gray-500 mb-6">
              {result.qty} אורחים
            </div>

            {result.presenceOnly ? (
              <div className="py-6">
                <div className="text-2xl text-gray-600 mb-2">ברקוד זה מיועד ל</div>
                <div className="text-[7rem] font-black text-emerald-600 leading-none">
                  {result.qty}
                </div>
                <div className="text-2xl text-gray-600 mt-2">אורחים</div>
              </div>
            ) : result.tableNumber != null ? (
              <div className="py-2">
                <div className="text-2xl text-gray-600 mb-2">שולחן</div>
                <div className="text-[9rem] font-black text-emerald-600 leading-none">
                  {result.tableNumber}
                </div>
              </div>
            ) : (
              <div className="py-6 text-3xl font-bold text-amber-600">
                טרם הושב לשולחן
              </div>
            )}
          </div>

          <p className="text-sm text-gray-300 mt-4">
            ממשיך לסריקה בעוד רגע...
          </p>
        </div>
      )}
    </div>
  );
}