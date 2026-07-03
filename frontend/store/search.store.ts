import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Cap on stored recent searches. */
const MAX_RECENT = 6;

/**
 * Recent-search history — mock, client-only state persisted to localStorage.
 * No API is involved in this phase; this backs the search dialog's UI only.
 */
interface SearchState {
  recent: string[];
  addRecent: (term: string) => void;
  removeRecent: (term: string) => void;
  clearRecent: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      recent: [],
      addRecent: (term) =>
        set((state) => {
          const trimmed = term.trim();
          if (!trimmed) return state;
          const next = [trimmed, ...state.recent.filter((t) => t !== trimmed)].slice(0, MAX_RECENT);
          return { recent: next };
        }),
      removeRecent: (term) => set((state) => ({ recent: state.recent.filter((t) => t !== term) })),
      clearRecent: () => set({ recent: [] }),
    }),
    { name: 'fworld:recent-searches' },
  ),
);
