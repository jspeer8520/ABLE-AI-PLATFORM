import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!;
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      await prisma.subscription.upsert({
        where: { stripeSubscriptionId: sub.id },
        update: {
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
        create: {
          stripeSubscriptionId: sub.id,
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await prisma.subscription.update({
        where: { stripeSubscriptionId: sub.id },
        data: { status: 'canceled' },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
