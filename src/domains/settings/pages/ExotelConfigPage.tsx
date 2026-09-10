import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faChevronRight,
  faCube,
  faBuilding,
  faCheckCircle,
  faUsers,
  faSliders,
  faUserPlus,
  faMobileScreenButton,
  faHeadset,
} from "@fortawesome/free-solid-svg-icons";
import {
  telephonyApi,
  type ConnectionEntity,
  type ProvisionedAgent,
  type CallAppStatus,
} from "../api/telephonyApi";
import { productApi, type ProductEntity } from "@/domains/products/api/productApi";
import { usersApi, type UserEntity } from "@/domains/users/api/usersApi";
import { ExotelConfigurationForm } from "../components/ExotelConfigurationForm";
import { AgentProvisionModal } from "../components/AgentProvisionModal";
import { formatTimestamp } from "@/shared/utils/dateUtils";
import { ConfirmDialog } from "@/shared/ui/modal/ConfirmDialog";
import { useToast } from "@/shared/ui/toast/ToastProvider";

type ActiveTab = "config" | "products" | "agents";

const CONNECTION_NAME = "exotel_connection";

/** Turns the two failure modes of POST /provisioning/initialize into operator prose. */
function registerFailureMessage(err: any): string {
  const raw = String(err?.message || "").trim();
  if (/detail|required|missing/i.test(raw)) {
    return `Exotel refused the registration because a connection detail is missing or wrong: ${raw}`;
  }
  if (/50\d/.test(raw) || /provider/i.test(raw)) {
    return `Exotel refused the request: ${raw}`;
  }
  return raw || "Failed to register the Exotel voice app.";
}

