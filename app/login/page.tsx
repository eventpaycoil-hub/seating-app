'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase.js';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  const user = username.trim();
  const pass = password.trim();

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass }),
    });
    const data = await res.json();

    if (!data.success) {
      setError(data.error || 'שם משתמש או סיסמה שגויים');
      setLoading(false);
      return;
    }

        if (data.role === 'admin') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', 'admin');
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('clientMode', 'false');
      localStorage.removeItem('clientEventId');
      localStorage.removeItem('canReturnToAdmin');
      router.push('/events');
      return;
    }

    const matched = data.event;
    try {
      const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
      const idx = events.findIndex((ev: any) => String(ev.id) === String(matched.id));
      if (idx >= 0) events[idx] = { ...events[idx], ...matched };
      else events.push(matched);
      localStorage.setItem('myEvents', JSON.stringify(events));
    } catch {}

        localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', user);
    localStorage.setItem('userRole', 'client');
    localStorage.setItem('clientMode', 'true');
    localStorage.setItem('clientEventId', String(matched.id));
    localStorage.removeItem('canReturnToAdmin');

    router.push(`/event/${matched.id}/guests`);
  } catch (err: any) {
    console.error(err);
    setError('שגיאה בהתחברות');
    setLoading(false);
  }
};

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center"
      dir="rtl"
    >
      <div className="bg-zinc-800 p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-4xl mb-4">
            R
          </div>
          <h1 className="text-3xl font-bold text-white">כניסה למערכת</h1>
          <p className="text-zinc-400 mt-2">EventPay - ניהול אירועים</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">שם משתמש</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-700 border border-zinc-600 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500"
              placeholder="שם משתמש"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-700 border border-zinc-600 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500"
              placeholder="סיסמה"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 text-white font-bold text-xl py-4 rounded-3xl transition"
          >
            {loading ? 'נכנס...' : 'התחבר'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500 mt-8">
          מנהל: admin / 123456 · לקוח: לפי פרטי האירוע
        </p>
      </div>
    </div>
  );
}