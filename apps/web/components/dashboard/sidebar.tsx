'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Products', href: '/dashboard/products' },
  { name: 'Emails', href: '/dashboard/emails' },
  { name: 'Workflows', href: '/dashboard/workflows' },
  { name: 'Contacts', href: '/dashboard/contacts' },
  { name: 'Analytics', href: '/dashboard/analytics' },
  { name: 'Settings', href: '/dashboard/settings' },
  { name: 'Billing', href: '/dashboard/billing' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-gray-200 bg-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">ABLE</h1>
      </div>
      
      <nav className="space-y-1 px-3 py-6">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'block rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
