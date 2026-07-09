'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../providers';
import { ApiError } from '@/app/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Check, CreditCard, Download, Mail, Package, Workflow, X, Zap } from 'lucide-react';

type Plan = {
  id: string;
  name: string;
  price: number;
  stripePriceId: string | null;
  maxProducts: number;
  maxEmails: number;
  maxWorkflows: number;
  monthlyCredits: number;
};

type Subscription = {
  id: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
} | null;

const formatPrice = (cents: number) =>
  cents === 0 ? '$0' : `$${(cents / 100).toFixed(0)}`;

export default function BillingPage() {
  const { authFetch } = useAuth();
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get('checkout');

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [plansData, subData] = await Promise.all([
          authFetch<Plan[]>('/api/billing/plans'),
          authFetch<{ subscription: Subscription; plan: Plan }>('/api/billing/subscription'),
        ]);

        setPlans(plansData);
        setCurrentPlan(subData.plan);
        setSubscription(subData.subscription);
      } catch (e) {
        setError('Could not load billing information. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authFetch]);

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    setError(null);
    try {
      const data = await authFetch<{ url: string }>('/api/billing/checkout', {
        method: 'POST',
        body: { planId },
      });

      // Full navigation, not router.push — Stripe Checkout is a
      // Stripe-hosted page outside your Next.js app.
      window.location.href = data.url;
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Something went wrong starting checkout.';
      setError(message);
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-gray-100" />
        <div className="h-32 animate-pulse rounded-lg bg-gray-100" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">Account</p>
        <h1 className="mt-1 text-3xl font-bold text-ink">Billing</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your plan and payment method.</p>
      </div>

      {checkoutStatus === 'success' && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check className="h-4 w-4" /> Payment successful — your plan will update shortly.
        </div>
      )}
      {checkoutStatus === 'cancelled' && (
        <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <X className="h-4 w-4" /> Checkout was cancelled. No changes were made.
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-brand-600" /> Current plan
            </CardTitle>
            <CardDescription>
              You're on the {currentPlan.name} plan
              {subscription && subscription.status !== 'active' && (
                <span className="ml-1 font-medium text-yellow-700">({subscription.status})</span>
              )}
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-3xl font-bold text-ink">
              {formatPrice(currentPlan.price)}
              <span className="text-base font-normal text-gray-500">/month</span>
            </p>

            {subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
              <p className="text-sm text-yellow-700">
                Cancels on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
              </p>
            )}

            <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-3 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-gray-400" />
                {currentPlan.maxProducts >= 999 ? 'Unlimited' : currentPlan.maxProducts} products
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                {currentPlan.maxEmails.toLocaleString()} emails/mo
              </div>
              <div className="flex items-center gap-1.5">
                <Workflow className="h-3.5 w-3.5 text-gray-400" />
                {currentPlan.maxWorkflows} workflows
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-500">Available plans</h2>
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan?.id;
            return (
              <Card key={plan.id} className={isCurrent ? 'ring-2 ring-brand-500' : ''}>
                <CardHeader>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <p className="text-2xl font-bold text-ink">
                    {formatPrice(plan.price)}
                    <span className="text-sm font-normal text-gray-500">/mo</span>
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    <li className="flex items-start gap-1.5">
                      <Check className="mt-0.5 h-3 w-3 flex-none text-brand-600" />
                      {plan.maxProducts >= 999 ? 'Unlimited' : plan.maxProducts} products
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="mt-0.5 h-3 w-3 flex-none text-brand-600" />
                      {plan.maxEmails.toLocaleString()} emails/mo
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="mt-0.5 h-3 w-3 flex-none text-brand-600" />
                      {plan.maxWorkflows} workflows
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="mt-0.5 h-3 w-3 flex-none text-brand-600" />
                      {plan.monthlyCredits.toLocaleString()} credits/mo
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrent ? (
                    <Button variant="secondary" disabled className="w-full">
                      Current plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      isLoading={upgrading === plan.id}
                      disabled={!plan.stripePriceId}
                      title={!plan.stripePriceId ? 'Not yet available' : undefined}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {!currentPlan || plan.price > currentPlan.price ? 'Upgrade' : 'Downgrade'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-400" /> Payment method
          </CardTitle>
          <CardDescription>Manage your card via the Stripe customer portal.</CardDescription>
        </CardHeader>
        <CardFooter>
          {/* Requires a separate /api/billing/portal route that creates a
              stripe.billingPortal.sessions.create() session — not built
              yet in this pass. Flagging rather than faking it. */}
          <Button variant="secondary" disabled title="Customer portal route not yet built">
            Manage payment method
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-4 w-4 text-gray-400" /> Invoice history
          </CardTitle>
          <CardDescription>Your past invoices will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
            <p className="text-sm text-gray-500">No invoices yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
