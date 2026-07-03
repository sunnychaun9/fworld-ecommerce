'use client';

import { MapPin, Plus } from 'lucide-react';
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
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@/features/addresses/use-addresses';
import { ApiError } from '@/services/api';
import type { Address } from '@/types/address';

import { AddressCard } from './address-card';
import { AddressForm } from './address-form';

interface AddressSelectorProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Lists the user's addresses as selectable radios, with add / edit / delete /
 * set-default management. Auto-selects the default (or first) address once
 * loaded so the checkout always has a target.
 */
function AddressSelector({ selectedId, onSelect }: AddressSelectorProps): React.ReactElement {
  const { data, isPending, isError, refetch } = useAddresses();
  const remove = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Address | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Address | null>(null);

  // Auto-select the default (or first) address once, when nothing is selected.
  React.useEffect(() => {
    if (!data || data.length === 0) return;
    const stillValid = selectedId && data.some((a) => a.id === selectedId);
    if (stillValid) return;
    const preferred = data.find((a) => a.isDefault) ?? data[0];
    if (preferred) onSelect(preferred.id);
  }, [data, selectedId, onSelect]);

  function openCreate(): void {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(address: Address): void {
    setEditing(address);
    setFormOpen(true);
  }

  function confirmDelete(): void {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    remove.mutate(id, {
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
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  const addresses = data ?? [];

  return (
    <div className="space-y-4">
      {addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin />}
          title="No saved addresses"
          description="Add a shipping address to continue to payment."
          className="py-10"
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add address
            </Button>
          }
        />
      ) : (
        <>
          <div role="radiogroup" aria-label="Shipping address" className="space-y-3">
            {addresses.map((address) => (
              <AddressCard
                key={address.id}
                address={address}
                selectable
                selected={selectedId === address.id}
                onSelect={() => onSelect(address.id)}
                onEdit={() => openEdit(address)}
                onDelete={() => setPendingDelete(address)}
                onSetDefault={() => onSetDefault(address.id)}
                busy={remove.isPending || setDefault.isPending}
              />
            ))}
          </div>
          <Button variant="outline" onClick={openCreate}>
            <Plus className="size-4" />
            Add another address
          </Button>
        </>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit address' : 'Add a new address'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the shipping details for this address.'
                : 'Where should we deliver your order?'}
            </DialogDescription>
          </DialogHeader>
          <AddressForm
            {...(editing ? { address: editing } : {})}
            makeDefault={addresses.length === 0}
            onSuccess={(saved) => {
              setFormOpen(false);
              onSelect(saved.id);
            }}
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

export { AddressSelector };
