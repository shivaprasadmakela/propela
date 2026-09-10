import React, { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faXmark,
  faHeadset,
  faUserCheck,
  faMagnifyingGlass,
  faChevronLeft,
  faCircleInfo,
  faTriangleExclamation,
  faLink,
  faArrowRightLong,
} from "@fortawesome/free-solid-svg-icons";
import { telephonyApi, type ProvisionedAgent } from "../api/telephonyApi";
import type { UserEntity } from "@/domains/users/api/usersApi";
import { COUNTRY_CODES, type CountryCode } from "@/shared/ui/form/PhoneInput";
import { formatTimestamp } from "@/shared/utils/dateUtils";

interface AgentProvisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Everyone from security, so the operator picks inside this dialog. */
  users: UserEntity[];
  /** Current provider mappings, used to prefill and to show what will change. */
  agents: ProvisionedAgent[];
  /** Preselects a user — set when the row's own "Enable calling" was clicked. */
  initialUser?: UserEntity | null;
  connectionName: string;
  /** Connection caller ID, the default virtual number for a new agent. */
  defaultVirtualNumber?: string;
  onSuccess: () => void;
}

type Step = "select" | "details";

const INPUT_CLASS =
  "w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground " +
  "placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-2 focus:ring-primary/20 " +
  "focus:border-primary transition-all";

/** Splits an E.164 number into a known country code and its local digits. */
function splitNumber(raw?: string | null): { country: CountryCode; digits: string } {
  const india = COUNTRY_CODES.find((c) => c.dialCode === "+91")!;
  const value = (raw || "").trim();
  if (!value) return { country: india, digits: "" };

  if (value.startsWith("+")) {
    // Longest dial code first, so +971 is not read as +97.
    const match = [...COUNTRY_CODES]
      .sort((a, b) => b.dialCode.length - a.dialCode.length)
      .find((c) => value.startsWith(c.dialCode));
    if (match) return { country: match, digits: value.slice(match.dialCode.length).replace(/\D/g, "") };
  }
  return { country: india, digits: value.replace(/\D/g, "") };
}

function agentFor(agents: ProvisionedAgent[], user: UserEntity | null): ProvisionedAgent | undefined {
  if (!user) return undefined;
  return agents.find((a) => String(a.userId) === String(user.id));
}

function fullName(user: UserEntity): string {
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || `User ${user.id}`;
}

