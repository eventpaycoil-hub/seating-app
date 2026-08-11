import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'אישורי הגעה לאירוע | SMS וואטסאפ ודף נחיתה',
  description:
    'מערכת אישורי הגעה לאירועים בישראל: שליחת SMS וואטסאפ, דף נחיתה למוזמנים, מעקב בזמן אמת וניהול רשימת מוזמנים.',
  alternates: {
    canonical: '/services/rsvp',
  },
};

export default function RsvpServicePage() {
  return (
    <div className="min-h-screen bg-[#f8f1e3] text-slate-900" dir="rtl">
      <header className="border-b border-amber-900/10 bg-[#f5e8c7]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-[#4a2c0f]">
            EventPay
          </Link>
          <Link
            href="/"
            className="rounded-full bg-[#4a2c0f] px-5 py-2 text-sm font-bold text-white"
          >
            כניסה למערכת
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        <section className="mb-14 text-center">
          <p className="mb-3 text-sm font-medium text-amber-800">
            שירות לאירועים בישראל
          </p>
          <h1 className="mb-5 text-4xl font-black leading-tight text-[#4a2c0f] sm:text-5xl">
            אישורי הגעה לאירוע
          </h1>
          <p className="mb-2 text-2xl font-bold text-amber-900">
            בלי טלפונים אינסופיים ובלי אקסל
          </p>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-700">
            שולחים למוזמנים קישור אישי ב-SMS או בוואטסאפ. הם מאשרים הגעה בדף
            נחיתה, ואתם רואים בזמן אמת מי מגיע, כמה אורחים, ומי עדיין לא ענה.
          </p>
        </section>

        <section className="mb-14 grid gap-5 sm:grid-cols-3">
          <div className="rounded-3xl border border-amber-900/10 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold text-[#4a2c0f]">שליחה מהירה</h2>
            <p className="leading-relaxed text-slate-600">
              SMS וואטסאפ עם קישור אישי לכל מוזמן — כולל שם, תאריך ופרטי האירוע.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-900/10 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold text-[#4a2c0f]">דף נחיתה מעוצב</h2>
            <p className="leading-relaxed text-slate-600">
              המוזמן מאשר הגעה במספר לחיצות, כולל כמות אורחים והסעות אם צריך.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-900/10 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold text-[#4a2c0f]">מעקב חי</h2>
            <p className="leading-relaxed text-slate-600">
              טבלת מוזמנים מתעדכנת אוטומטית: מגיע, לא מגיע, ממתין, הערות.
            </p>
          </div>
        </section>

        <section className="mb-14 rounded-3xl border border-amber-900/10 bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold text-[#4a2c0f]">למי זה מתאים?</h2>
          <ul className="grid gap-3 text-slate-700 sm:grid-cols-2">
            <li>חתונות</li>
            <li>בר מצווה ובת מצווה</li>
            <li>ברית ובריתה</li>
            <li>אירועים עסקיים</li>
            <li>מפיקי אירועים ודיילות</li>
            <li>זוגות שמנהלים את רשימת המוזמנים</li>
          </ul>
        </section>

        <section className="mb-14">
          <h2 className="mb-4 text-2xl font-bold text-[#4a2c0f]">איך זה עובד?</h2>
          <ol className="space-y-4">
            <li className="rounded-2xl border border-amber-900/10 bg-white px-5 py-4 text-slate-700">
              1. מעלים רשימת מוזמנים או מוסיפים ידנית.
            </li>
            <li className="rounded-2xl border border-amber-900/10 bg-white px-5 py-4 text-slate-700">
              2. שולחים הודעת אישור הגעה ב-SMS או בוואטסאפ.
            </li>
            <li className="rounded-2xl border border-amber-900/10 bg-white px-5 py-4 text-slate-700">
              3. המוזמן נכנס לדף נחיתה ומאשר כמה מגיעים.
            </li>
            <li className="rounded-2xl border border-amber-900/10 bg-white px-5 py-4 text-slate-700">
              4. אתם עוקבים אחרי הסטטוסים וממשיכים להושבה או הסעות.
            </li>
          </ol>
        </section>

        <section className="rounded-3xl bg-[#4a2c0f] px-8 py-10 text-center text-white">
          <h2 className="mb-3 text-2xl font-bold">מוכנים לסדר את אישורי ההגעה?</h2>
          <p className="mb-6 text-amber-100">
            היכנסו למערכת EventPay והתחילו לנהל את המוזמנים במקום אחד.
          </p>
          <Link
            href="/"
            className="inline-block rounded-full bg-amber-400 px-8 py-3 font-bold text-[#4a2c0f]"
          >
            כניסה ל-EventPay
          </Link>
        </section>
      </main>

      <footer className="border-t border-amber-900/10 py-8 text-center text-sm text-slate-500">
        EventPay - אישורי הגעה וסידורי הושבה לאירועים בישראל
      </footer>
    </div>
  );
}