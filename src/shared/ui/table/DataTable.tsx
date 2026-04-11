import React from 'react';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No data available.',
}: DataTableProps<T>) {
  return (
    <div className="flex-1 overflow-auto min-h-0 w-full">
      <table className="w-full relative">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className="text-left text-xs font-medium text-foreground/30 uppercase tracking-wider px-5 py-3 whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-foreground/40">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Loading data...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-foreground/40">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, i) => (
              <tr
                key={i}
                className={`border-b border-border hover:bg-muted/50 transition-colors group ${i === data.length - 1 ? 'border-b-0' : ''
                  }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4 whitespace-nowrap">
                    {col.render
                      ? col.render(item, i)
                      : (item[col.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
