/** Fulfilment step state derived from an order's status. */
export type StepState = 'done' | 'active' | 'upcoming';

export interface OrderStep {
  label: string;
  description: string;
  state: StepState;
}

const STEPS: { label: string; description: string }[] = [
  { label: 'Confirmed', description: 'We received your order' },
  { label: 'Processing', description: 'Your order is being prepared' },
  { label: 'Shipped', description: 'On its way to you' },
  { label: 'Delivered', description: 'Delivered to your address' },
];

/** How far along the fulfilment journey each status sits (index into STEPS). */
const RANK: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  COMPLETED: 4,
};

/** True when the order is cancelled (the timeline no longer applies). */
export function isCancelled(status: string): boolean {
  return status === 'CANCELLED';
}

/**
 * Build the four fulfilment steps with per-step state from an order status.
 * The visual timeline is derived from `order.status` because the backend exposes
 * no per-status history to customers.
 */
export function orderStatusSteps(status: string): OrderStep[] {
  const rank = RANK[status] ?? 0;
  const completedThrough = rank - 1;
  return STEPS.map((step, index) => {
    let state: StepState = 'upcoming';
    if (index <= completedThrough) {
      state = 'done';
    } else if (index === completedThrough + 1 && !isCancelled(status)) {
      state = 'active';
    }
    return { ...step, state };
  });
}
