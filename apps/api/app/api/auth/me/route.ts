import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@able/db'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizations: {
          include: {
            organization: true,
          },
        },
        subscriptions: {
          include: {
            plan: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        organizations: user.organizations.map((o) => ({
          ...o.organization,
          role: o.role,
        })),
      },
    })
  } catch (error) {
    console.error('GET /api/auth/me:', error)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
