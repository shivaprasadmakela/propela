export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/security/authenticate',
    VERIFY_TOKEN: '/api/security/verifyToken',
    FIND_USER_CLIENTS: '/api/security/users/findUserClients?appLevel=false',
  },
  DEALS: {
    QUERY_EAGER: '/api/entity/processor/tickets/eager/query',
  },
  ACCOUNTS: {
    QUERY_EAGER: '/api/entity/processor/owners/eager/query',
  },
  PRODUCTS: {
    QUERY_EAGER: '/api/entity/processor/products/eager/query',
  },
} as const;
