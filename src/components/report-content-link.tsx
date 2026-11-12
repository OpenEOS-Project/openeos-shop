'use client';

/** Formular-Adresse mit der aktuellen Seite als Fundstelle. */
export function reportContentHref(reportUrl: string, page: string | null): string {
  if (!page) return reportUrl;
  const separator = reportUrl.includes('?') ? '&' : '?';
  return `${reportUrl}${separator}url=${encodeURIComponent(page)}`;
}

/**
 * „Inhalt melden“ (Melde- und Abhilfeverfahren, Art. 16 DSA). Das
 * Formular liegt in der Verwaltung (`platform.reportUrl` aus der API). Die
 * Fundstelle (aktuelle Seite) kommt erst beim Anklicken dazu — so bleiben
 * Server- und Browser-HTML gleich.
 */
export function ReportContentLink({ reportUrl }: { reportUrl: string | null | undefined }) {
  if (!reportUrl || !/^https?:\/\//i.test(reportUrl)) return null;
  const withPage = (event: { currentTarget: HTMLAnchorElement }) => {
    event.currentTarget.href = reportContentHref(reportUrl, window.location.href);
  };
  return (
    <a
      href={reportUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="report-content-link"
      onPointerDown={withPage}
      onFocus={withPage}
      onClick={withPage}
      style={{ color: 'inherit' }}
    >
      Inhalt melden
    </a>
  );
}
