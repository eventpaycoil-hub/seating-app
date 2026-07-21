// @ts-nocheck
'use client';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { getGuests, saveGuests, normalizeGuest } from '../lib/guests';

interface Guest {
  id: number;
  name: string;
  phone: string;
  quantity: string;
  group: string;
  transportation: string;
  confirmed: string;
  customerExpectation: string;
  notes: string;
}

type FieldKey = keyof Guest;

function normalizePhone(raw: string): string {
  if (!raw) return '';
  let p = raw.toString().trim();
  p = p.replace(/[^\d+]/g, '');
  if (p.startsWith('+972')) p = p.slice(4);
  else if (p.startsWith('972')) p = p.slice(3);
  p = p.replace(/\D/g, '');
  if (p.length === 9 && p.startsWith('5')) p = '0' + p;
  return p;
}

function isValidIsraeliMobile(phone: string): boolean {
  if (!phone) return true;
  return phone.length === 10 && phone.startsWith('05');
}

function emptyGuest(partial?: Partial<Guest>): Guest {
  return {
    id: Date.now() + Math.random(),
    name: '',
    phone: '',
    quantity: '',
    group: '',
    transportation: '',
    confirmed: '',
    customerExpectation: '',
    notes: '',
    ...partial,
  };
}

function classifyHeader(header: string): FieldKey | 'skip' | '' {
  const h = (header || '').toString().toLowerCase().trim();
  if (!h) return '';
  if (/שם\s*מלא|שם האורח|^שם$|name|אורח|guest/.test(h)) return 'name';
  if (/טלפון|phone|נייד|mobile|פלאפון|cell/.test(h)) return 'phone';
  if (/מספר\s*מוזמ|כמות|quantity|count|אנשים|מס['']?\s*מוזמ/.test(h)) return 'quantity';
  if (/^צד$|קבוצה|group|side/.test(h)) return 'group';
  if (/הסעה|transport/.test(h)) return 'transportation';
  if (/אישור|confirm|rsvp|מגיע/.test(h)) return 'confirmed';
  if (/הערה|notes|note|הערות/.test(h)) return 'notes';
  return 'skip';
}

function detectBlocks(headers: string[]) {
  const classified = headers.map((h, i) => ({ i, type: classifyHeader(h), header: h }));
  const nameCols = classified.filter((c) => c.type === 'name');
  if (nameCols.length === 0) return [];

  return nameCols.map((nameCell) => {
    const center = nameCell.i;
    const window = classified.filter((c) => Math.abs(c.i - center) <= 5 && c.i !== center);
    const phoneCol =
      window.find((c) => c.type === 'phone' && c.i < center)?.i ??
      window.find((c) => c.type === 'phone')?.i ??
      null;
    const quantityCol = window.find((c) => c.type === 'quantity')?.i ?? null;
    const groupCol = window.find((c) => c.type === 'group')?.i ?? null;
    return {
      nameCol: center,
      phoneCol,
      quantityCol,
      groupCol,
      label: `בלוק: ${nameCell.header} (עמודה ${String.fromCharCode(65 + (center % 26))})`,
    };
  });
}

function extractGuestsFromBlocks(
  rows: any[][],
  blocks: ReturnType<typeof detectBlocks>,
  defaults: { group: string; transportation: string }
): Guest[] {
  const result: Guest[] = [];
  const seen = new Set<string>();

  blocks.forEach((block) => {
    rows.forEach((row) => {
      const name = String(row[block.nameCol] ?? '').trim();
      if (!name) return;
      if (/שם|name|טלפון|phone/i.test(name) && name.length < 20) return;

      let phone = '';
      if (block.phoneCol !== null) phone = normalizePhone(String(row[block.phoneCol] ?? ''));

      let quantity = '';
      if (block.quantityCol !== null) quantity = String(row[block.quantityCol] ?? '').trim();

      let group = defaults.group;
      if (block.groupCol !== null) {
        const g = String(row[block.groupCol] ?? '').trim();
        if (g) group = g;
      }

      const key = `${name}|${phone}`;
      if (seen.has(key)) return;
      seen.add(key);

      result.push(
        emptyGuest({
          name,
          phone,
          quantity,
          group,
          transportation: defaults.transportation,
        })
      );
    });
  });

  return result;
}

function AddGuestsContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId') || '1';

  const [guests, setGuests] = useState<Guest[]>([]);
  const [allTransportation, setAllTransportation] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [eventTitle, setEventTitle] = useState(`אירוע #${eventId}`);

  const fileRef = useRef<HTMLInputElement>(null);
  const [excelOpen, setExcelOpen] = useState(false);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelRows, setExcelRows] = useState<any[][]>([]);
  const [detectedBlocks, setDetectedBlocks] = useState<ReturnType<typeof detectBlocks>>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [columnMap, setColumnMap] = useState<Record<number, FieldKey | ''>>({});
  const [contactsSupported, setContactsSupported] = useState(false);

  const groups = ['משפחה', 'חברים', 'עבודה', 'שכנים', 'חברי ילדות', 'לקוחות'];

  const columns: { key: keyof Guest; label: string }[] = [
    { key: 'name', label: 'שם האורח' },
    { key: 'phone', label: 'טלפון' },
    { key: 'quantity', label: 'כמות' },
    { key: 'group', label: 'קבוצה' },
    { key: 'transportation', label: 'הסעה' },
    { key: 'confirmed', label: 'אישור הגעה' },
    { key: 'customerExpectation', label: 'צפי לקוח' },
    { key: 'notes', label: 'הערה' },
  ];

  const FIELD_OPTIONS: { key: FieldKey | ''; label: string }[] = [
    { key: '', label: '— אל תייבא —' },
    { key: 'name', label: 'שם האורח' },
    { key: 'phone', label: 'טלפון' },
    { key: 'quantity', label: 'כמות' },
    { key: 'group', label: 'קבוצה' },
    { key: 'transportation', label: 'הסעה' },
    { key: 'confirmed', label: 'אישור הגעה' },
    { key: 'customerExpectation', label: 'צפי לקוח' },
    { key: 'notes', label: 'הערה' },
  ];

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const currentEvent = events.find((e: any) => e.id.toString() === eventId.toString());
    if (currentEvent) setEventTitle(currentEvent.owners || currentEvent.title);

    // Contact Picker API – בעיקר כרום באנדרואיד
    setContactsSupported(
      typeof window !== 'undefined' &&
        'contacts' in navigator &&
        'ContactsManager' in window
    );
  }, [eventId]);

  useEffect(() => {
    setGuests(Array.from({ length: 30 }, () => emptyGuest()));
  }, []);

  const updateGuest = (id: number, field: keyof Guest, value: string) => {
    let finalValue = value;
    if (field === 'phone') finalValue = normalizePhone(value);
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: finalValue } : g)));
  };

  const deleteRow = (id: number) => {
    if (!confirm('למחוק את השורה?')) return;
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  const clearColumn = (field: keyof Guest) => {
    if (!confirm('למחוק את כל התוכן בעמודה?')) return;
    setGuests((prev) => prev.map((g) => ({ ...g, [field]: '' })));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, rowIndex: number, field: keyof Guest) => {
    const text = e.clipboardData.getData('text');
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    if (lines.length <= 1) {
      if (field === 'phone') {
        e.preventDefault();
        updateGuest(guests[rowIndex].id, 'phone', normalizePhone(text));
      }
      return;
    }

    e.preventDefault();
    setGuests((prev) => {
      const newGuests = [...prev];
      lines.forEach((value, i) => {
        const idx = rowIndex + i;
        const raw = (value ?? '').trim();
        const finalValue = field === 'phone' ? (raw ? normalizePhone(raw) : '') : raw;
        if (idx < newGuests.length) {
          (newGuests[idx] as any)[field] = finalValue;
        } else {
          const newG = emptyGuest({
            group: selectedGroup,
            transportation: allTransportation ? 'כן' : '',
          });
          (newG as any)[field] = finalValue;
          newGuests.push(newG);
        }
      });
      return newGuests;
    });
  };

  const toggleAllTransportation = () => {
    const newVal = !allTransportation;
    setAllTransportation(newVal);
    setGuests((prev) => prev.map((g) => ({ ...g, transportation: newVal ? 'כן' : '' })));
  };

  /** שמירה ישירה לאירוע */
  const saveListToEvent = (list: Guest[]) => {
    const valid = list
      .filter((g) => g.name.trim() !== '')
      .map((g) => ({ ...g, phone: normalizePhone(g.phone) }));

    if (!valid.length) {
      alert('אין מוזמנים עם שם לשמירה');
      return 0;
    }

    const existing = getGuests(eventId);
    const normalizedNew = valid.map((g) =>
      normalizeGuest({
        ...g,
        group: (g.group || '').trim() || selectedGroup || '',
      })
    );

    // מניעת כפילות מול קיימים (שם+טלפון)
    const existingKeys = new Set(
      existing.map((g: any) => `${(g.name || '').trim()}|${normalizePhone(g.phone || '')}`)
    );
    const unique = normalizedNew.filter(
      (g) => !existingKeys.has(`${g.name.trim()}|${normalizePhone(g.phone)}`)
    );

    saveGuests(eventId, [...existing, ...unique]);
    return unique.length;
  };

  const uploadToEvent = () => {
    const count = saveListToEvent(guests);
    if (count > 0) {
      alert(`✅ ${count} מוזמנים נשמרו לאירוע!`);
      setGuests(Array.from({ length: 30 }, () => emptyGuest()));
    }
  };

  const onExcelFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        raw: false,
      });

      if (!matrix.length) {
        alert('הקובץ ריק');
        return;
      }

      let headerIdx = 0;
      for (let r = 0; r < Math.min(5, matrix.length); r++) {
        const nonEmpty = matrix[r].filter((c) => String(c ?? '').trim() !== '').length;
        if (nonEmpty >= 2) {
          headerIdx = r;
          break;
        }
      }

      const headerRow = matrix[headerIdx].map((c: any, i: number) => {
        const v = (c ?? '').toString().trim();
        return v || `עמודה ${String.fromCharCode(65 + (i % 26))}`;
      });

      const body = matrix
        .slice(headerIdx + 1)
        .filter((row) => row.some((c) => String(c ?? '').trim() !== ''));

      const blocks = detectBlocks(headerRow);
      const preview = extractGuestsFromBlocks(body, blocks, {
        group: selectedGroup,
        transportation: allTransportation ? 'כן' : '',
      });

      setExcelHeaders(headerRow);
      setExcelRows(body);
      setDetectedBlocks(blocks);
      setPreviewCount(preview.length);
      setManualMode(blocks.length === 0);
      setExcelOpen(true);

      const autoMap: Record<number, FieldKey | ''> = {};
      headerRow.forEach((h, i) => {
        const t = classifyHeader(h);
        autoMap[i] = t === 'skip' || t === '' ? '' : t;
      });
      setColumnMap(autoMap);
    } catch (err) {
      console.error(err);
      alert('שגיאה בקריאת קובץ האקסל');
    }
  };

  const closeExcel = () => {
    setExcelOpen(false);
    setExcelHeaders([]);
    setExcelRows([]);
    setDetectedBlocks([]);
    setColumnMap({});
    setManualMode(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const applySmartImportAndSave = () => {
    const imported = extractGuestsFromBlocks(excelRows, detectedBlocks, {
      group: selectedGroup,
      transportation: allTransportation ? 'כן' : '',
    });

    if (!imported.length) {
      alert('לא נמצאו מוזמנים. נסה מצב ידני.');
      setManualMode(true);
      return;
    }

    const count = saveListToEvent(imported);
    closeExcel();
    alert(
      count > 0
        ? `✅ ${count} מוזמנים נשמרו ישירות לאירוע! (${detectedBlocks.length} בלוקים)`
        : 'כל המוזמנים כבר קיימים באירוע'
    );
  };

  const applySmartImportToTableOnly = () => {
    const imported = extractGuestsFromBlocks(excelRows, detectedBlocks, {
      group: selectedGroup,
      transportation: allTransportation ? 'כן' : '',
    });
    if (!imported.length) {
      alert('לא נמצאו מוזמנים');
      return;
    }
    setGuests((prev) => {
      const hasData = prev.some((g) => g.name.trim() || g.phone.trim());
      if (!hasData) return [...imported, ...Array.from({ length: 8 }, () => emptyGuest())];
      return [...imported, ...prev];
    });
    closeExcel();
    alert(`✅ ${imported.length} מוזמנים בטבלה – לחץ "העלה לאירוע" כדי לשמור`);
  };

  const applyManualImportAndSave = () => {
    const mapped = Object.values(columnMap).filter(Boolean);
    if (!mapped.includes('name')) {
      alert('חובה למפות לפחות עמודה ל"שם האורח"');
      return;
    }

    const imported: Guest[] = excelRows
      .map((row) => {
        const g = emptyGuest({
          group: selectedGroup,
          transportation: allTransportation ? 'כן' : '',
        });
        Object.entries(columnMap).forEach(([colIndex, field]) => {
          if (!field) return;
          let val = String(row[Number(colIndex)] ?? '').trim();
          if (field === 'phone') val = normalizePhone(val);
          (g as any)[field] = val;
        });
        return g;
      })
      .filter((g) => g.name.trim() !== '');

    if (!imported.length) {
      alert('לא נמצאו שורות עם שם');
      return;
    }

    const count = saveListToEvent(imported);
    closeExcel();
    alert(count > 0 ? `✅ ${count} מוזמנים נשמרו ישירות לאירוע!` : 'כל המוזמנים כבר קיימים');
  };

  /** ייבוא מאנשי קשר בטלפון */
  const importFromContacts = async () => {
    try {
      const nav: any = navigator;
      if (!nav.contacts || !nav.contacts.select) {
        alert(
          'ייבוא מאנשי קשר נתמך בעיקר ב-Chrome באנדרואיד.\n\nבאייפון: ייצא אנשי קשר ל-CSV/vCard וייבא באקסל.'
        );
        return;
      }

      const selected = await nav.contacts.select(['name', 'tel'], { multiple: true });
      if (!selected || !selected.length) return;

      const imported: Guest[] = selected
        .map((c: any) => {
          const name = (c.name && (Array.isArray(c.name) ? c.name[0] : c.name)) || '';
          let phone = '';
          if (c.tel && c.tel.length) {
            phone = normalizePhone(String(c.tel[0]));
          }
          return emptyGuest({
            name: String(name).trim(),
            phone,
            group: selectedGroup,
            transportation: allTransportation ? 'כן' : '',
          });
        })
        .filter((g: Guest) => g.name);

      if (!imported.length) {
        alert('לא נבחרו אנשי קשר עם שם');
        return;
      }

      const count = saveListToEvent(imported);
      alert(count > 0 ? `✅ ${count} אנשי קשר נשמרו לאירוע!` : 'כל אנשי הקשר כבר קיימים באירוע');
    } catch (err: any) {
      if (err?.name === 'InvalidStateError' || err?.name === 'SecurityError') {
        alert('הדפדפן חסם גישה לאנשי קשר. נסה בכרום באנדרואיד עם HTTPS.');
      } else {
        console.error(err);
        alert('לא ניתן לפתוח את אנשי הקשר בדפדפן זה');
      }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">הוספת אורחים - {eventTitle}</h1>
        <Link href={`/event/${eventId}/guests`}>
          <button className="px-8 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-2xl font-semibold">
            ← חזרה לרשימת מוזמנים
          </button>
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={allTransportation} onChange={toggleAllTransportation} />
          <span>אפשרות הסעה לכולם</span>
        </div>

        <div className="flex items-center gap-2">
          <span>קבוצה:</span>
          <select
            value={selectedGroup}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedGroup(val);
              if (val) {
                setGuests((prev) =>
                  prev.map((g) => {
                    const hasData = g.name.trim() !== '' || g.phone.trim() !== '';
                    if (hasData && g.group.trim() === '') return { ...g, group: val };
                    return g;
                  })
                );
              }
            }}
            className="border border-slate-300 rounded-xl px-4 py-2 text-sm"
          >
            <option value="">— בחר —</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <label className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold cursor-pointer">
          📊 ייבוא מאקסל
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onExcelFile(f);
            }}
          />
        </label>

        <button
          onClick={importFromContacts}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold"
          title={contactsSupported ? 'בחירה מאנשי הקשר' : 'נתמך בעיקר בכרום באנדרואיד'}
        >
          📱 מאנשי קשר
        </button>

        <button
          onClick={uploadToEvent}
          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold"
        >
          העלה לאירוע
        </button>
      </div>

      <div className="bg-slate-100 rounded-3xl border shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-200 sticky top-0 z-10">
            <tr className="border-b border-slate-300">
              <th className="w-12 py-4 text-center font-semibold text-slate-700">#</th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-4 pr-4 text-right font-semibold text-slate-700 border-r border-slate-300 ${
                    col.key === 'quantity' ? 'w-28' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{col.label}</span>
                    <button
                      type="button"
                      onClick={() => clearColumn(col.key)}
                      className="text-slate-500 hover:text-rose-600 rounded px-1.5 text-xs font-bold"
                    >
                      ▼
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {guests.map((guest, idx) => {
              const phoneInvalid = guest.phone.trim() !== '' && !isValidIsraeliMobile(guest.phone);
              return (
                <tr key={guest.id} className="hover:bg-slate-50">
                  <td className="text-center text-slate-500 py-3 border-r">{idx + 1}</td>
                  <td className="pr-6 border-r">
                    <input
                      value={guest.name}
                      onChange={(e) => updateGuest(guest.id, 'name', e.target.value)}
                      onPaste={(e) => handlePaste(e, idx, 'name')}
                      className="w-full py-3.5 outline-none bg-transparent"
                    />
                  </td>
                  <td className="pr-6 border-r">
                    <input
                      value={guest.phone}
                      onChange={(e) => updateGuest(guest.id, 'phone', e.target.value)}
                      onPaste={(e) => handlePaste(e, idx, 'phone')}
                      className={`w-full py-3.5 outline-none bg-transparent ${
                        phoneInvalid ? 'text-red-600 font-semibold' : ''
                      }`}
                    />
                  </td>
                  <td className="pr-6 border-r">
                    <input
                      value={guest.quantity}
                      onChange={(e) => updateGuest(guest.id, 'quantity', e.target.value)}
                      onPaste={(e) => handlePaste(e, idx, 'quantity')}
                      className="w-full py-3.5 outline-none text-center bg-transparent"
                    />
                  </td>
                  <td className="pr-6 border-r">
                    <input
                      value={guest.group}
                      onChange={(e) => updateGuest(guest.id, 'group', e.target.value)}
                      onPaste={(e) => handlePaste(e, idx, 'group')}
                      className="w-full py-3.5 outline-none bg-transparent"
                    />
                  </td>
                  <td className="pr-6 border-r">
                    <input
                      value={guest.transportation}
                      onChange={(e) => updateGuest(guest.id, 'transportation', e.target.value)}
                      onPaste={(e) => handlePaste(e, idx, 'transportation')}
                      className="w-full py-3.5 outline-none bg-transparent"
                    />
                  </td>
                  <td className="pr-6 border-r">
                    <input
                      value={guest.confirmed}
                      onChange={(e) => updateGuest(guest.id, 'confirmed', e.target.value)}
                      onPaste={(e) => handlePaste(e, idx, 'confirmed')}
                      className="w-full py-3.5 outline-none bg-transparent"
                    />
                  </td>
                  <td className="pr-6 border-r">
                    <input
                      value={guest.customerExpectation}
                      onChange={(e) => updateGuest(guest.id, 'customerExpectation', e.target.value)}
                      onPaste={(e) => handlePaste(e, idx, 'customerExpectation')}
                      className="w-full py-3.5 outline-none bg-transparent"
                    />
                  </td>
                  <td className="pr-6">
                    <input
                      value={guest.notes}
                      onChange={(e) => updateGuest(guest.id, 'notes', e.target.value)}
                      onPaste={(e) => handlePaste(e, idx, 'notes')}
                      className="w-full py-3.5 outline-none bg-transparent"
                    />
                  </td>
                  <td className="text-center">
                    <button onClick={() => deleteRow(guest.id)} className="text-red-500 text-xl px-3">
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {excelOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">ייבוא מאקסל</h2>

            {!manualMode && detectedBlocks.length > 0 ? (
              <>
                <p className="text-slate-600 mb-4">
                  זוהו <strong>{detectedBlocks.length}</strong> בלוקים · כ־
                  <strong>{previewCount}</strong> מוזמנים
                </p>
                <ul className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-2 text-sm">
                  {detectedBlocks.map((b, i) => (
                    <li key={i}>{b.label}</li>
                  ))}
                </ul>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={applySmartImportAndSave}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold text-lg"
                  >
                    ✅ ייבא ושמור ישר לאירוע
                  </button>
                  <button
                    onClick={applySmartImportToTableOnly}
                    className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 py-3 rounded-2xl font-medium"
                  >
                    רק לטבלה (בלי שמירה עדיין)
                  </button>
                  <button
                    onClick={() => setManualMode(true)}
                    className="w-full bg-slate-100 hover:bg-slate-200 py-3 rounded-2xl"
                  >
                    מיפוי ידני
                  </button>
                  <button onClick={closeExcel} className="text-slate-500 py-2">
                    ביטול
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-500 text-sm mb-4">מיפוי ידני לעמודות</p>
                <div className="space-y-3 mb-6 max-h-72 overflow-y-auto">
                  {excelHeaders.map((header, colIndex) => (
                    <div
                      key={colIndex}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 rounded-2xl p-3"
                    >
                      <div className="sm:w-1/2 font-medium truncate">{header}</div>
                      <select
                        value={columnMap[colIndex] ?? ''}
                        onChange={(e) =>
                          setColumnMap((prev) => ({
                            ...prev,
                            [colIndex]: e.target.value as FieldKey | '',
                          }))
                        }
                        className="sm:w-1/2 border rounded-xl px-3 py-2"
                      >
                        {FIELD_OPTIONS.map((opt) => (
                          <option key={opt.key || 'none'} value={opt.key}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={applyManualImportAndSave}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold"
                  >
                    ✅ ייבא ושמור ישר לאירוע
                  </button>
                  <button onClick={closeExcel} className="bg-slate-200 py-3 rounded-2xl font-bold">
                    ביטול
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddGuestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xl">טוען דף...</div>}>
      <AddGuestsContent />
    </Suspense>
  );
}