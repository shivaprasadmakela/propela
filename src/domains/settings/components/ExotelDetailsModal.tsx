import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { telephonyApi, type ConnectionEntity } from '../api/telephonyApi';

interface ExotelDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connection: ConnectionEntity | null;
  onSaveSuccess: (updated: ConnectionEntity) => void;
}

export function ExotelDetailsModal({
  isOpen,
  onClose,
  connection,
  onSaveSuccess,
}: ExotelDetailsModalProps) {
  const [accountSid, setAccountSid] = useState('');
  const [subdomain, setSubdomain] = useState('api.in.exotel.com');
  const [apiKey, setApiKey] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [dialCode, setDialCode] = useState('91');
  const [callerId, setCallerId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connection && connection.connectionDetails) {
      const d = connection.connectionDetails;
      setAccountSid(d.accountSid || '');
      setSubdomain(d.subdomain || 'api.in.exotel.com');
      setApiKey(d.apiKey || '');
      setApiToken(d.apiToken || '');
      
      let num = d.callerId || '';
      if (num.startsWith('+91')) {
        setDialCode('91');
        setCallerId(num.substring(3).trim());
      } else if (num.startsWith('+')) {
        setDialCode(num.substring(1, 3));
        setCallerId(num.substring(3).trim());
      } else {
        setCallerId(num);
      }
    } else {
      setAccountSid('');
      setSubdomain('api.in.exotel.com');
      setApiKey('');
      setApiToken('');
      setCallerId('');
    }
    setError(null);
  }, [connection, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountSid.trim()) {
      setError('Account ID is required');
      return;
    }
    if (!subdomain.trim()) {
      setError('Subdomain is required');
      return;
    }
    if (!apiKey.trim()) {
      setError('API Key is required');
      return;
    }
    if (!apiToken.trim()) {
      setError('API Token is required');
      return;
    }

    setSaving(true);
    setError(null);

    const formattedCallerId = callerId.trim()
      ? (callerId.startsWith('+') ? callerId.trim() : `+${dialCode}${callerId.replace(/\D/g, '')}`)
      : '';

    const payload: Partial<ConnectionEntity> = {
      name: connection?.name || 'exotel_connection',
      connectionType: 'CALL',
      connectionSubType: 'EXOTEL',
      isAppLevel: true,
      onlyThruKIRun: false,
      connectionDetails: {
        // Keep every detail this modal does not edit - the Exotel configuration
        // screen writes browser-calling keys here, and a bare object drops them.
        ...(connection?.connectionDetails || {}),
        accountSid: accountSid.trim(),
        subdomain: subdomain.trim(),
        apiKey: apiKey.trim(),
        apiToken: apiToken.trim(),
        callerId: formattedCallerId,
      },
    };

    try {
      let saved: ConnectionEntity;
      if (connection && connection.id) {
        saved = await telephonyApi.updateConnection(connection.id, payload);
      } else {
        saved = await telephonyApi.createConnection(payload);
      }
      onSaveSuccess(saved);
      onClose();
    } catch (err: any) {
      console.error('Failed to save Exotel details:', err);
      setError(err.message || 'Failed to save Exotel details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">Enter details</h3>
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

          {/* Account ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">
              Account ID<span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={accountSid}
              onChange={(e) => setAccountSid(e.target.value)}
              placeholder="e.g. apyacapitalservices1m"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Subdomain */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">
              Subdomain<span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              placeholder="api.in.exotel.com"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">
              API Key<span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter Exotel API Key"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-xs"
            />
          </div>

          {/* API Token */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">
              API Token<span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Enter Exotel API Token"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-xs"
            />
          </div>

          {/* Default phone number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80">
              Default phone number
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground shrink-0">
                <span className="text-base">🇮🇳</span>
                <span className="text-xs font-medium text-muted-foreground">+91</span>
              </div>
              <input
                type="tel"
                value={callerId}
                onChange={(e) => setCallerId(e.target.value)}
                placeholder="80446 57072"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Actions */}
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
