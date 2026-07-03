/**
 * `GET /orders/:id/tracking` — shipment projection. Returns 404 when the order
 * has no shipment yet (not an error state: it simply hasn't shipped).
 */
export interface OrderTracking {
  courier: string;
  trackingNumber: string;
  trackingUrl: string | null;
  estimatedDelivery: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
}
