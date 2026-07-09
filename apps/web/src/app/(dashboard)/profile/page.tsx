'use client';

import { useState } from 'react';
import { useAuth } from '../../providers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Camera } from 'lucide-react';

export const runtime = "nodejs";

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.full_name ?? '');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  if (!user) return null;

  const initial = (user.name?.trim()?.charAt(0) || user.email.charAt(0)).toUpperCase();

  const markDirty = () => {
    setIsDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    // TODO: wire to PATCH /api/auth/me once the backend endpoint exists.
    // Payload shape assumed: { name, bio } — confirm against actual schema
    // once the endpoint is built.
    await new Promise((r) => setTimeout(r, 400));
    setIsSaving(false);
    setSaved(true);
    setIsDirty(false);
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
            {/* Avatar with hover-to-upload affordance. Visual only for now —
                no upload endpoint exists, so clicking is a no-op with a
                title tooltip rather than a fake file picker. */}
            <div className="group relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-xl font-semibold text-white">
                {initial}
              </div>
              <button
                type="button"
                title="Avatar upload coming soon"
                disabled
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100"
              >
                <Camera className="h-5 w-5" />
              </button>
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
              markDirty();
            }}
            placeholder="Add your name"
          />
          <Input label="Email" id="email" defaultValue={user.email} disabled />
          <div>
            <label htmlFor="bio" className="mb-1 block text-sm font-medium text-ink">
              Bio
            </label>
            <textarea
              id="bio"
              rows={3}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                markDirty();
              }}
              placeholder="Tell others a bit about yourself"
              maxLength={160}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-ink placeholder:text-gray-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{bio.length}/160</p>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          {saved ? (
            <p className="text-sm text-brand-700">Saved.</p>
          ) : isDirty ? (
            <p className="text-sm text-gray-400">Unsaved changes</p>
          ) : (
            <span />
          )}
          <Button onClick={handleSave} isLoading={isSaving} disabled={!isDirty || isSaving}>
            Save changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}