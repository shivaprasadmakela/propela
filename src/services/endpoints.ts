export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/security/authenticate',
    VERIFY_TOKEN: '/api/security/verifyToken',
    FIND_USER_CLIENTS: '/api/security/users/findUserClients?appLevel=false',
  },
} as const;
