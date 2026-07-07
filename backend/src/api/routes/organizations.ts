import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { requireAuth } from '../../middleware/auth';
import {
  createOrganizationHandler,
  deleteOrganizationHandler,
  getOrganizationHandler,
  listOrganizationsHandler,
  updateOrganizationHandler,
} from '../controllers/organizations.controller';

const router = Router();

router.use(requireAuth);

router.post('/', asyncHandler(createOrganizationHandler));
router.get('/', asyncHandler(listOrganizationsHandler));
router.get('/:id', asyncHandler(getOrganizationHandler));
router.patch('/:id', asyncHandler(updateOrganizationHandler));
router.delete('/:id', asyncHandler(deleteOrganizationHandler));

export default router;
