'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthProvider } from "@/app/providers";
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CreditCard,
  Mail,
  Settings,
  Shield,
  UserCircle,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { href: '/profile', icon: UserCircle, label: 'Edit profile', desc: 'Name, avatar, bio' },
  { href: '/settings/security', icon: Shield, label: 'Security', desc: 'Password, sessions' },
  { href: '/settings/notifications', icon: Bell, label: 'Notifications', desc: 'Manage alerts' },
  { href: '/billing', icon: CreditCard, label: 'Billing', desc: 'Plan & invoices' },
];

export const runtime = "nodejs";

export default function DashboardPage() {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  if (!user) {
    return null;
  }

  const displayName = user.name?.trim() || user.email;
  const source: string = user.name?.trim() || user.email;

  const initials = source
    .split(/[\s.@]+/)
    .filter((part: string) => part.length > 0)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? "")
    .join("");





  // TODO: wire to your actual resend-verification endpoint once it exists.
  // Left as a stub so the button is functional-looking without inventing an API shape.
  const handleResend = async () => {
    setResending(true);
    try {
      // await api.post('/auth/resend-verification');
      setResent(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with avatar instead of plain text-only greeting */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-600">Overview</p>
          <h1 className="mt-0.5 text-3xl font-bold text-ink">Welcome, {displayName}</h1>
        </div>
      </div>

      {/* Actionable banner instead of a passive status card — only shows when relevant */}
      {!user.emailVerified && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-yellow-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">Your email isn't verified yet</p>
            <p className="mt-0.5 text-sm text-yellow-700">
              Verify {user.email} to unlock all features.
            </p>
          </div>
          <Button
            onClick={handleResend}
            isLoading={resending}
            disabled={resent}
            className="flex-none bg-yellow-600 hover:bg-yellow-700"
          >
            {resent ? 'Sent ✓' : 'Resend link'}
          </Button>
        </div>
      )}

      {/* Quick actions — turns the dashboard into a launch point, not just a status page */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500">Quick actions</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href as any}>
              <Card className="h-full transition hover:border-brand-300 hover:shadow-md">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Account details consolidated into one table instead of 4 separate cards —
          same info, less scanning, less white space */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-500">Account details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <dl className="divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="h-4 w-4" /> Email
              </dt>
              <dd className="text-sm font-medium text-ink">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-sm text-gray-500">Verification</dt>
              <dd>
                {user.emailVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                    Not verified
                  </span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-sm text-gray-500">Role</dt>
              <dd className="text-sm font-medium capitalize text-ink">{user.role}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-sm text-gray-500">Account ID</dt>
              <dd className="break-all font-mono text-xs text-gray-600">{user.id}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Settings shortcut row */}
      <Link
        href="/settings"
        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 transition hover:border-brand-300 hover:text-ink"
      >
        <span className="flex items-center gap-2">
          <Settings className="h-4 w-4" /> All settings
        </span>
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}