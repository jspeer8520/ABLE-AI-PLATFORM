'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">Account</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Billing</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your plan and payment method.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>You&apos;re on the Free plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-ink">
            $0<span className="text-base font-normal text-gray-500">/month</span>
          </p>
        </CardContent>
        <CardFooter>
          <Button>Upgrade plan</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment method</CardTitle>
          <CardDescription>No card on file yet.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="secondary">Add payment method</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
