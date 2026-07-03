'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateOrderStatus } from '@/features/admin/use-admin-orders';
import { ApiError } from '@/services/api';
import type { OrderStatus } from '@/types/admin';

/** Client mirror of the backend's allowed status transitions. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
  COMPLETED: [],
};

interface OrderStatusDialogProps {
  orderId: string;
  currentStatus: OrderStatus;
  trigger: React.ReactNode;
}

/** Advance an order's status (with an optional note) within allowed transitions. */
function OrderStatusDialog({
  orderId,
  currentStatus,
  trigger,
}: OrderStatusDialogProps): React.ReactElement {
  const options = TRANSITIONS[currentStatus];
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<OrderStatus | ''>('');
  const [note, setNote] = React.useState('');
  const update = useUpdateOrderStatus(orderId);

  function submit(): void {
    if (!status) {
      toast.error('Choose a new status.');
      return;
    }
    update.mutate(
      { status, ...(note.trim() ? { note: note.trim() } : {}) },
      {
        onSuccess: () => {
          toast.success('Order updated');
          setOpen(false);
          setStatus('');
          setNote('');
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : 'Could not update the order.'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update order status</DialogTitle>
          <DialogDescription>
            {options.length === 0
              ? 'This order is in a terminal state and cannot change.'
              : 'Move the order to its next stage.'}
          </DialogDescription>
        </DialogHeader>

        {options.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="next-status">New status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                <SelectTrigger id="next-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0) + option.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status-note">Note (optional)</Label>
              <Textarea
                id="status-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={255}
                placeholder="Add an internal note"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={update.isPending}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={update.isPending}>
                {update.isPending ? 'Updating…' : 'Update'}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export { OrderStatusDialog };
