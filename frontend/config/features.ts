/**
 * Client-side feature flags — typed, build-time toggles that gate optional UI or
 * behaviour. Kept intentionally simple; a remote-config strategy can replace the
 * source of these values later without changing call sites.
 */
export const featureFlags = {
  wishlist: true,
  reviews: true,
  recentlyViewed: true,
  recommendations: true,
  coupons: true,
  darkMode: true,
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
