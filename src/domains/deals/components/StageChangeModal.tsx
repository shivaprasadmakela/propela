import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { type DealEntity } from '../api/dealsApi';
import { type StageEntity } from '../../stages/api/stagesApi';

interface StageChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deal: DealEntity | null;
  fromStage: StageEntity | null;
  toStage: StageEntity | null;
}

export function StageChangeModal({
  isOpen,
  onClose,
  onConfirm,
  deal,
  fromStage,
  toStage,
}: StageChangeModalProps) {
  if (!isOpen || !deal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-xl" />
          </div>
          
          <h2 className="text-xl font-bold text-foreground mb-2">Change Stage?</h2>
          <p className="text-sm text-foreground/50 mb-6">
            You are moving <span className="font-bold text-foreground">{deal.firstName} {deal.lastName}</span>'s deal to a new stage.
          </p>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border mb-8">
            <div className="text-center flex-1">
              <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest block mb-1">From</span>
              <span className="text-sm font-bold text-foreground">{fromStage?.name || 'Unknown'}</span>
            </div>
            
            <div className="px-4 text-foreground/20">
              <FontAwesomeIcon icon={faArrowRight} />
            </div>

            <div className="text-center flex-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">To</span>
              <span className="text-sm font-bold text-primary">{toStage?.name || 'Target'}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground/60 hover:bg-muted transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
            >
              Confirm Move
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
