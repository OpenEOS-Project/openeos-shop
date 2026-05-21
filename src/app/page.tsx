export default function HomePage() {
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
          Wähle dein Event
        </h1>
        <p style={{ fontSize: 16, color: 'var(--mute)', marginTop: 18 }}>
          Du hast einen Link zum Event-Shop bekommen? Öffne ihn — er sieht aus wie
          <span className="mono" style={{ color: 'var(--ink)' }}>
            {' '}https://shop.openeos.de/&lt;event-id&gt;
          </span>
        </p>
      </div>
    </div>
  );
}
