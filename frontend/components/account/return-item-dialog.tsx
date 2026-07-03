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
import { Textarea } from '@/components/ui/textarea';
import { useCreateReturn } from '@/features/returns/use-returns';
import { ApiError } from '@/services/api';

interface ReturnItemDialogProps {
  orderItemId: string;
  productName: string;
  trigger: React.ReactNode;
}

/** Dialog to request a return for a single delivered order item. */
function ReturnItemDialog({
  orderItemId,
  productName,
  trigger,
}: ReturnItemDialogProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const create = useCreateReturn();

  function submit(): void {
    const trimmed = reason.trim();
    if (trimmed.length === 0) {
      toast.error('Tell us why you want to return this item.');
      return;
    }
    create.mutate(
      { orderItemId, reason: trimmed },
      {
        onSuccess: () => {
          toast.success('Return requested');
          setOpen(false);
          setReason('');
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : 'Could not request the return.'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Return item</DialogTitle>
          <DialogDescription>
            Request a return for “{productName}”. Returns are accepted within 7 days of delivery.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="return-reason">Reason</Label>
          <Textarea
            id="return-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What went wrong with this item?"
            rows={4}
            maxLength={500}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? 'Requesting…' : 'Request return'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ReturnItemDialog };
