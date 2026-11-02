import { Icon } from '@openeos/ui';

export const ON_SITE_ONLY_TITLE = 'Bestellungen nur vor Ort';

/** Erklärsatz zum Hinweis — mit Vereinsnamen, sofern bekannt. */
export function onSiteOnlyMessage(organizationName: string | null | undefined): string {
  const organization = organizationName?.trim();
  return organization
    ? `${organization} nimmt für diese Veranstaltung keine Online-Bestellungen an. Bestell bitte direkt vor Ort.`
    : 'Für diese Veranstaltung gibt es keine Online-Bestellungen. Bestell bitte direkt vor Ort.';
}

/**
 * Hinweis für die Betriebsart „Nur Bons“: Der Verein kassiert außerhalb von
 * OpenEOS, deshalb gibt es im Shop weder Speisekarte noch Preise, Warenkorb
 * oder Kasse.
 */
export function OnSiteOnlyNotice({ organizationName }: { organizationName: string | null | undefined }) {
  return (
    <div className="shop-banner shop-banner--closed" role="status">
      <Icon name="pin" width={22} height={22} style={{ flexShrink: 0, color: 'var(--green-ink)' }} />
      <div style={{ minWidth: 0 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>{ON_SITE_ONLY_TITLE}</h2>
        <p style={{ fontSize: 13, color: 'var(--mute)', margin: '4px 0 0' }}>{onSiteOnlyMessage(organizationName)}</p>
      </div>
    </div>
  );
}
