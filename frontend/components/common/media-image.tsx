'use client';

import { ImageOff } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';

import { cn } from '@/lib/utils';

interface MediaImageProps {
  src?: string | null;
  alt: string;
  /** Responsive `sizes` hint for the Next.js image optimiser. */
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Fills its (positioned) parent with an optimised image, degrading gracefully to
 * a neutral placeholder when the source is missing or fails to load. The parent
 * must be `relative` and define the aspect ratio.
 */
function MediaImage({ src, alt, sizes, priority, className }: MediaImageProps): React.ReactElement {
  const [failed, setFailed] = React.useState(false);

  if (!src || failed) {
    return (
      <div
        className="bg-muted absolute inset-0 flex items-center justify-center"
        role="img"
        aria-label={alt}
      >
        <ImageOff className="text-muted-foreground/40 size-6" aria-hidden="true" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? '100vw'}
      priority={priority}
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}

export { MediaImage };
