import {
  Bell,
  Boxes,
  FolderTree,
  Layers,
  LayoutDashboard,
  Package,
  RotateCcw,
  Settings,
  ShoppingCart,
  Star,
  Tag,
  Ticket,
  Upload,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { ROUTES } from '@/constants/routes';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface AdminNavGroup {
  label?: string;
  items: AdminNavItem[];
}

export const adminNav: AdminNavGroup[] = [
  { items: [{ label: 'Dashboard', href: ROUTES.admin, icon: LayoutDashboard, exact: true }] },
  {
    label: 'Catalog',
    items: [
      { label: 'Products', href: ROUTES.adminProducts, icon: Package },
      { label: 'Categories', href: ROUTES.adminCategories, icon: FolderTree },
      { label: 'Brands', href: ROUTES.adminBrands, icon: Tag },
      { label: 'Collections', href: ROUTES.adminCollections, icon: Layers },
      { label: 'Inventory', href: ROUTES.adminInventory, icon: Boxes },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Orders', href: ROUTES.adminOrders, icon: ShoppingCart },
      { label: 'Coupons', href: ROUTES.adminCoupons, icon: Ticket },
      { label: 'Returns', href: ROUTES.adminReturns, icon: RotateCcw },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Customers', href: ROUTES.adminCustomers, icon: Users },
      { label: 'Reviews', href: ROUTES.adminReviews, icon: Star },
      { label: 'Notifications', href: ROUTES.adminNotifications, icon: Bell },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Import / Export', href: ROUTES.adminImportExport, icon: Upload },
      { label: 'Settings', href: ROUTES.adminSettings, icon: Settings },
    ],
  },
];

/** Flat list of every admin nav item (for breadcrumb/title lookup). */
export const adminNavItems: AdminNavItem[] = adminNav.flatMap((group) => group.items);

export function isActiveAdminRoute(pathname: string, item: AdminNavItem): boolean {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
