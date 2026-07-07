import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@able/db'
import { requireOrgMember } from '@able/auth'
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().positive(),
  type: z.enum(['course', 'ebook', 'template', 'download']),
  image: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const organizationId = request.nextUrl.searchParams.get('org')
    if (!organizationId) return NextResponse.json({ error: 'MISSING_ORG' }, { status: 400 })

    await requireOrgMember(organizationId, userId)

    const products = await prisma.product.findMany({
      where: {
        organizationId,
        userId,
      },
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: products,
    })
  } catch (error) {
    console.error('GET /api/products:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const body = await request.json()
    const organizationId = body.organizationId

    await requireOrgMember(organizationId, userId)

    const validated = createProductSchema.parse(body)

    const product = await prisma.product.create({
      data: {
        ...validated,
        organizationId,
        userId,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: product,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 }
      )
    }
    console.error('POST /api/products:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
