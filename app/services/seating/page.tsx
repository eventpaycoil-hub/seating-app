import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'סידורי הושבה לאירוע | סקיצת אולם ושולחנות',
  description:
    'סידורי הושבה דיגיטליים לאירועים: סקיצת אולם, שולחנות, הושבת מוזמנים, מעקב הגעה בזמן אמת והדפסה. מתאים לחתונות ובר מצווה.',
  alternates: {
    canonical: '/services/seating',
  },
};

export default function SeatingServicePage() {
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
            סידורי הושבה לאירוע
          </h1>
          <p className="mb-2 text-2xl font-bold text-amber-900">
            סקיצת אולם, שולחנות והושבה במקום אחד
          </p>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-700">
            בונים את מפת האולם, משייכים מוזמנים לשולחנות, וביום האירוע רואים
            מי הגיע ומי עדיין בדרך — בלי ניירת ובלי בלבול.
          </p>
        </section>

        <section className="mb-14 grid gap-5 sm:grid-cols-3">
          <div className="rounded-3xl border border-amber-900/10 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold text-[#4a2c0f]">סקיצת אולם</h2>
            <p className="leading-relaxed text-slate-600">
              סידור שולחנות עגולים, מלבניים ומקומות מיוחדים על גבי מפת האולם.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-900/10 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold text-[#4a2c0f]">הושבת מוזמנים</h2>
            <p className="leading-relaxed text-slate-600">
              שיוך לפי קבוצות, משפחות והעדפות — עם עדכון מהיר כשמישהו משנה הגעה.
            </p>
          </div>
          <div className="rounded-3xl border border-amber-900/10 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold text-[#4a2c0f]">יום האירוע</h2>
            <p className="leading-relaxed text-slate-600">
              מסך הגעה והושבה חיה: כמה הושבו, כמה הגיעו, ואיפה יש מקום פנוי.
            </p>
          </div>
        </section>

        <section className="mb-14 rounded-3xl border border-amber-900/10 bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold text-[#4a2c0f]">למי זה מתאים?</h2>
          <ul className="grid gap-3 text-slate-700 sm:grid-cols-2">
            <li>חתונות באולמות ובגנים</li>
            <li>בר מצווה ובת מצווה</li>
            <li>אירועים עם עשרות עד מאות מוזמנים</li>
            <li>מפיקים ודיילות שצריכים סדר ביום האירוע</li>
            <li>זוגות שרוצים לשלוט בהושבה מראש</li>
            <li>מי שכבר מנהל אישורי הגעה ב-EventPay</li>
          </ul>
        </section>

        <section className="mb-14">
          <h2 className="mb-4 text-2xl font-bold text-[#4a2c0f]">איך זה עובד?</h2>
          <ol className="space-y-4">
            <li className="rounded-2xl border border-amber-900/10 bg-white px-5 py-4 text-slate-700">
              1. בונים סקיצה של האולם ומוסיפים שולחנות.
            </li>
            <li className="rounded-2xl border border-amber-900/10 bg-white px-5 py-4 text-slate-700">
              2. משייכים מוזמנים לשולחנות לפי הרשימה.
            </li>
            <li className="rounded-2xl border border-amber-900/10 bg-white px-5 py-4 text-slate-700">
              3. מעדכנים אוטומטית כשיש שינוי באישור הגעה.
            </li>
            <li className="rounded-2xl border border-amber-900/10 bg-white px-5 py-4 text-slate-700">
              4. ביום האירוע עוקבים אחרי הגעה והושבה במסך חי.
            </li>
          </ol>
        </section>

        <section className="mb-10 rounded-3xl border border-amber-900/10 bg-white p-6 text-center">
          <p className="text-slate-700">
            כבר יש לכם אישורי הגעה?{' '}
            <Link href="/services/rsvp" className="font-bold text-amber-900 underline">
              למעבר לדף אישורי הגעה
            </Link>
          </p>
        </section>

        <section className="rounded-3xl bg-[#4a2c0f] px-8 py-10 text-center text-white">
          <h2 className="mb-3 text-2xl font-bold">מוכנים לסדר את ההושבה?</h2>
          <p className="mb-6 text-amber-100">
            היכנסו ל-EventPay ובנו את סקיצת האולם בתוך דקות.
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