import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { ShopApiError, shopApi, type ShopInfo } from '@/lib/api';

/** Event-IDs sind UUIDs — alles andere (favicon.ico, robots.txt, Tippfehler)
    ist keine Veranstaltung. */
const EVENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Liefert für unbekannte Veranstaltungen eine echte 404 statt einer
 * 200-Seite mit „Shop nicht gefunden“. Die Seiten darunter laden ihre
 * Daten weiterhin im Browser; hier wird nur geprüft, ob es den Shop gibt.
 *
 * Nur ein ausdrückliches „gibt es nicht“ der API führt zur 404. Ist die
 * API gerade nicht erreichbar, rendert die Seite wie bisher und zeigt
 * ihre eigene Fehlermeldung — ein Ausfall soll nicht als 404 gecacht
 * oder indexiert werden.
 */
const loadShop = cache(async (eventId: string): Promise<ShopInfo | 'missing' | null> => {
  if (!EVENT_ID_PATTERN.test(eventId)) return 'missing';
  try {
    return (await shopApi.getShop(eventId)).data;
  } catch (error) {
    const missing =
      error instanceof ShopApiError && (error.status === 404 || error.code === 'SHOP_NOT_FOUND');
    return missing ? 'missing' : null;
  }
});

/** Seitentitel mit dem Namen der Veranstaltung (WCAG 2.4.2). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const shop = await loadShop(eventId);
  if (shop === 'missing') return { title: 'Shop nicht gefunden · OpenEOS Shop' };
  if (!shop) return {};
  return { title: { default: shop.event.name, template: `%s · ${shop.event.name} · OpenEOS Shop` } };
}

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  if ((await loadShop(eventId)) === 'missing') {
    notFound();
  }
  return children;
}
