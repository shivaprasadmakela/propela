import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faChevronRight,
  faCheckCircle,
  faCircleExclamation,
  faCube,
  faMobileScreenButton,
  faHeadset
} from '@fortawesome/free-solid-svg-icons';
import { telephonyApi, type ConnectionEntity } from '../api/telephonyApi';

export function TelephonyProviderPage() {
  const navigate = useNavigate();
  const [connection, setConnection] = useState<ConnectionEntity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnection();
  }, []);

  const loadConnection = async () => {
    setLoading(true);
    try {
      const res = await telephonyApi.fetchConnections('EXOTEL');
      if (res && res.content && res.content.length > 0) {
        setConnection(res.content[0]);
      } else {
        setConnection(null);
      }
    } catch (err) {
      console.error('Failed to load telephony connection:', err);
    } finally {
      setLoading(false);
    }
  };

  const details = connection?.connectionDetails;
  const isConnected = !!details?.accountSid;

  // Which modes the tenant turned on. Connections saved before the configuration
  // screen existed carry no flag, so fall back to whether the Integrations
  // credentials that browser calling needs are present at all.
  const clickToCallOn = isConnected && details?.clickToCallEnabled !== false;
  const browserCallingOn =
    isConnected &&
    (typeof details?.browserCallingEnabled === 'boolean'
      ? details.browserCallingEnabled
      : !!details?.customerId);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span
          onClick={() => navigate('/settings')}
          className="hover:text-foreground cursor-pointer transition-colors"
        >
          Settings
        </span>
        <FontAwesomeIcon icon={faChevronRight} className="text-xs text-muted-foreground/60" />
        <span className="text-foreground font-medium">Telephony</span>
      </div>

      {/* Telephony Header Banner */}
      <div className="bg-[#fef9ee] border border-[#fae5bb] rounded-2xl p-6 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#fa8c16]/10 flex items-center justify-center text-[#fa8c16] shrink-0">
            <FontAwesomeIcon icon={faCube} className="text-lg" />
          </div>
          <div className="flex-1 space-y-1.5">
            <h2 className="text-base font-bold text-[#262626]">Telephony</h2>
            <p className="text-xs text-[#595959] leading-relaxed max-w-4xl">
              Telephony in CRM integrates calling capabilities directly into the platform, allowing
              users to make, receive, and log calls within the CRM. It supports features like call
              recording, click-to-call, call analytics, and automatic activity tracking to streamline
              communication and enhance sales productivity.
            </p>
          </div>
        </div>
      </div>

      {/* Provider Selection Section */}
      <div className="space-y-4 pt-2">
        <h3 className="text-base font-bold text-foreground">Select the Telephony provider</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Exotel Card */}
          <div
            onClick={() => navigate('/settings/telephony/exotel')}
            className="group bg-card border border-border hover:border-primary/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[160px]"
          >
            <div className="flex items-center justify-between">
              {/* Exotel Logo & Name */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black tracking-tight text-[#00b96b] font-sans">
                    exo<span className="text-[#1f2937]">tel</span>
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              {loading ? (
                <span className="text-xs text-muted-foreground animate-pulse">Checking...</span>
              ) : isConnected ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                  <span>Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-full">
                  <FontAwesomeIcon icon={faCircleExclamation} className="text-xs" />
                  <span>Not Connected</span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              Enable Exotel services to streamline communication. Manage calls and SMS integration
              within your system
            </p>

            {isConnected && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <ModeChip
                  icon={faMobileScreenButton}
                  label="Click-to-call"
                  on={clickToCallOn}
                />
                <ModeChip icon={faHeadset} label="Browser calling" on={browserCallingOn} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeChip({
  icon,
  label,
  on
}: {
  icon: IconDefinition;
  label: string;
  on: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${
        on
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-muted text-muted-foreground border-border'
      }`}
    >
      <FontAwesomeIcon icon={icon} className="text-[9px]" />
      <span>{label}</span>
      <span className="opacity-70">{on ? 'On' : 'Off'}</span>
    </span>
  );
}
