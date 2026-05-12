export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/security/authenticate',
    VERIFY_TOKEN: '/api/security/verifyToken',
    FIND_USER_CLIENTS: '/api/security/users/findUserClients?appLevel=false',
  },
  DEALS: {
    CREATE: '/api/entity/processor/tickets',
    QUERY_EAGER: '/api/entity/processor/tickets/eager/query',
    BY_CODE: (code: string) => `/api/entity/processor/tickets/code/${code}/eager`,
    UPDATE_BY_CODE: (code: string) => `/api/entity/processor/tickets/code/${code}`,
  },
  ACCOUNTS: {
    QUERY_EAGER: '/api/entity/processor/owners/eager/query',
    BY_CODE: (code: string) => `/api/entity/processor/owners/code/${code}/eager`,
  },
  PRODUCTS: {
    QUERY_EAGER: '/api/entity/processor/products/eager/query',
  },
  STAGES: {
    LIST: '/api/entity/processor/stages',
    EAGER: '/api/entity/processor/stages/eager',
  },
  PRODUCT_TEMPLATES: {
    LIST: '/api/entity/processor/products/templates',
  },
  TASKS: {
    QUERY_EAGER: '/api/entity/processor/tasks/eager/query',
    EAGER: '/api/entity/processor/tasks/eager',
    COMPLETE: (id: string | number) => `/api/entity/processor/tasks/req/${id}/completed`,
  },
  NOTES: {
    EAGER: '/api/entity/processor/notes/eager',
  },
  CALL_LOGS: {
    QUERY: '/api/message/call/exotel/eager/query',
  },
  SOURCES: {
    LIST: '/api/entity/processor/sources',
    SAVE: '/api/entity/processor/sources',
  },
  USERS: {
    QUERY: '/api/entity/processor/tickets/users/query',
  },
  PARTNERS: {
    QUERY: '/api/entity/processor/partners/query',
  },
} as const;
