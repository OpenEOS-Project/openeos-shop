/**
 * Laufzeit-Konfiguration des Shops.
 *
 * `NEXT_PUBLIC_API_URL` wird beim `next build` fest in das Bundle
 * geschrieben. Im veroeffentlichten Abbild steht damit `api.openeos.de` —
 * wer den Shop zu seiner eigenen Installation betreibt, musste das Abbild
 * bisher selbst neu bauen. Der Wert kommt deshalb zur Laufzeit aus dem
 * Next-Server (`output: 'standalone'`) und wird im Wurzel-Layout als
 * Inline-Script in die Seite geschrieben.
 *
 * Anders als im Dashboard schliesst dieser Wert das `/api`-Suffix ein —
 * so war es hier schon immer.
 */
export const RUNTIME_CONFIG_GLOBAL = '__OPENEOS_SHOP_RUNTIME_CONFIG__';

export interface RuntimeConfig {
  apiUrl: string;
}

const BUILD_TIME_FALLBACK: RuntimeConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api',
};

/** Nur serverseitig aufrufen — im Browser sind diese Variablen leer. */
export function readServerRuntimeConfig(): RuntimeConfig {
  return { apiUrl: process.env.API_URL || BUILD_TIME_FALLBACK.apiUrl };
}

function initialConfig(): RuntimeConfig {
  if (typeof window === 'undefined') return readServerRuntimeConfig();

  const injected = (window as unknown as Record<string, unknown>)[RUNTIME_CONFIG_GLOBAL];
  if (injected && typeof injected === 'object') {
    const { apiUrl } = injected as Partial<RuntimeConfig>;
    if (apiUrl) return { apiUrl };
  }
  return BUILD_TIME_FALLBACK;
}

/* Modulwert statt Context: `api.ts` ist ein gewoehnliches Modul und wird
   auch ausserhalb von React benutzt. */
const current: RuntimeConfig = initialConfig();

export function getApiBase(): string {
  return current.apiUrl.replace(/\/$/, '');
}
