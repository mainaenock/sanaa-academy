import type { MetadataRoute } from 'next';
import { runtime } from '@/lib/db';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/faq', '/policies/privacy', '/policies/terms', '/policies/refunds'].map((path) => ({
    url: runtime().APP_URL + path,
    changeFrequency: 'weekly',
    priority: path ? 0.3 : 1,
  }));
}
