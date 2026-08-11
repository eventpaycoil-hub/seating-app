import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/event/',
        '/events',
        '/admin/',
      ],
    },
    sitemap: 'https://www.eventpay1.co.il/sitemap.xml',
  };
}