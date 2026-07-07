import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const createProductSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(slugPattern, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().max(5000).optional(),
  price: z.number().int().min(0),
  type: z.enum(['course', 'ebook', 'template']),
  image: z.string().url().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  price: z.number().int().min(0).optional(),
  image: z.string().url().nullable().optional(),
  published: z.boolean().optional(),
});

export const productIdParamSchema = z.string().min(1, 'Product id is required');

export const listProductsQuerySchema = z.object({
  organizationId: z.string().min(1),
  published: z.enum(['true', 'false']).optional(),
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
