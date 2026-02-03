'use client';

import { createClient } from '@/lib/supabase/client';

export async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Login failed. Please try again.' };
  }
}

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Registration failed. Please try again.' };
  }
}

export async function signInWithGoogle() {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    
    if (error) {
      return { error: error.message };
    }
    
    if (data?.url) {
      return { url: data.url };
    }
    
    return { error: 'Failed to get Google OAuth URL' };
  } catch (error) {
    return { error: 'Google login failed. Please try again.' };
  }
}

export async function signOut() {
  const supabase = createClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Logout failed. Please try again.' };
  }
}

export async function resetPassword(email: string) {
  const supabase = createClient();
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to send reset email. Please try again.' };
  }
}

export async function updatePassword(password: string) {
  const supabase = createClient();
  
  try {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update password. Please try again.' };
  }
}
