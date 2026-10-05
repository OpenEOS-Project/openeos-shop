import type { Metadata } from 'next';
import { openEosFonts } from '@openeos/ui/fonts';

import '@/styles/shop.css';
import { Providers } from './providers';
import { RuntimeConfigScript } from '@/components/runtime-config-script';

/* Geist, Bricolage Grotesque und JetBrains Mono aus @openeos/ui —
   lokal eingebunden (next/font/local), ohne Anfrage bei Google. Setzt
   --font-oe-sans/-display/-mono; shop.css verbindet sie mit --f-*. */

export const metadata: Metadata = {
  title: 'OpenEOS Shop',
  description: 'Bestelle Speisen und Getränke direkt online.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={openEosFonts.className}>
      <body>
        <RuntimeConfigScript />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
