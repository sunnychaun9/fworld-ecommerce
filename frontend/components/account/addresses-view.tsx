'use client';

import { MapPin, Plus } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { AddressCard } from '@/components/checkout/address-card';
import { AddressForm } from '@/components/checkout/address-form';
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
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@/features/addresses/use-addresses';
import { ApiError } from '@/services/api';
import type { Address } from '@/types/address';

/** Account address book — reuses the checkout AddressCard/AddressForm leaves. */
function AddressesView(): React.ReactElement {
  const { data, isPending, isError, refetch } = useAddresses();
  const remove = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Address | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Address | null>(null);

  function openCreate(): void {
    setEditing(null);
    setFormOpen(true);
  }

  function confirmDelete(): void {
    if (!pendingDelete) return;
    remove.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('Address removed');
        setPendingDelete(null);
      },
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : 'Could not remove the address.'),
    });
  }

  function onSetDefault(id: string): void {
    setDefault.mutate(id, {
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : 'Could not update the address.'),
    });
  }

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  const addresses = data ?? [];

  return (
    <div className="space-y-6">
      {addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin />}
          title="No saved addresses"
          description="Add an address to speed up checkout."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add address
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                onEdit={() => {
                  setEditing(address);
                  setFormOpen(true);
                }}
                onDelete={() => setPendingDelete(address)}
                onSetDefault={() => onSetDefault(address.id)}
                busy={remove.isPending || setDefault.isPending}
              />
            ))}
          </div>
          <Button variant="outline" onClick={openCreate}>
            <Plus className="size-4" />
            Add address
          </Button>
        </>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit address' : 'Add a new address'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the details for this address.'
                : 'Add a shipping address to your account.'}
            </DialogDescription>
          </DialogHeader>
          <AddressForm
            {...(editing ? { address: editing } : {})}
            makeDefault={addresses.length === 0}
            onSuccess={() => setFormOpen(false)}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this address?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `${pendingDelete.fullName}, ${pendingDelete.addressLine1} will be permanently removed.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPendingDelete(null)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={remove.isPending}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { AddressesView };
