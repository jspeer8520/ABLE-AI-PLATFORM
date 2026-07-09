"use client";

import Link from "next/link";
import { useAuth } from "@/app/providers";
import { Button } from "@/app/components/ui/button";

export default function Navbar() {
  const { supabase } = useAuth();
const user = useAuth().user;

const source: string = user?.name?.trim() || user?.email || "";

const initials = source
  .split(/[\s.@]+/)
  .filter((part: string) => part.length > 0)
  .slice(0, 2)
  .map((part: string) => part.charAt(0).toUpperCase())
  .join("");

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <nav className="w-full border-b bg-white px-6 py-4 flex items-center justify-between">
      {/* Left: Logo */}
      <Link href="/" className="text-xl font-semibold">
        AbleAI
      </Link>

      {/* Right: Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-700 hover:text-black">
          Dashboard
        </Link>

        <Link href="/settings" className="text-gray-700 hover:text-black">
          Settings
        </Link>

        <Button onClick={handleLogout} className="flex items-center gap-4">
          Logout
        </Button>
      </div>
    </nav>
  );
}
