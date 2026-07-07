import { auth, currentUser } from '@clerk/nextjs/server'

export async function getClerkAuth() {
  const { userId, sessionId } = await auth()
  const user = await currentUser()
  
  return {
    userId,
    sessionId,
    user: user ? {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: user.firstName || user.lastName ? `${user.firstName} ${user.lastName}`.trim() : undefined,
      image: user.imageUrl,
    } : null,
  }
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }
  return userId
}
