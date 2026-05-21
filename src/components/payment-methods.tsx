import { Lock01 } from '@untitledui/icons';

const badgeBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 24,
  minWidth: 38,
  padding: '0 8px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0.5,
  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  border: '1px solid color-mix(in oklab, var(--ink) 8%, transparent)',
  background: '#fff',
  boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
};

function Visa() {
  return (
    <span aria-label="Visa" style={{ ...badgeBase, background: '#1A1F71', color: '#fff', fontStyle: 'italic' }}>
      VISA
    </span>
  );
}

function Mastercard() {
  return (
    <span aria-label="Mastercard" style={{ ...badgeBase, gap: 0, padding: '0 6px' }}>
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: '#EB001B',
          display: 'inline-block',
          marginRight: -5,
        }}
      />
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: '#F79E1B',
          display: 'inline-block',
          mixBlendMode: 'multiply',
        }}
      />
    </span>
  );
}

function Amex() {
  return (
    <span aria-label="American Express" style={{ ...badgeBase, background: '#1F72CD', color: '#fff' }}>
      AMEX
    </span>
  );
}

function Maestro() {
  return (
    <span aria-label="Maestro" style={{ ...badgeBase, gap: 0, padding: '0 6px' }}>
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: '#0099DF',
          display: 'inline-block',
          marginRight: -5,
        }}
      />
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: '#ED1C2E',
          display: 'inline-block',
          mixBlendMode: 'multiply',
        }}
      />
    </span>
  );
}

function ApplePay() {
  return (
    <span aria-label="Apple Pay" style={{ ...badgeBase, background: '#000', color: '#fff', gap: 3 }}>
      <svg viewBox="0 0 170 170" width="11" height="11" aria-hidden="true">
        <path
          fill="currentColor"
          d="M150.37 130.25a85 85 0 0 1-8.41 15.13c-4.42 6.31-8.04 10.68-10.83 13.1-4.33 4-9 6.07-13.99 6.18-3.58 0-7.9-1.02-12.92-3.08-5.04-2.05-9.67-3.07-13.9-3.07-4.43 0-9.19 1.02-14.29 3.07-5.11 2.06-9.23 3.13-12.39 3.24-4.78.2-9.55-1.92-14.31-6.34-3.02-2.63-6.8-7.16-11.31-13.59-4.85-6.87-8.84-14.83-11.96-23.9-3.34-9.79-5.01-19.27-5.01-28.45 0-10.51 2.27-19.58 6.83-27.18A40.02 40.02 0 0 1 36.95 40.5a36.36 36.36 0 0 1 16.27-6.59c4.05 0 9.34 1.25 15.91 3.71 6.55 2.47 10.76 3.72 12.6 3.72 1.38 0 6.06-1.46 14.01-4.37 7.51-2.7 13.85-3.82 19.05-3.38 14.09 1.14 24.67 6.69 31.71 16.69-12.6 7.63-18.83 18.32-18.71 32.04.11 10.68 3.98 19.57 11.59 26.65 3.45 3.27 7.31 5.81 11.59 7.61-.93 2.69-1.91 5.27-2.95 7.74zM119.11 7.24c0 7.85-2.87 15.18-8.58 21.97-6.89 8.07-15.23 12.72-24.28 11.99a24.42 24.42 0 0 1-.18-2.97c0-7.54 3.28-15.6 9.11-22.21 2.91-3.35 6.61-6.13 11.09-8.35 4.47-2.18 8.7-3.39 12.68-3.6.12 1.06.17 2.12.17 3.17z"
        />
      </svg>
      Pay
    </span>
  );
}

function GooglePay() {
  return (
    <span aria-label="Google Pay" style={{ ...badgeBase, background: '#fff', color: '#3C4043', gap: 3 }}>
      <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true">
        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Z" fill="#fff" />
        <path d="M8.16 7.13v1.83h2.55c-.1.6-.42 1.1-.89 1.43v1.18h1.44c.84-.77 1.32-1.91 1.32-3.26 0-.32-.03-.62-.08-.92H8.16Z" fill="#4285F4" />
        <path d="M8.16 12.48c1.2 0 2.21-.4 2.95-1.08l-1.44-1.12c-.4.27-.92.43-1.5.43-1.16 0-2.14-.78-2.49-1.83H4.18v1.15A4.32 4.32 0 0 0 8.16 12.48Z" fill="#34A853" />
        <path d="M5.67 8.88a2.6 2.6 0 0 1 0-1.65V6.08H4.18a4.33 4.33 0 0 0 0 3.95l1.49-1.15Z" fill="#FBBC04" />
        <path d="M8.16 5.4c.65 0 1.24.23 1.7.66l1.27-1.27a4.18 4.18 0 0 0-2.97-1.16 4.32 4.32 0 0 0-3.98 2.45l1.49 1.15c.35-1.05 1.33-1.83 2.49-1.83Z" fill="#EA4335" />
      </svg>
      Pay
    </span>
  );
}

export function PaymentMethods() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '14px 16px',
        borderRadius: 12,
        background: 'var(--paper)',
        border: '1px solid color-mix(in oklab, var(--ink) 8%, transparent)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>
        <Lock01 style={{ width: 14, height: 14 }} />
        Sichere Zahlung über SumUp
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Visa />
        <Mastercard />
        <Maestro />
        <Amex />
        <ApplePay />
        <GooglePay />
      </div>
    </div>
  );
}
