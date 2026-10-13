'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, LinkExternal01 } from '@untitledui/icons';

import { shopApi } from '@/lib/api';
import { LegalText } from '@/components/legal-text';
import { ShopLegalFooter } from '@/components/shop-legal';

/**
 * Impressum bzw. Datenschutzhinweis des Vereins, wenn er sie als Text statt
 * als Link hinterlegt hat (/<eventId>/legal/imprint|privacy).
 */
export default function ShopLegalPage() {
  const params = useParams<{ eventId: string; kind: string }>();
  const eventId = params.eventId;
  const kind = params.kind === 'privacy' ? 'privacy' : 'imprint';

  const shopQuery = useQuery({
    queryKey: ['shop', eventId],
    queryFn: () => shopApi.getShop(eventId),
    enabled: !!eventId,
    retry: false,
  });
  const legal = shopQuery.data?.data.legal;
  const text = kind === 'imprint' ? legal?.imprintText : legal?.privacyText;
  const url = kind === 'imprint' ? legal?.imprintUrl : legal?.privacyUrl;
  const title = kind === 'imprint' ? 'Impressum' : 'Datenschutzhinweis';

  return (
    <>
      <div className="shop-logo-bar">
        <Link href={`/${eventId}`} aria-label="Zurück zum Shop">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_dark.png" alt="OpenEOS" />
        </Link>
      </div>
      <main className="shop-wrap legal-page">
        <Link href={`/${eventId}`} className="checkout-back">
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Zurück zum Shop
        </Link>
        <h1 className="legal-page__title">{title}</h1>
        {legal?.organizationName && <p className="legal-page__meta">{legal.organizationName}</p>}

        {shopQuery.isLoading ? (
          <p className="legal-page__meta">…</p>
        ) : shopQuery.isError ? (
          <p>Diese Seite ist gerade nicht erreichbar.</p>
        ) : text ? (
          <LegalText text={text} />
        ) : url ? (
          <>
            <p>{legal?.organizationName || 'Der Veranstalter'} stellt diese Angaben auf einer eigenen Seite bereit.</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn--primary" style={{ display: 'inline-flex', gap: 8 }}>
              <LinkExternal01 style={{ width: 16, height: 16 }} />
              Seite öffnen
            </a>
          </>
        ) : (
          <p>
            {kind === 'imprint'
              ? 'Das Impressum des Veranstalters ist hier noch nicht hinterlegt.'
              : 'Der Datenschutzhinweis des Veranstalters ist hier noch nicht hinterlegt.'}
          </p>
        )}
        {kind === 'privacy' && legal?.contactEmail && (
          <p className="legal-page__meta" style={{ marginTop: 24 }}>
            Fragen zum Datenschutz: <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>
          </p>
        )}
      </main>
      <ShopLegalFooter legal={legal} eventId={eventId} />
    </>
  );
}
