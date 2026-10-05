import { headers } from 'next/headers';

/** Erlaubt nur einen nackten Hostnamen (optional mit Port) — der Wert kommt aus
    einem Request-Header und wird nur angezeigt, aber Unsinn soll nicht durch. */
const HOST_PATTERN = /^[a-z0-9.-]+(:\d{1,5})?$/i;

/**
 * Basis-URL des Shops, wie Besucher sie sehen. `SHOP_PUBLIC_URL` (Laufzeit-Env)
 * gewinnt; sonst aus den Headern des Reverse-Proxys bzw. dem Host-Header.
 */
async function resolveShopBaseUrl(): Promise<string | null> {
  const configured = process.env.SHOP_PUBLIC_URL?.trim().replace(/\/+$/, '');
  if (configured) return configured;

  const h = await headers();
  const host = (h.get('x-forwarded-host') ?? h.get('host'))?.split(',')[0]?.trim();
  if (!host || !HOST_PATTERN.test(host)) return null;
  const forwardedProto = h.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const proto =
    forwardedProto === 'http' || forwardedProto === 'https'
      ? forwardedProto
      : /^(localhost|127\.0\.0\.1)(:|$)/.test(host)
        ? 'http'
        : 'https';
  return `${proto}://${host}`;
}

export default async function HomePage() {
  const baseUrl = await resolveShopBaseUrl();

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 var(--pad)' }}>
      <div style={{ maxWidth: 640, textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo_dark.png"
          alt="OpenEOS"
          style={{ height: 44, width: 'auto', margin: '0 auto 24px', display: 'block' }}
        />
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 99,
            background: 'color-mix(in oklab, var(--green-soft) 60%, var(--paper))',
            border: '1px solid color-mix(in oklab, var(--green-ink) 22%, transparent)',
            color: 'var(--green-ink)',
            fontFamily: 'var(--f-mono)',
            fontSize: 12,
            marginBottom: 16,
          }}
        >
          OPENEOS · SHOP
        </div>
        <h1
          style={{
            fontSize: 'clamp(40px, 6vw, 80px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 0.95,
            margin: 0,
          }}
        >
          Öffne den Link deines Events
        </h1>
        <p style={{ fontSize: 16, color: 'var(--mute)', marginTop: 18 }}>
          Jeder Event-Shop hat eine eigene Adresse. Den Link dazu bekommst du vom Veranstalter —
          zum Beispiel als QR-Code vor Ort, auf einem Flyer oder per Nachricht.
        </p>
        <p style={{ fontSize: 14, color: 'var(--mute)', marginTop: 12 }}>
          Er sieht so aus:
          {/* Umbruch hoechstens vor "/<event-id>", nie mitten in Host oder Platzhalter. */}
          <span className="mono" style={{ display: 'block', color: 'var(--ink)', marginTop: 4 }}>
            <span style={{ whiteSpace: 'nowrap' }}>{baseUrl ?? '…'}</span>
            <wbr />
            <span style={{ whiteSpace: 'nowrap' }}>/&lt;event-id&gt;</span>
          </span>
        </p>
      </div>
    </div>
  );
}
