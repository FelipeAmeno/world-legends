import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://worldlegends.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const PUBLIC_ROUTES = ['/', '/collection', '/packs', '/match', '/ranking', '/events', '/market'];

  return PUBLIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1.0 : 0.8,
  }));
}
