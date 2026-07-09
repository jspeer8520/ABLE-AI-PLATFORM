import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-06-24.dahlia',
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { priceId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
  });

  return Response.json({ url: session.url });
}
