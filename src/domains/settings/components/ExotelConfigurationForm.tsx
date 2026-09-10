import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faMobileScreenButton,
  faHeadset,
  faKey,
  faPlug,
  faSliders,
  faLifeRing,
  faCheck,
  faEye,
  faEyeSlash,
  faCircleInfo,
  faTriangleExclamation,
  faChevronDown,
  faRotate,
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  telephonyApi,
  type ConnectionEntity,
  type ExotelConnectionDetails,
  type CallAppStatus,
} from "../api/telephonyApi";

/* ------------------------------------------------------------------ */
/* Form model                                                          */
/* ------------------------------------------------------------------ */

interface FormState {
  clickToCall: boolean;
  browserCalling: boolean;

  // Telephony API — click-to-call
  accountSid: string;
  subdomain: string;
  apiKey: string;
  apiToken: string;
  dialCode: string;
  callerId: string;

  // Integrations Core — browser calling
  customerId: string;
  customerSecret: string;
  exotelDomain: string;
  appName: string;
  callbackUrl: string;

  // Inbound connect applet
  overrideInbound: boolean;
  maxRingingDuration: string;
  record: boolean;
  fetchAfterAttempt: boolean;
  dialPassthruEventUrl: string;

  // Recovery
  appId: string;
  appSecret: string;
}

const EMPTY: FormState = {
  clickToCall: true,
  browserCalling: false,
  accountSid: "",
  subdomain: "api.in.exotel.com",
  apiKey: "",
  apiToken: "",
  dialCode: "91",
  callerId: "",
  customerId: "",
  customerSecret: "",
  exotelDomain: "@in.exotel.com",
  appName: "",
  callbackUrl: "",
  overrideInbound: false,
  maxRingingDuration: "30",
  record: true,
  fetchAfterAttempt: true,
  dialPassthruEventUrl: "",
  appId: "",
  appSecret: "",
};

/** Splits a stored E.164 caller id back into a dial code and a local number. */
function splitCallerId(raw: string): { dialCode: string; number: string } {
  const value = (raw || "").trim();
  if (value.startsWith("+91")) return { dialCode: "91", number: value.slice(3).trim() };
  if (value.startsWith("+")) return { dialCode: value.slice(1, 3), number: value.slice(3).trim() };
  return { dialCode: "91", number: value };
}

function toForm(details?: ExotelConnectionDetails | null): FormState {
  if (!details) return { ...EMPTY };
  const caller = splitCallerId(details.callerId || "");

  // Browser calling is on when the operator said so, or — for connections saved
  // before this screen existed — when the Integrations credentials are present.
  const browserCalling =
    typeof details.browserCallingEnabled === "boolean"
      ? details.browserCallingEnabled
      : !!(details.customerId || details.customerSecret);

  const overrideInbound =
    details.maxRingingDuration !== undefined ||
    details.record !== undefined ||
    details.fetchAfterAttempt !== undefined ||
    !!details.dialPassthruEventUrl;

  return {
    clickToCall: details.clickToCallEnabled !== false,
    browserCalling,
    accountSid: details.accountSid || "",
    subdomain: details.subdomain || EMPTY.subdomain,
    apiKey: details.apiKey || "",
    apiToken: details.apiToken || "",
    dialCode: caller.dialCode,
    callerId: caller.number,
    customerId: details.customerId || "",
    customerSecret: details.customerSecret || "",
    exotelDomain: details.exotelDomain || EMPTY.exotelDomain,
    appName: details.appName || "",
    callbackUrl: details.callbackUrl || "",
    overrideInbound,
    maxRingingDuration:
      details.maxRingingDuration !== undefined ? String(details.maxRingingDuration) : "30",
    record: details.record !== undefined ? !!details.record : true,
    fetchAfterAttempt:
      details.fetchAfterAttempt !== undefined ? !!details.fetchAfterAttempt : true,
    dialPassthruEventUrl: details.dialPassthruEventUrl || "",
    appId: details.appId || "",
    appSecret: details.appSecret || "",
  };
}

interface MissingField {
  label: string;
  section: string;
}

