import { create } from 'zustand';

/**
 * Global, ephemeral UI state (overlays that must be reachable from anywhere in
 * the tree). Domain/server state lives in TanStack Query, not here.
 */
interface UiState {
  mobileNavOpen: boolean;
  cartOpen: boolean;
  searchOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  closeAll: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  mobileNavOpen: false,
  cartOpen: false,
  searchOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setCartOpen: (open) => set({ cartOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  closeAll: () => set({ mobileNavOpen: false, cartOpen: false, searchOpen: false }),
}));
