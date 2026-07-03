import * as React from 'react';

import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
  className?: string;
}

const ALIGN: Record<'left' | 'right' | 'center', string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/** Generic, responsive admin table. Header + rows are driven by a column config. */
function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  className,
}: DataTableProps<T>): React.ReactElement {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div className={cn('border-border overflow-x-auto rounded-lg border', className)}>
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="border-border bg-muted/30 border-b">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'text-muted-foreground px-4 py-3 text-xs font-medium uppercase tracking-wide',
                  ALIGN[col.align ?? 'left'],
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-border border-b transition-colors last:border-0',
                onRowClick && 'hover:bg-accent/50 cursor-pointer',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-3 align-middle',
                    ALIGN[col.align ?? 'left'],
                    col.className,
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { DataTable };
