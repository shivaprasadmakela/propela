import { httpClient } from "@/services/httpClient";
import { ENDPOINTS } from "@/services/endpoints";

/**
 * Connection details for a CALL / EXOTEL connection.
 *
 * The keys are split by which Exotel API consumes them. Click-to-call speaks the
 * v1 telephony API (accountSid + apiKey + apiToken); browser calling speaks
 * Integrations Core, which has its own credential pair (customerId +
 * customerSecret) and needs the app registration details alongside it.
 *
 * Connection-document keys are camelCase; the provider wire format is snake_case.
 */
export interface ExotelConnectionDetails {
  // --- Telephony API (click-to-call) -------------------------------------
  accountSid: string;
  subdomain: string;
  apiKey: string;
  apiToken: string;
  callerId: string;

  // --- Integrations Core (browser / WebRTC calling) ----------------------
  customerId?: string;
  customerSecret?: string;
  exotelDomain?: string;
  appName?: string;
  callbackUrl?: string;

  // --- Inbound connect-applet tuning (optional) --------------------------
  maxRingingDuration?: number | string;
  record?: boolean;
  fetchAfterAttempt?: boolean;
  dialPassthruEventUrl?: string;

  // --- Recovery only: re-links an existing provider app after data loss ---
  appId?: string;
  appSecret?: string;

  // --- UI intent: which modes this tenant has turned on -------------------
  clickToCallEnabled?: boolean;
  browserCallingEnabled?: boolean;

  [key: string]: any;
}

/** Answer of GET/POST /provisioning/app - always 200, never 204. */
export interface CallAppStatus {
  initialized: boolean;
  provider?: string;
  appName?: string;
  callbackUrl?: string;
}

export interface ConnectionEntity {
  id?: string;
  name: string;
  clientCode?: string;
  appCode?: string;
  connectionType: string;
  connectionSubType: string;
  connectionDetails: ExotelConnectionDetails;
  isAppLevel?: boolean;
  onlyThruKIRun?: boolean;
  version?: number;
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  updatedBy?: string;
}

export interface ProductCommEntity {
  id?: number;
  code?: string;
  name?: string;
  clientCode?: string;
  appCode?: string;
  connectionName: string;
  connectionType: string;
  connectionSubType: string;
  productId: number;
  dialCode: number;
  phoneNumber: string;
  source?: string;
  subSource?: string;
  default?: boolean;
  active?: boolean;
  version?: number;
  createdAt?: number;
  updatedAt?: number;
  createdBy?: number;
  updatedBy?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  empty: boolean;
}

export interface SourceOption {
  id?: number;
  name: string;
  displayOrder?: number;
  active?: boolean;
  children?: SourceOption[];
}

export interface ProviderUserEndpoint {
  id?: number;
  code?: string;
  appCode?: string;
  clientCode?: string;
  connectionName: string;
  userId: number | string;
  endpointType: "WEBRTC_SIP" | "PSTN_PHONE" | string;
  endpointValue: string;
  providerUserId: string;
  priority: number;
  isActive: boolean | number;
}

/**
 * One entry per agent, as `/provisioning/agents` and `POST /provisioning/agent`
 * answer. The backend stores one row per *destination* — the browser and the
 * desk phone are separate rows whose PRIORITY is the dial order — and folds
 * them before answering, so a caller never sees the same person twice.
 *
 * `sipEndpoint: null` with an `agentNumber` set means half-provisioned: the
 * agent has a phone but no softphone. That is a state to show, not to hide.
 * `active` means *any* destination is live, not all of them.
 */
export interface ProvisionedAgent {
  userId: number | string;
  providerUserId?: string;
  sipEndpoint?: string | null;
  agentNumber?: string | null;
  virtualNumber?: string | null;
  active: boolean;
  updatedAt?: number | string;
}

export interface CallProviderApp {
  id?: number;
  code?: string;
  appCode?: string;
  clientCode?: string;
  connectionName: string;
  provider?: string;
  providerAppId: string;
  providerAppName: string;
  accountSid: string;
  callbackUrl?: string;
  isActive: boolean | number;
}

export interface BrowserCallToken {
  token?: string;
  accessToken?: string;
  providerUserId?: string;
  agentId?: string;
  sipId?: string;
  expiresIn?: number;
  provider?: string;
}

export interface BrowserCallStatus {
  provisioned: boolean;
  provider?: string;
  sipEndpoint?: string;
  phoneEndpoint?: string;
}

