'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/providers/auth-provider';
import Sidebar from '@/app/components/dashboard/sidebar';
import Header from '@/app/components/dashboard/header';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen bg-gray-50">
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
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div key={pathname} className="mx-auto max-w-7xl p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
