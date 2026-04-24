import { useEffect, useState } from "react";
import { productApi, type ProductEntity } from "../api/productApi";
import { DataTable, type ColumnDef, type SortState } from "@/shared/ui/table/DataTable";
import { useToast } from "@/shared/ui/toast/ToastProvider";
import { getStringColorClass } from "@/shared/utils/colorUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCopy, 
  faPlus, 
  faMagnifyingGlass, 
  faFilter 
} from "@fortawesome/free-solid-svg-icons";

export function ProductsPage() {
  const [products, setProducts] = useState<ProductEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortState, setSortState] = useState<SortState[]>([
    { property: 'isActive', direction: 'DESC' },
    { property: 'createdAt', direction: 'DESC' }
  ]);

  const toast = useToast();

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productApi.fetchProducts({
        condition: {
          conditions: [],
          operator: 'AND',
        },
        eager: true,
        size: pageSize,
        page: page,
        sort: sortState,
        eagerFields: ['id', 'productTemplateWalkInFormId', 'name', 'code', 'clientCode', 'version', 'isActive', 'createdAt'],
      });
      setProducts(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast('Failed to load products', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, sortState]);

  const columns: ColumnDef<ProductEntity>[] = [
    {
      key: 'name',
      header: 'Product Name',
      sortable: true,
      render: (product) => (
        <div className="flex items-center gap-3">
          {product.logoFileDetail?.url ? (
            <img 
              src={`https://dev.leadzump.ai/${product.logoFileDetail.url}`} 
              alt={product.name}
              className="w-16 h-9 rounded-lg object-contain bg-muted/50 p-1"
            />
          ) : (
            <div className="w-16 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/10">
              {product.name?.substring(0, 2).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-foreground/90 cursor-pointer hover:text-primary transition-colors">
            {product.name || 'Unnamed Product'}
          </span>
        </div>
      ),
    },
    {
      key: 'walkInUrl',
      header: 'WalkIn URL',
      render: (product) => {
        const url = `https://leadzumptest.dev.modlix.com/leadzump/${product.clientCode}/page/walkInForm/${product.code}`;
        return (
          <div className="flex items-center gap-2 max-w-[300px]">
            <span className="text-xs text-foreground/40 truncate font-mono">
              {url}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(url);
                toast('URL copied to clipboard', 'success');
              }}
              className="p-1.5 rounded-lg bg-muted/50 hover:bg-primary/20 hover:text-primary transition-all text-foreground/40"
              title="Copy URL"
            >
              <FontAwesomeIcon icon={faCopy} className="text-xs" />
            </button>
          </div>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      render: (product) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${product.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-foreground/20'}`} />
          <span className={`text-xs font-medium ${product.isActive ? 'text-emerald-500' : 'text-foreground/40'}`}>
            {product.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created On',
      sortable: true,
      render: (product) => (
        <span className="text-sm text-foreground/50">
          {product.createdAt
            ? new Intl.DateTimeFormat('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              }).format(new Date(product.createdAt * 1000))
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
        return [];
      }
      return [{ property, direction: 'ASC' }];
    });
    setPage(0);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase()) ||
      p.clientCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Products</h1>
          <p className="text-sm text-foreground/40 mt-1">Manage and track your products centrally</p>
        </div>
        <button className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 flex items-center gap-2">
          <FontAwesomeIcon icon={faPlus} className="text-base" />
          New Product
        </button>
      </div>

      <div className="flex-1 rounded-2xl border border-border/50 bg-card overflow-hidden flex flex-col min-h-0 shadow-sm">
        {}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30 text-sm" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-background/50 border border-border text-foreground placeholder-foreground/20 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all w-64"
              />
            </div>
            <button className="px-4 py-2 rounded-xl bg-background/50 border border-border text-foreground/50 text-sm hover:bg-muted hover:text-foreground/70 transition-all flex items-center gap-2">
              <FontAwesomeIcon icon={faFilter} /> Filter
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground/30">{filteredProducts.length} products found</span>
          </div>
        </div>

        {}
        <DataTable
          data={filteredProducts}
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
