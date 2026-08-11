import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AccessibilityWidget from '../components/AccessibilityWidget';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.eventpay1.co.il';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'EventPay | אישורי הגעה, סידורי הושבה והזמנות דיגיטליות',
    template: '%s | EventPay',
  },
  description:
    'מערכת לניהול אירועים בישראל: אישורי הגעה ב-SMS ובוואטסאפ, סידורי הושבה, הזמנות דיגיטליות ודף נחיתה למוזמנים.',
  keywords: [
    'אישורי הגעה',
    'סידורי הושבה',
    'הזמנה דיגיטלית',
    'ניהול מוזמנים',
    'RSVP',
    'חתונה',
    'בר מצווה',
    'EventPay',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: SITE_URL,
    siteName: 'EventPay',
    title: 'EventPay | אישורי הגעה וסידורי הושבה',
    description:
      'אישורי הגעה, סידורי הושבה והזמנות דיגיטליות לאירועים בישראל.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <AccessibilityWidget />
      </body>
    </html>
  );
}