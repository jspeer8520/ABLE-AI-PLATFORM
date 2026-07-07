import { prisma } from '../database/prisma';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import type {
  CreateOrderInput,
  ListOrdersQuery,
  UpdateOrderStatusInput,
} from '../../api/validators/orders.validators';

async function requireMembership(organizationId: string, userId: string) {
  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (!membership) {
    throw new ForbiddenError('You are not a member of this organization');
  }
  return membership;
}

/** Finds or creates the Contact record for a purchasing customer. */
async function upsertContact(organizationId: string, userId: string, email: string, name?: string) {
  return prisma.contact.upsert({
    where: { organizationId_email: { organizationId, email } },
    update: { name: name ?? undefined, status: 'customer' },
    create: { organizationId, userId, email, name, status: 'customer' },
  });
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  await requireMembership(input.organizationId, userId);

  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product || product.organizationId !== input.organizationId) {
    throw new NotFoundError('Product not found in this organization');
  }

  const contact = await upsertContact(
    input.organizationId,
    userId,
    input.customerEmail,
    input.customerName,
  );

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        organizationId: input.organizationId,
        productId: input.productId,
        customerId: contact.id,
        userId,
        amount: input.amount,
        customerEmail: input.customerEmail,
        stripeSessionId: input.stripeSessionId,
      },
    });
    await tx.contact.update({
      where: { id: contact.id },
      data: { ltv: { increment: input.amount } },
    });
    return order;
  });
}

export async function listOrders(userId: string, query: ListOrdersQuery) {
  await requireMembership(query.organizationId, userId);

  const where = {
    organizationId: query.organizationId,
    ...(query.status ? { status: query.status } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: query.skip,
      take: query.take,
      orderBy: { createdAt: 'desc' },
      include: { product: true, customer: true },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, skip: query.skip, take: query.take };
}

async function findOrderOrThrow(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new NotFoundError('Order not found');
  }
  return order;
}

export async function getOrderById(orderId: string, userId: string) {
  const order = await findOrderOrThrow(orderId);
  await requireMembership(order.organizationId, userId);
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true, customer: true },
  });
}

export async function updateOrderStatus(
  orderId: string,
  userId: string,
  input: UpdateOrderStatusInput,
) {
  const order = await findOrderOrThrow(orderId);
  await requireMembership(order.organizationId, userId);
  return prisma.order.update({ where: { id: orderId }, data: { status: input.status } });
}
