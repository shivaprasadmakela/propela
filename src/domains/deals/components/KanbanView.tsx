import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { StageChangeModal } from './StageChangeModal';
import { type DealEntity } from '../api/dealsApi';
import { type StageEntity } from '../../stages/api/stagesApi';

interface KanbanViewProps {
  deals: DealEntity[];
  stages: StageEntity[];
  isLoading: boolean;
  onDealMove: (dealId: number, toStageId: number) => void;
}

export function KanbanView({ deals, stages, isLoading, onDealMove }: KanbanViewProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [pendingMove, setPendingMove] = useState<{ dealId: number; toStageId: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const groupedDeals = useMemo(() => {
    const groups: Record<number, DealEntity[]> = {};
    stages.forEach((s) => {
      groups[s.id] = deals.filter((d) => d.stage?.id === s.id);
    });
    return groups;
  }, [deals, stages]);

  const activeDeal = useMemo(
    () => deals.find((d) => d.id === activeId),
    [activeId, deals]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const dealId = active.id as number;
    let toStageId: number | null = null;

    // Check if dropped on a column or a card
    const overId = over.id as number;
    if (stages.some(s => s.id === overId)) {
      toStageId = overId;
    } else {
      // Find stage of the card we dropped on
      const overDeal = deals.find(d => d.id === overId);
      if (overDeal && overDeal.stage) {
        toStageId = overDeal.stage.id;
      }
    }

    if (toStageId) {
      const deal = deals.find(d => d.id === dealId);
      if (deal && deal.stage?.id !== toStageId) {
        setPendingMove({ dealId, toStageId });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-foreground/40 font-medium">Organizing pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto min-h-0">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-4 h-full min-w-max">
          {stages.sort((a, b) => a.order - b.order).map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              deals={groupedDeals[stage.id] || []}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeId && activeDeal ? (
            <div className="w-[280px] rotate-3 scale-105 shadow-2xl">
              <KanbanCard deal={activeDeal} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <StageChangeModal
        isOpen={!!pendingMove}
        onClose={() => setPendingMove(null)}
        onConfirm={() => {
          if (pendingMove) {
            onDealMove(pendingMove.dealId, pendingMove.toStageId);
            setPendingMove(null);
          }
        }}
        deal={deals.find(d => d.id === pendingMove?.dealId) || null}
        fromStage={deals.find(d => d.id === pendingMove?.dealId)?.stage || null}
        toStage={stages.find(s => s.id === pendingMove?.toStageId) || null}
      />
    </div>
  );
}
