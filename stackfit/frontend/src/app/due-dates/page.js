'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from "sonner"
import Card from '../components/ui/Card'
import { getAuthToken } from '@/utils/auth'
import Table from '../components/ui/Table'

export default function DueDatesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [dueDates, setDueDates] = useState({
    duePayments: [],
    upcomingRenewals: []
  })

  useEffect(() => {
    fetchDueDatesData()
  }, [])

  const fetchDueDatesData = async () => {
    try {
      setIsLoading(true)
      const token = getAuthToken()
      if (!token) {
        toast.error('Please login to continue')
        router.push('/')
        return
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Fetch due payments
      const dueResponse = await fetch('http://localhost:3001/api/payments/due', { headers })
      const dueData = await dueResponse.json()

      // Fetch upcoming renewals
      const renewalsResponse = await fetch('http://localhost:3001/api/payments/upcoming-renewals', { headers })
      const renewalsData = await renewalsResponse.json()

      // Ensure data are always arrays
      const duePayments = Array.isArray(dueData) ? dueData : []
      const upcomingRenewals = Array.isArray(renewalsData) ? renewalsData : []

      setDueDates({
        duePayments,
        upcomingRenewals
      })
    } catch (error) {
      console.error('Error fetching due dates data:', error)
      toast.error('Failed to load due dates data')
      setDueDates({
        duePayments: [],
        upcomingRenewals: []
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Table columns
  const dueColumns = [
    {
      header: 'Member',
      accessor: 'name',
      cell: (row) => (
        <div>
          <p className="font-medium text-white">{row.name}</p>
          <p className="text-sm text-white/60">{row.email}</p>
        </div>
      )
    },
    {
      header: 'Membership Type',
      accessor: 'membershipType',
    },
    {
      header: 'End Date',
      accessor: 'endDate',
      cell: (row) => new Date(row.endDate).toLocaleDateString()
    },
    {
      header: 'Days Overdue',
      accessor: 'daysOverdue',
      cell: (row) => (
        <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-white">
          {row.daysOverdue} days
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => router.push(`/members/${row.memberId}`)}
          className="px-3 py-1 rounded text-sm bg-white/10 hover:bg-white/20 text-white"
        >
          View
        </button>
      )
    }
  ]

  const upcomingColumns = [
    {
      header: 'Member',
      accessor: 'name',
      cell: (row) => (
        <div>
          <p className="font-medium text-white">{row.name}</p>
          <p className="text-sm text-white/60">{row.email}</p>
        </div>
      )
    },
    {
      header: 'Membership Type',
      accessor: 'membershipType',
    },
    {
      header: 'End Date',
      accessor: 'endDate',
      cell: (row) => new Date(row.endDate).toLocaleDateString()
    },
    {
      header: 'Days Remaining',
      accessor: 'daysUntilRenewal',
      cell: (row) => (
        <span className="px-2 py-1 rounded-full text-xs bg-white/10 text-white">
          {row.daysUntilRenewal} days
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => router.push(`/members/${row.memberId}`)}
          className="px-3 py-1 rounded text-sm bg-white/10 hover:bg-white/20 text-white"
        >
          View
        </button>
      )
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Loading due dates data...
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 bg-black">
      <div>
        <h1 className="text-2xl font-bold mb-6 text-white">Due Dates</h1>
        
        <Card className="mb-8 bg-black border border-white/10">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Overdue Payments ({dueDates.duePayments.length})
          </h2>
          
          {dueDates.duePayments.length === 0 ? (
            <p className="py-4 text-center text-white/60">
              No overdue payments found.
            </p>
          ) : (
            <Table 
              columns={dueColumns} 
              data={dueDates.duePayments} 
              thClassName="text-left p-3 text-white/80"
              tdClassName="p-3 text-white"
            />
          )}
        </Card>
        
        <Card className="bg-black border border-white/10">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Upcoming Renewals ({dueDates.upcomingRenewals.length})
          </h2>
          
          {dueDates.upcomingRenewals.length === 0 ? (
            <p className="py-4 text-center text-white/60">
              No upcoming renewals found.
            </p>
          ) : (
            <Table 
              columns={upcomingColumns} 
              data={dueDates.upcomingRenewals} 
              thClassName="text-left p-3 text-white/80"
              tdClassName="p-3 text-white"
            />
          )}
        </Card>
      </div>
    </div>
  )
} 