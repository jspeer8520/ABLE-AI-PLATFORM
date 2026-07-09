'use client';

import { useState } from 'react';
import AuthProvider from "@/app/providers";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AlertTriangle, Bell, Key, LogOut, Save, Trash2 } from 'lucide-react';

type NotificationPrefs = {
  emailNotifications: boolean;
  productUpdates: boolean;
  securityAlerts: boolean;
};

export const runtime = "nodejs";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // NOTE: this is local-only until the notification preferences model exists.
  // Wire this to GET/PATCH /api/settings/notifications (or wherever it lands)
  // and hydrate initial state from the response instead of these defaults.
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    emailNotifications: true,
    productUpdates: true,
    securityAlerts: true,
  });

  if (!user) return null;

  const togglePref = (key: keyof NotificationPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  };

  const handleSavePrefs = async () => {
    setIsSaving(true);
    try {
      // await api.patch('/settings/notifications', prefs);
      await new Promise((r) => setTimeout(r, 400)); // stub delay
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

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
        <p className="mt-1 text-sm text-gray-600">Manage your account, notifications, and session.</p>
      </div>

      {/* Notifications — now stateful with a real save action */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-gray-400" /> Notifications
          </CardTitle>
          <CardDescription>Choose what you hear about, and how.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {(
            [
              ['emailNotifications', 'Email notifications', 'Account activity, sign-ins, and alerts'],
              ['productUpdates', 'Product updates', 'New features and announcements'],
              ['securityAlerts', 'Security alerts', 'Password changes, new device sign-ins'],
            ] as const
          ).map(([key, label, desc]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between rounded-md px-2 py-2.5 text-sm hover:bg-gray-50"
            >
              <span>
                <span className="block font-medium text-ink">{label}</span>
                <span className="block text-xs text-gray-500">{desc}</span>
              </span>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={() => togglePref(key)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-600"
              />
            </label>
          ))}
        </CardContent>
        <CardFooter className="flex items-center gap-3">
          <Button onClick={handleSavePrefs} isLoading={isSaving}>
            <Save className="mr-1.5 h-4 w-4" /> Save changes
          </Button>
          {saved && <span className="text-sm text-green-600">Saved ✓</span>}
        </CardFooter>
      </Card>

      {/* Security — placeholder actions, since there's no password-change
          endpoint referenced anywhere yet. Buttons are disabled rather than
          faking a working flow. */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4 text-gray-400" /> Security
          </CardTitle>
          <CardDescription>Manage your password and active sessions.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-ink">Password</p>
              <p className="text-xs text-gray-500">Last changed: unavailable</p>
            </div>
            <Button variant="secondary" disabled title="Coming soon">
              Change password
            </Button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-ink">Active sessions</p>
              <p className="text-xs text-gray-500">Manage devices signed into your account</p>
            </div>
            <Button variant="secondary" disabled title="Coming soon">
              View sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-4 w-4 text-gray-400" /> Session
          </CardTitle>
          <CardDescription>Sign out of ABLE on this device.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="danger" isLoading={isLoggingOut} onClick={handleLogout}>
            Log out
          </Button>
        </CardFooter>
      </Card>

      {/* Danger zone — separated visually since account deletion is
          destructive and shouldn't sit at the same visual weight as toggles */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" /> Danger zone
          </CardTitle>
          <CardDescription>Irreversible account actions.</CardDescription>
        </CardHeader>
        <CardFooter>
          {!showDeleteConfirm ? (
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete account
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-700">Are you sure? This can't be undone.</p>
              <Button variant="danger" disabled title="Endpoint not yet implemented">
                Confirm delete
              </Button>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}