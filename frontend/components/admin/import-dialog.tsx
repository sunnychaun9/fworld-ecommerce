'use client';

import { Upload } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useImportProducts } from '@/features/admin/use-admin-misc';
import { ApiError } from '@/services/api';
import type { ImportProduct, ImportResult } from '@/types/admin';

/** Parse a simple CSV (header row + comma-separated values) into import rows. */
function parseCsv(text: string): ImportProduct[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length < 2) return [];
  const headers = (lines[0] ?? '').split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? '';
    });
    return {
      name: record.name ?? '',
      slug: record.slug ?? '',
      categoryId: record.categoryId ?? '',
      ...(record.brandId ? { brandId: record.brandId } : {}),
      mrp: Number(record.mrp ?? 0),
      sellingPrice: Number(record.sellingPrice ?? 0),
      ...(record.status ? { status: record.status as ImportProduct['status'] } : {}),
      ...(record.description ? { description: record.description } : {}),
    };
  });
}

async function parseFile(file: File): Promise<ImportProduct[]> {
  const text = await file.text();
  if (file.name.endsWith('.json')) {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed as ImportProduct[];
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { products?: unknown }).products)
    ) {
      return (parsed as { products: ImportProduct[] }).products;
    }
    throw new Error('JSON must be an array or an object with a "products" array.');
  }
  return parseCsv(text);
}

/** Upload a CSV/JSON file and import products; per-row errors are shown inline. */
function ImportDialog(): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState<ImportProduct[] | null>(null);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const importer = useImportProducts();

  async function onFile(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;
    setResult(null);
    try {
      const parsed = await parseFile(file);
      setRows(parsed);
      if (parsed.length === 0) toast.error('No rows found in the file.');
    } catch (error) {
      setRows(null);
      toast.error(error instanceof Error ? error.message : 'Could not read the file.');
    }
  }

  function runImport(): void {
    if (!rows || rows.length === 0) return;
    importer.mutate(rows, {
      onSuccess: (res) => {
        setResult(res);
        toast.success(`Imported ${res.imported}, failed ${res.failed}`);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Import failed.'),
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setRows(null);
          setResult(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Upload className="size-4" />
          Import products
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import products</DialogTitle>
          <DialogDescription>
            Upload a CSV (headers: name, slug, categoryId, brandId, mrp, sellingPrice, status,
            description) or a JSON file. Rows are parsed in your browser and sent as JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={(e) => void onFile(e)}
            aria-label="Import file"
            className="text-muted-foreground file:bg-accent file:text-foreground block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm"
          />

          {rows ? (
            <p className="text-muted-foreground text-sm">{rows.length} row(s) ready to import.</p>
          ) : null}

          {result ? (
            <div className="space-y-3">
              <div className="flex gap-4 text-sm">
                <span className="text-success font-medium">Imported: {result.imported}</span>
                <span className="text-destructive font-medium">Failed: {result.failed}</span>
              </div>
              {result.errors.length > 0 ? (
                <div className="border-border max-h-56 overflow-y-auto rounded-md border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((rowError) => (
                        <tr key={rowError.row} className="border-border border-t">
                          <td className="px-3 py-2 tabular-nums">{rowError.row}</td>
                          <td className="text-muted-foreground px-3 py-2">
                            {rowError.errors.join('; ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={runImport} disabled={!rows || rows.length === 0 || importer.isPending}>
              {importer.isPending ? 'Importing…' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { ImportDialog };
