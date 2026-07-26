'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function TestDbPage() {
  const [status, setStatus] = useState('בודק...');
  const [details, setDetails] = useState('');

  useEffect(() => {
    async function check() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!url) {
          setStatus('❌ חסר NEXT_PUBLIC_SUPABASE_URL בקובץ .env.local');
          return;
        }

        const { data, error } = await supabase.from('events').select('*').limit(5);

        if (error) {
          setStatus('❌ שגיאה מ-Supabase');
          setDetails(error.message + ' | code: ' + (error as any).code);
        } else {
          setStatus('✅ מחובר ל-Supabase בהצלחה');
          setDetails(JSON.stringify(data, null, 2));
        }
      } catch (e: any) {
        setStatus('❌ שגיאה כללית');
        setDetails(e?.message || String(e));
      }
    }
    check();
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: 'Arial', direction: 'rtl' }}>
      <h1>בדיקת מסד נתונים</h1>
      <p style={{ fontSize: 22 }}>{status}</p>
      <pre style={{ background: '#f3f4f6', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
        {details}
      </pre>
    </div>
  );
}