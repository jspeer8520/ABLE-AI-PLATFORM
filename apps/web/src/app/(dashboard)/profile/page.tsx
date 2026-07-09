'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers/auth-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const initial = (user.name?.trim()?.charAt(0) || user.email.charAt(0)).toUpperCase();

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    // TODO: wire to PATCH /api/auth/me once the backend endpoint exists.
    await new Promise((r) => setTimeout(r, 400));
    setIsSaving(false);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">Account</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Profile</h1>
        <p className="mt-1 text-sm text-gray-600">This is how others on ABLE see you.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-xl font-semibold text-white">
              {initial}
            </div>
            <div>
              <CardTitle>Personal details</CardTitle>
              <CardDescription>Update your name and see your account email.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Name"
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            placeholder="Add your name"
          />
          <Input label="Email" id="email" defaultValue={user.email} disabled />
        </CardContent>
        <CardFooter className="justify-between">
          {saved ? <p className="text-sm text-brand-700">Saved.</p> : <span />}
          <Button onClick={handleSave} isLoading={isSaving}>
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
