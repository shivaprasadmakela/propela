import { create } from 'zustand';
import { authApi, type LoginCredentials, type AuthUser, type LoginResponse, type AuthClient } from '../api/authApi';

export interface AuthState {
  user: AuthUser | null;
  client: AuthClient | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
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
    // If already initialized or currently loading, do nothing
    if (get().isInitialized || get().isLoading) return;

    set({ isLoading: true });

    const storedToken = localStorage.getItem('accessToken');
    const storedExpiry = localStorage.getItem('accessTokenExpiryAt');

    // Check if token exists and hasn't expired (compare UNIX seconds). 
    // If storedExpiry is missing (e.g. from an older session), default to false to let the API verify.
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
      // Set token early so requests made during initialisation can use it
      set({ token: storedToken });

      const response = await authApi.verifyToken();
      set({
        user: response.user,
        client: response.client,
        token: response.accessToken, // Update to refreshed token if provided
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
      });

      // Keep local storage updated
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('accessTokenExpiryAt', response.accessTokenExpiryAt.toString());
    } catch (error) {
      // Verify failed (e.g. 401 or network)
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

// Listen to 401 events dispatched from the HTTP client to auto-logout
window.addEventListener('auth:unauthorized', () => {
  useAuthStore.getState().logout();
});

// Expose store to window for debugging in development
if (import.meta.env.DEV) {

  // @ts-expect-error - Attach direct getState method for convenience
  window.getStore = useAuthStore.getState;
}

