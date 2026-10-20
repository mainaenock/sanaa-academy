import type { MetadataRoute } from 'next';
import { runtime } from '@/lib/db';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/portal', '/login', '/register', '/payment', '/unsubscribe', '/api/'],
    },
    sitemap: runtime().APP_URL + '/sitemap.xml',
  };
}
