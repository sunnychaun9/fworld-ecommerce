'use client';

import * as React from 'react';

import { MediaImage } from '@/components/common/media-image';
import { cn } from '@/lib/utils';
import type { ProductImage } from '@/types/catalog';

interface GalleryProps {
  images: ProductImage[];
  name: string;
}

/** Product image gallery with a large main image and a thumbnail rail. */
function Gallery({ images, name }: GalleryProps): React.ReactElement {
  const [active, setActive] = React.useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      {images.length > 1 ? (
        <div
          className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible"
          role="tablist"
          aria-label="Product images"
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`View image ${index + 1}`}
              onClick={() => setActive(index)}
              className={cn(
                'focus-visible:ring-ring relative aspect-square w-16 shrink-0 overflow-hidden rounded-md border outline-none transition focus-visible:ring-2 lg:w-20',
                index === active ? 'border-foreground' : 'border-border hover:border-foreground/50',
              )}
            >
              <MediaImage src={image.url} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="bg-muted relative aspect-[3/4] flex-1 overflow-hidden rounded-lg">
        <MediaImage
          src={current?.url}
          alt={current?.altText ?? name}
          sizes="(min-width: 1024px) 45vw, 100vw"
          priority
        />
      </div>
    </div>
  );
}

export { Gallery };