export function AgentProvisionModal({
  isOpen,
  onClose,
  users,
  agents,
  initialUser,
  connectionName,
  defaultVirtualNumber,
  onSuccess,
}: AgentProvisionModalProps) {
  const [step, setStep] = useState<Step>("select");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<UserEntity | null>(null);

  const [agentCountry, setAgentCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [agentDigits, setAgentDigits] = useState("");
  const [virtualCountry, setVirtualCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [virtualDigits, setVirtualDigits] = useState("");
  const [role, setRole] = useState("User");
  const [appUserId, setAppUserId] = useState("");
  const [overrideIdentity, setOverrideIdentity] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existing = useMemo(() => agentFor(agents, user), [agents, user]);

  // Loads the form for whichever user is chosen. An existing mapping wins over
  // the user's profile number, because it is what the provider actually holds.
  const selectUser = (next: UserEntity) => {
    const mapping = agentFor(agents, next);
    const profilePhone =
      next.phoneNumber && next.phoneNumber !== "NONE" && next.phoneNumber !== "null"
        ? next.phoneNumber
        : "";

    const agentNum = splitNumber(mapping?.agentNumber || profilePhone);
    setAgentCountry(agentNum.country);
    setAgentDigits(agentNum.digits);

    const virtualNum = splitNumber(mapping?.virtualNumber || defaultVirtualNumber);
    setVirtualCountry(virtualNum.country);
    setVirtualDigits(virtualNum.digits);

    setAppUserId(mapping?.providerUserId || next.emailId || "");
    setOverrideIdentity(false);
    setRole("User");
    setUser(next);
    setError(null);
    setStep("details");
  };

  useEffect(() => {
    if (!isOpen) return;
    setSearch("");
    setError(null);
    if (initialUser) selectUser(initialUser);
    else {
      setUser(null);
      setStep("select");
    }
    // selectUser is stable enough for this dialog's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialUser]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = q
      ? users.filter(
          (u) =>
            fullName(u).toLowerCase().includes(q) ||
            (u.emailId || "").toLowerCase().includes(q) ||
            String(u.id).includes(q)
        )
      : users;

    // Unmapped first: this dialog is reached from "Add agent", so the people who
    // can still be added belong at the top. Ties keep the security order.
    return [...matches].sort((a, b) => {
      const aMapped = agentFor(agents, a) ? 1 : 0;
      const bMapped = agentFor(agents, b) ? 1 : 0;
      return aMapped - bMapped;
    });
  }, [users, search, agents]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);

    if (agentDigits.length < 10) {
      return setError("Enter a valid fallback phone number of at least 10 digits.");
    }
    if (virtualDigits.length < 8) {
      return setError("A virtual number is required — Exotel dials out on it.");
    }
    if (overrideIdentity && !appUserId.trim()) {
      return setError("Enter the provider identity, or turn the override off.");
    }

    setSaving(true);
    try {
      await telephonyApi.provisionAgent({
        connectionName: connectionName || "exotel_connection",
        userId: user.id,
        agentNumber: `${agentCountry.dialCode}${agentDigits}`,
        virtualNumber: `${virtualCountry.dialCode}${virtualDigits}`,
        role,
        appUserId: overrideIdentity ? appUserId.trim() : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      const raw = String(err?.message || "");
      // A provider identity claimed by a different CRM user is the one conflict
      // provisioning still answers with, and it means cross-wired softphones.
      setError(
        /409|already|claimed/i.test(raw)
          ? `That provider identity is already mapped to a different user. Two agents sharing one identity ring each other's calls. ${raw}`
          : raw || "Failed to provision the agent with Exotel."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {step === "details" && !initialUser && (
              <button
                type="button"
                onClick={() => setStep("select")}
                aria-label="Back to user list"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faHeadset} className="text-base" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-foreground">
                {step === "select"
                  ? "Select a team member"
                  : existing
                  ? "Update agent calling"
                  : "Enable agent calling"}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {step === "select"
                  ? "Pick the user to map to an Exotel calling identity"
                  : "WebRTC softphone with a PSTN fallback"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
          >
            <FontAwesomeIcon icon={faXmark} className="text-base" />
          </button>
        </div>

        {/* STEP 1 — pick a user from security */}
        {step === "select" && (
          <div className="flex flex-col min-h-0">
            <div className="px-6 pt-5 pb-3 shrink-0">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email or user ID"
                  className={`${INPUT_CLASS} pl-9`}
                />
              </div>
            </div>

            <div className="px-6 pb-6 overflow-y-auto space-y-2">
              {filtered.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  {users.length === 0
                    ? "No users came back from security."
                    : `No user matches "${search}".`}
                </div>
              ) : (
                filtered.map((u, idx) => {
                  const mapping = agentFor(agents, u);
                  const prevMapped = idx > 0 && !!agentFor(agents, filtered[idx - 1]);
                  const firstMapped = !!mapping && !prevMapped;
                  return (
                    <React.Fragment key={u.id}>
                      {firstMapped && (
                        <div className="pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Already provisioned
                        </div>
                      )}
                    <button
                      type="button"
                      onClick={() => selectUser(u)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:bg-muted/30 hover:border-primary/40 transition-all text-left cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {(u.firstName || "U")[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {fullName(u)}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {u.emailId || `User #${u.id}`}
                        </div>
                      </div>
                      {mapping ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-full border shrink-0 ${
                            mapping.sipEndpoint
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          }`}
                        >
                          {mapping.sipEndpoint ? "Mapped" : "Phone only"}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground shrink-0">
                          Not mapped
                        </span>
                      )}
                    </button>
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* STEP 2 — numbers and identity */}
        {step === "details" && user && (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-xs mt-0.5 shrink-0" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Selected user */}
              <div className="p-3.5 bg-muted/40 rounded-2xl border border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                  {(user.firstName || "U")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {fullName(user)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{user.emailId}</div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border shrink-0">
                  ID #{user.id}
                </span>
              </div>

              {/* Existing provider mapping */}
              {existing && (
                <div className="rounded-2xl border border-border overflow-hidden">
                  <div className="px-3.5 py-2.5 bg-muted/40 border-b border-border flex items-center gap-2">
                    <FontAwesomeIcon icon={faLink} className="text-[10px] text-muted-foreground" />
                    <span className="text-[11px] font-bold text-foreground">
                      Current mapping at Exotel
                    </span>
                    <span
                      className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        existing.active
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {existing.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <dl className="divide-y divide-border text-[11px]">
                    <MappingRow label="Provider identity" value={existing.providerUserId} mono />
                    <MappingRow
                      label="SIP endpoint"
                      value={existing.sipEndpoint}
                      mono
                      fallback="Not created — this agent has no softphone yet"
                    />
                    <MappingRow label="Agent number" value={existing.agentNumber} />
                    <MappingRow label="Virtual number" value={existing.virtualNumber} />
                    <MappingRow
                      label="Last updated"
                      value={formatTimestamp(existing.updatedAt)}
                      fallback="Not recorded"
                    />
                  </dl>
                </div>
              )}

              {existing && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-border bg-muted/30 text-xs text-muted-foreground">
                  <FontAwesomeIcon icon={faCircleInfo} className="text-xs mt-0.5 shrink-0" />
                  <span className="leading-relaxed">
                    Saving re-provisions this agent, which is how a number is changed. Exotel finds
                    them by email and reuses the seat, so this costs no extra licence.
                  </span>
                </div>
              )}

              {/* Agent number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">
                  Fallback phone number<span className="text-rose-500">*</span>
                </label>
                <NumberInput
                  country={agentCountry}
                  digits={agentDigits}
                  onCountry={setAgentCountry}
                  onDigits={setAgentDigits}
                  placeholder="9876543210"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Ringing is sequential: the browser first, then this number. A wrong one rings a
                  stranger on every call the agent does not answer in time.
                </p>
                {existing?.agentNumber &&
                  `${agentCountry.dialCode}${agentDigits}` !== existing.agentNumber && (
                    <ChangeHint from={existing.agentNumber} to={`${agentCountry.dialCode}${agentDigits}`} />
                  )}
              </div>

              {/* Virtual number */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">
                  Virtual number<span className="text-rose-500">*</span>
                </label>
                <NumberInput
                  country={virtualCountry}
                  digits={virtualDigits}
                  onCountry={setVirtualCountry}
                  onDigits={setVirtualDigits}
                  placeholder="8044657072"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  The Exotel number this agent dials out on. Defaults to the connection's caller ID.
                </p>
                {existing?.virtualNumber &&
                  `${virtualCountry.dialCode}${virtualDigits}` !== existing.virtualNumber && (
                    <ChangeHint
                      from={existing.virtualNumber}
                      to={`${virtualCountry.dialCode}${virtualDigits}`}
                    />
                  )}
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">Calling role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`${INPUT_CLASS} cursor-pointer`}
                >
                  <option value="User">Standard agent — make &amp; receive</option>
                  <option value="Admin">Telephony admin — full access</option>
                </select>
              </div>

              {/* Provider identity override */}
              <div className="rounded-2xl border border-border p-3.5 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overrideIdentity}
                    onChange={(e) => setOverrideIdentity(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-black cursor-pointer shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="text-xs font-semibold text-foreground block">
                      Override provider identity
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed block mt-0.5">
                      Leave off to use{" "}
                      <span className="font-mono text-foreground/70">
                        {user.emailId || "the user's email"}
                      </span>
                      . Set it only when the Exotel identity cannot follow ours, such as a per-user
                      licence shared with an existing account.
                    </span>
                  </span>
                </label>

                {overrideIdentity && (
                  <input
                    value={appUserId}
                    onChange={(e) => setAppUserId(e.target.value)}
                    placeholder="agent@yourcompany.com"
                    className={`${INPUT_CLASS} font-mono text-xs`}
                  />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0 bg-card">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                <FontAwesomeIcon icon={faUserCheck} className="text-xs" />
                <span>
                  {saving ? "Provisioning…" : existing ? "Update agent" : "Enable calling"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function MappingRow({
  label,
  value,
  mono,
  fallback,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  fallback?: string;
}) {
  return (
    <div className="flex items-start gap-3 px-3.5 py-2">
      <dt className="text-muted-foreground w-28 shrink-0">{label}</dt>
      <dd
        className={`flex-1 min-w-0 break-all ${
          value ? `text-foreground font-medium ${mono ? "font-mono" : ""}` : "text-muted-foreground"
        }`}
      >
        {value || fallback || "—"}
      </dd>
    </div>
  );
}

function ChangeHint({ from, to }: { from: string; to: string }) {
  return (
    <p className="flex items-center gap-2 text-[11px] text-amber-700 font-medium">
      <span className="font-mono line-through opacity-70">{from}</span>
      <FontAwesomeIcon icon={faArrowRightLong} className="text-[9px]" />
      <span className="font-mono">{to}</span>
    </p>
  );
}

function NumberInput({
  country,
  digits,
  onCountry,
  onDigits,
  placeholder,
}: {
  country: CountryCode;
  digits: string;
  onCountry: (c: CountryCode) => void;
  onDigits: (d: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <select
        value={country.code}
        onChange={(e) => onCountry(COUNTRY_CODES.find((c) => c.code === e.target.value)!)}
        className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer shrink-0"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.dialCode}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={digits}
        onChange={(e) => onDigits(e.target.value.replace(/\D/g, ""))}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </div>
  );
}
