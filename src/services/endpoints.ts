export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/security/authenticate",
    VERIFY_TOKEN: "/api/security/verifyToken",
    FIND_USER_CLIENTS: "/api/security/users/findUserClients?appLevel=false",
  },
  DEALS: {
    CREATE: "/api/entity/processor/tickets",
    QUERY_EAGER: "/api/entity/processor/tickets/eager/query",
    BY_CODE: (code: string) =>
      `/api/entity/processor/tickets/code/${code}/eager`,
    UPDATE_BY_CODE: (code: string) =>
      `/api/entity/processor/tickets/code/${code}`,
  },
  ACCOUNTS: {
    QUERY_EAGER: "/api/entity/processor/owners/eager/query",
    BY_CODE: (code: string) =>
      `/api/entity/processor/owners/code/${code}/eager`,
  },
  PRODUCTS: {
    QUERY_EAGER: "/api/entity/processor/products/eager/query",
    BY_CODE: (code: string) =>
      `/api/entity/processor/products/code/${code}/eager`,
    UPDATE: (id: number) => `/api/entity/processor/products/${id}`,
  },
  STAGES: {
    LIST: "/api/entity/processor/stages",
    EAGER: "/api/entity/processor/stages/eager",
  },
  PRODUCT_TEMPLATES: {
    LIST: "/api/entity/processor/products/templates",
    EAGER: "/api/entity/processor/products/templates/eager",
    BY_CODE: (code: string) => `/api/entity/processor/products/templates/req/${code}`,
  },
  TASKS: {
    QUERY_EAGER: "/api/entity/processor/tasks/eager/query",
    EAGER: "/api/entity/processor/tasks/eager",
    COMPLETE: (id: string | number) =>
      `/api/entity/processor/tasks/req/${id}/completed`,
  },
  NOTES: {
    EAGER: "/api/entity/processor/notes/eager",
  },
  ACTIVITIES: {
    TICKETS_EAGER: (ticketId: number) =>
      `/api/entity/processor/activities/tickets/${ticketId}/eager`,
  },
  CALL_LOGS: {
    QUERY: "/api/message/call/exotel/eager/query",
  },
  SOURCES: {
    LIST: "/api/entity/processor/sources",
    SAVE: "/api/entity/processor/sources",
  },
  TAGS: {
    LIST: "/api/entity/processor/tags",
    SAVE: "/api/entity/processor/tags",
  },
  USERS: {
    QUERY: "/api/entity/processor/tickets/users/query",
  },
  PARTNERS: {
    QUERY: "/api/entity/processor/partners/query",
  },
  TELEPHONY: {
    CONNECTIONS: "/api/core/connections",
    CONNECTION_BY_ID: (id: string) => `/api/core/connections/${id}`,
    PRODUCT_COMMS_DEFAULT: "/api/entity/processor/productComms/default",
    PRODUCT_COMMS: "/api/entity/processor/productComms",
    PRODUCT_COMMS_BY_CODE: (code: string) => `/api/entity/processor/productComms/code/${code}`,
    PRODUCT_COMMS_BY_ID: (id: number | string) => `/api/entity/processor/productComms/${id}`,
    PROVISIONING_INITIALIZE: "/api/message/call/provisioning/initialize",
    PROVISIONING_APP: "/api/message/call/provisioning/app",
    PROVISIONING_AGENT: "/api/message/call/provisioning/agent",
    PROVISIONING_AGENTS: "/api/message/call/provisioning/agents",
    PROVISIONING_AGENT_DEACTIVATE: (userId: string | number) => `/api/message/call/provisioning/agent/${userId}`,
    BROWSER_STATUS: "/api/message/call/browser/status",
    BROWSER_TOKEN: "/api/message/call/browser/token",
  },
  ANALYTICS: {
    STAGE_COUNTS: "/api/entity/processor/analytics/tickets/stage-counts/sources/assigned-users",
    ASSIGNED_USERS: "/api/entity/processor/analytics/tickets/stage-counts/assigned-users",
  },
} as const;
