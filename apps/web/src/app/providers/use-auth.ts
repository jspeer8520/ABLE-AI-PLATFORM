"use client";

import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import { createContext, useContext } from "react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SupabaseContext = createContext({ supabase });
export { useAuth } from "@/providers/auth-provider";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  return useContext(SupabaseContext).supabase;
}
