import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { type DealEntity } from '@/domains/deals/api/dealsApi';
import { getStringColorClass } from '@/shared/utils/colorUtils';

interface DealsListProps {
  deals: DealEntity[];
}

export function DealsList({ deals }: DealsListProps) {
  const navigate = useNavigate();

  const handleOpenDeal = (code: string) => {
    navigate(`/dealProfile/${code}`);
  };

  if (!deals || deals.length === 0) {
    return (
      <div className="text-xs text-foreground/40 italic p-2 bg-muted rounded-xl">
        No deals found matching the search.
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      <div className="text-xs font-semibold text-primary/80 uppercase tracking-wider px-1">
        Found {deals.length} deals:
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {deals.map((deal) => (
          <div
            key={deal.id}
            onClick={() => handleOpenDeal(deal.code)}
            className="bg-card border border-border p-3 rounded-xl shadow-sm hover:border-primary/40 hover:shadow transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors pr-2">
                {deal.name}
              </h4>
              <span className="text-[10px] text-foreground/45 shrink-0 bg-muted px-1.5 py-0.5 rounded font-mono">
                {deal.code}
              </span>
            </div>
            <div className="text-[11px] text-foreground/50 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                <span className="truncate">{deal.productId?.name || 'No Product'}</span>
              </div>
              {deal.nextFollowUp && (
                <div className="flex items-center gap-1.5 text-amber-500/80">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-[9px]" />
                  <span>
                    Followup:{' '}
                    {new Intl.DateTimeFormat('en-US', {
                      month: 'short',
                      day: 'numeric',
                    }).format(new Date(deal.nextFollowUp * 1000))}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between">
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-medium border ${getStringColorClass(
                  deal.stage?.name || deal.status?.name
                )}`}
              >
                {deal.stage?.name || deal.status?.name || 'Open'}
              </span>
              <span className="text-[9px] text-foreground/40 font-mono">
                {deal.assignedUserId?.name ||
                  `${deal.assignedUserId?.firstName || ''} ${
                    deal.assignedUserId?.lastName || ''
                  }`.trim() ||
                  'Unassigned'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
