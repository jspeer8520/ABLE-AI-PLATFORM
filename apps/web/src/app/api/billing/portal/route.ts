import Stripe from 'stripe';
import { prisma } from '@/app/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
});

export async function POST() {
  // TODO: Replace with your real auth user ID
  const userId = 'replace-with-auth-user-id';

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  // Ensure Stripe customer exists
  const customer = await stripe.customers.create({
    email: user.email,
  });

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  return Response.json({ url: session.url });
}
