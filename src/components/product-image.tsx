'use client';

import { PosIcon } from '@openeos/pos-icons';

interface ProductImageProps {
  imageUrl: string | null | undefined;
  productName: string;
  /** Pixel size for the icon variant; for URL images this is ignored (image fills its parent). */
  iconSize?: number;
  /** Name steht daneben als Text — Bild dann ohne Alternativtext (WCAG 1.1.1). */
  decorative?: boolean;
}

export function ProductImage({ imageUrl, productName, iconSize = 96, decorative = false }: ProductImageProps) {
  const alt = decorative ? '' : productName;
  if (imageUrl?.startsWith('pos-icon:')) {
    const iconId = imageUrl.slice('pos-icon:'.length);
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'color-mix(in oklab, var(--green-soft) 50%, var(--paper))',
        }}
      >
        <PosIcon id={iconId} size={iconSize} alt={alt} />
      </div>
    );
  }

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }

  return <span>{productName}</span>;
}