/** Tolerates `active` arriving as `isActive`, a number, or a string. */
function normaliseAgent(raw: any): ProvisionedAgent {
  const live = raw?.active ?? raw?.isActive;
  return {
    userId: raw?.userId,
    providerUserId: raw?.providerUserId ?? undefined,
    sipEndpoint: raw?.sipEndpoint ?? null,
    agentNumber: raw?.agentNumber ?? null,
    virtualNumber: raw?.virtualNumber ?? null,
    active: live === true || live === 1 || live === "true",
    updatedAt: raw?.updatedAt,
  };
}

/**
 * Folds raw destination rows into one entry per agent, the same way the backend
 * does: an endpoint type this code does not recognise is ignored rather than
 * guessed at, and an agent counts as active when *any* destination is live.
 */
function foldEndpointRows(rows: ProviderUserEndpoint[]): ProvisionedAgent[] {
  const byUser = new Map<string, ProvisionedAgent>();

  for (const row of rows) {
    if (row.endpointType !== "WEBRTC_SIP" && row.endpointType !== "PSTN_PHONE") continue;

    const key = String(row.userId);
    const agent: ProvisionedAgent = byUser.get(key) ?? {
      userId: row.userId,
      sipEndpoint: null,
      agentNumber: null,
      virtualNumber: null,
      active: false,
    };

    if (row.endpointType === "WEBRTC_SIP") agent.sipEndpoint = row.endpointValue;
    else agent.agentNumber = row.endpointValue;

    agent.providerUserId = agent.providerUserId || row.providerUserId;
    agent.active = agent.active || (row.isActive !== false && row.isActive !== 0);
    byUser.set(key, agent);
  }

  return [...byUser.values()];
}

