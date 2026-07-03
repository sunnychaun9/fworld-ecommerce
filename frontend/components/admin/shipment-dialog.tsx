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
import { useCreateShipment, useUpdateShipment } from '@/features/admin/use-shipping';
import { ApiError } from '@/services/api';
import type { Shipment } from '@/types/admin';

interface ShipmentDialogProps {
  orderId: string;
  shipment: Shipment | null;
  trigger: React.ReactNode;
}

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

/** Create or edit a shipment, and mark it delivered. */
function ShipmentDialog({ orderId, shipment, trigger }: ShipmentDialogProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [courier, setCourier] = React.useState(shipment?.courier ?? '');
  const [trackingNumber, setTrackingNumber] = React.useState(shipment?.trackingNumber ?? '');
  const [trackingUrl, setTrackingUrl] = React.useState(shipment?.trackingUrl ?? '');
  const [estimated, setEstimated] = React.useState(
    toDateInput(shipment?.estimatedDelivery ?? null),
  );

  const create = useCreateShipment(orderId);
  const update = useUpdateShipment(orderId);
  const busy = create.isPending || update.isPending;

  function onError(error: unknown): void {
    toast.error(error instanceof ApiError ? error.message : 'Something went wrong.');
  }

  function submit(): void {
    if (!courier.trim() || !trackingNumber.trim()) {
      toast.error('Courier and tracking number are required.');
      return;
    }
    const base = {
      courier: courier.trim(),
      trackingNumber: trackingNumber.trim(),
      ...(trackingUrl.trim() ? { trackingUrl: trackingUrl.trim() } : {}),
      ...(estimated ? { estimatedDelivery: new Date(estimated).toISOString() } : {}),
    };
    if (shipment) {
      update.mutate(
        { id: shipment.id, input: base },
        {
          onSuccess: () => {
            toast.success('Shipment updated');
            setOpen(false);
          },
          onError,
        },
      );
    } else {
      create.mutate(
        { orderId, ...base },
        {
          onSuccess: () => {
            toast.success('Shipment created');
            setOpen(false);
          },
          onError,
        },
      );
    }
  }

  function markDelivered(): void {
    if (!shipment) return;
    update.mutate(
      { id: shipment.id, input: { delivered: true } },
      {
        onSuccess: () => {
          toast.success('Marked as delivered');
          setOpen(false);
        },
        onError,
      },
    );
  }

  const delivered = Boolean(shipment?.deliveredAt);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{shipment ? 'Manage shipment' : 'Create shipment'}</DialogTitle>
          <DialogDescription>
            {shipment
              ? 'Update tracking details or mark the order delivered.'
              : 'Add courier and tracking details to ship this order.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field id="courier" label="Courier">
            <Input id="courier" value={courier} onChange={(e) => setCourier(e.target.value)} />
          </Field>
          <Field id="tracking-number" label="Tracking number">
            <Input
              id="tracking-number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </Field>
          <Field id="tracking-url" label="Tracking URL (optional)">
            <Input
              id="tracking-url"
              type="url"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field id="estimated" label="Estimated delivery (optional)">
            <Input
              id="estimated"
              type="date"
              value={estimated}
              onChange={(e) => setEstimated(e.target.value)}
            />
          </Field>

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            {shipment && !delivered ? (
              <Button variant="outline" onClick={markDelivered} disabled={busy}>
                Mark delivered
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={busy}>
                {shipment ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ShipmentDialog };