/** Required fields still blank for the modes the operator has turned on. */
function missingFields(f: FormState): MissingField[] {
  const missing: MissingField[] = [];
  const need = (ok: boolean, label: string, section: string) => {
    if (!ok) missing.push({ label, section });
  };

  need(!!f.accountSid.trim(), "Account SID", "Exotel account");
  need(!!f.subdomain.trim(), "API subdomain", "Exotel account");
  need(!!f.apiKey.trim(), "API key", "Exotel account");
  need(!!f.apiToken.trim(), "API token", "Exotel account");

  if (f.clickToCall) {
    need(!!f.callerId.trim(), "Default caller ID", "Click-to-call");
  }

  if (f.browserCalling) {
    need(!!f.customerId.trim(), "Customer ID", "Browser calling");
    need(!!f.customerSecret.trim(), "Customer secret", "Browser calling");
    need(!!f.exotelDomain.trim(), "Exotel domain", "Browser calling");
    need(!!f.appName.trim(), "Voice app name", "Browser calling");
    need(!!f.callbackUrl.trim(), "Callback URL", "Browser calling");
  }

  return missing;
}

/* ------------------------------------------------------------------ */
/* Presentational building blocks                                      */
/* ------------------------------------------------------------------ */

const INPUT_CLASS =
  "w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground " +
  "placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary/20 " +
  "focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed";

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  mono?: boolean;
  secret?: boolean;
  type?: string;
  disabled?: boolean;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  hint,
  mono,
  secret,
  type = "text",
  disabled,
}: FieldProps) {
  const [revealed, setRevealed] = useState(false);
  const isBlank = required && !value.trim();

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-rose-500">*</span>}
      </label>

      <div className="relative">
        <input
          type={secret && !revealed ? "password" : type}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${INPUT_CLASS} ${mono || secret ? "font-mono text-xs" : ""} ${
            secret ? "pr-10" : ""
          } ${isBlank ? "border-amber-300" : ""}`}
        />
        {secret && (
          <button
            type="button" tabIndex={-1}
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? `Hide ${label}` : `Show ${label}`}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={revealed ? faEyeSlash : faEye} className="text-xs" />
          </button>
        )}
      </div>

      {hint && <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  );
}

interface SectionProps {
  icon: IconDefinition;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

function Section({ icon, title, subtitle, badge, children }: SectionProps) {
  return (
    <section className="bg-card border border-border rounded-3xl shadow-xs overflow-hidden">
      <header className="flex items-start gap-3.5 px-6 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-muted/60 text-foreground/70 flex items-center justify-center shrink-0">
          <FontAwesomeIcon icon={icon} className="text-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 flex-wrap">
            <span>{title}</span>
            {badge}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>
        </div>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button" role="switch" aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
        checked ? "bg-primary" : "bg-muted-foreground/25"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

interface ModeCardProps {
  icon: IconDefinition;
  title: string;
  tagline: string;
  bullets: string[];
  enabled: boolean;
  onToggle: (v: boolean) => void;
  ready: boolean;
}

function ModeCard({ icon, title, tagline, bullets, enabled, onToggle, ready }: ModeCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        enabled ? "bg-muted/30 border-primary/40 shadow-xs" : "bg-card border-border"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          <FontAwesomeIcon icon={icon} className="text-base" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-foreground">{title}</h4>
            {enabled &&
              (ready ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <FontAwesomeIcon icon={faCheck} className="text-[8px]" />
                  Configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  Needs details
                </span>
              ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tagline}</p>
        </div>

        <Switch checked={enabled} onChange={onToggle} label={`Enable ${title}`} />
      </div>

      <ul className="mt-4 pt-4 border-t border-border/70 space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-[11px] text-muted-foreground">
            <FontAwesomeIcon
              icon={faCheck}
              className={`text-[9px] mt-[3px] shrink-0 ${
                enabled ? "text-primary" : "text-muted-foreground/40"
              }`}
            />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Callout({
  tone,
  icon,
  children,
}: {
  tone: "info" | "warn" | "error" | "success";
  icon: IconDefinition;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    info: "bg-muted/40 border-border text-muted-foreground",
    warn: "bg-amber-50 border-amber-200 text-amber-800",
    error:
      "bg-rose-50 border-rose-200 text-rose-700",
    success:
      "bg-emerald-50 border-emerald-200 text-emerald-800",
  };
  return (
    <div className={`flex items-start gap-2.5 p-3.5 rounded-2xl border text-xs ${tones[tone]}`}>
      <FontAwesomeIcon icon={icon} className="text-xs mt-0.5 shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main form                                                           */
/* ------------------------------------------------------------------ */

interface Props {
  connection: ConnectionEntity | null;
  appStatus: CallAppStatus | null;
  onSaved: (updated: ConnectionEntity) => void;
  onRegisterApp: () => Promise<void>;
  registering: boolean;
  registerError: string | null;
}

export function ExotelConfigurationForm({
  connection,
  appStatus,
  onSaved,
  onRegisterApp,
  registering,
  registerError,
}: Props) {
  const [form, setForm] = useState<FormState>(() => toForm(connection?.connectionDetails));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    setForm(toForm(connection?.connectionDetails));
    setError(null);
    setSaved(false);
  }, [connection]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const missing = useMemo(() => missingFields(form), [form]);
  const accountReady = !missing.some((m) => m.section === "Exotel account");
  const clickToCallReady = accountReady && !missing.some((m) => m.section === "Click-to-call");
  const browserReady = accountReady && !missing.some((m) => m.section === "Browser calling");
  const noModeSelected = !form.clickToCall && !form.browserCalling;
  // Saved Integrations details survive the mode being switched off, so say so
  // rather than letting the disappearing fields read as data loss.
  const hasStoredIntegrations = !!(
    connection?.connectionDetails?.customerId || connection?.connectionDetails?.customerSecret
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (noModeSelected) {
      setError("Enable at least one calling mode.");
      return;
    }
    if (missing.length > 0) {
      setError(`Fill the required details first: ${missing.map((m) => m.label).join(", ")}.`);
      return;
    }

    const digits = form.callerId.replace(/\D/g, "");
    const callerId = form.callerId.trim()
      ? form.callerId.trim().startsWith("+")
        ? form.callerId.trim()
        : `+${form.dialCode}${digits}`
      : "";

    // Keep any detail this screen does not know about, then lay ours over it.
    const details: ExotelConnectionDetails = {
      ...(connection?.connectionDetails || {}),
      accountSid: form.accountSid.trim(),
      subdomain: form.subdomain.trim(),
      apiKey: form.apiKey.trim(),
      apiToken: form.apiToken.trim(),
      callerId,
      clickToCallEnabled: form.clickToCall,
      browserCallingEnabled: form.browserCalling,
    };

    // A blank optional detail is removed rather than written as "", because the
    // backend reads a present-but-empty key as configured.
    const drop = (key: string) => {
      delete details[key];
    };

    // Turning browser calling off flips the flag but KEEPS the Integrations
    // credentials. Deleting them would make an accidental toggle destroy details
    // the operator had to fetch from Exotel, and the flag alone already says the
    // mode is off.
    if (form.browserCalling) {
      details.customerId = form.customerId.trim();
      details.customerSecret = form.customerSecret.trim();
      details.exotelDomain = form.exotelDomain.trim();
      details.appName = form.appName.trim();
      details.callbackUrl = form.callbackUrl.trim();
    }

    if (form.browserCalling && form.overrideInbound) {
      details.maxRingingDuration = Number(form.maxRingingDuration) || 30;
      details.record = form.record;
      details.fetchAfterAttempt = form.fetchAfterAttempt;
      if (form.dialPassthruEventUrl.trim()) {
        details.dialPassthruEventUrl = form.dialPassthruEventUrl.trim();
      } else {
        drop("dialPassthruEventUrl");
      }
    } else {
      // Applet tuning only means anything for inbound browser calls, and an
      // absent key is how the provider default is requested.
      ["maxRingingDuration", "record", "fetchAfterAttempt", "dialPassthruEventUrl"].forEach(drop);
    }

    if (form.browserCalling && form.appId.trim() && form.appSecret.trim()) {
      details.appId = form.appId.trim();
      details.appSecret = form.appSecret.trim();
    } else {
      ["appId", "appSecret"].forEach(drop);
    }

    const payload: Partial<ConnectionEntity> = {
      name: connection?.name || "exotel_connection",
      connectionType: "CALL",
      connectionSubType: "EXOTEL",
      isAppLevel: true,
      onlyThruKIRun: false,
      connectionDetails: details,
    };

    setSaving(true);
    try {
      const result = connection?.id
        ? await telephonyApi.updateConnection(connection.id, payload)
        : await telephonyApi.createConnection(payload);
      setSaved(true);
      onSaved(result);
    } catch (err: any) {
      console.error("Failed to save Exotel configuration:", err);
      setError(err?.message || "Failed to save the Exotel configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ---------------- Calling modes ---------------- */}
      <Section
        icon={faPlug}
        title="Calling modes" subtitle="Pick how your agents place and take calls. Each mode reaches Exotel through a different API, so each asks for its own details below."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ModeCard
            icon={faMobileScreenButton}
            title="Click-to-call" tagline="Exotel rings the agent's mobile first, then dials the customer and bridges the two." bullets={[
              "Uses the Exotel Telephony (v1) API",
              "No browser permissions or headset needed",
              "Needs a virtual number as the outbound caller ID",
            ]}
            enabled={form.clickToCall}
            onToggle={(v) => set("clickToCall", v)}
            ready={clickToCallReady}
          />

          <ModeCard
            icon={faHeadset}
            title="Browser calling (WebRTC)" tagline="The agent takes the call on a headset in the CRM. Inbound rings the browser first, the desk phone after." bullets={[
              "Uses the Exotel Integrations Core API — a second credential pair",
              "Registers a voice app at Exotel and needs a callback URL",
              "Requires VoIP–PSTN intermix enabled on the Exotel account",
            ]}
            enabled={form.browserCalling}
            onToggle={(v) => set("browserCalling", v)}
            ready={browserReady}
          />
        </div>

        {noModeSelected && (
          <div className="mt-4">
            <Callout tone="warn" icon={faTriangleExclamation}>
              No calling mode is enabled — agents will not be able to place calls from the CRM.
            </Callout>
          </div>
        )}

        {!form.browserCalling && hasStoredIntegrations && (
          <div className="mt-4">
            <Callout tone="info" icon={faCircleInfo}>
              Browser calling is off. Your Integrations credentials are kept, so turning it back on
              does not mean fetching them from Exotel again.
            </Callout>
          </div>
        )}
      </Section>

      {/* ---------------- Exotel account ---------------- */}
      <Section
        icon={faKey}
        title="Exotel account" subtitle="Your Telephony API credentials. Both calling modes need these; click-to-call is placed with them directly." badge={
          accountReady ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Complete
            </span>
          ) : undefined
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
          <Field
            label="Account SID"required
            value={form.accountSid}
            onChange={(v) => set("accountSid", v)}
            placeholder="e.g. acmecapitalservices1m" hint="Found under Settings → API in the Exotel dashboard."
          />
          <Field
            label="API subdomain"required
            mono
            value={form.subdomain}
            onChange={(v) => set("subdomain", v)}
            placeholder="api.in.exotel.com" hint="Region host for the Telephony API. Indian accounts use api.in.exotel.com."
          />
          <Field
            label="API key"required
            mono
            value={form.apiKey}
            onChange={(v) => set("apiKey", v)}
            placeholder="Exotel API key"
          />
          <Field
            label="API token"required
            secret
            value={form.apiToken}
            onChange={(v) => set("apiToken", v)}
            placeholder="Exotel API token"
          />

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
              <span>Default caller ID</span>
              {form.clickToCall && <span className="text-rose-500">*</span>}
            </label>
            <div className="flex items-center gap-2">
              <select
                value={form.dialCode}
                onChange={(e) => set("dialCode", e.target.value)}
                className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer shrink-0"
              >
                <option value="91">🇮🇳 +91</option>
                <option value="1">🇺🇸 +1</option>
                <option value="44">🇬🇧 +44</option>
                <option value="971">🇦🇪 +971</option>
              </select>
              <input
                type="tel" value={form.callerId}
                onChange={(e) => set("callerId", e.target.value)}
                placeholder="80446 57072" className={INPUT_CLASS}
              />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              The Exotel virtual number customers see. Per-product numbers are set under{" "}
              <span className="font-medium text-foreground/70">Products &amp; phone numbers</span>.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------------- Browser calling ---------------- */}
      {form.browserCalling && (
        <Section
          icon={faHeadset}
          title="Browser calling — Integrations Core" subtitle="A separate credential pair and the voice app Exotel registers for this tenant. Registration is refused until all five are filled." badge={
            appStatus?.initialized ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <FontAwesomeIcon icon={faCircleCheck} className="text-[9px]" />
                Voice app registered
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                <FontAwesomeIcon icon={faCircleXmark} className="text-[9px]" />
                Voice app not registered
              </span>
            )
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
            <Field
              label="Customer ID"required
              mono
              value={form.customerId}
              onChange={(v) => set("customerId", v)}
              placeholder="Integrations customer ID" hint="Issued for the Integrations API — not the same as the Account SID."
            />
            <Field
              label="Customer secret"required
              secret
              value={form.customerSecret}
              onChange={(v) => set("customerSecret", v)}
              placeholder="Integrations customer secret"
            />
            <Field
              label="Exotel domain"required
              mono
              value={form.exotelDomain}
              onChange={(v) => set("exotelDomain", v)}
              placeholder="@in.exotel.com" hint="Your account's region, spelled exactly as Exotel spells it."
            />
            <Field
              label="Voice app name"required
              value={form.appName}
              onChange={(v) => set("appName", v)}
              placeholder="e.g. propela-voice" hint="The name operators will find this app under in the Exotel dashboard."
            />
            <div className="md:col-span-2">
              <Field
                label="Callback URL"required
                mono
                value={form.callbackUrl}
                onChange={(v) => set("callbackUrl", v)}
                placeholder="https://your-host/api/message/call/callback/exotel" hint="Used verbatim — no path is appended and no host is derived. It must be reachable by Exotel and carry whatever prefix your gateway needs to resolve the tenant."
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <Callout tone="info" icon={faCircleInfo}>
              Inbound ordering — browser first, desk phone after — needs{" "}
              <strong className="font-semibold text-foreground/80">VoIP–PSTN intermix</strong>{" "}
              enabled on the Exotel account. Without it the SIP destination is dropped silently and
              only the mobile rings.
            </Callout>

            {registerError && (
              <Callout tone="error" icon={faTriangleExclamation}>
                {registerError}
              </Callout>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-muted/20">
              <div className="min-w-0">
                <div className="text-xs font-bold text-foreground">
                  {appStatus?.initialized ? "Voice app registered" : "Voice app not registered yet"}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {appStatus?.initialized
                    ? `${appStatus.appName || form.appName || "—"} • ${
                        appStatus.callbackUrl || form.callbackUrl || "no callback URL"
                      }`
                    : "Save the details above, then register the app at Exotel."}
                </div>
              </div>
              <button
                type="button" onClick={onRegisterApp}
                disabled={registering || !browserReady}
                title={
                  browserReady ? undefined : "Fill and save every required detail above first."
                }
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <FontAwesomeIcon
                  icon={faRotate}
                  className={`text-xs ${registering ? "animate-spin" : ""}`}
                />
                <span>
                  {registering
                    ? "Registering…"
                    : appStatus?.initialized
                    ? "Re-sync voice app"
                    : "Register voice app"}
                </span>
              </button>
            </div>
          </div>
        </Section>
      )}

      {/* ---------------- Inbound handling ---------------- */}
      {form.browserCalling && (
        <Section
          icon={faSliders}
          title="Inbound call handling" subtitle="How Exotel's connect applet behaves on an incoming call. Leave this off to use the provider's defaults."
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-bold text-foreground">Override provider defaults</div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                When off, none of these keys are sent and Exotel applies its own defaults.
              </p>
            </div>
            <Switch
              checked={form.overrideInbound}
              onChange={(v) => set("overrideInbound", v)}
              label="Override inbound defaults"
            />
          </div>

          {form.overrideInbound && (
            <div className="mt-5 pt-5 border-t border-border space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                <Field
                  label="Ring browser for (seconds)" type="number" value={form.maxRingingDuration}
                  onChange={(v) => set("maxRingingDuration", v)}
                  placeholder="30" hint="How long the softphone rings before the agent's desk phone is dialled."
                />
                <div className="space-y-3 md:pt-6">
                  <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-background">
                    <span className="text-xs font-medium text-foreground">Record calls</span>
                    <Switch
                      checked={form.record}
                      onChange={(v) => set("record", v)}
                      label="Record calls"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-background">
                    <span className="text-xs font-medium text-foreground">
                      Fetch routing after each attempt
                    </span>
                    <Switch
                      checked={form.fetchAfterAttempt}
                      onChange={(v) => set("fetchAfterAttempt", v)}
                      label="Fetch after attempt"
                    />
                  </label>
                </div>
              </div>

              <Field
                label="Passthru event URL"mono
                value={form.dialPassthruEventUrl}
                onChange={(v) => set("dialPassthruEventUrl", v)}
                placeholder="Leave blank unless you are replacing the dashboard Passthru applet" hint="Optional. If your Exotel dashboard already has a Passthru applet configured, setting this too delivers every event twice."
              />
            </div>
          )}
        </Section>
      )}

      {/* ---------------- Recovery ---------------- */}
      {form.browserCalling && (
        <section className="bg-card border border-border rounded-3xl shadow-xs overflow-hidden">
          <button
            type="button" onClick={() => setShowRecovery((s) => !s)}
            className="w-full flex items-start gap-3.5 px-6 py-5 text-left hover:bg-muted/20 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-muted/60 text-foreground/70 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faLifeRing} className="text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground">Recovery — re-link an existing app</h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Only for restoring a tenant whose app registration was lost. Skip this on a normal
                setup.
              </p>
            </div>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`text-xs text-muted-foreground mt-1 transition-transform ${
                showRecovery ? "rotate-180" : ""
              }`}
            />
          </button>

          {showRecovery && (
            <div className="px-6 pb-6 space-y-5">
              <Callout tone="warn" icon={faTriangleExclamation}>
                Set both values to adopt an app Exotel already holds, register once, then clear them
                again. Leaving them set is not harmful, but they are never written back by the
                platform and will drift.
              </Callout>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
                <Field
                  label="Provider app ID"mono
                  value={form.appId}
                  onChange={(v) => set("appId", v)}
                  placeholder="e4cff98d-d67b-48b4-94ba-6419864926c3" hint="Which app to adopt. Apps are matched by ID only — never by name."
                />
                <Field
                  label="Provider app secret"secret
                  value={form.appSecret}
                  onChange={(v) => set("appSecret", v)}
                  placeholder="App secret" hint="Proves the app is yours. Exotel returns it once, at creation."
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* ---------------- Footer ---------------- */}
      <div className="sticky bottom-0 z-10 bg-background/85 backdrop-blur-sm border-t border-border -mx-1 px-1 pt-4 pb-4">
        {error && (
          <div className="mb-3">
            <Callout tone="error" icon={faTriangleExclamation}>
              {error}
            </Callout>
          </div>
        )}
        {saved && !error && (
          <div className="mb-3">
            <Callout tone="success" icon={faCircleCheck}>
              Configuration saved.
              {form.browserCalling && !appStatus?.initialized
                ? " Register the voice app to finish enabling browser calling."
                : ""}
            </Callout>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-muted-foreground">
            {missing.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                <FontAwesomeIcon icon={faCircleCheck} className="text-xs" />
                All required details are filled for the modes you selected.
              </span>
            ) : (
              <span>
                <span className="font-semibold text-amber-600">
                  {missing.length} required {missing.length === 1 ? "detail" : "details"} missing
                </span>
                {": "}
                {missing.map((m) => m.label).join(", ")}
              </span>
            )}
          </div>

          <button
            type="submit" disabled={saving}
            className="px-7 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
          >
            {saving ? "Saving…" : "Save configuration"}
          </button>
        </div>
      </div>
    </form>
  );
}
