import type { Request, Response } from 'express';
import {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
} from '../../services/orders/orders.service';
import {
  createOrderSchema,
  listOrdersQuerySchema,
  orderIdParamSchema,
  updateOrderStatusSchema,
} from '../validators/orders.validators';

export async function createOrderHandler(req: Request, res: Response): Promise<void> {
  const input = createOrderSchema.parse(req.body);
  const order = await createOrder(req.user!.id, input);
  res.status(201).json({ order });
}

export async function listOrdersHandler(req: Request, res: Response): Promise<void> {
  const query = listOrdersQuerySchema.parse(req.query);
  const result = await listOrders(req.user!.id, query);
  res.status(200).json(result);
}

export async function getOrderHandler(req: Request, res: Response): Promise<void> {
  const id = orderIdParamSchema.parse(req.params.id);
  const order = await getOrderById(id, req.user!.id);
  res.status(200).json({ order });
}

export async function updateOrderStatusHandler(req: Request, res: Response): Promise<void> {
  const id = orderIdParamSchema.parse(req.params.id);
  const input = updateOrderStatusSchema.parse(req.body);
  const order = await updateOrderStatus(id, req.user!.id, input);
  res.status(200).json({ order });
}
