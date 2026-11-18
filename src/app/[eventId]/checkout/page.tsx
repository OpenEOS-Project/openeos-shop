'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft } from '@untitledui/icons';
import Link from 'next/link';

import { ShopHeader } from '@/components/shop-header';

import { shopApi, ShopApiError } from '@/lib/api';
import { useCartStore, useCartHydration, cartTotal, lineUnitPrice, type CartItem } from '@/stores/cart-store';
import { PaymentMethods } from '@/components/payment-methods';
import { formatPrice } from '@/lib/format';
import {
  CheckoutPrivacyHint,
  CheckoutSubmitLegalNote,
  LegalMissingNotice,
  ShopLegalFooter,
  isLegalInfoMissing,
} from '@/components/shop-legal';
import { OnSiteOnlyNotice } from '@/components/on-site-only-notice';
import { isOnlineOrderingAvailable } from '@/lib/operating-mode';

interface FriendlyError {
  title: string;
  detail: string | null;
}

function mapCheckoutError(err: unknown): FriendlyError {
  if (err instanceof ShopApiError) {
    switch (err.code) {
      case 'SUMUP_NOT_CONFIGURED':
        return {
          title: 'Online-Bezahlung ist noch nicht eingerichtet',
          detail:
            'Bitte den Veranstalter kontaktieren — die SumUp-Online-Daten sind noch nicht hinterlegt.',
        };
      case 'INVALID_EMAIL':
        return { title: 'Ungültige E-Mail-Adresse', detail: 'Bitte prüfe deine Eingabe und versuche es erneut.' };
      case 'TABLE_NUMBER_REQUIRED':
        return { title: 'Tischnummer fehlt', detail: 'Bitte gib die Tischnummer ein, an die wir liefern sollen.' };
      case 'EMPTY_CART':
        return { title: 'Dein Warenkorb ist leer', detail: 'Lege zuerst Artikel in den Warenkorb.' };
      case 'INVALID_ITEMS':
        return {
          title: 'Mindestens ein Artikel ist nicht mehr verfügbar',
          detail: 'Bitte gehe zurück und prüfe deine Auswahl.',
        };
      case 'SHOP_NOT_FOUND':
        return {
          title: 'Shop ist nicht erreichbar',
          detail: 'Der Veranstalter hat den Shop ausgeschaltet oder die Öffnungszeiten sind vorbei.',
        };
      case 'INVALID_TOTAL':
        return {
          title: 'Gesamtbetrag ungültig',
          detail: 'Bitte gehe zurück und versuche es erneut.',
        };
    }
  }
  return {
    title: 'Etwas ist schiefgelaufen',
    detail: 'Bitte versuche es in einem Augenblick erneut.',
  };
}

