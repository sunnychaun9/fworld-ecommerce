'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import type { ProductVariant } from '@/types/catalog';

interface VariantSelectorProps {
  variants: ProductVariant[];
  size: string | null;
  color: string | null;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
}

function uniqueSizes(variants: ProductVariant[]): string[] {
  return [...new Set(variants.map((v) => v.size).filter((s): s is string => Boolean(s)))];
}

function uniqueColors(variants: ProductVariant[]): { color: string; hex: string | null }[] {
  const map = new Map<string, string | null>();
  for (const v of variants) if (v.color) map.set(v.color, v.colorHex);
  return [...map].map(([color, hex]) => ({ color, hex }));
}

/** Size and colour selectors derived from the product's variants. */
function VariantSelector({
  variants,
  size,
  color,
  onSizeChange,
  onColorChange,
}: VariantSelectorProps): React.ReactElement {
  const sizes = uniqueSizes(variants);
  const colors = uniqueColors(variants);

  return (
    <div className="flex flex-col gap-6">
      {colors.length > 0 ? (
        <div>
          <p className="text-foreground mb-2 text-sm font-medium">
            Colour{color ? <span className="text-muted-foreground"> — {color}</span> : null}
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.color}
                type="button"
                aria-label={c.color}
                aria-pressed={color === c.color}
                title={c.color}
                onClick={() => onColorChange(c.color)}
                className={cn(
                  'focus-visible:ring-ring focus-visible:ring-offset-background size-8 rounded-full border outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2',
                  color === c.color ? 'border-foreground ring-foreground ring-1' : 'border-border',
                )}
                style={{ backgroundColor: c.hex ?? undefined }}
              />
            ))}
          </div>
        </div>
      ) : null}

      {sizes.length > 0 ? (
        <div>
          <p className="text-foreground mb-2 text-sm font-medium">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={size === s}
                onClick={() => onSizeChange(s)}
                className={cn(
                  'focus-visible:ring-ring min-w-12 rounded-md border px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2',
                  size === s
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border text-foreground hover:border-foreground',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { VariantSelector };
