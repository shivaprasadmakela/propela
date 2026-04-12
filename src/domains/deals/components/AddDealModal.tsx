import { useState } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddDealModal({ isOpen, onClose, onSuccess }: AddDealModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [product, setProduct] = useState('');
  const [source, setSource] = useState('');
  const [subSource, setSubSource] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call or call proper API here
    console.log('Creating deal:', { name, phone, email, product, source, subSource });
    onClose();
    if (onSuccess) onSuccess();
    
    // Clear form
    setName('');
    setPhone('');
    setEmail('');
    setProduct('');
    setSource('');
    setSubSource('');
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
              placeholder="user@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1.5">Product</label>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none"
          >
            <option value="">Select a product...</option>
            <option value="Primus">Primus</option>
            <option value="Atlas">Atlas</option>
            <option value="Nexus">Nexus</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none"
            >
              <option value="">Select source...</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Outbound">Outbound</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1.5">Sub Source</label>
            <select
              value={subSource}
              onChange={(e) => setSubSource(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none"
            >
              <option value="">Select sub source...</option>
              <option value="Organic Search">Organic Search</option>
              <option value="Paid Social">Paid Social</option>
              <option value="Cold Call">Cold Call</option>
            </select>
          </div>
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
