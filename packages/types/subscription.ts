export interface Subscription {
  id: string
  organizationId: string
  userId: string
  planId: string
  status: 'active' | 'past_due' | 'canceled'
  stripeSubscriptionId?: string
  currentPeriodEnd?: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
}

export interface Plan {
  id: string
  name: string
  price: number // cents
  maxProducts: number
  maxEmails: number
  maxWorkflows: number
  monthlyCredits: number
}
