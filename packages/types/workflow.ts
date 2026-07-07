export interface Workflow {
  id: string
  organizationId: string
  userId: string
  name: string
  trigger: 'purchase' | 'new_contact' | 'product_created'
  enabled: boolean
  createdAt: Date
}

export interface WorkflowAction {
  id: string
  workflowId: string
  type: 'send_email' | 'create_contact' | 'update_contact'
  config: Record<string, any> // JSON config
  position: number
}
