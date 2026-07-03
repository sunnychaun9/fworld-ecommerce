'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import type { FilterKey, FilterOptions, ListingFilters } from './types';

/** Maps a single-value filter key to its field on {@link ListingFilters}. */
const FIELD: Record<Exclude<FilterKey, 'price'>, keyof ListingFilters> = {
  category: 'categoryId',
  brand: 'brandId',
  size: 'size',
  color: 'color',
  fit: 'fit',
  fabric: 'fabric',
};

const LABELS: Record<FilterKey, string> = {
  category: 'Category',
  brand: 'Brand',
  size: 'Size',
  color: 'Colour',
  fit: 'Fit',
  fabric: 'Fabric',
  price: 'Price',
};

interface FilterSidebarProps {
  filters: ListingFilters;
  onChange: (patch: Partial<ListingFilters>) => void;
  onClear: () => void;
  available: FilterKey[];
  options: FilterOptions;
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="border-border border-b pb-6">
      <h3 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-[0.15em]">
        {title}
      </h3>
      {children}
    </div>
  );
}

/** Configurable listing filter panel. Presentational — parents own the state. */
function FilterSidebar({
  filters,
  onChange,
  onClear,
  available,
  options,
}: FilterSidebarProps): React.ReactElement {
  const [minInput, setMinInput] = React.useState(filters.priceMin?.toString() ?? '');
  const [maxInput, setMaxInput] = React.useState(filters.priceMax?.toString() ?? '');

  React.useEffect(() => {
    setMinInput(filters.priceMin?.toString() ?? '');
    setMaxInput(filters.priceMax?.toString() ?? '');
  }, [filters.priceMin, filters.priceMax]);

  const hasActive = Object.values(filters).some((v) => v !== undefined && v !== '');

  function applyPrice(): void {
    const min = minInput.trim() === '' ? undefined : Number(minInput);
    const max = maxInput.trim() === '' ? undefined : Number(maxInput);
    onChange({
      priceMin: Number.isFinite(min) ? min : undefined,
      priceMax: Number.isFinite(max) ? max : undefined,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-sm font-medium">Filters</h2>
        {hasActive ? (
          <Button variant="link" className="h-auto px-0 text-xs" onClick={onClear}>
            Clear all
          </Button>
        ) : null}
      </div>

      {available.map((key) => {
        if (key === 'price') {
          return (
            <FilterGroup key="price" title={LABELS.price}>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="price-min" className="text-muted-foreground mb-1.5 text-xs">
                    Min
                  </Label>
                  <Input
                    id="price-min"
                    inputMode="numeric"
                    placeholder="0"
                    value={minInput}
                    onChange={(e) => setMinInput(e.target.value)}
                    onBlur={applyPrice}
                    className="h-9"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="price-max" className="text-muted-foreground mb-1.5 text-xs">
                    Max
                  </Label>
                  <Input
                    id="price-max"
                    inputMode="numeric"
                    placeholder="—"
                    value={maxInput}
                    onChange={(e) => setMaxInput(e.target.value)}
                    onBlur={applyPrice}
                    className="h-9"
                  />
                </div>
              </div>
            </FilterGroup>
          );
        }

        const field = FIELD[key];
        const opts = options[key] ?? [];
        if (opts.length === 0) return null;
        const current = filters[field] as string | undefined;

        return (
          <FilterGroup key={key} title={LABELS[key]}>
            {key === 'color' ? (
              <div className="flex flex-wrap gap-2">
                {opts.map((opt) => {
                  const active = current === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-label={opt.label}
                      aria-pressed={active}
                      title={opt.label}
                      onClick={() =>
                        onChange({
                          [field]: active ? undefined : opt.value,
                        } as Partial<ListingFilters>)
                      }
                      className={cn(
                        'focus-visible:ring-ring focus-visible:ring-offset-background size-7 rounded-full border outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2',
                        active ? 'border-foreground ring-foreground ring-1' : 'border-border',
                      )}
                      style={{ backgroundColor: opt.hex }}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {opts.map((opt) => {
                  const active = current === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        onChange({
                          [field]: active ? undefined : opt.value,
                        } as Partial<ListingFilters>)
                      }
                      className={cn(
                        'focus-visible:ring-ring rounded-sm border px-3 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2',
                        active
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border text-foreground hover:border-foreground',
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}
          </FilterGroup>
        );
      })}
    </div>
  );
}

export { FilterSidebar };
