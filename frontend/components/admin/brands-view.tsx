'use client';

import { Plus } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Field } from '@/components/auth/form-field';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAdminBrands, useBrandMutations } from '@/features/admin/use-taxonomy';
import { ApiError } from '@/services/api';
import type { BrandDetail } from '@/types/catalog';
import type { BrandInput } from '@/types/admin';

import { DataTable, type Column } from './data-table';
import { EntityToolbar } from './entity-toolbar';
import { StatusBadge } from './status-badge';

function BrandDialog({
  brand,
  trigger,
}: {
  brand?: BrandDetail;
  trigger: React.ReactNode;
}): React.ReactElement {
  const { create, update } = useBrandMutations();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(brand?.name ?? '');
  const [slug, setSlug] = React.useState(brand?.slug ?? '');
  const [description, setDescription] = React.useState(brand?.description ?? '');
  const [logo, setLogo] = React.useState(brand?.logo ?? '');
  const [website, setWebsite] = React.useState(brand?.website ?? '');
  const [status, setStatus] = React.useState(brand?.status ?? 'ACTIVE');
  const busy = create.isPending || update.isPending;

  function submit(): void {
    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }
    const payload: BrandInput = {
      name: name.trim(),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(logo.trim() ? { logo: logo.trim() } : {}),
      ...(website.trim() ? { website: website.trim() } : {}),
      status: status as 'ACTIVE' | 'ARCHIVED',
    };
    const onError = (e: unknown): void => {
      toast.error(e instanceof ApiError ? e.message : 'Could not save the brand.');
    };
    const onSuccess = (): void => {
      toast.success('Brand saved');
      setOpen(false);
    };
    if (brand) update.mutate({ id: brand.id, input: payload }, { onSuccess, onError });
    else create.mutate(payload, { onSuccess, onError });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{brand ? 'Edit brand' : 'New brand'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field id="brand-name" label="Name">
            <Input id="brand-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="brand-slug" label="Slug (optional)">
            <Input id="brand-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </Field>
          <Field id="brand-desc" label="Description (optional)">
            <Textarea
              id="brand-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="brand-logo" label="Logo URL (optional)">
              <Input
                id="brand-logo"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field id="brand-website" label="Website (optional)">
              <Input
                id="brand-website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="brand-status" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BrandsView(): React.ReactElement {
  const { data, isPending, isError, refetch } = useAdminBrands();
  const { remove } = useBrandMutations();
  const brands = data?.items ?? [];

  const columns: Column<BrandDetail>[] = [
    { key: 'name', header: 'Name', cell: (b) => <span className="font-medium">{b.name}</span> },
    {
      key: 'slug',
      header: 'Slug',
      cell: (b) => <span className="text-muted-foreground">{b.slug}</span>,
    },
    { key: 'status', header: 'Status', cell: (b) => <StatusBadge status={b.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (b) => (
        <div className="flex justify-end gap-1">
          <BrandDialog
            brand={b}
            trigger={
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            disabled={remove.isPending}
            onClick={() =>
              remove.mutate(b.id, {
                onSuccess: () => toast.success('Brand deleted'),
                onError: (e) =>
                  toast.error(e instanceof ApiError ? e.message : 'Could not delete.'),
              })
            }
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <EntityToolbar
        title="Brands"
        description="Manage the brands in your catalog."
        action={
          <BrandDialog
            trigger={
              <Button>
                <Plus className="size-4" />
                New brand
              </Button>
            }
          />
        }
      />
      {isPending ? (
        <Skeleton className="h-80 w-full rounded-lg" />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <DataTable
          columns={columns}
          rows={brands}
          rowKey={(b) => b.id}
          empty={
            <div className="border-border text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
              No brands yet.
            </div>
          }
        />
      )}
    </div>
  );
}

export { BrandsView };
