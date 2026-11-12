'use client';

import { useEffect, useState } from 'react';

/** Formular-Adresse mit der aktuellen Seite als Fundstelle. */
export function reportContentHref(reportUrl: string, page: string | null): string {
  if (!page) return reportUrl;
  const separator = reportUrl.includes('?') ? '&' : '?';
  return `${reportUrl}${separator}url=${encodeURIComponent(page)}`;
}

/**
 * „Inhalt melden“ (Melde- und Abhilfeverfahren, Art. 16 DSA). Das
 * Formular liegt in der Verwaltung (`platform.reportUrl` aus der API); die
 * Fundstelle kommt erst im Browser dazu, damit Server- und Browser-HTML
 * gleich bleiben.
 */
export function ReportContentLink({ reportUrl }: { reportUrl: string | null | undefined }) {
  const [page, setPage] = useState<string | null>(null);
  useEffect(() => {
    setPage(window.location.href);
  }, []);
  if (!reportUrl || !/^https?:\/\//i.test(reportUrl)) return null;
  return (
    <a
      href={reportContentHref(reportUrl, page)}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="report-content-link"
      style={{ color: 'inherit' }}
    >
      Inhalt melden
    </a>
  );
}