export function ExotelConfigPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>("config");
  const [connection, setConnection] = useState<ConnectionEntity | null>(null);
  const [appStatus, setAppStatus] = useState<CallAppStatus | null>(null);
  const [products, setProducts] = useState<ProductEntity[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Users & their provider mappings
  const [users, setUsers] = useState<UserEntity[]>([]);
  const [agents, setAgents] = useState<ProvisionedAgent[]>([]);
  const [selectedUserForProvision, setSelectedUserForProvision] = useState<UserEntity | null>(null);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [agentToDisable, setAgentToDisable] = useState<ProvisionedAgent | null>(null);
  const [disabling, setDisabling] = useState(false);

  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [connRes, appRes, prodRes, usersRes, agentsRes] = await Promise.allSettled([
        telephonyApi.fetchConnections("EXOTEL"),
        telephonyApi.getCallApp(CONNECTION_NAME),
        productApi.fetchProducts({
          condition: { conditions: [], operator: "AND" },
          eager: false,
          eagerFields: [],
          page: 0,
          size: 50,
          sort: [{ property: "name", direction: "ASC" }],
        }),
        usersApi.fetchUsers(0, 50),
        telephonyApi.fetchProvisionedAgents(CONNECTION_NAME),
      ]);

      if (connRes.status === "fulfilled" && connRes.value.content?.length > 0) {
        setConnection(connRes.value.content[0]);
      }

      // GET /provisioning/app always answers 200, so a rejection here is a
      // transport or auth problem rather than "no app".
      setAppStatus(appRes.status === "fulfilled" ? appRes.value : null);

      if (prodRes.status === "fulfilled" && prodRes.value.content) {
        const list = prodRes.value.content;
        setProducts(list);
        if (list.length > 0) setSelectedProductId(list[0].id);
      }

      let fetchedUsers: UserEntity[] = [];
      if (usersRes.status === "fulfilled" && usersRes.value.content) {
        fetchedUsers = usersRes.value.content.filter((u) => u.statusCode !== "DELETED");
      }

      let fetchedAgents: ProvisionedAgent[] = [];
      if (agentsRes.status === "fulfilled") {
        fetchedAgents = agentsRes.value;
        setAgents(fetchedAgents);
      }

      // `users` stays the plain security list: it is what the picker offers, and
      // the agents table renders from the mappings instead, so an agent missing
      // from security is still shown there rather than injected as a fake user.
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Failed to load Exotel config data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterApp = async () => {
    setRegistering(true);
    setRegisterError(null);
    try {
      await telephonyApi.initializeCallApp(connection?.name || CONNECTION_NAME);
      const status = await telephonyApi.getCallApp(connection?.name || CONNECTION_NAME);
      setAppStatus(status);
      toast("Exotel voice app registered.", "success");
    } catch (err: any) {
      console.error("Failed to register the Exotel voice app:", err);
      setRegisterError(registerFailureMessage(err));
    } finally {
      setRegistering(false);
    }
  };

  const handleDeactivateAgent = async () => {
    if (!agentToDisable) return;
    setDisabling(true);
    try {
      await telephonyApi.deactivateAgent(
        agentToDisable.userId,
        connection?.name || CONNECTION_NAME
      );
      setAgents(await telephonyApi.fetchProvisionedAgents(connection?.name || CONNECTION_NAME));
      toast("Agent disabled. Their softphone and fallback number are no longer dialled.", "success");
      setAgentToDisable(null);
    } catch (err: any) {
      console.error("Failed to deactivate agent:", err);
      toast(err?.message || "Failed to disable the agent.", "error");
    } finally {
      setDisabling(false);
    }
  };

  const openProvisionModal = (user: UserEntity | null) => {
    setSelectedUserForProvision(user);
    setIsProvisionModalOpen(true);
  };

  /**
   * A stand-in user for an agent security no longer returns, so the modal can
   * still open on them. Only the identity fields are real.
   */
  const synthesiseUser = (agent: ProvisionedAgent): UserEntity => ({
    id: Number(agent.userId),
    firstName: agent.providerUserId?.split("@")[0] || `User ${agent.userId}`,
    lastName: "",
    emailId: agent.providerUserId || "",
    phoneNumber: agent.agentNumber || "NONE",
    statusCode: "ACTIVE",
    createdAt: Date.now(),
  });

  const details = connection?.connectionDetails;
  const clickToCallOn = !!details && details.clickToCallEnabled !== false;
  const browserCallingOn =
    !!details &&
    (typeof details.browserCallingEnabled === "boolean"
      ? details.browserCallingEnabled
      : !!details.customerId);
  const activeAgents = agents.filter((a) => a.active).length;

  const tabs: { id: ActiveTab; label: string; icon: IconDefinition; badge?: React.ReactNode }[] = [
    { id: "config", label: "Configuration", icon: faSliders },
    { id: "products", label: "Products & phone numbers", icon: faBuilding },
    {
      id: "agents",
      label: "Team members & agents",
      icon: faUsers,
      badge:
        activeAgents > 0 ? (
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 font-extrabold">
            {activeAgents} active
          </span>
        ) : undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <span
          onClick={() => navigate("/settings")}
          className="hover:text-foreground cursor-pointer transition-colors"
        >
          Settings
        </span>
        <FontAwesomeIcon icon={faChevronRight} className="text-xs text-muted-foreground/60" />
        <span
          onClick={() => navigate("/settings?category=communication")}
          className="hover:text-foreground cursor-pointer transition-colors"
        >
          Communication
        </span>
        <FontAwesomeIcon icon={faChevronRight} className="text-xs text-muted-foreground/60" />
        <span
          onClick={() => navigate("/settings/telephony")}
          className="hover:text-foreground cursor-pointer transition-colors"
        >
          Telephony
        </span>
        <FontAwesomeIcon icon={faChevronRight} className="text-xs text-muted-foreground/60" />
        <span className="text-foreground font-medium">Exotel</span>
      </nav>

      {/* Header */}
      <div className="bg-[#fef9ee] border border-[#fae5bb] rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#fa8c16]/10 flex items-center justify-center text-[#fa8c16] shrink-0">
              <FontAwesomeIcon icon={faCube} className="text-lg" />
            </div>
            <div className="space-y-1.5 min-w-0">
              <h2 className="text-base font-bold text-[#262626]">
                Exotel telephony
              </h2>
              <p className="text-xs text-[#595959] leading-relaxed max-w-3xl">
                Configure how your team calls: click-to-call through the agent's mobile, browser
                calling through a WebRTC softphone, or both. Credentials, the tenant voice app and
                per-product numbers are all set here.
              </p>
            </div>
          </div>

          {/* Mode summary */}
          <div className="flex items-center gap-2 shrink-0">
            <ModePill
              icon={faMobileScreenButton}
              label="Click-to-call" on={clickToCallOn}
              loading={loading}
            />
            <ModePill
              icon={faHeadset}
              label="Browser calling" on={browserCallingOn && !!appStatus?.initialized}
              partial={browserCallingOn && !appStatus?.initialized}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} className="text-xs" />
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        ))}
      </div>

      {/* TAB 1: CONFIGURATION */}
      {activeTab === "config" &&
        (loading ? (
          <div className="bg-card border border-border rounded-3xl p-12 text-center text-xs text-muted-foreground animate-pulse">
            Loading configuration…
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
            <ExotelConfigurationForm
              connection={connection}
              appStatus={appStatus}
              registering={registering}
              registerError={registerError}
              onRegisterApp={handleRegisterApp}
              onSaved={(updated) => {
                setConnection(updated);
                setRegisterError(null);
              }}
            />
          </div>
        ))}

      {/* TAB 2: PRODUCTS & PHONE NUMBERS */}
      {activeTab === "products" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select a product to configure numbers
              </h4>
              <span className="text-xs text-muted-foreground">
                {products.length} product{products.length === 1 ? "" : "s"} available
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                Loading products…
              </div>
            ) : products.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No products found. Add a product first.
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product, idx) => {
                  const isSelected = selectedProductId === product.id;
                  const iconColors = [
                    "text-emerald-500 bg-emerald-50",
                    "text-rose-500 bg-rose-50",
                    "text-amber-500 bg-amber-50",
                  ];
                  return (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProductId(product.id)}
                      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-muted/40 border-primary/50 shadow-xs"
                          : "bg-card border-border hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            iconColors[idx % iconColors.length]
                          }`}
                        >
                          <FontAwesomeIcon icon={faBuilding} className="text-base" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {product.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Product #{product.id} • inbound &amp; outbound routes
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                          isSelected ? "text-primary" : "text-border"
                        }`}
                      >
                        <FontAwesomeIcon icon={faCheckCircle} className="text-lg" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                disabled={!selectedProductId}
                onClick={() =>
                  selectedProductId &&
                  navigate(`/settings/telephony/exotel/product/${selectedProductId}`)
                }
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Configure inbound numbers</span>
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEAM MEMBERS & AGENTS */}
      {activeTab === "agents" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {browserCallingOn && !appStatus?.initialized && (
            <div className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50 text-xs text-amber-800 leading-relaxed">
              The voice app is not registered yet, so provisioning will fail. Register it on the{" "}
              <button
                type="button"
                onClick={() => setActiveTab("config")}
                className="font-bold underline cursor-pointer"
              >
                Configuration
              </button>{" "}
              tab first.
            </div>
          )}

          <div className="bg-card border border-border rounded-3xl shadow-xs overflow-hidden">
            <div className="flex items-start justify-between gap-4 flex-wrap px-6 py-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Provisioned agents</span>
                  {agents.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-muted text-muted-foreground">
                      {agents.length}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                  Only team members mapped to an Exotel calling identity appear here. Ringing is
                  sequential, so the fallback number is dialled on every call the agent does not
                  answer in time — a wrong one rings a stranger.
                </p>
              </div>
              <button
                onClick={() => openProvisionModal(null)}
                className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
              >
                <FontAwesomeIcon icon={faUserPlus} className="text-xs" />
                <span>Add agent</span>
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-muted-foreground animate-pulse">
                Loading agents…
              </div>
            ) : agents.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faHeadset} className="text-lg" />
                </div>
                <h4 className="text-sm font-bold text-foreground">No agents provisioned yet</h4>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Add a team member to give them a softphone and a fallback number. You pick who
                  from your security users, so nobody is mapped by accident.
                </p>
                <button
                  onClick={() => openProvisionModal(null)}
                  className="mt-5 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <FontAwesomeIcon icon={faUserPlus} className="text-xs" />
                  <span>Add your first agent</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold [&>th]:whitespace-nowrap">
                      <th className="py-3 px-6">TEAM MEMBER</th>
                      <th className="py-3 px-4">CALLING STATUS</th>
                      <th className="py-3 px-4">PROVIDER IDENTITY</th>
                      <th className="py-3 px-4">SIP ENDPOINT</th>
                      <th className="py-3 px-4">FALLBACK MOBILE</th>
                      <th className="py-3 px-4">VIRTUAL NUMBER</th>
                      <th className="py-3 px-4">LAST UPDATED</th>
                      <th className="py-3 px-6 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {agents.map((agent) => {
                      // Rows come from the mappings, not the user list: an agent
                      // whose security record is missing still has to be visible,
                      // or nobody can see - let alone disable - a live mapping.
                      const user = users.find((u) => String(u.id) === String(agent.userId));
                      const name = user
                        ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                        : agent.providerUserId?.split("@")[0] || `User ${agent.userId}`;
                      const email = user?.emailId || agent.providerUserId || "";
                      const hasSoftphone = !!agent.sipEndpoint;

                      return (
                        <tr key={String(agent.userId)} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                {(name || "U")[0]?.toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground truncate">{name}</div>
                                <div className="text-[11px] text-muted-foreground truncate">
                                  {email}
                                  {!user && " • not in security"}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {!agent.active ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                                Disabled
                              </span>
                            ) : hasSoftphone ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Browser calling
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                title="No SIP endpoint: this agent can be reached on their phone but has no softphone."
                              >
                                Phone only
                              </span>
                            )}
                          </td>

                          <td
                            className="py-3.5 px-4 font-mono text-[11px] text-foreground/80 max-w-[180px] truncate"
                            title={agent.providerUserId || undefined}
                          >
                            {agent.providerUserId || "—"}
                          </td>

                          <td
                            className="py-3.5 px-4 font-mono text-[11px] text-foreground/80 max-w-[180px] truncate"
                            title={agent.sipEndpoint || undefined}
                          >
                            {agent.sipEndpoint || "—"}
                          </td>

                          <td className="py-3.5 px-4 font-medium text-foreground whitespace-nowrap">
                            {agent.agentNumber || "—"}
                          </td>

                          <td className="py-3.5 px-4 font-medium text-foreground whitespace-nowrap">
                            {agent.virtualNumber || "—"}
                          </td>

                          <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                            {formatTimestamp(agent.updatedAt) || "—"}
                          </td>

                          <td className="py-3.5 px-6 text-right whitespace-nowrap">
                            <button
                              onClick={() => openProvisionModal(user || synthesiseUser(agent))}
                              className="px-3 py-1.5 text-xs text-foreground/70 hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setAgentToDisable(agent)}
                              className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            >
                              Disable
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!agentToDisable}
        tone="danger"
        title="Disable calling for this agent?"
        confirmLabel="Disable agent"
        busy={disabling}
        onCancel={() => setAgentToDisable(null)}
        onConfirm={handleDeactivateAgent}
        message={
          <>
            <span className="font-semibold text-foreground">
              {agentToDisable?.providerUserId || `User ${agentToDisable?.userId}`}
            </span>{" "}
            will stop receiving calls in the browser, and their fallback number will no longer be
            dialled. The mapping at Exotel is revoked — re-enabling them means provisioning again.
          </>
        }
      />

      <AgentProvisionModal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        users={users}
        agents={agents}
        initialUser={selectedUserForProvision}
        connectionName={connection?.name || CONNECTION_NAME}
        defaultVirtualNumber={connection?.connectionDetails?.callerId || ""}
        onSuccess={loadData}
      />
    </div>
  );
}

function ModePill({
  icon,
  label,
  on,
  partial,
  loading,
}: {
  icon: IconDefinition;
  label: string;
  on: boolean;
  partial?: boolean;
  loading?: boolean;
}) {
  const tone = loading
    ? "bg-muted text-muted-foreground border-border animate-pulse"
    : on
    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/25"
    : partial
    ? "bg-amber-500/10 text-amber-700 border-amber-500/25"
    : "bg-muted text-muted-foreground border-border";

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-bold ${tone}`}
      title={partial ? "Configured, but the voice app is not registered yet" : undefined}
    >
      <FontAwesomeIcon icon={icon} className="text-xs" />
      <span>{label}</span>
      <span className="opacity-70">{loading ? "…" : on ? "On" : partial ? "Pending" : "Off"}</span>
    </div>
  );
}
