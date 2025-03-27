import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing. Make sure to provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for auth
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
};

// User data functions
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
};

export const getUserRole = async () => {
  const { user, error } = await getCurrentUser();
  
  if (error || !user) {
    return { role: null, error };
  }
  
  // Fetch user role from the database
  const { data, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  return { 
    role: data?.role || null, 
    error: roleError 
  };
};

// Real-time subscription helpers
export const subscribeToAirplayLogs = (callback: (payload: any) => void) => {
  return supabase
    .channel('airplay_logs_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'airplay_logs',
      },
      callback
    )
    .subscribe();
}; 