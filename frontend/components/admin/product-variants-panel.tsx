'use client';

import { Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useProductVariants, useVariantMutations } from '@/features/admin/use-admin-products';
import { ApiError } from '@/services/api';
import type { CreateVariantInput } from '@/types/admin';

import { InventoryAdjustmentDialog } from './inventory-adjustment-dialog';

function onError(error: unknown): void {
  toast.error(error instanceof ApiError ? error.message : 'Something went wrong.');
}

/** Manage a product's variants (add/remove) and adjust each variant's stock. */
function ProductVariantsPanel({ productId }: { productId: string }): React.ReactElement {
  const { data, isPending } = useProductVariants(productId);
  const { create, remove } = useVariantMutations(productId);
  const [form, setForm] = React.useState({ sku: '', size: '', color: '', colorHex: '' });

  function add(): void {
    if (!form.sku.trim()) {
      toast.error('SKU is required.');
      return;
    }
    const payload: CreateVariantInput = {
      productId,
      sku: form.sku.trim(),
      ...(form.size.trim() ? { size: form.size.trim() } : {}),
      ...(form.color.trim() ? { color: form.color.trim() } : {}),
      ...(form.colorHex.trim() ? { colorHex: form.colorHex.trim() } : {}),
    };
    create.mutate(payload, {
      onSuccess: () => {
        toast.success('Variant added');
        setForm({ sku: '', size: '', color: '', colorHex: '' });
      },
      onError,
    });
  }

  return (
    <div className="space-y-4">
      {isPending ? (
        <Skeleton className="h-28 w-full rounded-lg" />
      ) : data && data.items.length > 0 ? (
        <ul className="divide-border border-border divide-y rounded-lg border">
          {data.items.map((variant) => {
            const stock = variant.inventory?.availableStock ?? 0;
            const label = [variant.sku, variant.size, variant.color].filter(Boolean).join(' · ');
            return (
              <li key={variant.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div>
                  <p className="text-foreground font-medium">{label}</p>
                  <p className="text-muted-foreground text-xs">
                    Stock: <span className="tabular-nums">{stock}</span>
                    {variant.priceOverride ? ` · ₹${variant.priceOverride}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <InventoryAdjustmentDialog
                    variantId={variant.id}
                    label={label}
                    trigger={
                      <Button variant="outline" size="sm">
                        Adjust stock
                      </Button>
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Delete variant"
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(variant.id, { onError })}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">No variants yet.</p>
      )}

      <div className="border-border grid gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Input
          value={form.sku}
          onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
          placeholder="SKU"
          aria-label="SKU"
        />
        <Input
          value={form.size}
          onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
          placeholder="Size"
          aria-label="Size"
        />
        <Input
          value={form.color}
          onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
          placeholder="Colour"
          aria-label="Colour"
        />
        <Button onClick={add} disabled={create.isPending}>
          Add variant
        </Button>
      </div>
    </div>
  );
}

export { ProductVariantsPanel };
