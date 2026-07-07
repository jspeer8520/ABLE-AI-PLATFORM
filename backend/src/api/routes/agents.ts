import { Router } from 'express';

import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../lib/async-handler';
import { authRateLimiter } from '../../middleware/rate-limit';
import { getAgentStatusHandler, runAgentHandler } from '../controllers/agents.controller';

const router = Router();

router.post('/run', authRateLimiter, requireAuth, asyncHandler(runAgentHandler));
router.get('/:id', requireAuth, asyncHandler(getAgentStatusHandler));

export default router;
