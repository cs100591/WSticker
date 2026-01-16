/**
 * useAuth Hook
 * Provides authentication state and methods
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';

export const useAuth = () => {
  const { user, session, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Initialize auth on mount
    authService.initialize();
    
    // Setup auth state listener
    authService.setupAuthListener();
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    signIn: authService.signIn.bind(authService),
    signUp: authService.signUp.bind(authService),
    signOut: authService.signOut.bind(authService),
    resetPassword: authService.resetPassword.bind(authService),
    refreshSession: authService.refreshSession.bind(authService),
  };
};
