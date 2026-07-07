import { Router } from 'express';
import authRouter from './auth';
import agentsRouter from './agents';
import healthRouter from './health';
import organizationsRouter from './organizations';
import productsRouter from './products';
import ordersRouter from './orders';

const router = Router();

router.use(healthRouter);
router.use('/auth', authRouter);
router.use('/agents', agentsRouter);
router.use('/organizations', organizationsRouter);
router.use('/products', productsRouter);
router.use('/orders', ordersRouter);

export default router;
