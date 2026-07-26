'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EventDashboard() {
  const params = useParams();
  const eventId = params.id as string;

  const [eventTitle, setEventTitle] = useState('אירוע');

  useEffect(() => {
    const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
    const current = events.find((e: any) => e.id.toString() === eventId);
    if (current) {
      setEventTitle(current.owners || current.title || 'אירוע');
    }
  }, [eventId]);

  const cards = [
    {
      title: "רשימת מוזמנים",
      description: "ניהול מוזמנים, אישורי הגעה ועריכה",
      icon: "👥",
      href: `/event/${eventId}/guests`,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "סקיצה אולם",
      description: "תכנון הושבה ומיקום שולחנות וכיסאות",
      icon: "🪑",
      href: `/event/${eventId}/seating`,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      title: "שליחת הודעות",
      description: "SMS ו-WhatsApp למוזמנים",
      icon: "💬",
      href: `/event/${eventId}/sms`,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "עריכת פרטי אירוע",
      description: "עדכון פרטים, מחירים והגדרות",
      icon: "✏️",
      href: `/event/${eventId}/settings`,
      color: "from-orange-500 to-orange-600"
    },
    {
      title: "לינק להפצה",
      description: "דף נחיתה ציבורי לאורחים נוספים",
      icon: "🔗",
      href: `/event/${eventId}/public-rsvp`,
      color: "from-teal-500 to-teal-600"
    },
    {
      title: "WhatsApp Templates",
      description: "ניהול תבניות ווטסאפ",
      icon: "📱",
      href: `/event/${eventId}/whatsapp-templates`,
      color: "from-green-500 to-green-600"
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* כותרת */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-3">{eventTitle}</h1>
          <p className="text-xl text-gray-600">ניהול האירוע</p>
        </div>

        {/* כרטיסיות */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <Link 
              key={index} 
              href={card.href}
              className="group block bg-white rounded-3xl p-8 shadow-md hover:shadow-2xl transition-all border border-gray-100 hover:border-gray-200"
            >
              <div className="flex flex-col h-full">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white text-4xl mb-6`}>
                  {card.icon}
                </div>
                
                <h3 className="text-2xl font-bold mb-3 group-hover:text-blue-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-lg flex-1">
                  {card.description}
                </p>
                
                <div className="mt-6 text-blue-600 font-medium flex items-center gap-2">
                  כניסה 
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link 
            href="/events" 
            className="text-gray-500 hover:text-gray-700 underline text-lg"
          >
            ← חזרה לכל האירועים
          </Link>
        </div>
      </div>
    </div>
  );
}