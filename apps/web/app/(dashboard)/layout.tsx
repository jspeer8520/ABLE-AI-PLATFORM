'use client'

import { ReactNode } from 'react'
import { useAuth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/sidebar'
import Header from '@/components/dashboard/header'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isLoaded, userId } = useAuth()

  if (!isLoaded || !userId) {
    return redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
