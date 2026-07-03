'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { Field } from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ROUTES } from '@/constants/routes';
import { useCreateProduct, useUpdateProduct } from '@/features/admin/use-admin-products';
import { useAdminBrands, useAdminCategories } from '@/features/admin/use-taxonomy';
import { ApiError } from '@/services/api';
import type { AdminProduct, ProductInput, ProductStatus } from '@/types/admin';

const NO_BRAND = '__none__';

interface ProductFormProps {
  product?: AdminProduct;
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}): React.ReactElement {
  return (
    <div className="border-border flex items-center justify-between rounded-md border px-3 py-2.5">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

/** Create or edit a product. Category is required; the price/publish rules are
 * enforced by the backend and surfaced as toasts. */
function ProductForm({ product }: ProductFormProps): React.ReactElement {
  const router = useRouter();
  const categories = useAdminCategories();
  const brands = useAdminBrands();
  const create = useCreateProduct();
  const update = useUpdateProduct(product?.id ?? '');
  const isEditing = Boolean(product);

  const [name, setName] = React.useState(product?.name ?? '');
  const [slug, setSlug] = React.useState(product?.slug ?? '');
  const [shortDescription, setShortDescription] = React.useState(product?.shortDescription ?? '');
  const [description, setDescription] = React.useState(product?.description ?? '');
  const [categoryId, setCategoryId] = React.useState(product?.categoryId ?? '');
  const [brandId, setBrandId] = React.useState(product?.brandId ?? NO_BRAND);
  const [mrp, setMrp] = React.useState(product?.mrp ?? '');
  const [sellingPrice, setSellingPrice] = React.useState(product?.sellingPrice ?? '');
  const [status, setStatus] = React.useState<ProductStatus>(product?.status ?? 'DRAFT');
  const [featured, setFeatured] = React.useState(product?.featured ?? false);
  const [newArrival, setNewArrival] = React.useState(product?.newArrival ?? false);
  const [bestSeller, setBestSeller] = React.useState(product?.bestSeller ?? false);
  const [fit, setFit] = React.useState(product?.fit ?? '');
  const [fabric, setFabric] = React.useState(product?.fabric ?? '');

  const busy = create.isPending || update.isPending;

  function submit(): void {
    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (!categoryId) {
      toast.error('Choose a category.');
      return;
    }
    const mrpNum = Number(mrp);
    const priceNum = Number(sellingPrice);
    if (!Number.isFinite(mrpNum) || !Number.isFinite(priceNum)) {
      toast.error('Enter valid prices.');
      return;
    }

    const payload: ProductInput = {
      name: name.trim(),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      ...(shortDescription.trim() ? { shortDescription: shortDescription.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      categoryId,
      ...(brandId !== NO_BRAND ? { brandId } : {}),
      mrp: mrpNum,
      sellingPrice: priceNum,
      status,
      featured,
      newArrival,
      bestSeller,
      ...(fit.trim() ? { fit: fit.trim() } : {}),
      ...(fabric.trim() ? { fabric: fabric.trim() } : {}),
    };

    const onError = (error: unknown): void => {
      toast.error(error instanceof ApiError ? error.message : 'Could not save the product.');
    };

    if (isEditing) {
      update.mutate(payload, {
        onSuccess: () => toast.success('Product saved'),
        onError,
      });
    } else {
      create.mutate(payload, {
        onSuccess: (created) => {
          toast.success('Product created');
          router.push(ROUTES.adminProduct(created.id));
        },
        onError,
      });
    }
  }

  const categoryItems = categories.data?.items ?? [];
  const brandItems = brands.data?.items ?? [];

  return (
    <div className="max-w-2xl space-y-5">
      <Field id="name" label="Name">
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field id="slug" label="Slug (optional — generated from name)">
        <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
      </Field>
      <Field id="short-desc" label="Short description (optional)">
        <Input
          id="short-desc"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
        />
      </Field>
      <Field id="description" label="Description">
        <Textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryItems.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brand">Brand (optional)</Label>
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger id="brand">
              <SelectValue placeholder="No brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_BRAND}>No brand</SelectItem>
              {brandItems.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="mrp" label="MRP">
          <Input
            id="mrp"
            type="number"
            min={0}
            value={mrp}
            onChange={(e) => setMrp(e.target.value)}
          />
        </Field>
        <Field id="selling-price" label="Selling price">
          <Input
            id="selling-price"
            type="number"
            min={0}
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
          />
        </Field>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active (published)</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="fit" label="Fit (optional)">
          <Input id="fit" value={fit} onChange={(e) => setFit(e.target.value)} />
        </Field>
        <Field id="fabric" label="Fabric (optional)">
          <Input id="fabric" value={fabric} onChange={(e) => setFabric(e.target.value)} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <ToggleRow label="Featured" checked={featured} onChange={setFeatured} />
        <ToggleRow label="New arrival" checked={newArrival} onChange={setNewArrival} />
        <ToggleRow label="Best seller" checked={bestSeller} onChange={setBestSeller} />
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? 'Saving…' : isEditing ? 'Save changes' : 'Create product'}
        </Button>
      </div>
    </div>
  );
}

export { ProductForm };
