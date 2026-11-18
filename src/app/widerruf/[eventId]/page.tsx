'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle } from '@untitledui/icons';

import { ShopApiError, shopApi, type WithdrawalReceipt } from '@/lib/api';
import { ShopLegalFooter } from '@/components/shop-legal';
import { ShopHeader } from '@/components/shop-header';

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
  const [attempted, setAttempted] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const orderRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  // Nach dem Absenden verschwindet das Formular: Fokus auf die Bestätigung.
  useEffect(() => {
    if (receipt) doneRef.current?.focus();
  }, [receipt]);

  const info = useQuery({
    queryKey: ['withdrawal', eventId],
    queryFn: () => shopApi.getWithdrawal(eventId),
    enabled: !!eventId,
    retry: false,
  });
  const data = info.data?.data;
  const notAvailable = info.error instanceof ShopApiError && info.error.status === 404;

  const fieldErrors = {
    name: name.trim().length < 2 ? 'Bitte gib deinen Namen ein (mindestens 2 Zeichen).' : null,
    email: !email.trim()
      ? 'Bitte gib deine E-Mail-Adresse ein.'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ? 'Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@beispiel.de.'
        : null,
    orderNumber: !orderNumber.trim() ? 'Bitte gib die Bestellnummer aus deiner Bestellbestätigung ein.' : null,
  };
  const valid = !fieldErrors.name && !fieldErrors.email && !fieldErrors.orderNumber;
  const showError = (key: keyof typeof fieldErrors) => (attempted ? fieldErrors[key] : null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) {
      setAttempted(true);
      setError(null);
      (fieldErrors.name ? nameRef : fieldErrors.email ? emailRef : orderRef).current?.focus();
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
      <ShopHeader href={`/${eventId}`} label="Zum Shop" />
      <main id="main" tabIndex={-1} className="shop-wrap legal-page withdrawal">
        <h1 className="legal-page__title">Vertrag widerrufen</h1>
        {data && (
          <p className="legal-page__meta">
            Bestellung bei {data.organizationName} · {data.event.name}
          </p>
        )}

        {info.isLoading ? (
          <p className="legal-page__meta" role="status">Wird geladen …</p>
        ) : notAvailable ? (
          <p>Für Bestellungen in diesem Shop ist keine Widerrufsfunktion eingerichtet.</p>
        ) : info.isError || !data ? (
          <p>Diese Seite ist gerade nicht erreichbar. Bitte versuch es später noch einmal.</p>
        ) : receipt ? (
          <div className="withdrawal__done" role="status" data-testid="withdrawal-confirmed">
            <CheckCircle aria-hidden="true" />
            <h2 ref={doneRef} tabIndex={-1}>
              Dein Widerruf ist eingegangen
            </h2>
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
            <p className="field__hint">
              Pflichtfelder sind mit <span aria-hidden="true">*</span> markiert.
            </p>
            <div className="field">
              <label htmlFor="withdrawal-name">
                <span>
                  Name <span className="field__req" aria-hidden="true">*</span>
                </span>
              </label>
              <input
                id="withdrawal-name"
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={200}
                required
                aria-invalid={showError('name') ? true : undefined}
                aria-describedby={showError('name') ? 'withdrawal-name-error' : undefined}
              />
              {showError('name') && <FieldError id="withdrawal-name-error">{fieldErrors.name}</FieldError>}
            </div>
            <div className="field">
              <label htmlFor="withdrawal-email">
                <span>
                  E-Mail-Adresse <span className="field__req" aria-hidden="true">*</span>
                </span>
              </label>
              <input
                id="withdrawal-email"
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                maxLength={255}
                required
                aria-invalid={showError('email') ? true : undefined}
                aria-describedby={showError('email') ? 'withdrawal-email-error' : undefined}
              />
              {showError('email') && <FieldError id="withdrawal-email-error">{fieldErrors.email}</FieldError>}
            </div>
            <div className="field">
              <label htmlFor="withdrawal-order">
                <span>
                  Bestellnummer <span className="field__req" aria-hidden="true">*</span>
                </span>
              </label>
              <input
                id="withdrawal-order"
                ref={orderRef}
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                maxLength={100}
                required
                aria-invalid={showError('orderNumber') ? true : undefined}
                aria-describedby={showError('orderNumber') ? 'withdrawal-order-error' : 'withdrawal-order-hint'}
              />
              {showError('orderNumber') ? (
                <FieldError id="withdrawal-order-error">{fieldErrors.orderNumber}</FieldError>
              ) : (
                <p className="field__hint" id="withdrawal-order-hint">
                  Steht in deiner Bestellbestätigung per E-Mail.
                </p>
              )}
            </div>
            <div className="field">
              <label htmlFor="withdrawal-message">
                <span>Weitere Angaben (freiwillig)</span>
              </label>
              <textarea
                id="withdrawal-message"
                aria-describedby="withdrawal-message-hint"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={2000}
              />
              <p className="field__hint" id="withdrawal-message-hint">
                z. B. welche Artikel du widerrufst
              </p>
            </div>
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
            {attempted && !valid && (
              <p className="field__error" role="alert">
                Bitte prüfe die markierten Felder.
              </p>
            )}
            {/* § 356a BGB: Bestätigungsschaltfläche „Widerruf bestätigen“. */}
            <button
              type="submit"
              className="btn btn--primary"
              disabled={pending}
              aria-busy={pending}
              data-testid="withdrawal-confirm"
            >
              {pending ? 'Widerruf wird gesendet …' : 'Widerruf bestätigen'}
            </button>
          </form>
        )}
      </main>
      <ShopLegalFooter legal={data?.legal} eventId={eventId} />
    </>
  );
}

/** Fehlermeldung unter einem Feld, per aria-describedby verknüpft. */
function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p className="field__error" id={id}>
      {children}
    </p>
  );
}

export default function WithdrawalPage() {
  return (
    <Suspense>
      <WithdrawalForm />
    </Suspense>
  );
}
