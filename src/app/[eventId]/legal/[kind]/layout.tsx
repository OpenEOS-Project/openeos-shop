import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }): Promise<Metadata> {
  const { kind } = await params;
  return { title: kind === 'privacy' ? 'Datenschutzhinweis' : 'Impressum' };
}

export default function ShopLegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
