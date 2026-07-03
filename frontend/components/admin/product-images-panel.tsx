'use client';

import { Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { MediaImage } from '@/components/common/media-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useImageMutations, useProductImages } from '@/features/admin/use-admin-products';
import { ApiError } from '@/services/api';

function onError(error: unknown): void {
  toast.error(error instanceof ApiError ? error.message : 'Something went wrong.');
}

/** Manage a product's images by URL (add/remove). */
function ProductImagesPanel({ productId }: { productId: string }): React.ReactElement {
  const { data, isPending } = useProductImages(productId);
  const { create, remove } = useImageMutations(productId);
  const [url, setUrl] = React.useState('');
  const [altText, setAltText] = React.useState('');

  function add(): void {
    if (!url.trim()) {
      toast.error('Enter an image URL.');
      return;
    }
    create.mutate(
      {
        productId,
        url: url.trim(),
        ...(altText.trim() ? { altText: altText.trim() } : {}),
        sortOrder: data?.length ?? 0,
      },
      {
        onSuccess: () => {
          toast.success('Image added');
          setUrl('');
          setAltText('');
        },
        onError,
      },
    );
  }

  return (
    <div className="space-y-4">
      {isPending ? (
        <Skeleton className="h-28 w-full rounded-lg" />
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {data.map((image) => (
            <div key={image.id} className="group relative">
              <div className="bg-muted relative aspect-square overflow-hidden rounded-md">
                <MediaImage src={image.url} alt={image.altText ?? 'Product image'} sizes="150px" />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="Remove image"
                className="absolute right-1.5 top-1.5 size-7"
                disabled={remove.isPending}
                onClick={() => remove.mutate(image.id, { onError })}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No images yet.</p>
      )}

      <div className="border-border grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1fr_auto]">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Image URL (https://…)"
          type="url"
          aria-label="Image URL"
        />
        <Input
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Alt text (optional)"
          aria-label="Alt text"
        />
        <Button onClick={add} disabled={create.isPending}>
          Add image
        </Button>
      </div>
    </div>
  );
}

export { ProductImagesPanel };
