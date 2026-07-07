import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { requireAuth } from '../../middleware/auth';
import {
  createProductHandler,
  deleteProductHandler,
  getProductHandler,
  listProductsHandler,
  updateProductHandler,
} from '../controllers/products.controller';

const router = Router();

router.use(requireAuth);

router.post('/', asyncHandler(createProductHandler));
router.get('/', asyncHandler(listProductsHandler));
router.get('/:id', asyncHandler(getProductHandler));
router.patch('/:id', asyncHandler(updateProductHandler));
router.delete('/:id', asyncHandler(deleteProductHandler));

export default router;
