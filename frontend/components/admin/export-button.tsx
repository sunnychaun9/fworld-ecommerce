'use client';

import { Download } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { exportProducts } from '@/services/admin';
import { ApiError } from '@/services/api';

/** Download the full product catalog as a JSON file. */
function ExportButton(): React.ReactElement {
  const [busy, setBusy] = React.useState(false);

  async function onExport(): Promise<void> {
    setBusy(true);
    try {
      const data = await exportProducts();
      const blob = new Blob([JSON.stringify(data.products, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'products-export.json';
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.count} products`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Export failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" onClick={() => void onExport()} disabled={busy}>
      <Download className="size-4" />
      {busy ? 'Exporting…' : 'Export products'}
    </Button>
  );
}

export { ExportButton };
