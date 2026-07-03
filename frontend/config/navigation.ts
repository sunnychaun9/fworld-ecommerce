/**
 * Typed navigation model consumed by the layout components (header, mobile
 * drawer, footer). Category/collection children currently resolve to their
 * section landing pages; deeper routes are wired as those pages are built.
 */
import { ROUTES } from '@/constants/routes';

export interface NavItem {
  label: string;
  href: string;
  /** Optional nested items for grouped/mega menus and mobile accordions. */
  children?: NavItem[];
  /** Optional short blurb rendered in mega-menu panels. */
  description?: string;
  /** Marks links to external destinations (rendered with rel/target). */
  external?: boolean;
}

/** Primary header navigation. */
export const mainNav: NavItem[] = [
  {
    label: 'Men',
    href: ROUTES.men,
    description: 'Menswear — considered essentials and seasonal edits.',
    children: [
      { label: 'New In', href: ROUTES.men },
      { label: 'Clothing', href: ROUTES.men },
      { label: 'Footwear', href: ROUTES.men },
      { label: 'Accessories', href: ROUTES.men },
    ],
  },
  {
    label: 'Women',
    href: ROUTES.women,
    description: 'Womenswear — refined silhouettes and modern staples.',
    children: [
      { label: 'New In', href: ROUTES.women },
      { label: 'Clothing', href: ROUTES.women },
      { label: 'Footwear', href: ROUTES.women },
      { label: 'Accessories', href: ROUTES.women },
    ],
  },
  { label: 'New Arrivals', href: ROUTES.newArrivals },
  { label: 'Collections', href: ROUTES.collections },
  { label: 'Brands', href: ROUTES.brands },
  { label: 'Sale', href: ROUTES.sale },
];

/** Footer link groups. */
export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: 'Shop',
    items: [
      { label: 'Men', href: ROUTES.men },
      { label: 'Women', href: ROUTES.women },
      { label: 'New Arrivals', href: ROUTES.newArrivals },
      { label: 'Collections', href: ROUTES.collections },
      { label: 'Sale', href: ROUTES.sale },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'Brands', href: ROUTES.brands },
      { label: 'About', href: ROUTES.home },
      { label: 'Careers', href: ROUTES.home },
      { label: 'Stores', href: ROUTES.home },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Help Centre', href: ROUTES.home },
      { label: 'Shipping', href: ROUTES.home },
      { label: 'Returns', href: ROUTES.home },
      { label: 'Size Guide', href: ROUTES.home },
    ],
  },
];

/** Legal/policy links rendered in the footer base row. */
export const policyNav: NavItem[] = [
  { label: 'Privacy', href: ROUTES.home },
  { label: 'Terms', href: ROUTES.home },
  { label: 'Cookies', href: ROUTES.home },
];
