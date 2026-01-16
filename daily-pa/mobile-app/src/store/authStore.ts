/**
 * Authentication state management using Zustand
 */

import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user 
  }),
  
  setSession: (session) => set({ 
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session?.user
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  signOut: () => set({ 
    user: null, 
    session: null, 
    isAuthenticated: false 
  }),
}));
