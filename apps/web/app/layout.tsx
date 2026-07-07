import type { Metadata } from 'next';

import '../styles/globals.css';
import { AuthProvider } from '@/providers';

export const metadata: Metadata = {
  title: 'ABLE AI Platform',
  description: 'AI powered creator economy platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
