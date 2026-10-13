import Link from 'next/link';

import type { ShopLegal } from '@/lib/api';
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
      <p className="shop-legal__platform">
        <span>Bereitgestellt mit OpenEOS</span>
        {legal?.platform.imprintUrl && (
          <>
            <span aria-hidden="true">·</span>
            <a href={legal.platform.imprintUrl} target="_blank" rel="noopener noreferrer" aria-label="Impressum von OpenEOS">
              Impressum
            </a>
          </>
        )}
        {legal?.platform.privacyUrl && (
          <>
            <span aria-hidden="true">·</span>
            <a
              href={legal.platform.privacyUrl}
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
