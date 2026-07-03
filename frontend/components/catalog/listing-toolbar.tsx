'use client';

import { SlidersHorizontal } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface ListingToolbarProps {
  total: number;
  loading?: boolean;
  sortControl: React.ReactNode;
  /** Filter panel rendered inside the mobile drawer. */
  filterPanel: React.ReactNode;
}

/** Results count, sort control, and a mobile "Filters" drawer trigger. */
function ListingToolbar({
  total,
  loading,
  sortControl,
  filterPanel,
}: ListingToolbarProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex items-center justify-between gap-4 pb-6">
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {loading ? 'Loading…' : `${total} ${total === 1 ? 'product' : 'products'}`}
      </p>
      <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontal className="size-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(22rem,90vw)] overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            {filterPanel}
          </SheetContent>
        </Sheet>
        {sortControl}
      </div>
    </div>
  );
}

export { ListingToolbar };
