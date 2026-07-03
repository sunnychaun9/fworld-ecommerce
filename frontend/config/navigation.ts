/**
 * Typed navigation model consumed by layout components (header/footer). The
 * concrete category/collection entries are wired when the catalog pages land;
 * this module defines the shape and the stable, foundation-level links only.
 */
import { ROUTES } from '@/constants/routes';

export interface NavItem {
  label: string;
  href: string;
  /** Optional nested items for grouped menus. */
  children?: NavItem[];
  /** Marks links to external destinations (rendered with rel/target). */
  external?: boolean;
}

/** Primary header navigation. Populated with catalog entries in a later phase. */
export const mainNav: NavItem[] = [];

/** Footer link groups. Populated with policy/support pages in a later phase. */
export const footerNav: { title: string; items: NavItem[] }[] = [];

/** Links that always exist, independent of catalog data. */
export const utilityNav: NavItem[] = [{ label: 'Home', href: ROUTES.home }];
