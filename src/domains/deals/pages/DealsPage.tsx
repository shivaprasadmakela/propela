import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dealsApi, type DealEntity } from '../api/dealsApi';
import { stagesApi, type StageEntity } from '../../stages/api/stagesApi';
import { productApi, type ProductEntity } from '../../products/api/productApi';
import { DataTable, type ColumnDef, type SortState } from '@/shared/ui/table/DataTable';
import { KanbanView } from '../components/KanbanView';
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
  faCircle,
  faTable,
  faColumns,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';

type ViewMode = 'table' | 'kanban';

export function DealsPage() {
  const [deals, setDeals] = useState<DealEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const [products, setProducts] = useState<ProductEntity[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductEntity | null>(null);
  const [stages, setStages] = useState<StageEntity[]>([]);

  const [page, setPage] = useState(0);
  const [pageSize] = useState(100);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortState, setSortState] = useState<SortState[]>([{ property: 'updatedAt', direction: 'DESC' }]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});

  const toast = useToast();

  const fetchProducts = async () => {
    try {
      const response = await productApi.fetchProducts({
        condition: { conditions: [], operator: 'AND' },
        eager: true,
        size: 100,
        page: 0,
        sort: [{ property: 'name', direction: 'ASC' }],
        eagerFields: ['name', 'id', 'productTemplateId']
      });
      setProducts(response.content || []);
      if (response.content?.length > 0 && !selectedProduct) {
        setSelectedProduct(response.content[0]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchStages = async (productId: number) => {
    const product = products.find(p => p.id === productId) || selectedProduct;
    if (!product?.productTemplateId?.id) return;

    try {
      const response = await stagesApi.fetchStages({
        productTemplateId: product.productTemplateId.id
      });
      setStages(response.content || []);
    } catch (error) {
      console.error('Failed to fetch stages:', error);
    }
  };

  const fetchLiveDeals = async () => {
    setIsLoading(true);
    try {
      // Default structure with 15 empty slots
      let finalCondition = activeFilters?.conditions ? { ...activeFilters } : {
        operator: 'AND',
        conditions: Array(15).fill(null).map(() => ({
          conditions: [] as any[],
          operator: 'OR'
        }))
      };

      // Clone conditions to avoid direct mutation
      const conditions = [...finalCondition.conditions];

      // Slot 0: Search (name)
      if (search.trim()) {
        conditions[0] = {
          operator: 'OR',
          conditions: [
            { field: 'name', operator: 'CONTAINS', value: search.trim() },
            { field: 'code', operator: 'CONTAINS', value: search.trim() }
          ]
        };
      }

      // Slot 6: Product (for Kanban view override)
      if (viewMode === 'kanban' && selectedProduct) {
        conditions[6] = {
          operator: 'OR',
          conditions: [
            { field: 'productId', operator: 'EQUALS', value: selectedProduct.id }
          ]
        };
      }

      const response = await dealsApi.fetchDeals({
        condition: {
          ...finalCondition,
          conditions: conditions
        },
        eager: true,
        size: pageSize,
        page: page,
        sort: sortState,
        eagerFields: ['name', 'firstName', 'lastName', 'campaign_name', 'id', 'code', 'productId', 'createdBy', 'nextFollowUp', 'stage', 'status', 'source', 'subSource', 'tag', 'assignedUserId'],
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
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchLiveDeals();
    if (viewMode === 'kanban' && selectedProduct) {
      fetchStages(selectedProduct.id);
    }
  }, [page, sortState, activeFilters, selectedProduct, viewMode]);

  const handleDealMove = async (dealId: number, toStageId: number) => {
    try {
      await dealsApi.updateDealStage(dealId, toStageId);
      toast('Deal stage updated', 'success');
      fetchLiveDeals();
    } catch (error) {
      console.error('Failed to update deal stage:', error);
      toast('Failed to move deal', 'error');
    }
  };

  const handleSortChange = (property: string) => {
    setSortState((prev) => {
      const existing = prev.find((s) => s.property === property);
      if (existing) {
        if (existing.direction === 'ASC') return [{ property, direction: 'DESC' }];
        return [];
      }
      return [{ property, direction: 'ASC' }];
    });
    setPage(0);
  };

  const filteredDeals = deals.filter(
    (d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.code?.toLowerCase().includes(search.toLowerCase()) ||
      d.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      d.lastName?.toLowerCase().includes(search.toLowerCase())
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
        <span className="text-sm font-bold text-foreground/80">
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
        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium border ${getStringColorClass(deal.status?.name)}`}>
          {deal.status?.name || 'Open'}
        </span>
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
        <span className="text-sm font-medium text-foreground/80">
          {deal.productId?.name || '-'}
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
            ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(deal.createdAt * 1000))
            : '-'}
        </span>
      ),
    },
  ];

  const navigate = useNavigate();
  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      { }
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">List of deals</h1>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} className="text-base" />
          Add deal
        </button>
      </div>

      { }
      <div className="flex-1 rounded-3xl border border-border bg-card overflow-hidden flex flex-col min-h-0 shadow-sm">
        { }
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-xl">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative group flex-1 max-w-sm">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 text-sm group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-muted/30 border border-border/50 text-foreground placeholder-foreground/20 text-sm outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all"
              />
            </div>

            { }
            {viewMode === 'kanban' && (
              <div className="relative group max-w-[240px] w-full animate-in fade-in slide-in-from-left-2 duration-300">
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const prod = products.find(p => p.id === Number(e.target.value));
                    if (prod) setSelectedProduct(prod);
                  }}
                  className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-muted/30 border border-border/50 text-foreground text-sm outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/20 text-xs pointer-events-none" />
              </div>
            )}

            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`w-10 h-10 rounded-2xl border transition-all flex items-center justify-center relative ${hasActiveFilters
                  ? 'bg-primary/5 border-primary/20 text-primary shadow-inner shadow-primary/5'
                  : 'bg-muted/30 border-border/50 text-foreground/40 hover:bg-muted/50 hover:text-foreground/70'
                }`}
            >
              <FontAwesomeIcon icon={faFilter} className="text-sm" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-lg">
                  {Object.keys(activeFilters).length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            { }
            <div className="p-1 rounded-2xl bg-muted/30 border border-border/50 flex gap-1">
              <button
                onClick={() => setViewMode('table')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${viewMode === 'table'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-foreground/30 hover:text-foreground/50'
                  }`}
              >
                <FontAwesomeIcon icon={faTable} className="text-sm" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${viewMode === 'kanban'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-foreground/30 hover:text-foreground/50'
                  }`}
              >
                <FontAwesomeIcon icon={faColumns} className="text-sm" />
              </button>
            </div>

            <div className="flex flex-col items-end pr-1">
              <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest leading-none mb-1">Elements</span>
              <span className="text-xs font-bold text-foreground/60 leading-none">{filteredDeals.length}</span>
            </div>
          </div>
        </div>

        { }
        <div className="flex-1 overflow-hidden flex flex-col bg-muted/5">
          {viewMode === 'table' ? (
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
          ) : (
            <KanbanView
              deals={filteredDeals}
              stages={stages}
              isLoading={isLoading}
              onDealMove={handleDealMove}
            />
          )}
        </div>
      </div>

      <AddDealModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          toast('Deal created successfully', 'success');
          setPage(0);
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
