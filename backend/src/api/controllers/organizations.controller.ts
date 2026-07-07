import type { Request, Response } from 'express';
import {
  createOrganization,
  deleteOrganization,
  getOrganizationById,
  listOrganizationsForUser,
  updateOrganization,
} from '../../services/organizations/organizations.service';
import {
  createOrganizationSchema,
  organizationIdParamSchema,
  updateOrganizationSchema,
} from '../validators/organizations.validators';

export async function createOrganizationHandler(req: Request, res: Response): Promise<void> {
  const input = createOrganizationSchema.parse(req.body);
  const organization = await createOrganization(req.user!.id, input);
  res.status(201).json({ organization });
}

export async function listOrganizationsHandler(req: Request, res: Response): Promise<void> {
  const organizations = await listOrganizationsForUser(req.user!.id);
  res.status(200).json({ organizations });
}

export async function getOrganizationHandler(req: Request, res: Response): Promise<void> {
  const id = organizationIdParamSchema.parse(req.params.id);
  const organization = await getOrganizationById(id, req.user!.id);
  res.status(200).json({ organization });
}

export async function updateOrganizationHandler(req: Request, res: Response): Promise<void> {
  const id = organizationIdParamSchema.parse(req.params.id);
  const input = updateOrganizationSchema.parse(req.body);
  const organization = await updateOrganization(id, req.user!.id, input);
  res.status(200).json({ organization });
}

export async function deleteOrganizationHandler(req: Request, res: Response): Promise<void> {
  const id = organizationIdParamSchema.parse(req.params.id);
  await deleteOrganization(id, req.user!.id);
  res.status(204).send();
}
