'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Field } from '@/components/auth/form-field';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useAdminProducts } from '@/features/admin/use-admin-products';
import {
  useAdminCollections,
  useCollectionMutations,
  useCollectionProductMutations,
  useCollectionProducts,
} from '@/features/admin/use-taxonomy';
import { ApiError } from '@/services/api';
import type { StoreCollection } from '@/types/catalog';
import type { CollectionInput } from '@/types/admin';

import { DataTable, type Column } from './data-table';
import { EntityToolbar } from './entity-toolbar';
import { StatusBadge } from './status-badge';

function toastError(e: unknown, fallback: string): void {
  toast.error(e instanceof ApiError ? e.message : fallback);
}

function CollectionDialog({
  collection,
  trigger,
}: {
  collection?: StoreCollection;
  trigger: React.ReactNode;
}): React.ReactElement {
  const { create, update } = useCollectionMutations();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(collection?.name ?? '');
  const [slug, setSlug] = React.useState(collection?.slug ?? '');
  const [description, setDescription] = React.useState(collection?.description ?? '');
  const [image, setImage] = React.useState(collection?.image ?? '');
  const [status, setStatus] = React.useState(collection?.status ?? 'ACTIVE');
  const busy = create.isPending || update.isPending;

  function submit(): void {
    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }
    const payload: CollectionInput = {
      name: name.trim(),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(image.trim() ? { image: image.trim() } : {}),
      status: status as 'ACTIVE' | 'ARCHIVED',
    };
    const onSuccess = (): void => {
      toast.success('Collection saved');
      setOpen(false);
    };
    const onError = (e: unknown): void => toastError(e, 'Could not save the collection.');
    if (collection) update.mutate({ id: collection.id, input: payload }, { onSuccess, onError });
    else create.mutate(payload, { onSuccess, onError });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{collection ? 'Edit collection' : 'New collection'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field id="col-name" label="Name">
            <Input id="col-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="col-slug" label="Slug (optional)">
            <Input id="col-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </Field>
          <Field id="col-desc" label="Description (optional)">
            <Textarea
              id="col-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field id="col-image" label="Image URL (optional)">
            <Input
              id="col-image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <div className="space-y-1.5">
            <Label htmlFor="col-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="col-status" className="w-40">
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

function ManageProductsDialog({
  collection,
  trigger,
}: {
  collection: StoreCollection;
  trigger: React.ReactNode;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const { data: products, isPending } = useCollectionProducts(open ? collection.id : undefined);
  const allProducts = useAdminProducts({ page: 1, limit: 100 });
  const { add, remove, reorder } = useCollectionProductMutations(collection.id);
  const [toAdd, setToAdd] = React.useState('');

  const current = products ?? [];
  const inCollection = new Set(current.map((p) => p.id));
  const options = (allProducts.data?.items ?? []).filter((p) => !inCollection.has(p.id));

  function move(index: number, direction: -1 | 1): void {
    const next = [...current];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    reorder.mutate(
      next.map((p, i) => ({ productId: p.id, sortOrder: i })),
      { onError: (e) => toastError(e, 'Could not reorder.') },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Products in “{collection.name}”</DialogTitle>
          <DialogDescription>Add, remove and reorder products.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Select value={toAdd} onValueChange={setToAdd}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a product to add" />
            </SelectTrigger>
            <SelectContent>
              {options.length === 0 ? (
                <SelectItem value="__none__" disabled>
                  No more products
                </SelectItem>
              ) : (
                options.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            disabled={!toAdd || toAdd === '__none__' || add.isPending}
            onClick={() =>
              add.mutate([toAdd], {
                onSuccess: () => {
                  toast.success('Added');
                  setToAdd('');
                },
                onError: (e) => toastError(e, 'Could not add.'),
              })
            }
          >
            Add
          </Button>
        </div>

        {isPending ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : current.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">No products yet.</p>
        ) : (
          <ul className="divide-border border-border divide-y rounded-lg border">
            {current.map((product, index) => (
              <li key={product.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <span className="text-foreground truncate font-medium">{product.name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Move up"
                    disabled={index === 0 || reorder.isPending}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Move down"
                    disabled={index === current.length - 1 || reorder.isPending}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove"
                    disabled={remove.isPending}
                    onClick={() =>
                      remove.mutate(product.id, {
                        onError: (e) => toastError(e, 'Could not remove.'),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CollectionsView(): React.ReactElement {
  const { data, isPending, isError, refetch } = useAdminCollections();
  const { remove } = useCollectionMutations();
  const collections = data?.items ?? [];

  const columns: Column<StoreCollection>[] = [
    { key: 'name', header: 'Name', cell: (c) => <span className="font-medium">{c.name}</span> },
    {
      key: 'slug',
      header: 'Slug',
      cell: (c) => <span className="text-muted-foreground">{c.slug}</span>,
    },
    { key: 'status', header: 'Status', cell: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <ManageProductsDialog
            collection={c}
            trigger={
              <Button variant="ghost" size="sm">
                Products
              </Button>
            }
          />
          <CollectionDialog
            collection={c}
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
              remove.mutate(c.id, {
                onSuccess: () => toast.success('Collection deleted'),
                onError: (e) => toastError(e, 'Could not delete.'),
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
        title="Collections"
        description="Curate products into shoppable collections."
        action={
          <CollectionDialog
            trigger={
              <Button>
                <Plus className="size-4" />
                New collection
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
          rows={collections}
          rowKey={(c) => c.id}
          empty={
            <div className="border-border text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
              No collections yet.
            </div>
          }
        />
      )}
    </div>
  );
}

export { CollectionsView };
