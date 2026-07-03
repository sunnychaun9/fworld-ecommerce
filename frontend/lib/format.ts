import { appConfig } from '@/config/app';

/**
 * Format a monetary amount as Indian Rupees. The backend serialises money as a
 * decimal string, so both `string` and `number` inputs are accepted. Invalid
 * inputs render as the zero value rather than `NaN`.
 */
export function formatCurrency(
  value: number | string,
  options?: { currency?: string; locale?: string; maximumFractionDigits?: number },
): string {
  const amount = typeof value === 'string' ? Number(value) : value;
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(options?.locale ?? appConfig.locale, {
    style: 'currency',
    currency: options?.currency ?? appConfig.currency,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(safe);
}

/** Format an ISO date as a readable day, e.g. "3 Jul 2026". Invalid input → ''. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(appConfig.locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format an ISO date with the time of day, e.g. "3 Jul 2026, 2:30 pm". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(appConfig.locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Compute a whole-number discount percentage from a price and its (higher) compare-at. */
export function discountPercent(price: number | string, compareAt: number | string): number {
  const p = Number(price);
  const c = Number(compareAt);
  if (!Number.isFinite(p) || !Number.isFinite(c) || c <= 0 || p >= c) return 0;
  return Math.round(((c - p) / c) * 100);
}
