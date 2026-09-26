import { RUNTIME_CONFIG_GLOBAL, readServerRuntimeConfig } from '@/lib/runtime-config';

/**
 * Schreibt die Laufzeit-Konfiguration als Inline-Script in die Seite.
 *
 * Muss vor allem anderen im Body stehen: Inline-Scripts laufen waehrend des
 * Parsens, die Bundles von Next sind `defer`-t.
 */
export function RuntimeConfigScript() {
  const config = readServerRuntimeConfig();
  // `<` maskiert, damit ein "</script>" in einer URL das Element nicht
  // vorzeitig beendet.
  const serialized = JSON.stringify(config).replace(/</g, '\\u003c');

  return (
    <script
      dangerouslySetInnerHTML={{ __html: `window.${RUNTIME_CONFIG_GLOBAL}=${serialized};` }}
    />
  );
}
