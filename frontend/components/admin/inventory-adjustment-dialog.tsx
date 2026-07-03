'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Field } from '@/components/auth/form-field';
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
import { useAdjustInventory } from '@/features/admin/use-admin-inventory';
import { ApiError } from '@/services/api';

interface InventoryAdjustmentDialogProps {
  variantId: string;
  label: string;
  trigger: React.ReactNode;
}

/** Adjust a variant's stock by a signed delta with a required reason. */
function InventoryAdjustmentDialog({
  variantId,
  label,
  trigger,
}: InventoryAdjustmentDialogProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [quantity, setQuantity] = React.useState('1');
  const [reason, setReason] = React.useState('');
  const adjust = useAdjustInventory();

  function submit(): void {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      toast.error('Enter a whole quantity of at least 1.');
      return;
    }
    if (!reason.trim()) {
      toast.error('A reason is required.');
      return;
    }
    adjust.mutate(
      { variantId, type, quantity: qty, reason: reason.trim() },
      {
        onSuccess: (result) => {
          toast.success(`Stock updated to ${result.inventory.availableStock}`);
          setOpen(false);
          setQuantity('1');
          setReason('');
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : 'Could not adjust stock.'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="adjust-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'INCREASE' | 'DECREASE')}>
              <SelectTrigger id="adjust-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INCREASE">Increase</SelectItem>
                <SelectItem value="DECREASE">Decrease</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field id="adjust-qty" label="Quantity">
            <Input
              id="adjust-qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <Field id="adjust-reason" label="Reason">
            <Input
              id="adjust-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Restock, correction, damage…"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={adjust.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={adjust.isPending}>
              {adjust.isPending ? 'Saving…' : 'Apply'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { InventoryAdjustmentDialog };
