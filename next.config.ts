import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // @openeos/ui liefert das Font-Modul als TypeScript-Quelle aus; die
  // next/font/local-Aufrufe darin muessen von Next selbst kompiliert werden.
  transpilePackages: ['@openeos/ui'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**.openeos.de' },
    ],
  },
};

export default nextConfig;
