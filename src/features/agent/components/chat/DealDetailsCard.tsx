import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { type DealEntity } from '@/domains/deals/api/dealsApi';
import { getStringColorClass } from '@/shared/utils/colorUtils';

interface DealDetailsCardProps {
  deal: DealEntity | null;
}

export function DealDetailsCard({ deal }: DealDetailsCardProps) {
  const navigate = useNavigate();

  const handleOpenDeal = (code: string) => {
    navigate(`/dealProfile/${code}`);
  };

  if (!deal) {
    return (
      <div className="text-xs text-foreground/40 italic p-2 bg-muted rounded-xl">
        Deal not found.
      </div>
    );
  }

  return (
    <div className="mt-3 bg-card border border-border p-4 rounded-xl shadow-sm space-y-3">
      <div className="flex justify-between items-start border-b border-border pb-2.5">
        <div>
          <h4 className="text-sm font-bold text-foreground">{deal.name}</h4>
          <span className="text-xs text-foreground/50">
            {deal.productId?.name || 'No Product'}
          </span>
        </div>
        <span className="text-xs font-mono bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 rounded">
          {deal.code}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
        <div>
          <span className="text-[10px] text-foreground/40 block">Phone</span>
          <div className="flex items-center gap-1.5 mt-0.5 text-foreground/70">
            <FontAwesomeIcon
              icon={faPhone}
              className="text-[10px] text-foreground/40"
            />
            <span>{deal.phoneNumber || 'N/A'}</span>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-foreground/40 block">Email</span>
          <div className="flex items-center gap-1.5 mt-0.5 text-foreground/70">
            <FontAwesomeIcon
              icon={faEnvelope}
              className="text-[10px] text-foreground/40"
            />
            <span className="truncate">{deal.email || 'N/A'}</span>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-foreground/40 block">Stage / Status</span>
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border mt-1 ${getStringColorClass(
              deal.stage?.name || deal.status?.name
            )}`}
          >
            {deal.stage?.name || deal.status?.name || 'Open'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-foreground/40 block">Source</span>
          <span className="text-foreground/70 mt-0.5 block">
            {deal.source || 'Direct'} {deal.subSource ? `(${deal.subSource})` : ''}
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-border flex gap-2">
        <button
          onClick={() => handleOpenDeal(deal.code)}
          className="flex-1 bg-primary text-primary-foreground text-xs py-1.5 px-3 rounded-lg font-medium hover:bg-primary/95 transition-all text-center"
        >
          Open Deal Profile
        </button>
      </div>
    </div>
  );
}
