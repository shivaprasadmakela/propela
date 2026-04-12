import { useState } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddDealModal({ isOpen, onClose, onSuccess }: AddDealModalProps) {
  const [name, setName] = useState('');
  const [source, setSource] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call or call proper API here
    console.log('Creating deal:', { name, source });
    onClose();
    if (onSuccess) onSuccess();
    
    // Clear form
    setName('');
    setSource('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Deal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1.5">Deal Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            placeholder="e.g. Enterprise License"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1.5">Source</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            placeholder="e.g. Website Signup"
          />
        </div>
        
        <div className="pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground/70 hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 transition-all"
          >
            Create Deal
          </button>
        </div>
      </form>
    </Modal>
  );
}
