import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
    },
  })

  // Create test organization
  const org = await prisma.organization.upsert({
    where: { slug: 'test-org' },
    update: {},
    create: {
      name: 'Test Organization',
      slug: 'test-org',
      users: {
        create: { userId: user.id, role: 'owner' },
      },
    },
  })

  // Create free plan
  const freePlan = await prisma.plan.upsert({
    where: { name: 'Free' },
    update: {},
    create: {
      name: 'Free',
      price: 0,
      maxProducts: 1,
      maxEmails: 100,
      maxWorkflows: 0,
      monthlyCredits: 500,
    },
  })

  // Create subscription
  await prisma.subscription.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: {},
    create: {
      organizationId: org.id,
      userId: user.id,
      planId: freePlan.id,
      status: 'active',
    },
  })

  // Create test product
  await prisma.product.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      name: 'Test Course',
      slug: 'test-course',
      description: 'A test digital course',
      price: 4999,
      type: 'course',
      published: true,
    },
  })

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
