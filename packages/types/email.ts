export interface Email {
  id: string
  organizationId: string
  userId: string
  name: string
  subject: string
  htmlBody: string
  variables: string[] // JSON array
  createdAt: Date
}

export interface EmailCampaign {
  id: string
  emailId: string
  sentCount: number
  status: 'draft' | 'sent' | 'failed'
  sentAt?: Date
}
