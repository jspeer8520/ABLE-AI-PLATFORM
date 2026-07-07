import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'ABLE - Creator Platform',
  description: 'AI-powered business platform for creators',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-white text-foreground">{children}</body>
      </html>
    </ClerkProvider>
  )
}
