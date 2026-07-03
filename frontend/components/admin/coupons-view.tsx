'use client';

import { Plus } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Field } from '@/components/auth/form-field';
import { ErrorState } from '@/components/common/error-state';
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import { useAdminCoupons, useCouponMutations } from '@/features/admin/use-admin-misc';
import { ApiError } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Coupon, CouponInput, DiscountType } from '@/types/admin';

import { DataTable, type Column } from './data-table';
import { EntityToolbar } from './entity-toolbar';

function num(value: string): number | undefined {
  const n = Number(value);
  return value.trim() === '' || !Number.isFinite(n) ? undefined : n;
}

function CouponDialog({
  coupon,
  trigger,
}: {
  coupon?: Coupon;
  trigger: React.ReactNode;
}): React.ReactElement {
  const { create, update } = useCouponMutations();
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState(coupon?.code ?? '');
  const [description, setDescription] = React.useState(coupon?.description ?? '');
  const [discountType, setDiscountType] = React.useState<DiscountType>(
    coupon?.discountType ?? 'PERCENTAGE',
  );
  const [discountValue, setDiscountValue] = React.useState(coupon?.discountValue ?? '');
  const [minOrderAmount, setMinOrderAmount] = React.useState(coupon?.minOrderAmount ?? '');
  const [maxDiscount, setMaxDiscount] = React.useState(coupon?.maxDiscount ?? '');
  const [usageLimit, setUsageLimit] = React.useState(coupon?.usageLimit?.toString() ?? '');
  const [validTo, setValidTo] = React.useState(coupon?.validTo?.slice(0, 10) ?? '');
  const [active, setActive] = React.useState(coupon?.active ?? true);
  const busy = create.isPending || update.isPending;

  function submit(): void {
    const value = num(discountValue);
    if (!code.trim() || value === undefined || value <= 0) {
      toast.error('Enter a code and a positive discount value.');
      return;
    }
    const payload: CouponInput = {
      code: code.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      discountType,
      discountValue: value,
      ...(num(minOrderAmount) !== undefined ? { minOrderAmount: num(minOrderAmount) } : {}),
      ...(num(maxDiscount) !== undefined ? { maxDiscount: num(maxDiscount) } : {}),
      ...(num(usageLimit) !== undefined ? { usageLimit: num(usageLimit) } : {}),
      ...(validTo ? { validTo: new Date(validTo).toISOString() } : {}),
      active,
    };
    const onSuccess = (): void => {
      toast.success('Coupon saved');
      setOpen(false);
    };
    const onError = (e: unknown): void => {
      toast.error(e instanceof ApiError ? e.message : 'Could not save the coupon.');
    };
    if (coupon) update.mutate({ id: coupon.id, input: payload }, { onSuccess, onError });
    else create.mutate(payload, { onSuccess, onError });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{coupon ? 'Edit coupon' : 'New coupon'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field id="coupon-code" label="Code">
            <Input
              id="coupon-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="uppercase"
            />
          </Field>
          <Field id="coupon-desc" label="Description (optional)">
            <Input
              id="coupon-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="coupon-type">Type</Label>
              <Select
                value={discountType}
                onValueChange={(v) => setDiscountType(v as DiscountType)}
              >
                <SelectTrigger id="coupon-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FLAT">Flat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field id="coupon-value" label="Value">
              <Input
                id="coupon-value"
                type="number"
                min={0}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="coupon-min" label="Min order (optional)">
              <Input
                id="coupon-min"
                type="number"
                min={0}
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
              />
            </Field>
            <Field id="coupon-max" label="Max discount (optional)">
              <Input
                id="coupon-max"
                type="number"
                min={0}
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="coupon-usage" label="Usage limit (optional)">
              <Input
                id="coupon-usage"
                type="number"
                min={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
              />
            </Field>
            <Field id="coupon-validto" label="Valid to (optional)">
              <Input
                id="coupon-validto"
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={active} onCheckedChange={setActive} aria-label="Active" />
            Active
          </label>
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

function CouponsView(): React.ReactElement {
  const { data, isPending, isError, refetch } = useAdminCoupons();
  const { remove } = useCouponMutations();
  const coupons = data ?? [];

  const columns: Column<Coupon>[] = [
    { key: 'code', header: 'Code', cell: (c) => <span className="font-medium">{c.code}</span> },
    {
      key: 'type',
      header: 'Discount',
      cell: (c) =>
        c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : formatCurrency(c.discountValue),
    },
    {
      key: 'active',
      header: 'Status',
      cell: (c) => (
        <Badge variant={c.active ? 'success' : 'secondary'}>
          {c.active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'validTo',
      header: 'Valid to',
      cell: (c) => (
        <span className="text-muted-foreground">{c.validTo ? formatDate(c.validTo) : '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <CouponDialog
            coupon={c}
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
                onSuccess: () => toast.success('Coupon deleted'),
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
        title="Coupons"
        description="Only active coupons within their validity window are listed."
        action={
          <CouponDialog
            trigger={
              <Button>
                <Plus className="size-4" />
                New coupon
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
          rows={coupons}
          rowKey={(c) => c.id}
          empty={
            <div className="border-border text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
              No active coupons. Create one to get started.
            </div>
          }
        />
      )}
    </div>
  );
}

export { CouponsView };
