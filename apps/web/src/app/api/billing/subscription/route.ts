import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { requireUser, UnauthorizedError } from '@/app/lib/auth/verify-access-token';

export async function GET(req: NextRequest) {
  let userId: string;
  try {
    const payload = await requireUser(req);
    userId = payload.sub;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const subscription = await prisma.subscription.findFirst({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) {
    // No Subscription row yet means the user has never checked out —
    // fall back to the Free plan rather than erroring, since every user
    // implicitly has Free access per your Plan model defaults.
    const freePlan = await prisma.plan.findUnique({ where: { name: 'Free' } });
    return NextResponse.json({
      subscription: null,
      plan: freePlan,
    });
  }

  return NextResponse.json({ subscription, plan: subscription.plan });
}