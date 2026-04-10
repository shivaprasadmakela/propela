import { useAuthStore } from '../store/useAuthStore';
import type { AuthState } from '../store/useAuthStore';

export function useAuth(): AuthState {
  return useAuthStore();
}
