import Link from 'next/link';

/**
 * Kopf jeder Shop-Seite: Logo (zurück zum Shop bzw. zur Startseite) und
 * optional der Kontextstreifen der Veranstaltung. Ein einziges `<header>`,
 * damit alle Inhalte in Landmarks liegen (WCAG 1.3.1).
 */
export function ShopHeader({
  href,
  label,
  children,
}: {
  href: string;
  /** Zugänglicher Name des Logo-Links, z. B. „Zurück zum Shop“. */
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <header>
      <div className="shop-logo-bar">
        <Link href={href} aria-label={label}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_dark.png" alt="" />
        </Link>
      </div>
      {children}
    </header>
  );
}
