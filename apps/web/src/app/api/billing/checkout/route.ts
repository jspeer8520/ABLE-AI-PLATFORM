import Stripe from 'stripe';
import { prisma } from '@/app/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
});

export async function POST(req: Request) {
  const { planId } = await req.json();

  const plan = await prisma.plan.findUnique({ where: { id: planId } });

  if (!plan || !plan.stripePriceId) {
    return Response.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // TODO: Replace with real auth user ID
  const userId = 'replace-with-auth-user-id';
  const orgId = 'replace-with-org-id';

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const customer = await stripe.customers.create({
    email: user?.email ?? undefined,
    metadata: {
      userId,
      organizationId: orgId,
    },
  });

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        userId,
        organizationId: orgId,
        planId,
      },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?checkout=cancelled`,
  });

  return Response.json({ url: session.url });
}
