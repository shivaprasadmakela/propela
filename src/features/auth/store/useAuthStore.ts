import { create } from 'zustand';
import { authApi, type LoginCredentials, type AuthUser, type LoginResponse, type AuthClient } from '../api/authApi';

export interface AuthState {
  user: AuthUser | null;
  client: AuthClient | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  
  initAuth: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  client: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  initAuth: async () => {
    
    if (get().isInitialized || get().isLoading) return;

    set({ isLoading: true });

    const storedToken = localStorage.getItem('accessToken');
    const storedExpiry = localStorage.getItem('accessTokenExpiryAt');

    
    
    const isExpired = storedExpiry ? (Date.now() / 1000) >= Number(storedExpiry) : false;

    if (!storedToken || isExpired) {
      if (isExpired) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('accessTokenExpiryAt');
      }

      set({
        user: null,
        client: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
      return;
    }

    try {
      
      set({ token: storedToken });

      const response = await authApi.verifyToken();
      set({
        user: response.user,
        client: response.client,
        token: response.accessToken, 
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });

      
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('accessTokenExpiryAt', response.accessTokenExpiryAt.toString());
    } catch (error) {
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('accessTokenExpiryAt');
      set({
        user: null,
        client: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login(credentials);

      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('accessTokenExpiryAt', response.accessTokenExpiryAt.toString());

      set({
        user: response.user,
        client: response.client,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });

      return response;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('accessTokenExpiryAt');
    set({
      user: null,
      client: null,
      token: null,
      isAuthenticated: false,
    });
  },
}));


window.addEventListener('auth:unauthorized', () => {
  useAuthStore.getState().logout();
});


if (import.meta.env.DEV) {

  
  window.getStore = useAuthStore.getState;
}

