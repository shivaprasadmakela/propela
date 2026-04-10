import { useState, useEffect } from 'react';
import { dealsApi, type DealEntity } from '../api/dealsApi';
import { DataTable, type ColumnDef } from '@/shared/ui/table/DataTable';
import { getStringColorClass } from '@/shared/utils/colorUtils';

export function DealsPage() {
  const [deals, setDeals] = useState<DealEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLiveDeals = async () => {
    setIsLoading(true);
    try {
      const response = await dealsApi.fetchDeals({
        condition: {
          conditions: [], // Blank slate requested
          operator: 'AND',
        },
        eager: true,
        size: 100,
        page: 0,
        sort: {
          property: 'updatedAt',
          direction: 'DESC',
        },
        eagerFields: ['name', 'firstName', 'lastName', 'campaign_name', 'id', 'code'],
      });
      setDeals(response.content || []);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDeals();
  }, []);

  const filteredDeals = deals.filter(
    (d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.code?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnDef<DealEntity>[] = [
    {
      key: 'name',
      header: 'Deal',
      render: (deal) => (
        <span className="text-sm font-medium text-white/90 cursor-pointer hover:text-indigo-400 transition-colors">
          {deal.name || 'Unnamed Deal'}
          <br/>
          <span className="text-xs font-mono text-white/30">{deal.code}</span>
        </span>
      ),
    },
    {
      key: 'assignedUserId',
      header: 'Assigned To',
      render: (deal) => (
        <span className="text-sm text-white/50">
          {deal.assignedUserId?.firstName} {deal.assignedUserId?.lastName}
        </span>
      ),
    },
    {
      key: 'stage',
      header: 'Stage & Status',
      render: (deal) => (
        <div className="flex flex-col gap-1 items-start">
          <span className="text-sm font-semibold text-white/80">{deal.stage?.name || '-'}</span>
          <span className="text-xs text-white/50">{deal.status?.name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
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
      render: (deal) => (
        <span className="text-sm text-white/50">
          {deal.createdAt ? new Date(deal.createdAt * 1000).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Deals</h1>
          <p className="text-sm text-white/40 mt-1">Manage and track your sales pipeline</p>
        </div>
        <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40 transition-all duration-200 hover:-translate-y-0.5 flex items-center gap-2">
          <span className="text-lg leading-none">+</span>
          New Deal
        </button>
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-white/20 text-sm outline-none focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/20 transition-all w-64"
              />
            </div>
            <button className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/50 text-sm hover:bg-white/[0.06] hover:text-white/70 transition-all flex items-center gap-2">
              <span>⫶</span> Filter
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30">{filteredDeals.length} deals</span>
          </div>
        </div>

        {/* Table Mount */}
        <DataTable data={filteredDeals} columns={columns} isLoading={isLoading} />

        {/* Pagination placeholder */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
          <span className="text-xs text-white/30">Showing 1–{filteredDeals.length} of {filteredDeals.length}</span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded-lg text-xs text-white/30 hover:bg-white/[0.04] transition-colors">Prev</button>
            <button className="px-3 py-1.5 rounded-lg text-xs bg-indigo-500/15 text-indigo-400 font-medium">1</button>
            <button className="px-3 py-1.5 rounded-lg text-xs text-white/30 hover:bg-white/[0.04] transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
