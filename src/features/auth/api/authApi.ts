import { httpClient } from '@/services/httpClient';
import { ENDPOINTS } from '@/services/endpoints';

export interface LoginCredentials {
  userName: string;
  password: string;
  rememberMe?: boolean;
  cookie?: boolean;
  indentifierType?: string;
  clientId?: number;
}

export interface AuthUser {
  id: number;
  userName: string;
  emailId: string;
  firstName: string;
  lastName: string;
  localeCode: string;
  statusCode: string;
  clientId: number;
  stringAuthorities: string[];
}

export interface AuthClient {
  id: number;
  code: string;
  name: string;
  typeCode: string;
  statusCode: string;
  businessType: string;
}

export interface LoginResponse {
  user: AuthUser;
  client: AuthClient;
  accessToken: string;
  accessTokenExpiryAt: number;
  loggedInClientCode: string;
  loggedInClientId: number;
  verifiedAppCode: string;
}

export const authApi = {
  login: (credentials: LoginCredentials): Promise<LoginResponse> => {
    return httpClient.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, {
      userName: credentials.userName,
      password: credentials.password,
      rememberMe: credentials.rememberMe ?? true,
      cookie: credentials.cookie ?? false,
      indentifierType: credentials.indentifierType ?? 'EMAIL_ID',
      clientId: credentials.clientId,
    });
  },
};
