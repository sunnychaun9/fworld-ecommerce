'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Field } from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateAddress, useUpdateAddress } from '@/features/addresses/use-addresses';
import { ApiError } from '@/services/api';
import type { Address, CreateAddressInput } from '@/types/address';

const PHONE_PATTERN = /^[0-9+\-\s]{7,20}$/;
const POSTAL_PATTERN = /^[0-9A-Za-z\s-]{3,12}$/;

interface Values {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
}

function toValues(address?: Address): Values {
  return {
    fullName: address?.fullName ?? '',
    phone: address?.phone ?? '',
    addressLine1: address?.addressLine1 ?? '',
    addressLine2: address?.addressLine2 ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    postalCode: address?.postalCode ?? '',
  };
}

interface AddressFormProps {
  /** When provided, the form edits this address; otherwise it creates one. */
  address?: Address;
  /** Make the newly created / edited address the default. */
  makeDefault?: boolean;
  onSuccess?: (address: Address) => void;
  onCancel?: () => void;
}

/** Create or edit a shipping address. Validation is native react-hook-form. */
function AddressForm({
  address,
  makeDefault,
  onSuccess,
  onCancel,
}: AddressFormProps): React.ReactElement {
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const isEditing = Boolean(address);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ defaultValues: toValues(address) });

  async function onSubmit(values: Values): Promise<void> {
    const payload: CreateAddressInput = {
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      addressLine1: values.addressLine1.trim(),
      addressLine2: values.addressLine2.trim() || undefined,
      city: values.city.trim(),
      state: values.state.trim(),
      postalCode: values.postalCode.trim(),
    };

    try {
      const saved =
        isEditing && address
          ? await update.mutateAsync({ id: address.id, input: payload })
          : await create.mutateAsync({ ...payload, isDefault: makeDefault });
      toast.success(isEditing ? 'Address updated' : 'Address saved');
      onSuccess?.(saved);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not save the address.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field id="fullName" label="Full name" error={errors.fullName?.message}>
        <Input
          id="fullName"
          autoComplete="name"
          {...register('fullName', {
            required: 'Enter the recipient name',
            maxLength: { value: 120, message: 'Name is too long' },
          })}
        />
      </Field>

      <Field id="phone" label="Phone" error={errors.phone?.message}>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          {...register('phone', {
            required: 'Enter a contact number',
            pattern: { value: PHONE_PATTERN, message: 'Enter a valid phone number' },
          })}
        />
      </Field>

      <Field id="addressLine1" label="Address line 1" error={errors.addressLine1?.message}>
        <Input
          id="addressLine1"
          autoComplete="address-line1"
          {...register('addressLine1', {
            required: 'Enter your address',
            maxLength: { value: 180, message: 'Address is too long' },
          })}
        />
      </Field>

      <Field
        id="addressLine2"
        label="Address line 2 (optional)"
        error={errors.addressLine2?.message}
      >
        <Input
          id="addressLine2"
          autoComplete="address-line2"
          {...register('addressLine2', {
            maxLength: { value: 180, message: 'Address is too long' },
          })}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="city" label="City" error={errors.city?.message}>
          <Input
            id="city"
            autoComplete="address-level2"
            {...register('city', { required: 'Enter your city' })}
          />
        </Field>
        <Field id="state" label="State" error={errors.state?.message}>
          <Input
            id="state"
            autoComplete="address-level1"
            {...register('state', { required: 'Enter your state' })}
          />
        </Field>
      </div>

      <Field id="postalCode" label="Postal code" error={errors.postalCode?.message}>
        <Input
          id="postalCode"
          inputMode="numeric"
          autoComplete="postal-code"
          className="sm:max-w-[12rem]"
          {...register('postalCode', {
            required: 'Enter your postal code',
            pattern: { value: POSTAL_PATTERN, message: 'Enter a valid postal code' },
          })}
        />
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isEditing ? 'Save changes' : 'Save address'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export { AddressForm };
