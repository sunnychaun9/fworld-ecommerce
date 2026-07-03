'use client';

import { FileText } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { fetchImportTemplate } from '@/services/admin';
import { ApiError } from '@/services/api';

import { EntityToolbar } from './entity-toolbar';
import { ExportButton } from './export-button';
import { ImportDialog } from './import-dialog';

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="border-border bg-background rounded-lg border p-5">
      <h2 className="text-foreground text-sm font-medium">{title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ImportExportView(): React.ReactElement {
  const [busy, setBusy] = React.useState(false);

  async function downloadTemplate(): Promise<void> {
    setBusy(true);
    try {
      const template = await fetchImportTemplate();
      const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'product-import-template.json';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not fetch the template.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <EntityToolbar title="Import / Export" description="Bulk-manage your product catalog." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Export" description="Download every product and its variants as JSON.">
          <ExportButton />
          <Button variant="outline" onClick={() => void downloadTemplate()} disabled={busy}>
            <FileText className="size-4" />
            Download template
          </Button>
        </Card>
        <Card
          title="Import"
          description="Upload a CSV or JSON file. Rows are validated individually and any errors are reported per row."
        >
          <ImportDialog />
        </Card>
      </div>
    </div>
  );
}

export { ImportExportView };
