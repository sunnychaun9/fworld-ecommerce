'use client';

import { ArrowLeft, PackageX } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useAdminProduct, useDeleteProduct } from '@/features/admin/use-admin-products';
import { ApiError } from '@/services/api';

import { ProductForm } from './product-form';
import { ProductImagesPanel } from './product-images-panel';
import { ProductVariantsPanel } from './product-variants-panel';
import { StatusBadge } from './status-badge';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="border-border bg-background rounded-lg border p-5">
      <div className="mb-4">
        <h2 className="text-foreground text-sm font-medium">{title}</h2>
        {description ? <p className="text-muted-foreground mt-0.5 text-xs">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ProductEditView({ productId }: { productId: string }): React.ReactElement {
  const router = useRouter();
  const { data: product, isPending, isError, error, refetch } = useAdminProduct(productId);
  const remove = useDeleteProduct();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <EmptyState
          icon={<PackageX />}
          title="Product not found"
          action={
            <Button asChild>
              <Link href={ROUTES.adminProducts}>Back to products</Link>
            </Button>
          }
        />
      );
    }
    return <ErrorState onRetry={() => void refetch()} />;
  }

  function onDelete(): void {
    remove.mutate(productId, {
      onSuccess: () => {
        toast.success('Product deleted');
        router.push(ROUTES.adminProducts);
      },
      onError: (err) =>
        toast.error(err instanceof ApiError ? err.message : 'Could not delete the product.'),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={ROUTES.adminProducts}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" />
          Products
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-foreground text-xl font-semibold tracking-tight">{product.name}</h1>
            <StatusBadge status={product.status} />
          </div>
          <Button variant="outline" onClick={() => setConfirmOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <Section title="Details" description="Publish by setting status to Active.">
        <ProductForm key={product.id} product={product} />
      </Section>

      <Section title="Media" description="Add images by URL.">
        <ProductImagesPanel productId={productId} />
      </Section>

      <Section title="Variants & inventory" description="Manage sizes/colours and stock levels.">
        <ProductVariantsPanel productId={productId} />
      </Section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this product?</DialogTitle>
            <DialogDescription>
              This permanently removes “{product.name}”. Consider archiving instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={remove.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { ProductEditView };
