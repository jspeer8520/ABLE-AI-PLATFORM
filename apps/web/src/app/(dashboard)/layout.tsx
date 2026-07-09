'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import AuthProvider from "@/app/providers";
import Sidebar from '@/app/components/dashboard/sidebar';
import Header from '@/app/components/dashboard/header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  // Redirect once hydration is complete and the user is not signed in.
  // Doing this in an effect (not during render) avoids router updates while
  // rendering, which React forbids.
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar-shaped skeleton instead of a centered spinner — avoids
            the whole viewport flashing/jumping once real content mounts */}
        <div className="hidden w-64 flex-none border-r border-gray-200 bg-white lg:block">
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded-md bg-gray-100" />
            ))}
          </div>
        </div>
        <div className="flex flex-1 flex-col">
          <div className="h-16 flex-none animate-pulse border-b border-gray-200 bg-white" />
          <div className="flex-1 space-y-4 p-6">
            <div className="h-8 w-64 animate-pulse rounded-md bg-gray-100" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    // Redirect is in flight; render nothing to avoid a flash of dashboard UI.
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          {/* max-w constrains content on ultrawide monitors so cards/forms
              don't stretch to unreadable line lengths; mx-auto centers it */}
          <div key={pathname} className="mx-auto max-w-7xl p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}