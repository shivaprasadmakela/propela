import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dealsApi, type DealEntity } from '../api/dealsApi';
import { DataTable, type ColumnDef, type SortState } from '@/shared/ui/table/DataTable';
import { getStringColorClass } from '@/shared/utils/colorUtils';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { AddDealModal } from '../components/AddDealModal';
import { DealFilterModal } from '../components/DealFilterModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faFilter,
  faPlus,
  faUpRightFromSquare,
  faCopy,
  faCircle
} from '@fortawesome/free-solid-svg-icons';

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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});

  const toast = useToast();

  const fetchLiveDeals = async () => {
    setIsLoading(true);
    try {
      const conditions: any[] = [];
      
      // If we have search, it's already filtered locally in this implementation 
      // but usually we'd add it to conditions for server-side search.
      
      const response = await dealsApi.fetchDeals({
        condition: {
          conditions: conditions,
          operator: 'AND',
        },
        eager: true,
        size: pageSize,
        page: page,
        sort: sortState,
        eagerFields: ['name', 'firstName', 'lastName', 'campaign_name', 'id', 'code', 'productId', 'createdBy', 'nextFollowUp'],
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
  }, [page, sortState, activeFilters]);

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
      key: 'id',
      header: 'Deal ID',
      sortable: true,
      render: (deal) => {
        const dealIdDisplay = `D${String(deal.id).padStart(10, '0')}`;
        return (
          <span
            className="text-xs font-mono text-foreground/60 hover:text-primary cursor-pointer flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(dealIdDisplay);
              toast(`Copied ${dealIdDisplay}`, 'success');
            }}
            title="Copy Deal ID"
          >
            {dealIdDisplay} <FontAwesomeIcon icon={faCopy} className="opacity-50" />
          </span>
        );
      },
    },
    {
      key: 'name',
      header: 'Deal Name',
      sortable: true,
      render: (deal) => (
        <span className="text-sm text-foreground/50">
          {deal.name}
        </span>
      ),
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
      header: 'Stage',
      sortable: true,
      render: (deal) => (
        <span className="text-sm font-medium text-foreground/80">{deal.stage?.name || '-'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (deal) => (
        <span className="text-sm text-foreground/70">{deal.status?.name || '-'}</span>
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
      key: 'productId',
      header: 'Product',
      sortable: true,
      render: (deal) => (
        <span
          className="text-sm font-medium text-foreground/80 cursor-pointer transition-colors flex items-center gap-1"

        >
          {deal.productId?.name || '-'}
        </span>
      ),
    },
    {
      key: 'createdBy',
      header: 'Created By',
      render: (deal) => (
        <span className="text-sm text-foreground/50">
          {deal.createdBy?.firstName ? `${deal.createdBy.firstName} ${deal.createdBy.lastName || ''}` : '-'}
        </span>
      ),
    },
    {
      key: 'nextFollowUp',
      header: 'Next Follow Up',
      sortable: true,
      render: (deal) => (
        <span className="text-sm text-foreground/50">
          {deal.nextFollowUp
            ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(deal.nextFollowUp * 1000))
            : '-'}
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

  const navigate = useNavigate();

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deals</h1>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} className="text-base" />
          New Deal
        </button>
      </div>

      {/* Table card */}
      <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden flex flex-col min-h-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm" />
              <input
                type="text"
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/20 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all w-64"
              />
            </div>
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className={`px-4 py-2 rounded-xl border text-sm transition-all flex items-center gap-2 ${
                hasActiveFilters 
                  ? 'bg-primary/10 border-primary/50 text-primary hover:bg-primary/20' 
                  : 'bg-muted/50 border-border text-foreground/50 hover:bg-muted hover:text-foreground/70'
              }`}
            >
              <div className="relative">
                <FontAwesomeIcon icon={faFilter} />
                {hasActiveFilters && (
                  <FontAwesomeIcon icon={faCircle} className="absolute -top-1 -right-1 text-[6px] text-primary" />
                )}
              </div>
              Filter
              {hasActiveFilters && (
                <span className="bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center ml-1">
                  {Object.keys(activeFilters).length}
                </span>
              )}
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
          onRowClick={(deal) => navigate(`/dealProfile/${deal.code}`)}
        />
      </div>

      <AddDealModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          toast('Deal created successfully', 'success');
          setPage(0); // Optional: reload deals list
          fetchLiveDeals();
        }}
      />

      <DealFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={(filters) => {
          setActiveFilters(filters);
          setPage(0);
        }}
      />
    </div>
  );
}
