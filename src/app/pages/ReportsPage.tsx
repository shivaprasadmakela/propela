import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronDown, 
  faChevronLeft,
  faChevronRight,
  faFilter,
  faTimes,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { analyticsApi } from '@/domains/deals/api/analyticsApi';
import { DataTable, type ColumnDef } from '@/shared/ui/table/DataTable';

export function ReportsPage() {
  const [groupMode, setGroupMode] = useState<'stage' | 'status'>('status');
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(25);
  
  // Data States
  const [reportData, setReportData] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter Chips States
  const [activeFilters, setActiveFilters] = useState<string[]>(['Report Type 1']);

  useEffect(() => {
    fetchReport();
  }, [page, size, groupMode]);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        includeTotal: true,
        includeZero: true,
        includeAll: true,
        onlyCurrentStageStatus: groupMode === 'status',
      };

      const response = await analyticsApi.fetchAssignedUsersStageCounts(payload, page, size);
      setReportData(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (err: any) {
      console.error('Failed to fetch report data:', err);
      setError(err.message || 'Failed to load report data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamically extract columns from API content items (union of all perCount IDs except 'Total')
  const dynamicColumns = React.useMemo(() => {
    const ids = new Set<string>();
    reportData.forEach(item => {
      item.perCount?.forEach((pc: any) => {
        if (pc.id && pc.id !== 'Total') {
          ids.add(pc.id);
        }
      });
    });
    return Array.from(ids);
  }, [reportData]);

  const removeFilterChip = (chip: string) => {
    setActiveFilters(prev => prev.filter(c => c !== chip));
  };

  // Helper to extract a specific count by column ID
  const getCountVal = (perCount: any[], colId: string) => {
    const match = perCount?.find(pc => pc.id === colId);
    return match?.value?.count ?? 0;
  };

  const columns = React.useMemo(() => {
    const cols: ColumnDef<any>[] = [
      {
        key: 'name',
        header: 'RM NAME',
        width: '150px',
        render: (item) => <span className="font-semibold text-foreground/80">{item.name || '-'}</span>
      },
      {
        key: 'totalDeals',
        header: 'TOTAL DEALS',
        width: '112px',
        render: (item) => <div className="text-center font-bold text-foreground/80">{getCountVal(item.perCount, 'Total')}</div>
      }
    ];

    dynamicColumns.forEach(colId => {
      cols.push({
        key: colId,
        header: colId,
        render: (item) => <div className="text-center font-medium text-foreground/60">{getCountVal(item.perCount, colId)}</div>
      });
    });

    return cols;
  }, [dynamicColumns]);

  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0">
      {/* Breadcrumbs & Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <span className="text-[10px] text-foreground/40 font-medium">Reports &gt; Deal Report</span>
        </div>
        
        {/* Toggle options & filters */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border/40 rounded-xl text-xs text-foreground/75 outline-none hover:bg-muted/10 transition-all">
            <FontAwesomeIcon icon={faFilter} className="opacity-55 text-[10px]" />
            <span>Filters</span>
          </button>

          <div className="flex rounded-lg bg-muted/20 border border-border/50 p-0.5 h-8 shrink-0">
            <button
              onClick={() => setGroupMode('stage')}
              className={`px-3 flex items-center justify-center rounded-md text-[10px] font-semibold transition-all ${
                groupMode === 'stage'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-foreground/45 hover:text-foreground/75'
              }`}
            >
              By Stage
            </button>
            <button
              onClick={() => setGroupMode('status')}
              className={`px-3 flex items-center justify-center rounded-md text-[10px] font-semibold transition-all ${
                groupMode === 'status'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-foreground/45 hover:text-foreground/75'
              }`}
            >
              By Status
            </button>
          </div>

          <div className="flex items-center gap-2 bg-muted/20 border border-border/50 rounded-lg p-0.5 h-8 shrink-0">
            <span className="text-[9px] font-semibold text-foreground/45 uppercase tracking-wider pl-2.5">Page Size</span>
            <div className="relative group h-full">
              <select
                value={size}
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  setPage(0);
                }}
                className="pl-2 pr-8 h-full bg-transparent text-[10px] font-semibold text-foreground/70 outline-none appearance-none cursor-pointer border-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 text-[8px] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter chips strip */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {activeFilters.map(chip => (
            <span 
              key={chip}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted/30 border border-border/40 rounded-lg text-[10px] font-semibold text-foreground/60 select-none animate-in fade-in zoom-in-95 duration-200"
            >
              {chip}
              <FontAwesomeIcon 
                icon={faTimes} 
                onClick={() => removeFilterChip(chip)}
                className="opacity-50 hover:opacity-100 cursor-pointer text-[9px] transition-opacity" 
              />
            </span>
          ))}
        </div>
      )}

      {/* Table Card container */}
      <div className="bg-card border border-border/40 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        {error ? (
          <div className="w-full h-full flex flex-col items-center justify-center py-20 text-center text-red-400">
            <p className="text-xs font-semibold mb-1">Failed to load report</p>
            <p className="text-[10px] max-w-sm mb-3 opacity-80">{error}</p>
            <button
              onClick={fetchReport}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/95 transition-all text-xs"
            >
              Try Again
            </button>
          </div>
        ) : (
          <DataTable
            data={reportData}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No records found"
            showSerialNumber
            startIndex={page * size}
            page={page}
            size={size}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
