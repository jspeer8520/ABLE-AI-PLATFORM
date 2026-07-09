"use client";

import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AuthContextType {
  supabase: typeof supabase;
  session: Session | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  user: Session['user'] | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoaded(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setIsLoaded(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      supabase,
      session,
      isLoaded,
      isSignedIn: !!session,
      user: session?.user ?? null,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useSupabase must be used within AuthProvider');
  return context.supabase;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
