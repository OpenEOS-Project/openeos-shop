'use client';

import { Icon } from '@openeos/ui';

import { getSourceUrl } from '@/lib/runtime-config';

/**
 * Link "Quellcode (AGPL-3.0)".
 *
 * AGPL-3.0 § 13: Wer den Shop (veraendert) ueber ein Netzwerk anbietet, muss
 * den Besucher:innen den Quellcode anbieten. Ziel aus SOURCE_URL (Laufzeit),
 * damit Self-Hoster mit eigenen Aenderungen auf ihr Repository zeigen.
 */
export function SourceCodeLink() {
  return (
    <a
      href={getSourceUrl()}
      target="_blank"
      rel="noopener noreferrer"
      title="OpenEOS ist freie Software unter der AGPL-3.0-or-later. Hier findest du den Quellcode."
      style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4, verticalAlign: 'middle' }}
    >
      <Icon name="code" width={12} height={12} />
      <span>Quellcode (AGPL-3.0)</span>
    </a>
  );
}
