'use client'

import { UserButton } from '@clerk/nextjs'

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  )
}
