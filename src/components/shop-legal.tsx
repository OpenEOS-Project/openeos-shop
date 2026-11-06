import Link from 'next/link';
import { Icon } from '@openeos/ui';

import type { ShopLegal } from '@/lib/api';
import type { PlatformLegalLinks } from '@/lib/platform-legal';
import { APP_VERSION } from '@/lib/version';
import { SourceCodeLink } from '@/components/source-code-link';

type LegalKind = 'imprint' | 'privacy';

/**
 * Wohin "Impressum"/"Datenschutz" des Vereins fuehrt: seine eigene Seite
 * (Link-Variante) oder die Textseite /<eventId>/legal/<kind>.
 */
export function clubLegalTarget(
  legal: ShopLegal | null | undefined,
  kind: LegalKind,
  eventId: string,
): { href: string; external: boolean } | null {
  if (!legal) return null;
  const url = kind === 'imprint' ? legal.imprintUrl : legal.privacyUrl;
  if (url) return { href: url, external: true };
  const text = kind === 'imprint' ? legal.imprintText : legal.privacyText;
  if (text) return { href: `/${eventId}/legal/${kind}`, external: false };
  return null;
}

function ClubLink({ target, children }: { target: { href: string; external: boolean }; children: React.ReactNode }) {
  return target.external ? (
    <a href={target.href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ) : (
    <Link href={target.href}>{children}</Link>
  );
}

/**
 * Fusszeile des Shops: oben Impressum und Datenschutz des Vereins — er
 * verkauft —, darunter dezent "Bereitgestellt mit OpenEOS" mit den
 * Plattform-Links. Fehlen die Angaben des Vereins, steht dort ein neutraler
 * Hinweis statt einer leeren Stelle.
 */
export function ShopLegalFooter({
  legal,
  eventId,
  cartBar = false,
}: {
  legal: ShopLegal | null | undefined;
  eventId: string;
  /** Schwebt auf dem Handy die Warenkorb-Leiste darueber? */
  cartBar?: boolean;
}) {
  const imprint = clubLegalTarget(legal, 'imprint', eventId);
  const privacy = clubLegalTarget(legal, 'privacy', eventId);
  const organization = legal?.organizationName?.trim();
  return (
    <footer className={cartBar ? 'shop-legal shop-legal--cart-bar' : 'shop-legal'}>
      {legal && (
        <div className="shop-legal__club">
          {organization && (
            <span>
              Anbieter: <b>{organization}</b>
            </span>
          )}
          {imprint && <ClubLink target={imprint}>Impressum</ClubLink>}
          {privacy && <ClubLink target={privacy}>Datenschutz</ClubLink>}
          {legal.contactEmail && <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>}
          {(!imprint || !privacy) && (
            <span className="shop-legal__missing">
              {!imprint && !privacy
                ? 'Impressum und Datenschutzhinweis des Veranstalters sind hier noch nicht hinterlegt.'
                : !imprint
                  ? 'Das Impressum des Veranstalters ist hier noch nicht hinterlegt.'
                  : 'Der Datenschutzhinweis des Veranstalters ist hier noch nicht hinterlegt.'}
            </span>
          )}
        </div>
      )}
      <PlatformLegalLine platform={legal?.platform} />
    </footer>
  );
}

/**
 * Hinweis direkt an den Kontaktfeldern im Checkout (Art. 13 DSGVO: beim
 * Erheben sagen, wer die Daten verarbeitet und wo der Hinweis steht).
 */
export function CheckoutPrivacyHint({ legal, eventId }: { legal: ShopLegal | null | undefined; eventId: string }) {
  const organization = legal?.organizationName?.trim() || 'der Veranstalter';
  const privacy = clubLegalTarget(legal, 'privacy', eventId);
  return (
    <p className="shop-legal__form-hint">
      E-Mail und Name verarbeitet {organization}, um deine Bestellung abzuwickeln und dir die Bestätigung zu
      schicken.
      {privacy ? (
        <>
          {' '}
          Mehr dazu im <ClubLink target={privacy}>Datenschutzhinweis</ClubLink>.
        </>
      ) : (
        ' Einen Datenschutzhinweis hat der Veranstalter hier noch nicht hinterlegt.'
      )}
    </p>
  );
}

/**
 * Fehlen Impressum oder Datenschutzhinweis des Vereins, wird nicht bestellt
 * (die API lehnt den Checkout dann mit LEGAL_INFO_MISSING ab). Aeltere APIs
 * liefern `legal` nicht — dann bleibt alles wie bisher.
 */
export function isLegalInfoMissing(legal: ShopLegal | null | undefined): boolean {
  return legal?.complete === false;
}

export const LEGAL_MISSING_TITLE = 'Dieser Shop ist noch nicht freigeschaltet';

/** Welche Angaben fehlen — fuer den Hinweis statt Kasse. */
export function legalMissingMessage(legal: ShopLegal | null | undefined): string {
  const imprint = Boolean(legal?.imprintUrl || legal?.imprintText);
  const privacy = Boolean(legal?.privacyUrl || legal?.privacyText);
  const missing =
    !imprint && privacy
      ? 'Es fehlt noch das Impressum des Veranstalters.'
      : imprint && !privacy
        ? 'Es fehlt noch der Datenschutzhinweis des Veranstalters.'
        : 'Es fehlen noch Impressum und Datenschutzhinweis des Veranstalters.';
  return `${missing} Bis dahin kannst du hier nicht bestellen.`;
}

/** Neutraler Hinweis statt Bestell-/Kassen-Button, solange Angaben fehlen. */
export function LegalMissingNotice({ legal }: { legal: ShopLegal | null | undefined }) {
  return (
    <div className="shop-banner shop-banner--closed" role="status">
      <Icon name="info" width={22} height={22} style={{ flexShrink: 0, color: 'var(--mute)' }} />
      <div style={{ minWidth: 0 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--ink)' }}>{LEGAL_MISSING_TITLE}</h2>
        <p style={{ fontSize: 13, color: 'var(--mute)', margin: '4px 0 0' }}>{legalMissingMessage(legal)}</p>
      </div>
    </div>
  );
}

/**
 * Kurzer Hinweis direkt ueber "Jetzt bezahlen": bei wem bestellt wird und
 * wo der Datenschutzhinweis steht.
 */
export function CheckoutSubmitLegalNote({ legal, eventId }: { legal: ShopLegal | null | undefined; eventId: string }) {
  const organization = legal?.organizationName?.trim();
  const privacy = clubLegalTarget(legal, 'privacy', eventId);
  if (!organization && !privacy) return null;
  return (
    <p className="shop-legal__form-hint" style={{ margin: 0, textAlign: 'center' }}>
      {organization && (
        <>
          Du bestellst bei <b>{organization}</b>
          {/* "e. V." endet schon mit Punkt */}
          {organization.endsWith('.') ? ' ' : '. '}
        </>
      )}
      {privacy && (
        <>
          Wie deine Daten verarbeitet werden, steht im <ClubLink target={privacy}>Datenschutzhinweis</ClubLink>.
        </>
      )}
    </p>
  );
}

/**
 * „Bereitgestellt mit OpenEOS“ mit Impressum und Datenschutz der Plattform,
 * Version und Quellcode-Link (AGPL-3.0 § 13).
 */
export function PlatformLegalLine({ platform }: { platform: PlatformLegalLinks | null | undefined }) {
  return (
    <p className="shop-legal__platform">
      <span>Bereitgestellt mit OpenEOS</span>
      {platform?.imprintUrl && (
        <>
          <span aria-hidden="true">·</span>
          <a href={platform.imprintUrl} target="_blank" rel="noopener noreferrer" aria-label="Impressum von OpenEOS">
            Impressum
          </a>
        </>
      )}
      {platform?.privacyUrl && (
        <>
          <span aria-hidden="true">·</span>
          <a
            href={platform.privacyUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Datenschutzerklärung von OpenEOS"
          >
            Datenschutz
          </a>
        </>
      )}
      <span aria-hidden="true">·</span>
      <span className="mono">Shop v{APP_VERSION}</span>
      {/* AGPL-3.0 § 13: Quellcode-Link */}
      <span aria-hidden="true">·</span>
      <SourceCodeLink />
    </p>
  );
}

/**
 * Fusszeile fuer Seiten ohne Verein (Startseite, 404): nur die Plattform.
 */
export function PlatformLegalFooter({ platform }: { platform: PlatformLegalLinks | null | undefined }) {
  return (
    <footer className="shop-legal">
      <PlatformLegalLine platform={platform} />
    </footer>
  );
}
