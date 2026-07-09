'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M10 2 2 8v10h5v-6h6v6h5V8l-8-6Z" />
      </svg>
    ),
  },
  {
    name: 'Inbox',
    href: '/inbox',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M4 4h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm0 2 6 4 6-4" stroke="currentColor" strokeWidth="0" fill="none" />
        <path d="M2 6.5 10 12l8-5.5V15a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6.5Z" />
        <path d="m2 5 8 5.5L18 5" stroke="white" strokeWidth="1" fill="none" />
      </svg>
    ),
  },
  {
    name: 'Billing',
    href: '/billing',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M2 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5Zm2 1v2h12V6H4Zm0 4v4h4v-4H4Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M10 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 8a6 6 0 0 1 12 0 1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path fillRule="evenodd" d="M11.078 2.25c.917 0 1.699.663 1.85 1.567l.132.795a.75.75 0 0 0 .445.56c.083.036.164.073.244.114a.75.75 0 0 0 .71-.024l.696-.395a1.875 1.875 0 0 1 2.416.517l.529.75a1.875 1.875 0 0 1-.257 2.418l-.598.573a.75.75 0 0 0-.222.638 6.6 6.6 0 0 1 0 .594.75.75 0 0 0 .222.638l.598.573c.694.667.795 1.734.257 2.418l-.53.75a1.875 1.875 0 0 1-2.415.517l-.696-.395a.75.75 0 0 0-.71-.024 5.6 5.6 0 0 1-.245.114.75.75 0 0 0-.444.56l-.133.795A1.875 1.875 0 0 1 11.078 17.75h-1.156a1.875 1.875 0 0 1-1.85-1.567l-.132-.795a.75.75 0 0 0-.445-.56 5.31 5.31 0 0 1-.244-.114.75.75 0 0 0-.71.024l-.696.395a1.875 1.875 0 0 1-2.416-.517l-.529-.75a1.875 1.875 0 0 1 .257-2.418l.598-.573a.75.75 0 0 0 .222-.638 6.6 6.6 0 0 1 0-.594.75.75 0 0 0-.222-.638l-.598-.573a1.875 1.875 0 0 1-.257-2.418l.53-.75a1.875 1.875 0 0 1 2.415-.517l.696.395a.75.75 0 0 0 .71.024c.08-.04.161-.078.245-.114a.75.75 0 0 0 .444-.56l.133-.795a1.875 1.875 0 0 1 1.85-1.567h1.156ZM10 13.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          A
        </div>
        <h1 className="text-xl font-bold text-ink">ABLE</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-ink',
              )}
            >
              <span className={active ? 'text-brand-600' : 'text-gray-400'}>{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 px-6 py-4">
        <p className="text-xs text-gray-400">ABLE AI Platform</p>
      </div>
    </aside>
  );
}
