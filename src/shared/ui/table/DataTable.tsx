import React from 'react';

export interface SortState {
  property: string;
  direction: 'ASC' | 'DESC';
}

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  showSerialNumber?: boolean;
  startIndex?: number;
  sortState?: SortState[];
  onSortChange?: (property: string) => void;
  page?: number;
  size?: number;
  totalPages?: number;
  totalElements?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No data available.',
  showSerialNumber = false,
  startIndex = 0,
  sortState = [],
  onSortChange,
  page,
  size,
  totalPages,
  totalElements,
  onPageChange,
  onRowClick,
}: DataTableProps<T>) {
  const getSortIndicator = (key: string) => {
    const sort = sortState.find((s) => s.property === key);
    if (!sort) return null;
    return sort.direction === 'ASC' ? ' ↑' : ' ↓';
  };

  const actualColumns = showSerialNumber
    ? [
        {
          key: '_serial',
          header: '#',
          width: '60px',
          render: (_: T, index: number) => (
            <span className="text-foreground/50 text-sm">{startIndex + index + 1}</span>
          ),
        } as unknown as ColumnDef<T>,
        ...columns,
      ]
    : columns;

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      <div className="flex-1 overflow-auto min-h-0 w-full">
      <table className="w-full relative">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">
            {actualColumns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={`text-left text-xs font-medium text-foreground/30 uppercase tracking-wider px-4 py-2.5 whitespace-nowrap ${
                  col.sortable ? 'cursor-pointer hover:text-foreground/60 transition-colors' : ''
                }`}
                onClick={() => {
                  if (col.sortable && onSortChange) {
                    onSortChange(col.key);
                  }
                }}
              >
                {col.header}
                {col.sortable && getSortIndicator(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={actualColumns.length} className="px-4 py-8 text-center text-sm text-foreground/40">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Loading data...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={actualColumns.length} className="px-4 py-8 text-center text-sm text-foreground/40">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(item)}
                className={`border-b border-border transition-colors group ${
                  onRowClick ? 'cursor-pointer hover:bg-muted/70' : 'hover:bg-muted/50'
                } ${i === data.length - 1 ? 'border-b-0' : ''}`}
              >
                {actualColumns.map((col) => (
                  <td key={col.key} className="px-4 py-2.5 whitespace-nowrap">
                    {col.render
                      ? col.render(item, i)
                      : (item[col.key as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {page !== undefined && totalElements !== undefined && onPageChange && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border shrink-0 bg-card">
          <span className="text-xs text-foreground/30">
            Showing {data.length === 0 ? 0 : page * (size || 10) + 1}–{Math.min((page + 1) * (size || 10), totalElements)} of {totalElements}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs text-foreground/30 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <button className="px-3 py-1.5 rounded-lg text-xs bg-primary/20 text-primary font-medium">
              {page + 1}
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={totalPages !== undefined ? page >= totalPages - 1 : false}
              className="px-3 py-1.5 rounded-lg text-xs text-foreground/30 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
