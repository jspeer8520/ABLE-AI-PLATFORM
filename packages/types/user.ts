export interface User {
  id: string
  email: string
  name?: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

export interface Organization {
  id: string
  name: string
  slug: string
  image?: string
  createdAt: Date
}

export interface UserOrganization {
  userId: string
  organizationId: string
  role: 'owner' | 'member'
}
