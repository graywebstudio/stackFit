'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from "sonner"
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table'
import { getAuthToken } from '@/utils/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Download, X } from 'lucide-react'

export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    membershipType: '',
    startDate: '',
    endDate: ''
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalMembers: 0
  })

  useEffect(() => {
    fetchMembers()
  }, [searchTerm, filters])

  const fetchMembers = async (page = 1) => {
    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })

      if (searchTerm) queryParams.append('search', searchTerm)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.membershipType) queryParams.append('membershipType', filters.membershipType)
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)

      const response = await fetch(`http://localhost:3001/api/members?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }

      const data = await response.json()
      setMembers(data.members || [])
      setPagination({
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalMembers: data.totalMembers
      })
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error(error.message || 'Failed to load members')
      setMembers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setIsLoading(true)
      fetchMembers(newPage)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      status: '',
      membershipType: '',
      startDate: '',
      endDate: ''
    })
  }

  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const queryParams = new URLSearchParams()
      if (searchTerm) queryParams.append('search', searchTerm)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.membershipType) queryParams.append('membershipType', filters.membershipType)
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)

      const response = await fetch(`http://localhost:3001/api/members/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to export members')
      }

      if (!data.members || !data.members.length) {
        toast.error('No members data available to export')
        return
      }

      // Define CSV headers
      const headers = [
        'ID',
        'Name',
        'Email',
        'Phone',
        'Address',
        'Membership Type',
        'Status',
        'Join Date',
        'End Date',
        'Subscription Status',
        'Days Remaining'
      ]

      // Convert data to CSV rows
      const csvRows = [
        headers.join(','), // Header row
        ...data.members.map(member => [
          member.id,
          `"${member.name}"`, // Wrap in quotes to handle commas in names
          `"${member.email}"`,
          `"${member.phone}"`,
          `"${member.address}"`,
          `"${member.membership_type}"`,
          member.status,
          member.start_date,
          member.end_date,
          member.subscription_status,
          member.days_remaining
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `members_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url) // Clean up the URL object

      toast.success(`Successfully exported ${data.members.length} members`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error.message || 'Failed to export members')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6 mt-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          Members
        </h1>
        <Link href="/members/add">
          <Button 
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            Add New Member
          </Button>
        </Link>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search members by name, email, phone or plan..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full bg-transparent"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="text-sm flex items-center gap-2 border-white/10 text-white/70 hover:text-white hover:bg-white/5"
              onClick={exportToCSV}
            >
              <Download size={16} />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              className="text-sm flex items-center gap-2 border-white/10 text-white/70 hover:text-white hover:bg-white/5"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              Filter
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6"
            >
              <div className="p-4 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Filters</h3>
                  <Button
                    variant="ghost"
                    className="text-sm text-white/50 hover:text-white"
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white/70">
                      Status
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="w-full p-2 rounded-md bg-black border border-white/10 text-white"
                    >
                      <option value="">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white/70">
                      Membership Type
                    </label>
                    <select
                      value={filters.membershipType}
                      onChange={(e) => handleFilterChange('membershipType', e.target.value)}
                      className="w-full p-2 rounded-md bg-black border border-white/10 text-white"
                    >
                      <option value="">All</option>
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="pro">Pro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white/70">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-white/70">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="text-center py-8 text-white">
            Loading members...
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8 text-white">
            No members found. Add your first member!
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow isHeader>
                <TableCell isHeader className="text-white/70">Member</TableCell>
                <TableCell isHeader className="text-white/70">Contact</TableCell>
                <TableCell isHeader className="text-white/70">Membership</TableCell>
                <TableCell isHeader className="text-white/70">Join Date</TableCell>
                <TableCell isHeader className="text-white/70">Last Visit</TableCell>
                <TableCell isHeader className="text-white/70">Status</TableCell>
                <TableCell isHeader className="text-white/70">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="border-white/10">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-white">{member.name}</span>
                      <span className="text-white/50 text-xs">ID: {member.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-white">{member.email}</span>
                      <span className="text-white/50 text-xs">{member.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-white/10 text-white">
                      {member.membership_type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-white">{member.start_date}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-white">{member.last_visit || 'Never'}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      member.status === 'active' 
                        ? 'bg-white/20 text-white' 
                        : 'bg-white/10 text-white/70'
                    }`}>
                      {member.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/members/edit/${member.id}`}>
                        <Button 
                          variant="ghost" 
                          className="text-sm px-2 py-1 text-white/70 hover:text-white"
                        >
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/members/${member.id}`}>
                        <Button 
                          variant="ghost" 
                          className="text-sm px-2 py-1 text-white/70 hover:text-white"
                        >
                          View
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="text-sm px-2 py-1 text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => handleDelete(member.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 flex justify-between items-center text-sm text-white/50">
          <div>
            Showing {members.length} of {pagination.totalMembers} members
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              className="text-sm px-3 py-1 text-white/50 hover:text-white" 
              disabled={pagination.currentPage === 1}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
            >
              Previous
            </Button>
            <span className="px-3 py-1 rounded-md bg-white/5 text-white">
              {pagination.currentPage}
            </span>
            <Button 
              variant="ghost" 
              className="text-sm px-3 py-1 text-white/50 hover:text-white" 
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <h3 className="text-lg font-medium mb-2 text-white">
            Total Members
          </h3>
          <p className="text-3xl font-bold text-white">
            {members.length}
          </p>
        </Card>
        <Card>
          <h3 className="text-lg font-medium mb-2 text-white">
            Active Members
          </h3>
          <p className="text-3xl font-bold text-white">
            {members.filter(m => m.status === 'active').length}
          </p>
        </Card>
        <Card>
          <h3 className="text-lg font-medium mb-2 text-white">
            Inactive Members
          </h3>
          <p className="text-3xl font-bold text-white/70">
            {members.filter(m => m.status === 'inactive').length}
          </p>
        </Card>
        <Card>
          <h3 className="text-lg font-medium mb-2 text-white">
            New This Month
          </h3>
          <p className="text-3xl font-bold text-white">
            {members.filter(m => new Date(m.start_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
          </p>
        </Card>
      </div>
    </div>
  )
} 