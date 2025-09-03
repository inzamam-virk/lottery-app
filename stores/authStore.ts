import { create } from 'zustand';
import { User, UserRole } from '../types';
import { apiClient } from '../lib/api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, role: UserRole) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true
  error: null,

  // Actions
  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await apiClient.signIn(email, password);
      
      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      if (data.user) {
        // Fetch user profile from our users table
        const userResponse = await apiClient.get(`/rest/v1/users?id=eq.${data.user.id}`);
        
        if (userResponse.data && userResponse.data.length > 0) {
          const userProfile = userResponse.data[0];
          set({
            user: userProfile,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        }
      }

      set({ error: 'User profile not found', isLoading: false });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  signUp: async (email: string, password: string, role: UserRole) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await apiClient.signUp(email, password);
      
      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      if (data.user) {
        // Create user profile in our users table
        const userProfile = {
          id: data.user.id,
          email: data.user.email!,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const profileResponse = await apiClient.post('/rest/v1/users', userProfile);
        
        if (profileResponse.error) {
          set({ error: profileResponse.error, isLoading: false });
          return false;
        }

        set({
          user: userProfile,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      }

      set({ error: 'Sign up failed', isLoading: false });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      await apiClient.signOut();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear the state even if API call fails
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  checkAuth: async () => {
    try {
      console.log('🔐 AuthStore: Starting authentication check...');
      set({ isLoading: true });
      
      console.log('🔐 AuthStore: Calling apiClient.getCurrentUser()...');
      const { user, error } = await apiClient.getCurrentUser();
      
      console.log('🔐 AuthStore: getCurrentUser result:', { user, error });
      
      if (error || !user) {
        console.log('🔐 AuthStore: No user or error, setting unauthenticated');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      // Fetch user profile from our users table
      const userResponse = await apiClient.get(`/rest/v1/users?id=eq.${user.id}`);
      
      if (userResponse.data && userResponse.data.length > 0) {
        const userProfile = userResponse.data[0];
        set({
          user: userProfile,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },
}));
