import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { telephonyApi, type ProductCommEntity, type SourceOption } from '../api/telephonyApi';

interface AddIncomingNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  connectionName: string;
  itemToEdit?: ProductCommEntity | null;
  onSaveSuccess: () => void;
}

export function AddIncomingNumberModal({
  isOpen,
  onClose,
  productId,
  connectionName,
  itemToEdit,
  onSaveSuccess,
}: AddIncomingNumberModalProps) {
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [selectedSourceName, setSelectedSourceName] = useState('');
  const [selectedSubSourceName, setSelectedSubSourceName] = useState('');
  const [dialCode, setDialCode] = useState('91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingSources, setLoadingSources] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSources();
      if (itemToEdit) {
        setSelectedSourceName(itemToEdit.source || '');
        setSelectedSubSourceName(itemToEdit.subSource || '');
        let num = itemToEdit.phoneNumber || '';
        if (num.startsWith('+91')) {
          setDialCode('91');
          setPhoneNumber(num.substring(3).trim());
        } else if (num.startsWith('+')) {
          setDialCode(num.substring(1, 3));
          setPhoneNumber(num.substring(3).trim());
        } else {
          setPhoneNumber(num);
        }
      } else {
        setSelectedSourceName('');
        setSelectedSubSourceName('');
        setPhoneNumber('');
      }
      setError(null);
    }
  }, [isOpen, itemToEdit]);

  const loadSources = async () => {
    setLoadingSources(true);
    try {
      const res = await telephonyApi.fetchSources();
      setSources(res || []);
    } catch (err) {
      console.error('Failed to load sources:', err);
    } finally {
      setLoadingSources(false);
    }
  };

  const selectedSource = sources.find((s) => s.name === selectedSourceName);
  const subSourceOptions = selectedSource?.children || [];

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSourceName(val);
    setSelectedSubSourceName('');
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSourceName) {
      setError('Please select a Source');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Please enter a Phone number');
      return;
    }

    setSaving(true);
    setError(null);

    const formattedPhoneNumber = phoneNumber.startsWith('+')
      ? phoneNumber.trim()
      : `+${dialCode}${phoneNumber.replace(/\D/g, '')}`;

    const payload: Partial<ProductCommEntity> = {
      connectionName: connectionName || 'exotel_connection',
      connectionType: 'CALL',
      connectionSubType: 'EXOTEL',
      productId: Number(productId),
      dialCode: Number(dialCode),
      phoneNumber: formattedPhoneNumber,
      source: selectedSourceName,
      subSource: selectedSubSourceName || undefined,
      default: false,
      active: true,
    };

    try {
      if (itemToEdit && itemToEdit.code) {
        await telephonyApi.updateProductCommByCode(itemToEdit.code, payload);
      } else {
        await telephonyApi.createProductComm(payload);
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save incoming number:', err);
      setError(err.message || 'Failed to save incoming number');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">
            {itemToEdit ? 'Edit Incoming number' : 'Add Incoming number'}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faXmark} className="text-base" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          {/* Source Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">
              Source<span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedSourceName}
              onChange={handleSourceChange}
              disabled={loadingSources}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              <option value="">Select Source</option>
              {sources.map((s) => (
                <option key={s.id || s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sub Source Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">Sub source</label>
            <select
              value={selectedSubSourceName}
              onChange={(e) => setSelectedSubSourceName(e.target.value)}
              disabled={!selectedSourceName || subSourceOptions.length === 0}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="">Select Sub source</option>
              {subSourceOptions.map((sub) => (
                <option key={sub.id || sub.name} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Default Call Numbers */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">
              Default Call numbers<span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground shrink-0">
                <span className="text-base">🇮🇳</span>
                <span className="text-xs font-medium text-muted-foreground">+91</span>
              </div>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="80446 57072"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-6 bg-[#262626] hover:bg-[#1f1f1f] text-white font-semibold rounded-2xl text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
