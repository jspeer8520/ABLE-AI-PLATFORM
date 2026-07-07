'use client';

import { useAuth } from '@/app/providers/auth-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">Account</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Profile</h1>
        <p className="mt-1 text-sm text-gray-600">This is how others on ABLE see you.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>Update your name and see your account email.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Name" id="name" defaultValue={user.name ?? ''} placeholder="Add your name" />
          <Input label="Email" id="email" defaultValue={user.email} disabled />
        </CardContent>
        <CardFooter>
          <Button>Save changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
