import { prisma } from '../database/prisma';
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from '../../api/validators/products.validators';

async function requireMembership(organizationId: string, userId: string) {
  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (!membership) {
    throw new ForbiddenError('You are not a member of this organization');
  }
  return membership;
}

export async function createProduct(userId: string, input: CreateProductInput) {
  await requireMembership(input.organizationId, userId);

  const existing = await prisma.product.findUnique({
    where: { organizationId_slug: { organizationId: input.organizationId, slug: input.slug } },
  });
  if (existing) {
    throw new ConflictError('A product with this slug already exists in this organization');
  }

  return prisma.product.create({
    data: {
      organizationId: input.organizationId,
      userId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      price: input.price,
      type: input.type,
      image: input.image,
    },
  });
}

export async function listProducts(userId: string, query: ListProductsQuery) {
  await requireMembership(query.organizationId, userId);

  const where = {
    organizationId: query.organizationId,
    ...(query.published !== undefined ? { published: query.published === 'true' } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: query.skip,
      take: query.take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, skip: query.skip, take: query.take };
}

async function findProductOrThrow(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  return product;
}

export async function getProductById(productId: string, userId: string) {
  const product = await findProductOrThrow(productId);
  await requireMembership(product.organizationId, userId);
  return product;
}

export async function updateProduct(productId: string, userId: string, input: UpdateProductInput) {
  const product = await findProductOrThrow(productId);
  await requireMembership(product.organizationId, userId);
  return prisma.product.update({ where: { id: productId }, data: input });
}

export async function deleteProduct(productId: string, userId: string) {
  const product = await findProductOrThrow(productId);
  await requireMembership(product.organizationId, userId);
  await prisma.product.delete({ where: { id: productId } });
}
