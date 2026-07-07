import { prisma } from '../database/prisma';
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import type { CreateOrganizationInput, UpdateOrganizationInput } from '../../api/validators/organizations.validators';

/** Throws if the user is not a member of the organization. Returns the membership row otherwise. */
async function requireMembership(organizationId: string, userId: string) {
  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (!membership) {
    throw new ForbiddenError('You are not a member of this organization');
  }
  return membership;
}

export async function createOrganization(userId: string, input: CreateOrganizationInput) {
  const existing = await prisma.organization.findUnique({ where: { slug: input.slug } });
  if (existing) {
    throw new ConflictError('An organization with this slug already exists');
  }

  return prisma.organization.create({
    data: {
      name: input.name,
      slug: input.slug,
      image: input.image,
      users: {
        create: { userId, role: 'owner' },
      },
    },
  });
}

export async function listOrganizationsForUser(userId: string) {
  const memberships = await prisma.userOrganization.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: 'asc' },
  });
  return memberships.map((m) => ({ ...m.organization, role: m.role }));
}

export async function getOrganizationById(organizationId: string, userId: string) {
  await requireMembership(organizationId, userId);
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!organization) {
    throw new NotFoundError('Organization not found');
  }
  return organization;
}

export async function updateOrganization(
  organizationId: string,
  userId: string,
  input: UpdateOrganizationInput,
) {
  const membership = await requireMembership(organizationId, userId);
  if (membership.role !== 'owner') {
    throw new ForbiddenError('Only the owner can update this organization');
  }
  return prisma.organization.update({
    where: { id: organizationId },
    data: input,
  });
}

export async function deleteOrganization(organizationId: string, userId: string) {
  const membership = await requireMembership(organizationId, userId);
  if (membership.role !== 'owner') {
    throw new ForbiddenError('Only the owner can delete this organization');
  }
  await prisma.organization.delete({ where: { id: organizationId } });
}
