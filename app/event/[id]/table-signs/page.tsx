'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function TableSignsPage() {
  const params = useParams();
  const eventId = String(params?.id || '');
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState('');

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    try {
      let data: any[] = [];
      const raw1 = localStorage.getItem(`seatingTables_${eventId}`);
      const raw2 = localStorage.getItem('seatingTables');

      if (raw1) {
        const parsed = JSON.parse(raw1);
        if (Array.isArray(parsed) && parsed.length > 0) data = parsed;
      }
      if (data.length === 0 && raw2) {
        const parsed = JSON.parse(raw2);
        if (Array.isArray(parsed) && parsed.length > 0) data = parsed;
      }

      setTables(data);

      const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
      const current = events.find((e: any) => String(e.id) === String(eventId));
      if (current) setEventTitle(current.owners || current.title || '');
    } catch (err) {
      console.error(err);
      setTables([]);
    }
    setLoading(false);
  }, [eventId]);

  const sorted = [...tables].sort(
    (a, b) => (Number(a.tableNumber) || 0) - (Number(b.tableNumber) || 0)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        טוען...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      <div className="print:hidden bg-white border-b px-4 py-3 flex flex-wrap items-center gap-3 sticky top-0 z-50">
        <Link href={`/event/${eventId}/seating`} className="text-blue-600 text-sm hover:underline">
          ← חזרה לסקיצה
        </Link>
        <div className="font-bold">{eventTitle || `אירוע ${eventId}`}</div>
        <div className="text-sm text-gray-500">({sorted.length} שולחנות)</div>
        <div className="flex-1" />
        <button
          onClick={() => window.print()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold"
        >
          🖨️ הדפס שלטי שולחנות
        </button>
      </div>

      <div className="p-6 print:p-0">
        {sorted.length === 0 ? (
          <div className="text-center text-gray-500 py-20 text-xl">לא נמצאו שולחנות</div>
        ) : (
          sorted.map((table, idx) => (
            <div
              key={table.id || idx}
              className="bg-white mx-auto mb-10 print:mb-0"
              style={{ width: '210mm', minHeight: '297mm', pageBreakAfter: 'always' }}
            >
              {/* חצי עליון - מסובב */}
              <div
                className="flex flex-col items-center justify-center border-b-2 border-dashed border-gray-300"
                style={{ height: '148.5mm', padding: '20px', transform: 'rotate(180deg)' }}
              >
                <div
  style={{
    border: '3px solid #5c4033',
    borderRadius: '12px',
    padding: '30px 50px',
    textAlign: 'center',
    background: '#fdfbf7',
    boxShadow: 'inset 0 0 0 6px #f5e6d3',
  }}
>
  <h1 style={{ fontSize: '156px', fontWeight: 900, margin: 0, color: '#2c1810' }}>
    {table.tableNumber ?? idx + 1}
  </h1>
  {table.tableName && (
    <p style={{ fontSize: '34px', fontWeight: 600, marginTop: '12px', color: '#5c4033' }}>
      {table.tableName}
    </p>
  )}
</div>
              </div>

              {/* חצי תחתון - רגיל */}
              <div
                className="flex flex-col items-center justify-center"
                style={{ height: '148.5mm', padding: '20px' }}
              >
                <div
                  style={{
                    border: '3px solid #5c4033',
                    borderRadius: '12px',
                    padding: '30px 50px',
                    textAlign: 'center',
                    background: '#fdfbf7',
                    boxShadow: 'inset 0 0 0 6px #f5e6d3',
                  }}
                >
                  <h1 style={{ fontSize: '130px', fontWeight: 900, margin: 0, color: '#2c1810' }}>
                    {table.tableNumber ?? idx + 1}
                  </h1>
                  {table.tableName && (
                    <p style={{ fontSize: '28px', fontWeight: 600, marginTop: '12px', color: '#5c4033' }}>
                      {table.tableName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}