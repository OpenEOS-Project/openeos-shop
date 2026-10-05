import { notFound } from 'next/navigation';

import { ShopApiError, shopApi } from '@/lib/api';

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
async function shopIsMissing(eventId: string): Promise<boolean> {
  try {
    await shopApi.getShop(eventId);
    return false;
  } catch (error) {
    return (
      error instanceof ShopApiError &&
      (error.status === 404 || error.code === 'SHOP_NOT_FOUND')
    );
  }
}

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  if (!EVENT_ID_PATTERN.test(eventId) || (await shopIsMissing(eventId))) {
    notFound();
  }
  return children;
}