export const telephonyApi = {
  fetchConnections: async (subType: string = "EXOTEL"): Promise<PageResponse<ConnectionEntity>> => {
    const clientCode = localStorage.getItem("clientCode") || "FIN";
    const res = await httpClient.get<PageResponse<ConnectionEntity>>(
      `${ENDPOINTS.TELEPHONY.CONNECTIONS}?connectionSubType=${subType}&size=10&page=0&clientCode=${clientCode}&appCode=leadzump`
    );

    if (res && res.content && res.content.length > 0) {
      const detailed = await Promise.all(
        res.content.map(async (c) => {
          if (c.id) {
            try {
              return await telephonyApi.getConnectionById(c.id);
            } catch {
              return c;
            }
          }
          return c;
        })
      );
      res.content = detailed;
    }

    return res;
  },

  getConnectionById: async (id: string): Promise<ConnectionEntity> => {
    const clientCode = localStorage.getItem("clientCode") || "FIN";
    return httpClient.get<ConnectionEntity>(
      `${ENDPOINTS.TELEPHONY.CONNECTION_BY_ID(id)}?clientCode=${clientCode}&appCode=leadzump`
    );
  },

  createConnection: async (data: Partial<ConnectionEntity>): Promise<ConnectionEntity> => {
    return httpClient.post<ConnectionEntity>(ENDPOINTS.TELEPHONY.CONNECTIONS, data);
  },

  updateConnection: async (id: string, data: Partial<ConnectionEntity>): Promise<ConnectionEntity> => {
    return httpClient.put<ConnectionEntity>(ENDPOINTS.TELEPHONY.CONNECTION_BY_ID(id), data);
  },

  fetchDefaultProductComm: async (
    productId: number,
    subType: string = "EXOTEL"
  ): Promise<ProductCommEntity | null> => {
    try {
      const clientCode = localStorage.getItem("clientCode") || "FIN";
      return await httpClient.get<ProductCommEntity>(
        `${ENDPOINTS.TELEPHONY.PRODUCT_COMMS_DEFAULT}?connectionSubType=${subType}&productId=${productId}&connectionType=CALL&clientCode=${clientCode}&appCode=leadzump`
      );
    } catch (e) {
      console.warn("No default product communication found:", e);
      return null;
    }
  },

  fetchProductComms: async (
    productId: number,
    isDefault: boolean = false,
    page: number = 0,
    size: number = 20
  ): Promise<PageResponse<ProductCommEntity>> => {
    const clientCode = localStorage.getItem("clientCode") || "FIN";
    return httpClient.get<PageResponse<ProductCommEntity>>(
      `${ENDPOINTS.TELEPHONY.PRODUCT_COMMS}?productId=${productId}&isDefault=${isDefault}&size=${size}&page=${page}&clientCode=${clientCode}&appCode=leadzump`
    );
  },

  createProductComm: async (data: Partial<ProductCommEntity>): Promise<ProductCommEntity> => {
    return httpClient.post<ProductCommEntity>(ENDPOINTS.TELEPHONY.PRODUCT_COMMS, data);
  },

  updateProductCommByCode: async (
    code: string,
    data: Partial<ProductCommEntity>
  ): Promise<ProductCommEntity> => {
    return httpClient.put<ProductCommEntity>(ENDPOINTS.TELEPHONY.PRODUCT_COMMS_BY_CODE(code), data);
  },

  deleteProductComm: async (id: number | string): Promise<void> => {
    return httpClient.delete(ENDPOINTS.TELEPHONY.PRODUCT_COMMS_BY_ID(id));
  },

  fetchSources: async (): Promise<SourceOption[]> => {
    return httpClient.get<SourceOption[]>(ENDPOINTS.SOURCES.LIST);
  },

  // -------------------------------------------------------------
  // PROVISIONING & BROWSER CALLING
  // -------------------------------------------------------------

  getCallApp: async (connectionName: string = "exotel_connection"): Promise<CallAppStatus> => {
    return httpClient.get<CallAppStatus>(
      `${ENDPOINTS.TELEPHONY.PROVISIONING_APP}?connectionName=${connectionName}`
    );
  },

  initializeCallApp: async (connectionName: string = "exotel_connection"): Promise<CallProviderApp> => {
    return httpClient.post<CallProviderApp>(ENDPOINTS.TELEPHONY.PROVISIONING_INITIALIZE, {
      connectionName,
    });
  },

  fetchProvisionedAgents: async (
    connectionName: string = "exotel_connection"
  ): Promise<ProvisionedAgent[]> => {
    try {
      const res = await httpClient.get<any[]>(
        `${ENDPOINTS.TELEPHONY.PROVISIONING_AGENTS}?connectionName=${connectionName}`
      );
      if (!Array.isArray(res)) return [];
      // A build that predates the fold answers with the raw destination rows.
      // Fold those here rather than rendering an empty table against them.
      return res.some((row) => row && "endpointType" in row)
        ? foldEndpointRows(res as ProviderUserEndpoint[])
        : res.map(normaliseAgent);
    } catch (e) {
      console.warn("Failed to fetch provisioned agents:", e);
      return [];
    }
  },

  /**
   * Creates or updates an agent's provider mapping. Re-provisioning is the
   * update path: the backend looks the agent up at Exotel by email, reuses a
   * mapping that already matches, and upserts one that differs. Sending it
   * again for somebody Exotel already holds costs no extra seat.
   */
  provisionAgent: async (data: {
    connectionName?: string;
    userId: number | string;
    agentNumber: string;
    virtualNumber: string;
    role?: string;
    appUserId?: string;
  }): Promise<ProvisionedAgent> => {
    const res = await httpClient.post<any>(ENDPOINTS.TELEPHONY.PROVISIONING_AGENT, {
      connectionName: data.connectionName || "exotel_connection",
      userId: data.userId,
      agentNumber: data.agentNumber,
      virtualNumber: data.virtualNumber,
      role: data.role || "User",
      // Only sent when the operator overrode it: the provider identity normally
      // follows the CRM user's own email.
      ...(data.appUserId ? { appUserId: data.appUserId } : {}),
    });
    return normaliseAgent(res);
  },

  deactivateAgent: async (
    userId: number | string,
    connectionName: string = "exotel_connection"
  ): Promise<number> => {
    return httpClient.delete<number>(
      `${ENDPOINTS.TELEPHONY.PROVISIONING_AGENT_DEACTIVATE(userId)}?connectionName=${connectionName}`
    );
  },

  getBrowserStatus: async (
    connectionName: string = "exotel_connection"
  ): Promise<BrowserCallStatus> => {
    return httpClient.get<BrowserCallStatus>(
      `${ENDPOINTS.TELEPHONY.BROWSER_STATUS}?connectionName=${connectionName}`
    );
  },

  getBrowserToken: async (
    connectionName: string = "exotel_connection"
  ): Promise<BrowserCallToken> => {
    return httpClient.post<BrowserCallToken>(ENDPOINTS.TELEPHONY.BROWSER_TOKEN, {
      connectionName,
    });
  },
};
