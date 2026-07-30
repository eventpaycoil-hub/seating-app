'use client';

import Link from 'next/link';

const LINKS = [
  {
    id: '019-sms',
    title: '019 SMS – דוחות',
    description: 'כניסה לדוחות SMS',
    url: 'https://new.019sms.co.il/login?to=%2Fsms-report',
    icon: '📩',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-400',
  },
  {
    id: 'go-out',
    title: 'Go-Out Business',
    description: 'עמוד עסקי Go-Out',
    url: 'https://go-out.co/businesspage',
    icon: '🎫',
    color: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
  },
  {
    id: 'flex-vat',
    title: 'מחשבון מע״מ – Flex',
    description: 'חישוב מע״מ',
    url: 'https://www.flex.co.il/Calculators/VAT-Calculator.aspx',
    icon: '🧮',
    color: 'bg-amber-50 border-amber-200 hover:border-amber-400',
  },
];

export default function ExternalLinksPage() {
  return (
    <div className="min-h-screen bg-zinc-100 p-6 md:p-10" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">קישורים חיצוניים</h1>
            <p className="text-slate-500 mt-1 text-sm">גישה מהירה לשירותים בשימוש יומיומי · מנהל בלבד</p>
          </div>
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← חזרה
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LINKS.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block border-2 rounded-3xl p-6 transition-all shadow-sm ${link.color}`}
            >
              <div className="text-4xl mb-3">{link.icon}</div>
              <div className="text-xl font-bold text-slate-900">{link.title}</div>
              <div className="text-sm text-slate-600 mt-1">{link.description}</div>
              <div className="text-xs text-slate-400 mt-4 truncate" dir="ltr">
                {link.url}
              </div>
            </a>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-10">
          אפשר להוסיף קישורים נוספים בהמשך לפי הצורך
        </p>
      </div>
    </div>
  );
}