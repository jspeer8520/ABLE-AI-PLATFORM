'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'

interface Stats {
  products: number
  revenue: number
  customers: number
}

export default function DashboardPage() {
  const { userId } = useAuth()
  const [stats, setStats] = useState<Stats>({ products: 0, revenue: 0, customers: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/analytics/revenue')
        if (res.ok) {
          const data = await res.json()
          setStats(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm text-gray-600">Products</h3>
          <p className="mt-2 text-2xl font-bold">{stats.products}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm text-gray-600">Revenue</h3>
          <p className="mt-2 text-2xl font-bold">${(stats.revenue / 100).toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-sm text-gray-600">Customers</h3>
          <p className="mt-2 text-2xl font-bold">{stats.customers}</p>
        </div>
      </div>
    </div>
  )
}
