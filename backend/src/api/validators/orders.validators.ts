import { z } from 'zod';

export const createOrderSchema = z.object({
  organizationId: z.string().min(1),
  productId: z.string().min(1),
  customerEmail: z.string().email(),
  customerName: z.string().min(1).max(200).optional(),
  amount: z.number().int().min(0),
  stripeSessionId: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'completed', 'refunded', 'failed']),
});

export const orderIdParamSchema = z.string().min(1, 'Order id is required');

export const listOrdersQuerySchema = z.object({
  organizationId: z.string().min(1),
  status: z.string().optional(),
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
