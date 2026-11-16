/* Frueher eine Modul-Konstante aus NEXT_PUBLIC_API_URL, also beim Build
   festgeschrieben. Jetzt zur Laufzeit — siehe lib/runtime-config.ts. */
import { getApiBase } from '@/lib/runtime-config';

export class ShopApiError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = 'ShopApiError';
    this.status = status;
    this.code = code;
  }
}

async function parseErrorPayload(res: Response): Promise<{ code: string | null; message: string }> {
  try {
    const json = (await res.json()) as { error?: { code?: string; message?: string } };
    const code = json.error?.code ?? null;
    const message = json.error?.message ?? `Request failed: ${res.status}`;
    return { code, message };
  } catch {
    return { code: null, message: `Request failed: ${res.status}` };
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const { code, message } = await parseErrorPayload(res);
    throw new ShopApiError(message, res.status, code);
  }
  return res.json();
}

async function post<T, B = unknown>(path: string, body: B): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const { code, message } = await parseErrorPayload(res);
    throw new ShopApiError(message, res.status, code);
  }
  return res.json();
}

export interface ShopEvent {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive' | 'test';
  startDate: string | null;
  endDate: string | null;
  organizationName: string;
  /**
   * Phase der Veranstaltung (API seit 2026-11): `planned` = vor dem
   * Verkaufsfenster (Bestellungen nur mit Vorverkauf), `ended` = vorbei.
   * Fehlt bei älteren APIs.
   */
  phase?: 'inactive' | 'test' | 'planned' | 'active' | 'ended';
  /** Beginn der echten Verkäufe (ISO). */
  realSalesFrom?: string | null;
  realSalesUntil?: string | null;
}

export type ShopWeekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export interface ShopTimeWindow {
  start: string;
  end: string;
}
export type ShopOpeningHours = Partial<Record<ShopWeekday, ShopTimeWindow | null>>;

/** Ein konkretes Öffnungsfenster mit ISO-Zeitpunkten. Kann über Mitternacht laufen. */
export interface ShopWindow {
  start: string;
  end: string;
}

export interface ShopMeta {
  /** 'event': aus dem Veranstaltungszeitraum abgeleitet. 'weekly': Wochentags-Tabelle. */
  hoursMode: 'event' | 'weekly';
  /** Die tatsächlichen Öffnungsfenster — in beiden Modi gefüllt. */
  windows: ShopWindow[];
  /** Nächste Öffnung in der Zukunft, sonst null. */
  nextOpening: string | null;
  openingHours: ShopOpeningHours | null;
  serviceFee: number;
  isOpenNow: boolean;
  testMode: boolean;
  /**
   * Zustand des Shops (API seit 2026-11): `presale` = Vorverkauf läuft,
   * `not_started` = Verkauf beginnt erst mit der Veranstaltung, `ended` =
   * Veranstaltung beendet. Fehlt bei älteren APIs.
   */
  state?: 'test' | 'presale' | 'open' | 'closed' | 'not_started' | 'ended';
  presale?: {
    enabled: boolean;
    active: boolean;
    /** Vorverkauf bis (Beginn des Verkaufsfensters, ISO). */
    until: string | null;
    windows: ShopWindow[] | null;
  };
  /**
   * false in der Betriebsart „Nur Bons“: keine Online-Bestellungen, der
   * Shop zeigt nur „Bestellungen nur vor Ort“. Fehlt bei älteren APIs —
   * dann gilt true. Auswerten über `isOnlineOrderingAvailable`.
   */
  onlineOrderingAvailable?: boolean;
  operatingMode?: OperatingMode;
}

/** Betriebsart der Organisation (Nur Bons / Bargeldlos / Alle Funktionen). */
export type OperatingMode = 'orders_only' | 'cashless' | 'full';

/**
 * Impressum und Datenschutzhinweis des Vereins (er verkauft) sowie die
 * Plattform-Links von OpenEOS. Je Angabe Link oder Text; fehlt beides,
 * zeigt der Shop einen neutralen Hinweis.
 */
