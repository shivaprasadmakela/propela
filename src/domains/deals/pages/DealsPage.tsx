import { useState, useEffect } from 'react';
import { dealsApi, type DealEntity } from '../api/dealsApi';
import { DataTable, type ColumnDef, type SortState } from '@/shared/ui/table/DataTable';
import { getStringColorClass } from '@/shared/utils/colorUtils';
import { useToast } from '@/shared/ui/toast/ToastProvider';

export function DealsPage() {
  const [deals, setDeals] = useState<DealEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination & Sorting State
  const [page, setPage] = useState(0);
  const [pageSize] = useState(100);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortState, setSortState] = useState<SortState[]>([{ property: 'updatedAt', direction: 'DESC' }]);

  const toast = useToast();

  const fetchLiveDeals = async () => {
    setIsLoading(true);
    try {
      const response = await dealsApi.fetchDeals({
        condition: {
          conditions: [], // Blank slate requested
          operator: 'AND',
        },
        eager: true,
        size: pageSize,
        page: page,
        sort: sortState,
        eagerFields: ['name', 'firstName', 'lastName', 'campaign_name', 'id', 'code'],
      });
      setDeals(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
      toast('Failed to load deals', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDeals();
  }, [page, sortState]);

  const handleSortChange = (property: string) => {
    setSortState((prev) => {
      const existing = prev.find((s) => s.property === property);
      if (existing) {
        if (existing.direction === 'ASC') return [{ property, direction: 'DESC' }];
        return []; // Clear sort
      }
      return [{ property, direction: 'ASC' }];
    });
    setPage(0); // Reset to first page on sort
  };

  const filteredDeals = deals.filter(
    (d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.code?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<DealEntity>[] = [
    {
      key: 'name',
      header: 'Deal',
      sortable: true,
      render: (deal) => {
        const dealIdDisplay = `D${String(deal.id).padStart(10, '0')}`;
        return (
          <span className="text-sm font-medium text-foreground/90 cursor-pointer hover:text-primary transition-colors">
            {deal.name || 'Unnamed Deal'}
            <br/>
            <span 
              className="text-xs font-mono text-foreground/40 hover:text-foreground/80 flex items-center gap-1 mt-0.5"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(dealIdDisplay);
                toast(`Copied ${dealIdDisplay}`, 'success');
              }}
              title="Copy Deal ID"
            >
              {dealIdDisplay} <span className="opacity-50">⎘</span>
            </span>
          </span>
        );
      },
    },
    {
      key: 'assignedUserId',
      header: 'Assigned To',
      render: (deal) => (
        <span className="text-sm text-foreground/50">
          {deal.assignedUserId?.firstName} {deal.assignedUserId?.lastName}
        </span>
      ),
    },
    {
      key: 'stage',
      header: 'Stage & Status',
      render: (deal) => (
        <div className="flex flex-col gap-1 items-start">
          <span className="text-sm font-semibold text-foreground/80">{deal.stage?.name || '-'}</span>
          <span className="text-xs text-foreground/50">{deal.status?.name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      render: (deal) => (
        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${getStringColorClass(deal.source)}`}>
          {deal.source || 'Unknown'}
        </span>
      ),
    },
    {
      key: 'subSource',
      header: 'Sub Source',
      render: (deal) => (
        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${getStringColorClass(deal.subSource)}`}>
          {deal.subSource || '-'}
        </span>
      ),
    },
    {
      key: 'tag',
      header: 'Tag',
      render: (deal) => (
        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${getStringColorClass(deal.tag)}`}>
          {deal.tag || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created On',
      sortable: true,
      render: (deal) => (
        <span className="text-sm text-foreground/50">
          {deal.createdAt 
            ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(deal.createdAt * 1000)) 
            : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deals</h1>
        </div>
        <button className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2">
          <span className="text-lg leading-none">+</span>
          New Deal
        </button>
      </div>

      {/* Table card */}
      <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden flex flex-col min-h-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/20 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all w-64"
              />
            </div>
            <button className="px-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground/50 text-sm hover:bg-muted hover:text-foreground/70 transition-all flex items-center gap-2">
              <span>⫶</span> Filter
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground/30">{filteredDeals.length} deals</span>
          </div>
        </div>

        {/* Table Mount */}
        <DataTable 
          data={filteredDeals} 
          columns={columns} 
          isLoading={isLoading}
          showSerialNumber
          startIndex={page * pageSize}
          sortState={sortState}
          onSortChange={handleSortChange}
          page={page}
          size={pageSize}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
