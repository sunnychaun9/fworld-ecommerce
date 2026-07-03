import {
  Bell,
  Heart,
  LayoutGrid,
  MapPin,
  Package,
  Star,
  User,
  type LucideIcon,
} from 'lucide-react';

import { ROUTES } from '@/constants/routes';

export interface AccountNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match the pathname exactly (used for the section root). */
  exact?: boolean;
  /** Show the unread-notifications badge on this item. */
  badge?: 'notifications';
}

/** Full account navigation, used by the desktop sidebar. */
export const accountNav: AccountNavItem[] = [
  { label: 'Overview', href: ROUTES.account, icon: LayoutGrid, exact: true },
  { label: 'Orders', href: ROUTES.accountOrders, icon: Package },
  { label: 'Wishlist', href: ROUTES.accountWishlist, icon: Heart },
  { label: 'Addresses', href: ROUTES.accountAddresses, icon: MapPin },
  { label: 'Reviews', href: ROUTES.accountReviews, icon: Star },
  { label: 'Notifications', href: ROUTES.accountNotifications, icon: Bell, badge: 'notifications' },
  { label: 'Profile', href: ROUTES.accountProfile, icon: User },
];

const MOBILE_HREFS = new Set<string>([
  ROUTES.account,
  ROUTES.accountOrders,
  ROUTES.accountWishlist,
  ROUTES.accountNotifications,
  ROUTES.accountProfile,
]);

/** Condensed set surfaced in the mobile bottom navigation. */
export const accountMobileNav: AccountNavItem[] = accountNav.filter((item) =>
  MOBILE_HREFS.has(item.href),
);

/** Whether `pathname` is within (or equal to) a nav item's route. */
export function isActiveAccountRoute(pathname: string, item: AccountNavItem): boolean {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
