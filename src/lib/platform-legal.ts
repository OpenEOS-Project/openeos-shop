import { readServerRuntimeConfig } from '@/lib/runtime-config';

/** Impressum und Datenschutz des Plattformbetreibers; `null` = nicht anzeigen. */
export interface PlatformLegalLinks {
  imprintUrl: string | null;
  privacyUrl: string | null;
}

interface LegalVersionsResponse {
  data?: {
    enabled?: boolean;
    platform?: Partial<PlatformLegalLinks> | null;
    documents?: Partial<Record<'imprint' | 'privacy', { url?: string }>>;
  };
}

const httpUrl = (value: unknown): string | null =>
  typeof value === 'string' && /^https?:\/\//i.test(value) ? value : null;

/**
 * Plattform-Links fuer Seiten ohne Verein (Startseite, 404). Kommen aus
 * GET /legal/versions — dieselbe Quelle wie unter den Event-Shops, damit
 * Staging auf staging.openeos.de und eigene Installationen auf ihre eigenen
 * Seiten (oder gar keine) zeigen. Aeltere APIs ohne `platform`: die
 * Website-Links der Rechtstexte. Nur serverseitig aufrufen.
 */
export async function fetchPlatformLegal(): Promise<PlatformLegalLinks> {
  const none = { imprintUrl: null, privacyUrl: null };
  try {
    const base = readServerRuntimeConfig().apiUrl.replace(/\/$/, '');
    const res = await fetch(`${base}/legal/versions`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return none;
    const { data } = (await res.json()) as LegalVersionsResponse;
    if (!data) return none;
    if (data.platform !== undefined) {
      return { imprintUrl: httpUrl(data.platform?.imprintUrl), privacyUrl: httpUrl(data.platform?.privacyUrl) };
    }
    if (!data.enabled) return none;
    return { imprintUrl: httpUrl(data.documents?.imprint?.url), privacyUrl: httpUrl(data.documents?.privacy?.url) };
  } catch {
    return none;
  }
}
