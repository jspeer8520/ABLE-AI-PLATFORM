export interface Contact {
  id: string
  organizationId: string
  email: string
  name?: string
  status: 'lead' | 'customer' | 'inactive'
  ltv: number // lifetime value in cents
  createdAt: Date
}
