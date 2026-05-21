import type { Metadata } from 'next';
import { Geist, JetBrains_Mono, Archivo_Black } from 'next/font/google';

import '@/styles/shop.css';
import { Providers } from './providers';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const archivo = Archivo_Black({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-archivo-black',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OpenEOS Shop',
  description: 'Bestelle Speisen und Getränke direkt online.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${geist.variable} ${jetbrains.variable} ${archivo.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
