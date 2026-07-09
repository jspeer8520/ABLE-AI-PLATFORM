'use client';

import { useSession, useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

export function useAuth() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const user = useUser();

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signup(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  return {
    user,
    session,
    supabase,
    isLoaded: session !== undefined,
    isSignedIn: !!user,
    login,
    signup,
    logout,
  };
}
