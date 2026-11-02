import type { ShopInfo } from '@/lib/api';

/**
 * Kann in diesem Shop online (mit Vorkasse) bestellt werden?
 *
 * In der Betriebsart „Nur Bons“ (`orders_only`) kassiert der Verein
 * außerhalb von OpenEOS — der Shop zeigt dann nur den Hinweis
 * „Bestellungen nur vor Ort“. Ältere APIs kennen das Feld noch nicht;
 * fehlt es, bleibt alles wie bisher (bestellbar).
 */
export function isOnlineOrderingAvailable(info: ShopInfo | null | undefined): boolean {
  if (!info) return true;
  const flag = info.shop?.onlineOrderingAvailable ?? info.onlineOrderingAvailable;
  if (flag === false) return false;
  const mode = info.shop?.operatingMode ?? info.operatingMode;
  return mode !== 'orders_only';
}
