'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from "sonner"
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { getAuthToken } from '@/utils/auth'

export default function AddMemberPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [memberships, setMemberships] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    membershipType: '',
    startDate: new Date().toISOString().split('T')[0],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  })

  // Fetch available membership types
  useEffect(() => {
    const fetchMemberships = async () => {
      try {
        const token = getAuthToken()
        if (!token) {
          throw new Error('No authentication token found')
        }

        const response = await fetch('http://localhost:3001/api/memberships?status=active', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (!response.ok) {
          throw new Error('Failed to fetch memberships')
        }
        const data = await response.json()
        setMemberships(data || [])
      } catch (error) {
        console.error('Error fetching memberships:', error)
        toast.error(error.message || 'Failed to load membership types')
        setMemberships([])
      }
    }
    fetchMemberships()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      const selectedMembership = memberships.find(m => m.id === formData.membershipType)
      const startDate = new Date(formData.startDate)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + selectedMembership.duration)

      const response = await fetch('http://localhost:3001/api/members', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          endDate: endDate.toISOString().split('T')[0]
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add member')
      }

      toast.success('Member added successfully!')
      router.push('/members')
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error(error.message || 'Failed to add member')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 bg-black">
      <Card className="max-w-4xl mt-15 mx-auto bg-black border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">
            Add New Member
          </h1>
          <Link href="/members">
            <Button 
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              Back to Members
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Left Column - Personal Information */}
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-black border-white/10 text-white"
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-black border-white/10 text-white"
              />
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="bg-black border-white/10 text-white"
              />
              <Input
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-black border-white/10 text-white"
              />
            </div>

            {/* Right Column - Emergency Contact & Membership */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Emergency Contact"
                  value={formData.emergencyContact.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                  })}
                  required
                  className="bg-black border-white/10 text-white"
                />
                <Input
                  label="Contact Phone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                  })}
                  required
                  className="bg-black border-white/10 text-white"
                />
              </div>
              <Input
                label="Relationship"
                value={formData.emergencyContact.relationship}
                onChange={(e) => setFormData({
                  ...formData,
                  emergencyContact: { ...formData.emergencyContact, relationship: e.target.value }
                })}
                required
                className="bg-black border-white/10 text-white"
              />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">
                    Membership Type
                  </label>
                  <select
                    value={formData.membershipType}
                    onChange={(e) => setFormData({ ...formData, membershipType: e.target.value })}
                    required
                    className="w-full p-2 rounded-md bg-black border border-white/10 text-white"
                  >
                    <option value="">Select Membership</option>
                    {Array.isArray(memberships) && memberships.map((membership) => (
                      <option key={membership.id} value={membership.id}>
                        {membership.name} - ${membership.price} / {membership.duration} months
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Start Date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="bg-black border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              {isLoading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
} 