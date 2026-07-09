import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  // Fails fast at boot rather than on first checkout attempt in prod.
  // If this throws, it means Vercel's Stripe integration env vars
  // aren't reaching this environment (check Project Settings > Environment Variables).
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Pin to a fixed API version so Stripe's dashboard-side default upgrades
  // don't silently change response shapes under you. This should match
  // whatever version ships with your installed `stripe` package —
  // run `npm ls stripe` then check that version's bundled API_VERSION
  // (or just omit this and let the SDK default do it automatically,
  // which is Stripe's own recommendation for strongly-typed languages).
  apiVersion: '2026-06-24.dahlia',
  typescript: true,
});