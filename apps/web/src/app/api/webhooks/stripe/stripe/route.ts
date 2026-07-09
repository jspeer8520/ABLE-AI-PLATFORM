import Stripe from 'stripe';
import { prisma } from '@/app/lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
  });

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;

      await prisma.subscription.upsert({
        where: { stripeSubscriptionId: sub.id },
        update: {
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
        create: {
          stripeSubscriptionId: sub.id,
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          // TODO: map user + organization from metadata
          userId: sub.metadata.userId,
          organizationId: sub.metadata.organizationId,
          planId: sub.items.data[0].price.metadata.planId,
        },
      });

      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;

      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: 'canceled' },
      });

      break;
    }
  }

  return new Response('OK', { status: 200 });
}
