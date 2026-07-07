export interface Product {
  id: string
  organizationId: string
  userId: string
  name: string
  slug: string
  description?: string
  price: number // cents
  type: 'course' | 'ebook' | 'template' | 'download'
  image?: string
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateProductInput {
  name: string
  slug: string
  description?: string
  price: number
  type: Product['type']
  image?: string
}
