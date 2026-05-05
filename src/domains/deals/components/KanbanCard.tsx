import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faUser, faCalendarAlt, faCircle } from '@fortawesome/free-solid-svg-icons';
import { type DealEntity } from '../api/dealsApi';
import { getStringColorClass } from '@/shared/utils/colorUtils';

interface KanbanCardProps {
  deal: DealEntity;
}

export function KanbanCard({ deal }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: {
      type: 'Deal',
      deal,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group bg-card border border-border p-4 rounded-xl shadow-sm hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing mb-3"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
          {deal.name}
        </h3>
        {deal.tag && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStringColorClass(deal.tag)}`}>
            {deal.tag}
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-foreground/40">
          <FontAwesomeIcon icon={faUser} className="text-[10px]" />
          <span className="text-xs truncate">{deal.productId?.name || 'No Product'}</span>
        </div>

        {deal.nextFollowUp && (
          <div className="flex items-center gap-2 text-foreground/40">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-[10px]" />
            <span className="text-xs">
              {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(deal.nextFollowUp * 1000))}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-foreground/40">
          <FontAwesomeIcon icon={faUser} className="text-[10px]" />
          <span className="text-xs truncate">{deal.assignedUserId?.firstName} {deal.assignedUserId?.lastName}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStringColorClass(deal.status?.name)}`}>
          {deal.status?.name || 'Open'}
        </span>
        <button className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500/20 transition-colors">
          <FontAwesomeIcon icon={faPhone} className="text-[10px]" />
        </button>
      </div>
    </div>
  );
}
