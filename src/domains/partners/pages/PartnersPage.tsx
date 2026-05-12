import { useState, useEffect } from 'react';
import { partnerApi, type PartnerEntity } from '../api/partnerApi';
import { DataTable, type ColumnDef } from '@/shared/ui/table/DataTable';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faPlus,
  faChevronDown,
  faInfoCircle,
  faFilter,
  faTable
} from '@fortawesome/free-solid-svg-icons';

export function PartnersPage() {
  const [partners, setPartners] = useState<PartnerEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const toast = useToast();

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const response = await partnerApi.fetchPartners({
        condition: {
          conditions: [
            { conditions: [], operator: 'OR' },
            { conditions: [], operator: 'OR' },
            { conditions: [], operator: 'OR' },
            { conditions: [], operator: 'OR' },
            { conditions: [], operator: 'OR' }
          ],
          operator: 'AND'
        },
        size: 100,
        page: page,
        sort: { property: 'createdAt', direction: 'DESC' }
      });
      setPartners(response.content || []);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
      toast('Failed to load channel partners', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [page]);

  const columns: ColumnDef<PartnerEntity>[] = [
    {
      header: 'S NO.',
      key: 'id',
      render: (_, index) => (page * 100) + index + 1
    },
    {
      header: 'CP NAME',
      key: 'clientName',
      render: (partner) => (
        <span className="font-bold text-foreground/80">{partner.clientId.owners[0].firstName + ' ' + partner.clientId.owners[0].lastName}</span>
      )
    },
    {
      header: 'PHONE NUMBER',
      key: 'userPhones',
      render: (partner) => (
        <span className="font-medium text-foreground/70">{partner.clientId.owners[0].phoneNumber}</span>
      )
    },
    {
      header: 'CP MANAGER',
      key: 'clientManagers',
      render: (partner) => {
        const managers = partner.clientId?.clientManagers;
        if (!managers || managers.length === 0) return '--';
        const firstManager = managers[0];
        const name = `${firstManager.firstName} ${firstManager.lastName || ''}`;
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground/80">{name}</span>
            {managers.length > 1 && (
              <span className="text-[10px] font-bold text-foreground/30 flex items-center gap-1 cursor-help group relative">
                & {managers.length - 1} More <FontAwesomeIcon icon={faInfoCircle} className="text-[9px]" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                  <div className="bg-popover text-popover-foreground text-[10px] p-2 rounded shadow-lg border border-border whitespace-nowrap">
                    {managers.slice(1).map(m => `${m.firstName} ${m.lastName || ''}`).join(', ')}
                  </div>
                </div>
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'NO. OF TEAMMATES',
      key: 'activeUsers',
      render: (partner) => (
        <div className="text-center font-bold text-foreground/80">{partner.activeUsers}</div>
      )
    },
    {
      header: 'NO. DEALS',
      key: 'totalTickets',
      render: (partner) => (
        <div className="text-center font-bold text-foreground/80">{partner.totalTickets}</div>
      )
    },
    {
      header: 'STATUS',
      key: 'active',
      render: (partner) => {
        const isActive = partner.active;
        return (
          <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        );
      }
    },
    {
      header: 'INVITATION STATUS',
      key: 'partnerVerificationStatus',
      render: (partner) => {
        const status = partner.partnerVerificationStatus;
        let colorClasses = 'bg-primary/10 text-primary border-primary/20';
        if (status === 'Verified') colorClasses = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        if (status === 'Invitation Sent') colorClasses = 'bg-pink-500/10 text-pink-500 border-pink-500/20';
        if (status === 'Approval Pending') colorClasses = 'bg-amber-500/10 text-amber-500 border-amber-500/20';

        return (
          <span className={`px-3 py-1 rounded-md text-[10px] font-bold border ${colorClasses}`}>
            {status}
          </span>
        );
      }
    },
    {
      header: 'CREATED AT',
      key: 'createdAt',
      render: (partner) => {
        const timestamp = partner.createdAt;
        return new Intl.DateTimeFormat('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date(timestamp * 1000));
      }
    }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display text-foreground/90">List of Channel Partners</h1>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative group">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors"
          />
          <input
            type="text"
            placeholder="Search by name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-card border border-border/50 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <button className="px-5 py-2.5 rounded-2xl border border-border/50 bg-card text-foreground/60 text-sm font-bold hover:bg-muted/50 transition-all flex items-center gap-2">
            Transfer CP
          </button>
          <button className="px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} className="text-xs" /> Invite CP
          </button>

          <div className="flex items-center gap-2 ml-4">
            <button className="w-10 h-10 rounded-2xl border border-border/50 bg-card text-foreground/40 hover:text-primary flex items-center justify-center transition-all">
              <FontAwesomeIcon icon={faFilter} className="text-xs" />
            </button>
            <button className="w-10 h-10 rounded-2xl border border-border/50 bg-card text-foreground/40 hover:text-primary flex items-center justify-center transition-all">
              <FontAwesomeIcon icon={faTable} className="text-xs" />
            </button>
            <button className="w-10 h-10 rounded-2xl border border-border/50 bg-card text-foreground/40 hover:text-primary flex items-center justify-center transition-all">
              <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
            </button>
          </div>
        </div>
      </div>

      {/* Partners Table */}
      <div className="flex-1 bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-0">
        <DataTable
          columns={columns}
          data={partners}
          isLoading={isLoading}
          size={100}
          page={page}
          totalElements={totalElements}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
