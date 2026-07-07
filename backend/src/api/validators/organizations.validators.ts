import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(slugPattern, 'Slug must be lowercase letters, numbers, and hyphens only'),
  image: z.string().url().optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  image: z.string().url().nullable().optional(),
});

export const organizationIdParamSchema = z.string().min(1, 'Organization id is required');

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
