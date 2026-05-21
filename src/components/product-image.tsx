'use client';

import { PosIcon } from '@openeos/pos-icons';

interface ProductImageProps {
  imageUrl: string | null | undefined;
  productName: string;
  /** Pixel size for the icon variant; for URL images this is ignored (image fills its parent). */
  iconSize?: number;
}

export function ProductImage({ imageUrl, productName, iconSize = 96 }: ProductImageProps) {
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
        <PosIcon id={iconId} size={iconSize} alt={productName} />
      </div>
    );
  }

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={productName}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }

  return <span>{productName}</span>;
}
