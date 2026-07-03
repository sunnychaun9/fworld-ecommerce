'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Clock, Loader2, Search, X } from 'lucide-react';
import * as React from 'react';

import { useSearchStore } from '@/store/search.store';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

const DEBOUNCE_MS = 350;

/**
 * Search command palette (UI only — no API in this phase).
 *
 * - Opens from the header trigger or the Cmd/Ctrl+K shortcut.
 * - Shows recent searches (mock, persisted client state) when idle.
 * - Simulates a loading state on input, then an empty "no results" state.
 * - ESC and focus-trapping come from the underlying Radix dialog.
 */
function SearchDialog(): React.ReactElement {
  const open = useUiStore((s) => s.searchOpen);
  const setOpen = useUiStore((s) => s.setSearchOpen);
  const { recent, addRecent, removeRecent, clearRecent } = useSearchStore();

  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Global keyboard shortcut: Cmd/Ctrl + K toggles the palette.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(!useUiStore.getState().searchOpen);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);

  // Debounced "search" — no network; just drives the loading/empty states.
  React.useEffect(() => {
    if (!query.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const trimmed = query.trim();

  function submit(term: string): void {
    const value = term.trim();
    if (!value) return;
    addRecent(value);
    setQuery(value);
  }

  function onOpenChange(next: boolean): void {
    setOpen(next);
    if (!next) setQuery('');
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg border shadow-lg"
        >
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search FWorld products, collections and brands.
          </Dialog.Description>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(query);
            }}
            className="border-border flex items-center gap-3 border-b px-4"
          >
            <Search className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Search products, collections, brands…"
              aria-label="Search"
              className="placeholder:text-muted-foreground h-14 w-full bg-transparent text-base outline-none"
            />
            <Dialog.Close
              aria-label="Close search"
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex size-7 shrink-0 items-center justify-center rounded-sm outline-none transition-colors focus-visible:ring-2"
            >
              <X className="size-4" />
            </Dialog.Close>
          </form>

          <div className="max-h-[50vh] overflow-y-auto p-2">
            {loading ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 px-3 py-10 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Searching…
              </div>
            ) : trimmed ? (
              <div className="px-3 py-10 text-center">
                <p className="text-foreground text-sm font-medium">No results for “{trimmed}”</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Product search connects in a later phase.
                </p>
              </div>
            ) : recent.length > 0 ? (
              <div>
                <div className="flex items-center justify-between px-3 pb-1 pt-2">
                  <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Recent
                  </span>
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="text-muted-foreground hover:text-foreground focus-visible:text-foreground text-xs outline-none transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <ul>
                  {recent.map((term) => (
                    <li key={term} className="group flex items-center">
                      <button
                        type="button"
                        onClick={() => submit(term)}
                        className="hover:bg-accent focus-visible:bg-accent flex flex-1 items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm outline-none transition-colors"
                      >
                        <Clock className="text-muted-foreground size-4" />
                        {term}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRecent(term)}
                        aria-label={`Remove ${term}`}
                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mr-2 inline-flex size-7 items-center justify-center rounded-sm opacity-0 outline-none transition focus-visible:opacity-100 focus-visible:ring-2 group-hover:opacity-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="px-3 py-10 text-center">
                <Search className="text-muted-foreground mx-auto size-6" aria-hidden="true" />
                <p className="text-foreground mt-3 text-sm font-medium">Search FWorld</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Find products, collections and brands.
                </p>
              </div>
            )}
          </div>

          <div className="border-border text-muted-foreground flex items-center justify-end gap-1 border-t px-4 py-2 text-[11px]">
            <kbd className={kbdClass}>Esc</kbd>
            <span>to close</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const kbdClass = cn(
  'inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 font-sans text-[10px] font-medium text-muted-foreground',
);

export { SearchDialog };
