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
import { useAdminCategories, useCategoryMutations } from '@/features/admin/use-taxonomy';
import { ApiError } from '@/services/api';
import type { Category } from '@/types/catalog';
import type { CategoryInput } from '@/types/admin';

import { DataTable, type Column } from './data-table';
import { EntityToolbar } from './entity-toolbar';
import { StatusBadge } from './status-badge';

const NO_PARENT = '__root__';

function CategoryDialog({
  category,
  categories,
  trigger,
}: {
  category?: Category;
  categories: Category[];
  trigger: React.ReactNode;
}): React.ReactElement {
  const { create, update } = useCategoryMutations();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(category?.name ?? '');
  const [slug, setSlug] = React.useState(category?.slug ?? '');
  const [description, setDescription] = React.useState(category?.description ?? '');
  const [parentId, setParentId] = React.useState(category?.parentId ?? NO_PARENT);
  const [status, setStatus] = React.useState(category?.status ?? 'ACTIVE');
  const busy = create.isPending || update.isPending;

  function submit(): void {
    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }
    const payload: CategoryInput = {
      name: name.trim(),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      parentId: parentId === NO_PARENT ? null : parentId,
      status: status as 'ACTIVE' | 'ARCHIVED',
    };
    const onError = (e: unknown): void => {
      toast.error(e instanceof ApiError ? e.message : 'Could not save the category.');
    };
    const onSuccess = (): void => {
      toast.success('Category saved');
      setOpen(false);
    };
    if (category) update.mutate({ id: category.id, input: payload }, { onSuccess, onError });
    else create.mutate(payload, { onSuccess, onError });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field id="cat-name" label="Name">
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field id="cat-slug" label="Slug (optional)">
            <Input id="cat-slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </Field>
          <Field id="cat-desc" label="Description (optional)">
            <Textarea
              id="cat-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-parent">Parent</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger id="cat-parent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT}>None (root)</SelectItem>
                  {categories
                    .filter((c) => c.id !== category?.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="cat-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

function CategoriesView(): React.ReactElement {
  const { data, isPending, isError, refetch } = useAdminCategories();
  const { remove } = useCategoryMutations();
  const categories = data?.items ?? [];

  const columns: Column<Category>[] = [
    { key: 'name', header: 'Name', cell: (c) => <span className="font-medium">{c.name}</span> },
    {
      key: 'slug',
      header: 'Slug',
      cell: (c) => <span className="text-muted-foreground">{c.slug}</span>,
    },
    { key: 'status', header: 'Status', cell: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'order',
      header: 'Order',
      align: 'right',
      cell: (c) => <span className="tabular-nums">{c.sortOrder}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <CategoryDialog
            category={c}
            categories={categories}
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
                onSuccess: () => toast.success('Category deleted'),
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
        title="Categories"
        description="Organise your catalog."
        action={
          <CategoryDialog
            categories={categories}
            trigger={
              <Button>
                <Plus className="size-4" />
                New category
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
          rows={categories}
          rowKey={(c) => c.id}
          empty={
            <div className="border-border text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
              No categories yet.
            </div>
          }
        />
      )}
    </div>
  );
}

export { CategoriesView };
