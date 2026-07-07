import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@able/db'

export async function authMiddleware(request: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }
  
  // Add user context to request
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('X-User-Id', userId)
  requestHeaders.set('X-User-Email', user?.email || '')
  
  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export async function requireOrgMember(organizationId: string, userId: string) {
  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  })
  
  if (!membership) {
    throw new Error('FORBIDDEN')
  }
  
  return membership
}

export async function requireOrgOwner(organizationId: string, userId: string) {
  const membership = await requireOrgMember(organizationId, userId)
  
  if (membership.role !== 'owner') {
    throw new Error('FORBIDDEN')
  }
  
  return membership
}
