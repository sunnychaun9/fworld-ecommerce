/** A customer's saved shipping address (`GET /addresses`). */
export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Body for `POST /addresses`. */
export interface CreateAddressInput {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

/** Body for `PATCH /addresses/:id` — every field is optional. */
export type UpdateAddressInput = Partial<CreateAddressInput>;
