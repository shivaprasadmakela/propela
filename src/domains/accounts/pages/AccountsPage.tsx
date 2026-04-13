import { useEffect, useState } from "react";
import { accountApi, type AccountEntity } from "../api/accountApi";
import { DataTable, type ColumnDef, type SortState } from "@/shared/ui/table/DataTable";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import { getStringColorClass } from "@/shared/utils/colorUtils";

export function AccountsPage() {

  const [deals, setDeals] = useState<AccountEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(0);
  const [pageSize] = useState(100);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortState, setSortState] = useState<SortState[]>([{ property: 'updatedAt', direction: 'DESC' }]);

  const toast = useToast();


  const fetchLiveAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await accountApi.fetchAccounts({
        condition: {
          conditions: [], // Blank slate requested
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
    fetchLiveAccounts()
  }, [page, sortState]);


  const columns: ColumnDef<AccountEntity>[] = [

    {
      key: 'name',
      header: 'Deal Name',
      sortable: true,
      render: (deal) => (
        <span className="text-sm font-medium text-foreground/90 cursor-pointer hover:text-primary transition-colors">
          {deal.name || 'Unnamed Deal'}
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
      key: 'createdBy',
      header: 'Created By',
      render: (deal) => (
        <span className="text-sm text-foreground/50">
          {deal.createdBy?.firstName ? `${deal.createdBy.firstName} ${deal.createdBy.lastName || ''}` : '-'}
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

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
        </div>
        <button className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 flex items-center gap-2">
          <span className="text-lg leading-none">+</span>
          New Account
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


