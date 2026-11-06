import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';

import { PlatformLegalFooter } from '@/components/shop-legal';
import { fetchPlatformLegal } from '@/lib/platform-legal';

export const metadata: Metadata = {
  title: 'Shop nicht gefunden · OpenEOS Shop',
  robots: { index: false },
};

/** 404 im Shop-Design — für unbekannte Event-IDs und fehlende Dateien. */
export default async function NotFound() {
  // Zur Anfragezeit rendern: beim Bauen ist die API nicht erreichbar, die
  // Plattform-Links fehlten sonst in der statischen 404-Seite.
  await connection();
  const platform = await fetchPlatformLegal();
  return (
    <div className="not-found">
      <div className="shop-logo-bar">
        <Link href="/" aria-label="OpenEOS Shop">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_dark.png" alt="OpenEOS" />
        </Link>
      </div>
      <main className="not-found__main">
        <span className="not-found__code mono">Fehler 404</span>
        <h1 className="not-found__title">Shop nicht gefunden</h1>
        <p className="not-found__text">
          Diesen Event-Shop gibt es nicht oder er ist nicht aktiviert. Prüfe den Link oder
          scanne den QR-Code am Stand noch einmal.
        </p>
        <Link href="/" className="btn btn--ghost">
          Zur Startseite
        </Link>
      </main>
      <PlatformLegalFooter platform={platform} />
    </div>
  );
}
