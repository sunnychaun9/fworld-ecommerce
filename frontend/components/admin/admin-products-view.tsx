'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { PaginationBar } from '@/components/catalog/pagination-bar';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useBulkFlags, useBulkStatus, useAdminProducts } from '@/features/admin/use-admin-products';
import { ApiError } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { AdminProduct, ProductStatus } from '@/types/admin';

import { DataTable, type Column } from './data-table';
import { EntityToolbar } from './entity-toolbar';
import { StatusBadge } from './status-badge';

const STATUS_FILTERS = ['ALL', 'DRAFT', 'ACTIVE', 'ARCHIVED'];
const PAGE_SIZE = 20;

function onError(error: unknown): void {
  toast.error(error instanceof ApiError ? error.message : 'Bulk action failed.');
}

function AdminProductsView(): React.ReactElement {
  const params = useSearchParams();
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState('ALL');
  const [query, setQuery] = React.useState(params.get('q') ?? '');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const { data, isPending, isError, refetch, isPlaceholderData } = useAdminProducts({
    page,
    limit: PAGE_SIZE,
    ...(status !== 'ALL' ? { status } : {}),
  });
  const bulkStatus = useBulkStatus();
  const bulkFlags = useBulkFlags();

  const items = data?.items ?? [];
  const q = query.trim().toLowerCase();
  const rows = q ? items.filter((p) => p.name.toLowerCase().includes(q)) : items;

  function toggle(id: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(): void {
    setSelected((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((p) => p.id))));
  }

  function applyStatus(next: ProductStatus): void {
    bulkStatus.mutate(
      { productIds: [...selected], status: next },
      {
        onSuccess: (r) => {
          toast.success(`${r.affected} product(s) updated`);
          setSelected(new Set());
        },
        onError,
      },
    );
  }

  function applyFeatured(): void {
    bulkFlags.mutate(
      { productIds: [...selected], featured: true },
      {
        onSuccess: (r) => {
          toast.success(`${r.affected} product(s) featured`);
          setSelected(new Set());
        },
        onError,
      },
    );
  }

  const busy = bulkStatus.isPending || bulkFlags.isPending;

  const columns: Column<AdminProduct>[] = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          aria-label="Select all"
          checked={rows.length > 0 && selected.size === rows.length}
          onChange={toggleAll}
        />
      ),
      cell: (p) => (
        <input
          type="checkbox"
          aria-label={`Select ${p.name}`}
          checked={selected.has(p.id)}
          onChange={() => toggle(p.id)}
        />
      ),
    },
    {
      key: 'name',
      header: 'Product',
      cell: (p) => (
        <Link
          href={ROUTES.adminProduct(p.id)}
          className="text-foreground font-medium hover:underline"
        >
          {p.name}
        </Link>
      ),
    },
    { key: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      cell: (p) => <span className="tabular-nums">{formatCurrency(p.sellingPrice)}</span>,
    },
    {
      key: 'flags',
      header: 'Flags',
      cell: (p) => (
        <span className="text-muted-foreground text-xs">
          {[p.featured && 'Featured', p.newArrival && 'New', p.bestSeller && 'Best']
            .filter(Boolean)
            .join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'updated',
      header: 'Updated',
      cell: (p) => <span className="text-muted-foreground">{formatDate(p.updatedAt)}</span>,
    },
  ];

  return (
    <div>
      <EntityToolbar
        title="Products"
        description="Create, publish and manage your catalog."
        action={
          <Button asChild>
            <Link href={ROUTES.adminProductNew}>
              <Plus className="size-4" />
              New product
            </Link>
          </Button>
        }
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name…"
          aria-label="Filter products"
          className="h-9 w-56"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'ALL' ? 'All statuses' : s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </EntityToolbar>

      {selected.size > 0 ? (
        <div className="border-border bg-accent/40 mb-4 flex flex-wrap items-center gap-2 rounded-lg border px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => applyStatus('ACTIVE')}
            >
              Publish
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => applyStatus('DRAFT')}
            >
              Unpublish
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => applyStatus('ARCHIVED')}
            >
              Archive
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={applyFeatured}>
              Feature
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      {isPending ? (
        <Skeleton className="h-96 w-full rounded-lg" />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <div className="space-y-6" aria-busy={isPlaceholderData}>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(p) => p.id}
            empty={
              <div className="border-border text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
                No products found.
              </div>
            }
          />
          {q ? null : (
            <PaginationBar
              page={data.pageInfo.page}
              totalPages={data.pageInfo.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}

export { AdminProductsView };
