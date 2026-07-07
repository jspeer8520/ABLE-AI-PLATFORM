import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { requireAuth } from '../../middleware/auth';
import {
  createOrderHandler,
  getOrderHandler,
  listOrdersHandler,
  updateOrderStatusHandler,
} from '../controllers/orders.controller';

const router = Router();

router.use(requireAuth);

router.post('/', asyncHandler(createOrderHandler));
router.get('/', asyncHandler(listOrdersHandler));
router.get('/:id', asyncHandler(getOrderHandler));
router.patch('/:id/status', asyncHandler(updateOrderStatusHandler));

export default router;
