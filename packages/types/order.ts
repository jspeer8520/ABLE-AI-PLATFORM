export interface Order {
  id: string
  organizationId: string
  productId: string
  customerId: string
  userId: string
  amount: number // cents
  status: 'completed' | 'pending' | 'failed'
  stripeSessionId?: string
  customerEmail: string
  createdAt: Date
}
