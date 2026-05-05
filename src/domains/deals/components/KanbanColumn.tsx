import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import { KanbanCard } from './KanbanCard';
import { type DealEntity } from '../api/dealsApi';
import { type StageEntity } from '../../stages/api/stagesApi';

interface KanbanColumnProps {
  stage: StageEntity;
  deals: DealEntity[];
}

export function KanbanColumn({ stage, deals }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] h-full bg-muted/30 rounded-2xl border border-border/50">
      <div className="p-4 flex items-center justify-between border-b border-border/30">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-foreground truncate max-w-[140px]">{stage.name}</h2>
          <span className="bg-primary/5 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/10">
            {deals.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-6 h-6 rounded-lg hover:bg-muted text-foreground/30 hover:text-foreground/60 transition-colors">
            <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
          </button>
          <button className="w-6 h-6 rounded-lg hover:bg-muted text-foreground/30 hover:text-foreground/60 transition-colors">
            <FontAwesomeIcon icon={faEllipsisV} className="text-[10px]" />
          </button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[200px]"
      >
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <KanbanCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>
        
        {deals.length === 0 && (
          <div className="h-24 border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center">
            <span className="text-[10px] text-foreground/20 font-medium uppercase tracking-widest">No deals</span>
          </div>
        )}
      </div>
    </div>
  );
}
