'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle } from '@untitledui/icons';

import { ShopApiError, shopApi, type WithdrawalReceipt } from '@/lib/api';
import { ShopLegalFooter } from '@/components/shop-legal';

const RECEIVED = new Intl.DateTimeFormat('de-DE', {
  dateStyle: 'long',
  timeStyle: 'medium',
  timeZone: 'Europe/Berlin',
});

/**
 * Widerrufsfunktion nach § 356a BGB: „Vertrag widerrufen“ → Angaben →
 * „Widerruf bestätigen“ → sofortige Eingangsbestätigung (hier und per
 * E-Mail) mit Inhalt, Datum und Uhrzeit. Nur, wenn der Verein angegeben
 * hat, dass für seine Bestellungen ein Widerrufsrecht besteht. Bleibt
 * nach dem Ende der Veranstaltung erreichbar (Widerrufsfrist).
 */
function WithdrawalForm() {
  const params = useParams<{ eventId: string }>();
  const search = useSearchParams();
  const eventId = params.eventId;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState(search.get('order') ?? '');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<WithdrawalReceipt | null>(null);

  const info = useQuery({
    queryKey: ['withdrawal', eventId],
    queryFn: () => shopApi.getWithdrawal(eventId),
    enabled: !!eventId,
    retry: false,
  });
  const data = info.data?.data;
  const notAvailable = info.error instanceof ShopApiError && info.error.status === 404;

  const valid =
    name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && orderNumber.trim().length > 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) {
      setError('Bitte gib deinen Namen, deine E-Mail-Adresse und die Bestellnummer an.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await shopApi.submitWithdrawal(eventId, {
        name: name.trim(),
        email: email.trim(),
        orderNumber: orderNumber.trim(),
        message: message.trim() || undefined,
        website,
      });
      setReceipt(res.data);
    } catch (err) {
      setError(
        err instanceof ShopApiError && err.message
          ? err.message
          : 'Der Widerruf konnte nicht gesendet werden. Bitte versuch es noch einmal.',
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="shop-logo-bar">
        <Link href={`/${eventId}`} aria-label="Zum Shop">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_dark.png" alt="OpenEOS" />
        </Link>
      </div>
      <main className="shop-wrap legal-page withdrawal">
        <h1 className="legal-page__title">Vertrag widerrufen</h1>
        {data && (
          <p className="legal-page__meta">
            Bestellung bei {data.organizationName} · {data.event.name}
          </p>
        )}

        {info.isLoading ? (
          <p className="legal-page__meta">…</p>
        ) : notAvailable ? (
          <p>Für Bestellungen in diesem Shop ist keine Widerrufsfunktion eingerichtet.</p>
        ) : info.isError || !data ? (
          <p>Diese Seite ist gerade nicht erreichbar. Bitte versuch es später noch einmal.</p>
        ) : receipt ? (
          <div className="withdrawal__done" role="status" data-testid="withdrawal-confirmed">
            <CheckCircle aria-hidden="true" />
            <h2>Dein Widerruf ist eingegangen</h2>
            <p>
              Eingegangen am <b>{RECEIVED.format(new Date(receipt.receivedAt))} Uhr</b>. Wir haben ihn an{' '}
              {data.organizationName} weitergeleitet und dir eine Eingangsbestätigung mit dem Inhalt deines
              Widerrufs an <b>{email.trim()}</b> geschickt.
            </p>
            <dl className="withdrawal__summary">
              <dt>Bestellnummer</dt>
              <dd>{orderNumber.trim()}</dd>
              <dt>Name</dt>
              <dd>{name.trim()}</dd>
              {message.trim() && (
                <>
                  <dt>Weitere Angaben</dt>
                  <dd>{message.trim()}</dd>
                </>
              )}
              <dt>Kennung</dt>
              <dd className="mono">{receipt.reference}</dd>
            </dl>
          </div>
        ) : (
          <form onSubmit={submit} className="withdrawal__form" noValidate>
            <p>
              Hiermit widerrufst du den Vertrag über deine Bestellung bei {data.organizationName}. Gib dafür deinen
              Namen, die Bestellnummer aus deiner Bestellbestätigung und deine E-Mail-Adresse an – dorthin schicken
              wir dir sofort eine Eingangsbestätigung.
            </p>
            <label className="field">
              <span>
                Name <span style={{ color: 'var(--red)' }}>*</span>
              </span>
              <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={200} required />
            </label>
            <label className="field">
              <span>
                E-Mail-Adresse <span style={{ color: 'var(--red)' }}>*</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                maxLength={255}
                required
              />
            </label>
            <label className="field">
              <span>
                Bestellnummer <span style={{ color: 'var(--red)' }}>*</span>
              </span>
              <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} maxLength={100} required />
            </label>
            <label className="field">
              <span>Weitere Angaben (freiwillig)</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="z. B. welche Artikel du widerrufst"
              />
            </label>
            {/* Für Menschen unsichtbar; Bots füllen es meist aus. */}
            <div className="withdrawal__trap" aria-hidden="true">
              <label htmlFor="withdrawal-website">Website</label>
              <input
                id="withdrawal-website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <p className="shop-legal__form-hint">
              Deine Angaben verarbeitet {data.organizationName}, um den Widerruf zu bearbeiten.
            </p>
            {error && (
              <p className="withdrawal__error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn--primary" disabled={pending} data-testid="withdrawal-confirm">
              {pending ? 'Wird gesendet …' : 'Widerruf bestätigen'}
            </button>
          </form>
        )}
      </main>
      <ShopLegalFooter legal={data?.legal} eventId={eventId} />
    </>
  );
}

export default function WithdrawalPage() {
  return (
    <Suspense>
      <WithdrawalForm />
    </Suspense>
  );
}
