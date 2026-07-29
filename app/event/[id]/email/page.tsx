// @ts-nocheck
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as XLSX from 'xlsx';

type Recipient = {
  name: string;
  email: string;
  code?: string;
};

function normalizeEmail(raw: any) {
  return String(raw || '').trim().toLowerCase();
}

function looksLikeEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function EmailPage() {
  const params = useParams();
  const eventId = String(params?.id || '');

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState('אישור הגעה לאירוע');
  const [message, setMessage] = useState(
    'שלום *שם*,\n\nנשמח לאשר הגעה בקישור האישי שלך:\n{{RSVP_LINK}}\n\nתודה!'
  );
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  const baseUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://www.eventpay1.co.il';
    return window.location.origin;
  }, []);

  const buildRsvpLink = (code?: string) => {
    const base = `${baseUrl}/landing?eventId=${eventId}`;
    if (code && String(code).trim()) {
      return `${base}&ref=${encodeURIComponent(String(code).trim())}`;
    }
    return base;
  };

  const preview = useMemo(() => {
    const sampleCode = recipients[0]?.code || '';
    return message
      .replace(/\{\{RSVP_LINK\}\}/g, buildRsvpLink(sampleCode))
      .replace(/\*RSVP_LINK\*/g, buildRsvpLink(sampleCode))
      .replace(/\{\{name\}\}/g, recipients[0]?.name || 'ישראל ישראלי')
      .replace(/\*שם\*/g, recipients[0]?.name || 'ישראל ישראלי');
  }, [message, recipients, eventId, baseUrl]);

  const onExcel = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        raw: false,
      });

      if (!rows.length) {
        alert('הקובץ ריק');
        return;
      }

      let headerIdx = 0;
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        const nonEmpty = rows[i].filter((c) => String(c || '').trim()).length;
        if (nonEmpty >= 1) {
          headerIdx = i;
          break;
        }
      }

      const header = rows[headerIdx].map((c) => String(c || '').toLowerCase().trim());

      let nameCol = header.findIndex((h) => /שם|name/.test(h));
      let emailCol = header.findIndex((h) => /מייל|אימייל|email|mail/.test(h));
      let codeCol = header.findIndex((h) =>
        /קוד|code|ref|invite|invitecode|guestid|id/.test(h)
      );

      // ניחוש אימייל אם אין כותרת
      if (emailCol < 0) {
        for (let c = 0; c < (rows[headerIdx + 1] || []).length; c++) {
          if (looksLikeEmail(String(rows[headerIdx + 1][c] || ''))) {
            emailCol = c;
            break;
          }
        }
      }
      if (nameCol < 0) nameCol = emailCol === 0 ? 1 : 0;

      if (emailCol < 0) {
        alert('לא מצאתי עמודת אימייל בקובץ');
        return;
      }

      const list: Recipient[] = [];
      const seen = new Set<string>();

      for (let r = headerIdx + 1; r < rows.length; r++) {
        const email = normalizeEmail(rows[r][emailCol]);
        if (!looksLikeEmail(email) || seen.has(email)) continue;
        seen.add(email);

        const name = String(rows[r][nameCol] || '').trim();
        const code =
          codeCol >= 0 ? String(rows[r][codeCol] || '').trim() : '';

        list.push({ name, email, code: code || undefined });
      }

      if (!list.length) {
        alert('לא נמצאו אימיילים תקינים');
        return;
      }

      const withCode = list.filter((x) => x.code).length;
      setRecipients(list);
      setResult(
        `נטענו ${list.length} נמענים` +
          (withCode ? ` · מתוכם ${withCode} עם קוד אישי` : ' · ללא קודי ref באקסל')
      );
    } catch (e: any) {
      alert('שגיאה בקריאת האקסל: ' + (e?.message || ''));
    }
  };

  const addManual = () => {
    const email = normalizeEmail(manualEmail);
    if (!looksLikeEmail(email)) {
      alert('אימייל לא תקין');
      return;
    }
    if (recipients.some((r) => r.email === email)) {
      alert('האימייל כבר ברשימה');
      return;
    }
    setRecipients((prev) => [
      ...prev,
      {
        name: manualName.trim(),
        email,
        code: manualCode.trim() || undefined,
      },
    ]);
    setManualName('');
    setManualEmail('');
    setManualCode('');
  };

  const removeOne = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r.email !== email));
  };

  const sendAll = async () => {
    if (!recipients.length) return alert('אין נמענים');
    if (!subject.trim()) return alert('חסר נושא');
    if (!message.trim()) return alert('חסר תוכן');
    if (!confirm(`לשלוח מייל ל־${recipients.length} נמענים?`)) return;

    setSending(true);
    setResult('');

    try {
      // בונים לכל נמען הודעה עם לינק אישי
      const payloadRecipients = recipients.map((r) => {
        const link = buildRsvpLink(r.code);
        const html = message
          .replace(/\{\{RSVP_LINK\}\}/g, link)
          .replace(/\*RSVP_LINK\*/g, link)
          .replace(/\{\{name\}\}/g, r.name || '')
          .replace(/\*שם\*/g, r.name || '');
        return {
          name: r.name,
          email: r.email,
          // ה-API הנוכחי עושה replace ל*שם* — את הלינק כבר שמים כאן בתוכן
          _html: html,
        };
      });

      // שולחים דרך ה-API הקיים, אבל עם html מוכן לכל אחד
      // כדי לא לשבור את ה-API — נשלח בלולאה מהלקוח בקבוצות קטנות
      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const r of payloadRecipients) {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject,
            html: r._html,
            recipients: [{ name: r.name, email: r.email }],
          }),
        });
        const data = await res.json();
        if (data.success) sent += data.sent || 1;
        else {
          failed += 1;
          if (data.error) errors.push(`${r.email}: ${data.error}`);
        }
      }

      setResult(
        (sent > 0 ? `✅ נשלח ל־${sent}` : '❌ לא נשלח') +
          (failed ? ` | נכשלו: ${failed}` : '') +
          (errors.length ? `\n${errors.slice(0, 5).join('\n')}` : '')
      );
    } catch (e: any) {
      setResult('❌ שגיאת רשת: ' + (e?.message || ''));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">שליחת מיילים</h1>
            <p className="text-slate-500 mt-1">
              אקסל עם שם + אימייל + קוד אישי (אופציונלי)
            </p>
          </div>
          <Link
            href={`/event/${eventId}/guests`}
            className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-medium"
          >
            ← חזרה
          </Link>
        </div>

        <div className="bg-white rounded-2xl border p-5 space-y-3">
          <h2 className="font-bold text-lg">1. נמענים מאקסל</h2>
          <p className="text-sm text-slate-500">
            עמודות: <b>שם</b> | <b>אימייל</b> | <b>קוד</b> (או code / ref / inviteCode)
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onExcel(f);
            }}
            className="block w-full text-sm"
          />
        </div>

        <div className="bg-white rounded-2xl border p-5 space-y-3">
          <h2 className="font-bold text-lg">2. הוספה ידנית</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="שם"
              className="flex-1 border rounded-xl px-3 py-2"
            />
            <input
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 border rounded-xl px-3 py-2"
              dir="ltr"
            />
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="קוד אישי (אופציונלי)"
              className="flex-1 border rounded-xl px-3 py-2"
              dir="ltr"
            />
            <button
              type="button"
              onClick={addManual}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-medium"
            >
              ＋ הוסף
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">נמענים ({recipients.length})</h2>
            {recipients.length > 0 && (
              <button
                type="button"
                onClick={() => setRecipients([])}
                className="text-rose-600 text-sm hover:underline"
              >
                נקה הכל
              </button>
            )}
          </div>
          {recipients.length === 0 ? (
            <p className="text-slate-400 text-sm">אין נמענים עדיין</p>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1">
              {recipients.map((r) => (
                <div
                  key={r.email}
                  className="flex flex-wrap items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-sm"
                >
                  <span className="font-medium">{r.name || '—'}</span>
                  <span className="text-slate-500" dir="ltr">
                    {r.email}
                  </span>
                  <span className="text-xs text-slate-400 mr-auto" dir="ltr">
                    {r.code ? `ref=${r.code}` : 'ללא קוד'}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeOne(r.email)}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border p-5 space-y-3">
          <h2 className="font-bold text-lg">3. תוכן המייל</h2>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="נושא"
            className="w-full border rounded-xl px-3 py-2 font-medium"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            className="w-full border rounded-xl px-3 py-2 leading-relaxed"
          />
          <p className="text-xs text-slate-500">
            משתנים: <code>*שם*</code> · <code>{'{{RSVP_LINK}}'}</code> (לינק אישי אם יש קוד)
          </p>
          <div className="bg-slate-50 border rounded-xl p-4 text-sm whitespace-pre-wrap break-words">
            <div className="text-xs text-slate-400 mb-2">תצוגה מקדימה:</div>
            {preview}
          </div>
        </div>

        <button
          type="button"
          onClick={sendAll}
          disabled={sending || recipients.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white py-4 rounded-2xl font-bold text-lg"
        >
          {sending ? 'שולח...' : `📧 שלח ל־${recipients.length} נמענים`}
        </button>

        {result && (
          <div className="bg-white border rounded-2xl p-4 whitespace-pre-wrap text-sm">
            {result}
          </div>
        )}
      </div>
    </div>
  );
}