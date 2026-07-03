'use client';

import * as React from 'react';

import { PaginationBar } from '@/components/catalog/pagination-bar';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useInventory, useLowStock } from '@/features/admin/use-admin-inventory';
import { cn } from '@/lib/utils';
import type { InventoryRow } from '@/types/admin';

import { DataTable, type Column } from './data-table';
import { EntityToolbar } from './entity-toolbar';
import { InventoryAdjustmentDialog } from './inventory-adjustment-dialog';

const PAGE_SIZE = 20;

function InventoryView(): React.ReactElement {
  const [page, setPage] = React.useState(1);
  const [lowOnly, setLowOnly] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const paged = useInventory({ page, pageSize: PAGE_SIZE });
  const low = useLowStock();

  const source = lowOnly ? low : paged;
  const rowsAll = lowOnly ? (low.data ?? []) : (paged.data?.items ?? []);
  const q = query.trim().toLowerCase();
  const rows = q
    ? rowsAll.filter(
        (r) =>
          r.variant.sku.toLowerCase().includes(q) ||
          r.variant.product.name.toLowerCase().includes(q),
      )
    : rowsAll;

  const columns: Column<InventoryRow>[] = [
    {
      key: 'product',
      header: 'Product',
      cell: (r) => (
        <div>
          <p className="text-foreground font-medium">{r.variant.product.name}</p>
          <p className="text-muted-foreground text-xs">
            {[r.variant.sku, r.variant.size, r.variant.color].filter(Boolean).join(' · ')}
          </p>
        </div>
      ),
    },
    {
      key: 'available',
      header: 'Available',
      align: 'right',
      cell: (r) => (
        <span
          className={cn(
            'tabular-nums',
            r.availableStock <= 0
              ? 'text-destructive font-medium'
              : r.availableStock <= r.lowStockAlert
                ? 'text-brand font-medium'
                : '',
          )}
        >
          {r.availableStock}
        </span>
      ),
    },
    {
      key: 'reserved',
      header: 'Reserved',
      align: 'right',
      cell: (r) => <span className="text-muted-foreground tabular-nums">{r.reservedStock}</span>,
    },
    {
      key: 'alert',
      header: 'Low at',
      align: 'right',
      cell: (r) => <span className="text-muted-foreground tabular-nums">{r.lowStockAlert}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (r) => (
        <InventoryAdjustmentDialog
          variantId={r.variantId}
          label={`${r.variant.product.name} · ${r.variant.sku}`}
          trigger={
            <Button variant="outline" size="sm">
              Adjust
            </Button>
          }
        />
      ),
    },
  ];

  return (
    <div>
      <EntityToolbar title="Inventory" description="Track and adjust stock levels.">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search SKU or product…"
          aria-label="Search inventory"
          className="h-9 w-56"
        />
        <label className="text-muted-foreground ml-2 flex items-center gap-2 text-sm">
          <Switch checked={lowOnly} onCheckedChange={setLowOnly} aria-label="Low stock only" />
          Low stock only
        </label>
      </EntityToolbar>

      {source.isPending ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : source.isError ? (
        <ErrorState onRetry={() => void source.refetch()} />
      ) : (
        <div className="space-y-6">
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            empty={
              <div className="border-border text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
                {lowOnly ? 'No low-stock items. Nicely done.' : 'No inventory rows.'}
              </div>
            }
          />
          {!lowOnly && !q && paged.data ? (
            <PaginationBar
              page={paged.data.page}
              totalPages={Math.max(1, Math.ceil(paged.data.total / paged.data.pageSize))}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

export { InventoryView };
