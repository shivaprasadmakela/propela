export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/security/authenticate',
    VERIFY_TOKEN: '/api/security/verifyToken',
    FIND_USER_CLIENTS: '/api/security/users/findUserClients?appLevel=false',
  },
  DEALS: {
    QUERY_EAGER: '/api/entity/processor/tickets/eager/query',
    BY_CODE: (code: string) => `/api/entity/processor/tickets/code/${code}/eager`,
  },
  ACCOUNTS: {
    QUERY_EAGER: '/api/entity/processor/owners/eager/query',
    BY_CODE: (code: string) => `/api/entity/processor/owners/code/${code}/eager`,
  },
  PRODUCTS: {
    QUERY_EAGER: '/api/entity/processor/products/eager/query',
  },
} as const;
