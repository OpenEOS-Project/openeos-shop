import type { Metadata } from 'next';

// Eigene Vorlage, damit auch /checkout/return einen vollständigen Titel bekommt.
export const metadata: Metadata = { title: { default: 'Kasse', template: '%s · OpenEOS Shop' } };

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