export default function CheckoutPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = params.eventId;

  const items = useCartStore((s) => s.items);
  const cartEventId = useCartStore((s) => s.eventId);
  const clearCart = useCartStore((s) => s.clear);
  const cartHydrated = useCartHydration();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fulfillment, setFulfillment] = useState<'counter_pickup' | 'table_service'>('counter_pickup');
  const [tableNumber, setTableNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<FriendlyError | null>(null);
  /** Erst nach dem ersten Absenden Fehler an den Feldern zeigen. */
  const [attempted, setAttempted] = useState(false);
  const tableRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  /** Die API hat mit ORDER_ONLY_MODE abgelehnt — Betriebsart wurde gerade umgestellt. */
  const [orderOnlyRejected, setOrderOnlyRejected] = useState(false);
  /** Die API hat mit LEGAL_INFO_MISSING abgelehnt — Angaben wurden gerade entfernt. */
  const [legalRejected, setLegalRejected] = useState(false);

  const shopQuery = useQuery({
    queryKey: ['shop', eventId],
    queryFn: () => shopApi.getShop(eventId),
    enabled: !!eventId,
    retry: false,
  });

  // Betriebsart „Nur Bons“: hier kann nicht bestellt werden. Statt
  // Formular steht derselbe Hinweis wie auf der Shop-Seite.
  const onSiteOnly = orderOnlyRejected || !isOnlineOrderingAvailable(shopQuery.data?.data);
  // Ohne Impressum und Datenschutzhinweis des Vereins: Hinweis statt Kasse.
  const legalMissing = legalRejected || isLegalInfoMissing(shopQuery.data?.data.legal);

  useEffect(() => {
    if (cartHydrated && items.length === 0 && !onSiteOnly) {
      router.replace(`/${eventId}`);
    }
  }, [cartHydrated, items.length, eventId, router, onSiteOnly]);

  // Den gespeicherten Warenkorb dieser Veranstaltung verwerfen.
  useEffect(() => {
    if (cartHydrated && onSiteOnly && cartEventId === eventId && items.length > 0) {
      clearCart();
    }
  }, [cartHydrated, onSiteOnly, cartEventId, eventId, items.length, clearCart]);

  useEffect(() => {
    const isOpen = shopQuery.data?.data.shop.isOpenNow;
    if (isOpen === false) {
      router.replace(`/${eventId}`);
    }
  }, [shopQuery.data, eventId, router]);

  const currency = shopQuery.data?.data.currency || 'EUR';
  const serviceFee = shopQuery.data?.data.shop.serviceFee ?? 0;
  const itemsTotal = cartTotal(items as CartItem[]);
  const total = itemsTotal + (items.length > 0 ? serviceFee : 0);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const firstNameValid = firstName.trim().length >= 2;
  const lastNameValid = lastName.trim().length >= 2;
  const tableValid = fulfillment !== 'table_service' || tableNumber.trim().length > 0;
  const formValid = emailValid && firstNameValid && lastNameValid && tableValid;

  /* Fehler je Feld — als Text am Feld, per aria-describedby verknüpft
     (WCAG 3.3.1, 3.3.3). Der Button bleibt bedienbar, damit niemand vor
     einem ausgegrauten Button ohne Erklärung steht. */
  const fieldErrors = {
    table: !tableValid ? 'Bitte gib deine Tischnummer ein.' : null,
    email: !email.trim()
      ? 'Bitte gib deine E-Mail-Adresse ein.'
      : !emailValid
        ? 'Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@beispiel.de.'
        : null,
    firstName: !firstNameValid ? 'Bitte gib deinen Vornamen ein (mindestens 2 Zeichen).' : null,
    lastName: !lastNameValid ? 'Bitte gib deinen Nachnamen ein (mindestens 2 Zeichen).' : null,
  };
  const showError = (key: keyof typeof fieldErrors) => (attempted ? fieldErrors[key] : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || items.length === 0) return;
    if (!formValid) {
      setAttempted(true);
      const firstInvalid = !tableValid
        ? tableRef.current
        : !emailValid
          ? emailRef.current
          : !firstNameValid
            ? firstNameRef.current
            : lastNameRef.current;
      firstInvalid?.focus();
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response = await shopApi.createCheckout(eventId, {
        email: email.trim(),
        customerName: { firstName: firstName.trim(), lastName: lastName.trim() },
        fulfillmentType: fulfillment,
        tableNumber: fulfillment === 'table_service' ? tableNumber.trim() : undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          options: i.options && i.options.length > 0 ? i.options : undefined,
        })),
      });
      const url = response.data.sumupCheckoutUrl;
      // Cart is intentionally NOT cleared here — only clear on confirmed payment.
      window.location.href = url;
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ShopApiError && err.code === 'LEGAL_INFO_MISSING') {
        setLegalRejected(true);
        void queryClient.invalidateQueries({ queryKey: ['shop', eventId] });
        return;
      }
      if (err instanceof ShopApiError && err.code === 'ORDER_ONLY_MODE') {
        setOrderOnlyRejected(true);
        // Die Shop-Seite soll den neuen Stand gleich zeigen.
        void queryClient.invalidateQueries({ queryKey: ['shop', eventId] });
        return;
      }
      setError(mapCheckoutError(err));
      // Meldung vorlesen lassen und den Fokus dorthin setzen.
      window.setTimeout(() => errorRef.current?.focus(), 0);
    }
  };

  if (onSiteOnly || legalMissing) {
    const organizationName =
      shopQuery.data?.data.event.organizationName ?? shopQuery.data?.data.legal?.organizationName;
    return (
      <>
        <ShopHeader href={`/${eventId}`} label="Zurück zum Shop" />
        <main id="main" tabIndex={-1} className="shop-wrap" style={{ paddingTop: 24, paddingBottom: 80 }}>
          <Link href={`/${eventId}`} className="checkout-back">
            <ArrowLeft aria-hidden="true" style={{ width: 16, height: 16 }} />
            Zurück zur Veranstaltung
          </Link>
          <div style={{ marginTop: 16 }}>
            {onSiteOnly ? (
              <OnSiteOnlyNotice organizationName={organizationName} />
            ) : (
              <LegalMissingNotice legal={shopQuery.data?.data.legal} />
            )}
          </div>
        </main>
        <ShopLegalFooter legal={shopQuery.data?.data.legal} eventId={eventId} />
      </>
    );
  }

  return (
    <>
      <ShopHeader href={`/${eventId}`} label="Zurück zum Shop" />
    <main id="main" tabIndex={-1} className="shop-wrap" style={{ paddingTop: 24, paddingBottom: 80 }}>
      <Link href={`/${eventId}`} className="checkout-back">
        <ArrowLeft aria-hidden="true" style={{ width: 16, height: 16 }} />
        Zurück zur Produktauswahl
      </Link>
      <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-0.02em', margin: '12px 0 0' }}>
        Kasse
      </h1>
      <p style={{ color: 'var(--mute)', marginTop: 8 }}>
        Pflichtfelder sind mit <span aria-hidden="true">*</span> markiert: E-Mail, Vor- und Nachname — bei „An den Tisch“ auch die
        Tischnummer. An deine E-Mail schicken wir die Bestellbestätigung, dein Name steht für die
        Ausgabe auf der Bestellung.
      </p>

      <div className="checkout-layout">
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-busy={submitting}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          <section
            style={{
              padding: 20,
              borderRadius: 14,
              background: 'var(--paper-2)',
              border: '1px solid color-mix(in oklab, var(--ink) 8%, transparent)',
            }}
          >
            <fieldset className="checkout-fieldset">
            <legend>Wie möchtest du deine Bestellung erhalten?</legend>
            <div className="checkout-fulfillment">
              <label className={`checkout-fulfillment__opt${fulfillment === 'counter_pickup' ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="fulfillment"
                  value="counter_pickup"
                  checked={fulfillment === 'counter_pickup'}
                  onChange={() => setFulfillment('counter_pickup')}
                  aria-describedby="fulfillment-pickup-sub"
                />
                <div>
                  <div className="checkout-fulfillment__title">Abholung (To Go)</div>
                  <div className="checkout-fulfillment__sub" id="fulfillment-pickup-sub">
                    Du holst deine Bestellung an der Abholstation ab.
                  </div>
                </div>
              </label>
              <label className={`checkout-fulfillment__opt${fulfillment === 'table_service' ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="fulfillment"
                  value="table_service"
                  checked={fulfillment === 'table_service'}
                  onChange={() => setFulfillment('table_service')}
                  aria-describedby="fulfillment-table-sub"
                />
                <div>
                  <div className="checkout-fulfillment__title">An den Tisch</div>
                  <div className="checkout-fulfillment__sub" id="fulfillment-table-sub">
                    Wir bringen die Bestellung direkt an deinen Tisch.
                  </div>
                </div>
              </label>
            </div>
            </fieldset>
            {fulfillment === 'table_service' && (
              <div className="field" style={{ marginTop: 14 }}>
                <label htmlFor="checkout-table">
                  <span>
                    Tischnummer <span className="field__req" aria-hidden="true">*</span>
                  </span>
                </label>
                <input
                  id="checkout-table"
                  ref={tableRef}
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  maxLength={50}
                  aria-invalid={showError('table') ? true : undefined}
                  aria-describedby={showError('table') ? 'checkout-table-error' : 'checkout-table-hint'}
                />
                {showError('table') ? (
                  <FieldError id="checkout-table-error">{fieldErrors.table}</FieldError>
                ) : (
                  <p className="field__hint" id="checkout-table-hint">
                    Die Nummer steht auf dem Schild an deinem Tisch, z. B. 12.
                  </p>
                )}
              </div>
            )}
          </section>

          <section
            style={{
              padding: 20,
              borderRadius: 14,
              background: 'var(--paper-2)',
              border: '1px solid color-mix(in oklab, var(--ink) 8%, transparent)',
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>Kontakt</h2>
            <div className="field">
              <label htmlFor="checkout-email">
                <span>
                  E-Mail <span className="field__req" aria-hidden="true">*</span>
                </span>
              </label>
              <input
                id="checkout-email"
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-invalid={showError('email') ? true : undefined}
                aria-describedby={showError('email') ? 'checkout-email-error' : undefined}
              />
              {showError('email') && <FieldError id="checkout-email-error">{fieldErrors.email}</FieldError>}
            </div>
            {/* Art. 13 DSGVO: direkt beim Erheben sagen, wer die Daten
                verarbeitet und wo der Datenschutzhinweis steht. */}
            <CheckoutPrivacyHint legal={shopQuery.data?.data.legal} eventId={eventId} />
          </section>

          <section
            style={{
              padding: 20,
              borderRadius: 14,
              background: 'var(--paper-2)',
              border: '1px solid color-mix(in oklab, var(--ink) 8%, transparent)',
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Dein Name</h2>
            <p id="checkout-name-hint" style={{ fontSize: 12, color: 'var(--mute)', margin: '0 0 14px' }}>
              Steht auf deiner Bestellung — so finden wir dich bei der Ausgabe.
            </p>
            <div className="checkout-row checkout-row--name">
              <div className="field">
                <label htmlFor="checkout-first-name">
                  <span>
                    Vorname <span className="field__req" aria-hidden="true">*</span>
                  </span>
                </label>
                <input
                  id="checkout-first-name"
                  ref={firstNameRef}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  required
                  aria-invalid={showError('firstName') ? true : undefined}
                  aria-describedby={showError('firstName') ? 'checkout-first-name-error' : 'checkout-name-hint'}
                />
                {showError('firstName') && (
                  <FieldError id="checkout-first-name-error">{fieldErrors.firstName}</FieldError>
                )}
              </div>
              <div className="field">
                <label htmlFor="checkout-last-name">
                  <span>
                    Nachname <span className="field__req" aria-hidden="true">*</span>
                  </span>
                </label>
                <input
                  id="checkout-last-name"
                  ref={lastNameRef}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  required
                  aria-invalid={showError('lastName') ? true : undefined}
                  aria-describedby={showError('lastName') ? 'checkout-last-name-error' : 'checkout-name-hint'}
                />
                {showError('lastName') && (
                  <FieldError id="checkout-last-name-error">{fieldErrors.lastName}</FieldError>
                )}
              </div>
            </div>
          </section>

          {error && (
            <div
              role="alert"
              ref={errorRef}
              tabIndex={-1}
              style={{
                display: 'flex',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 12,
                background: 'color-mix(in oklab, var(--red) 8%, var(--paper))',
                color: 'var(--ink)',
                border: '1px solid color-mix(in oklab, var(--red) 30%, transparent)',
              }}
            >
              <AlertCircle aria-hidden="true" style={{ width: 20, height: 20, color: 'var(--red-ink)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red-ink)' }}>{error.title}</div>
                {error.detail && (
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>{error.detail}</div>
                )}
              </div>
            </div>
          )}

          <PaymentMethods />

          <CheckoutSubmitLegalNote legal={shopQuery.data?.data.legal} eventId={eventId} />

          {/* § 312j Abs. 3 BGB: Der Button, mit dem die Bestellung abgeschickt
              wird, heißt „zahlungspflichtig bestellen“ — auch während des Sendens. */}
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || items.length === 0}
            aria-describedby={attempted && !formValid ? 'checkout-form-errors' : undefined}
            style={{ padding: '14px 22px', fontSize: 15 }}
            data-testid="checkout-submit"
          >
            {submitting ? 'Zahlungspflichtig bestellen …' : 'Zahlungspflichtig bestellen'}
          </button>
          {attempted && !formValid && (
            <p id="checkout-form-errors" className="field__error" style={{ justifyContent: 'center' }}>
              Bitte prüfe die markierten Felder.
            </p>
          )}
          <p className="sr-only" role="status" aria-live="polite">
            {submitting ? 'Bestellung wird übermittelt. Du wirst gleich zur Bezahlung bei SumUp weitergeleitet.' : ''}
          </p>
        </form>

        <aside className="checkout-summary">
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>Deine Bestellung</h2>
          <div
            style={{
              fontSize: 12,
              color: 'var(--mute)',
              padding: '8px 10px',
              marginBottom: 12,
              borderRadius: 8,
              background: 'var(--paper)',
              border: '1px solid color-mix(in oklab, var(--ink) 8%, transparent)',
            }}
          >
            {fulfillment === 'table_service'
              ? `An den Tisch${tableNumber.trim() ? ` ${tableNumber.trim()}` : ''}`
              : 'Abholung (To Go)'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((i) => (
              <div
                key={i.signature ?? i.productId}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}
              >
                <div style={{ minWidth: 0 }}>
                  <span style={{ color: 'var(--ink-2)' }}>
                    {i.quantity} × {i.name}
                  </span>
                  {i.options && i.options.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 1 }}>
                      {i.options
                        .map((o) => (o.excluded ? `ohne ${o.option}` : `+ ${o.option}`))
                        .join(' · ')}
                    </div>
                  )}
                </div>
                <span className="mono">{formatPrice(lineUnitPrice(i) * i.quantity, currency)}</span>
              </div>
            ))}
          </div>
          {serviceFee > 0 && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid color-mix(in oklab, var(--ink) 8%, transparent)',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 13,
                color: 'var(--ink-2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Zwischensumme</span>
                <span className="mono">{formatPrice(itemsTotal, currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Servicegebühr</span>
                <span className="mono">{formatPrice(serviceFee, currency)}</span>
              </div>
            </div>
          )}
          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: '1px solid color-mix(in oklab, var(--ink) 10%, transparent)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Gesamt
            </span>
            <span className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
              {formatPrice(total, currency)}
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--mute)', marginTop: 12 }}>
            Bezahlung erfolgt sicher über SumUp. Erst nach erfolgreicher Zahlung wird die Bestellung erstellt.
          </p>
        </aside>
      </div>
    </main>
    <ShopLegalFooter legal={shopQuery.data?.data.legal} eventId={eventId} />
    </>
  );
}

/** Fehlermeldung unter einem Feld, per aria-describedby verknüpft. */
function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p className="field__error" id={id}>
      <AlertCircle aria-hidden="true" style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </p>
  );
}
