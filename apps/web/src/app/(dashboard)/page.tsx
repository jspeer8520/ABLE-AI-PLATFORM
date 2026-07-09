'use client';

import { useAuth } from '@/app/providers/auth-provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const displayName = user.name?.trim() || user.email;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">Overview</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Welcome, {displayName}</h1>
        <p className="mt-1 text-sm text-gray-600">Here&apos;s your account overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-ink">{user.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Email verification</CardTitle>
          </CardHeader>
          <CardContent>
            {user.emailVerified ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                Not verified
              </span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize text-ink">{user.role}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Account ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all font-mono text-sm text-ink">{user.id}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