export interface ShopLegal {
  organizationName: string;
  imprintUrl: string | null;
  imprintText: string | null;
  privacyUrl: string | null;
  privacyText: string | null;
  contactEmail: string | null;
  complete: boolean;
  /**
   * Besteht für Bestellungen ein Widerrufsrecht? Dann zeigt der Shop die
   * Widerrufsfunktion „Vertrag widerrufen“ (§ 356a BGB). API seit 2026-11.
   */
  withdrawalRight?: boolean;
  platform: {
    imprintUrl: string | null;
    privacyUrl: string | null;
    /** Kontaktstelle nach Art. 11/12 DSA (API seit 2026-11). */
    contactEmail?: string | null;
    /** Formular „Inhalt melden“ (Art. 16 DSA); null = kein Link. */
    reportUrl?: string | null;
  };
}

/** `GET /public/shop/:eventId/withdrawal` (`data`). */
export interface WithdrawalInfo {
  event: { id: string; name: string };
  organizationName: string;
  legal: ShopLegal;
}

/** Eingangsbestätigung eines Widerrufs. */
export interface WithdrawalReceipt {
  receivedAt: string;
  reference: string;
}

export interface ShopCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  parentId: string | null;
}

export interface ProductOption {
  name: string;
  priceModifier: number;
  default?: boolean;
}

export interface ProductOptionGroup {
  name: string;
  type: 'single' | 'multiple' | 'ingredients';
  required: boolean;
  options: ProductOption[];
}

export interface ProductOptions {
  groups: ProductOptionGroup[];
}

export interface SelectedOption {
  group: string;
  option: string;
  priceModifier: number;
  excluded?: boolean;
}

export interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: string | null;
  sortOrder: number;
  options: ProductOptions | null;
  trackInventory: boolean;
  stockQuantity: number | null;
  stockUnit: string | null;
}

/** Antwort von `GET /public/shop/:eventId` (`data`). */
export interface ShopInfo {
  event: ShopEvent;
  currency: string;
  shop: ShopMeta;
  legal?: ShopLegal;
  /** Wie `shop.onlineOrderingAvailable` — falls die API es auf oberster Ebene liefert. */
  onlineOrderingAvailable?: boolean;
  operatingMode?: OperatingMode;
}

export const shopApi = {
  getShop: (eventId: string) => get<{ data: ShopInfo }>(`/public/shop/${eventId}`),

  getCategories: (eventId: string) =>
    get<{ data: ShopCategory[] }>(`/public/shop/${eventId}/categories`),

  getProducts: (eventId: string) =>
    get<{ data: ShopProduct[] }>(`/public/shop/${eventId}/products`),

  createCheckout: (
    eventId: string,
    body: {
      email: string;
      /** Required — shows up on the order for pickup. */
      customerName: { firstName: string; lastName: string };
      fulfillmentType: 'counter_pickup' | 'table_service';
      tableNumber?: string;
      items: Array<{
        productId: string;
        quantity: number;
        options?: SelectedOption[];
      }>;
    },
  ) =>
    post<{ data: { checkoutId: string; sumupCheckoutUrl: string; returnUrl: string } }>(
      `/public/shop/${eventId}/checkout`,
      body,
    ),

  /** Widerrufsfunktion (§ 356a BGB) — auch nach dem Ende der Veranstaltung. */
  getWithdrawal: (eventId: string) => get<{ data: WithdrawalInfo }>(`/public/shop/${eventId}/withdrawal`),

  submitWithdrawal: (
    eventId: string,
    body: { name: string; email: string; orderNumber: string; message?: string; website?: string; startedAt?: number },
  ) => post<{ data: WithdrawalReceipt }>(`/public/shop/${eventId}/withdrawal`, body),

  verifyCheckout: (checkoutId: string) =>
    get<{ data: { status: 'pending' | 'paid' | 'failed' | 'cancelled'; orderNumber?: string } }>(
      `/public/shop/checkout/${checkoutId}/verify`,
    ),
};
