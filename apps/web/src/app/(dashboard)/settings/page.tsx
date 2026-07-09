'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers/auth-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">Preferences</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your account and session.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what you hear about, and how.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between text-sm text-ink">
            Email notifications
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600" />
          </label>
          <label className="flex items-center justify-between text-sm text-ink">
            Product updates
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600" />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>Sign out of ABLE on this device.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="danger" isLoading={isLoggingOut} onClick={handleLogout}>
            Log out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
