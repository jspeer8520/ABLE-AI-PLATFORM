import { prisma } from '@/app/lib/prisma';

export async function logUsage(userId: string, organizationId: string, feature: string, cost: number) {
  await prisma.usageLog.create({
    data: {
      userId,
      organizationId,
      feature,
      costInCredits: cost,
    },
  });

  await prisma.creditBalance.update({
    where: { userId },
    data: {
      balance: { decrement: cost },
    },
  });
}
