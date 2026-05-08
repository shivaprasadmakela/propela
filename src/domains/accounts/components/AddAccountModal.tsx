import { useState, useMemo, useEffect } from 'react';
import { Modal } from '@/shared/ui/modal/Modal';
import { DEAL_SOURCES, DEAL_SUB_SOURCES } from '@/domains/deals/utils/dealConstants';
import { accountApi } from '../api/accountApi';
import { useToast } from '@/shared/ui/toast/ToastProvider';
import { PhoneInput, COUNTRY_CODES, type CountryCode } from '@/shared/ui/form/PhoneInput';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddAccountModal({ isOpen, onClose, onSuccess }: AddAccountModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<CountryCode>(COUNTRY_CODES[0]); // India by default
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('');
  const [subSource, setSubSource] = useState('');
  const [appCode] = useState('leadzump');
  const [clientCode] = useState('FIN');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setName('');
      setPhone('');
      setEmail('');
      setSource('');
      setSubSource('');
      setErrors({});
      setCountry(COUNTRY_CODES[0]);
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (phone && phone.length !== country.length) {
      newErrors.phone = `Phone number must be ${country.length} digits for ${country.name}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const availableSubSources = useMemo(() => {
    return DEAL_SUB_SOURCES[source] || [];
  }, [source]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await accountApi.createAccount({
        name,
        phoneNumber: `${country.dialCode}${phone}`,
        dialCode: Number(country.dialCode.replace('+', '')),
        email,
        source,
        subSource,
        appCode,
        clientCode
      });

      toast('Account created successfully', 'success');
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to create account:', error);
      toast('Failed to create account', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-foreground/40 uppercase tracking-widest mb-2 ml-1">Account Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/30 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            placeholder="e.g. Dummy Account"
          />
        </div>
        <div className="grid gap-4">
          <div>
            <label className="block text-[11px] font-bold text-foreground/40 uppercase tracking-widest mb-2 ml-1">Phone</label>
            <PhoneInput
              value={phone}
              onChange={(val) => {
                setPhone(val);
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              selectedCountry={country}
              onCountryChange={(c) => {
                setCountry(c);
                setPhone('');
                setErrors({ ...errors, phone: '' });
              }}
              error={errors.phone}
            />
            {errors.phone && <p className="text-[11px] text-red-500 mt-1 ml-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-foreground/40 uppercase tracking-widest mb-2 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              className={`w-full px-4 py-2.5 rounded-xl bg-muted/50 border ${errors.email ? 'border-red-500/50' : 'border-border'} text-foreground placeholder-foreground/20 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all`}
              placeholder="user@example.com"
            />
            {errors.email && <p className="text-[11px] text-red-500 mt-1 ml-1">{errors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-foreground/40 uppercase tracking-widest mb-2 ml-1">Source</label>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setSubSource('');
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none"
            >
              <option value="">Select source...</option>
              {DEAL_SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-foreground/40 uppercase tracking-widest mb-2 ml-1">Sub Source</label>
            <select
              value={subSource}
              onChange={(e) => setSubSource(e.target.value)}
              disabled={!source || availableSubSources.length === 0}
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground placeholder-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!source ? 'Select source first...' : availableSubSources.length === 0 ? 'No sub sources' : 'Select sub source...'}
              </option>
              {availableSubSources.map((ss) => (
                <option key={ss} value={ss}>{ss}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground/70 hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
