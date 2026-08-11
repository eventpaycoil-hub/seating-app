import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.eventpay1.co.il';

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // כשיהיו דפי שירות ציבוריים — תוסיף כאן:
    // { url: `${base}/services/rsvp`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    // { url: `${base}/services/seating`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    // { url: `${base}/services/invites`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    // { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];
}