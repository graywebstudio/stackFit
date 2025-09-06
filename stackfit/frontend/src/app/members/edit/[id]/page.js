'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Card from '../../../components/ui/Card'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import { theme } from '@/styles/theme'
import { getAuthToken } from '@/utils/auth'

export default function EditMemberPage({ params }) {
  const router = useRouter()
  const { id } = params
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [memberData, setMemberData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    membershipType: '',
    status: 'active',
    age: '',
    gender: '',
    dateOfBirth: '',
    medicalHistory: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  })
  const [memberships, setMemberships] = useState([])

  useEffect(() => {
    fetchMemberDetails()
    fetchMemberships()
  }, [id])

  const fetchMemberDetails = async () => {
    try {
      setIsLoading(true)
      const token = getAuthToken()
      if (!token) {
        toast.error('Please login to continue')
        router.push('/')
        return
      }

      const response = await fetch(`http://localhost:3001/api/members/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch member details')
      }

      const member = await response.json()
      
      // Format date of birth if available
      const dateOfBirth = member.date_of_birth 
        ? new Date(member.date_of_birth).toISOString().split('T')[0] 
        : ''

      setMemberData({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        address: member.address || '',
        membershipType: member.membership_type || '',
        status: member.status || 'active',
        age: member.age || '',
        gender: member.gender || '',
        dateOfBirth,
        medicalHistory: member.medical_history || '',
        emergencyContact: member.emergency_contact || {
          name: '',
          phone: '',
          relationship: ''
        }
      })
    } catch (error) {
      console.error('Error fetching member details:', error)
      toast.error(error.message || 'Failed to load member details')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMemberships = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

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
      toast.error('Failed to load membership options')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name.startsWith('emergency_')) {
      const field = name.replace('emergency_', '')
      setMemberData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }))
    } else {
      setMemberData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setIsSaving(true)
      const token = getAuthToken()
      if (!token) {
        toast.error('Please login to continue')
        router.push('/')
        return
      }

      // Format data for API
      const formattedData = {
        name: memberData.name,
        email: memberData.email,
        phone: memberData.phone,
        address: memberData.address,
        membershipType: memberData.membershipType,
        status: memberData.status,
        age: memberData.age ? parseInt(memberData.age) : null,
        gender: memberData.gender,
        dateOfBirth: memberData.dateOfBirth || null,
        medicalHistory: memberData.medicalHistory,
        emergencyContact: memberData.emergencyContact
      }

      const response = await fetch(`http://localhost:3001/api/members/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update member')
      }

      toast.success('Member updated successfully')
      router.push(`/members/${id}`)
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error(error.message || 'Failed to update member')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ color: theme.colors.text.primary }}>
        Loading member details...
      </div>
    )
  }

  return (
    <div className="p-6" style={{ backgroundColor: theme.colors.background.primary }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
          Edit Member
        </h1>
        <Button 
          onClick={() => router.push(`/members/${id}`)} 
          style={{ backgroundColor: theme.colors.button.secondary.bg, color: theme.colors.button.secondary.text }}
        >
          Cancel
        </Button>
      </div>

      <Card className="p-6" style={{ backgroundColor: theme.colors.card.background }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-lg font-medium" style={{ color: theme.colors.text.accent }}>Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1" style={{ color: theme.colors.text.secondary }}>
                  Full Name *
                </label>
                <Input
                  type="text"
                  name="name"
                  value={memberData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block mb-1" style={{ color: theme.colors.text.secondary }}>
                  Email *
                </label>
                <Input
                  type="email"
                  name="email"
                  value={memberData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block mb-1" style={{ color: theme.colors.text.secondary }}>
                  Phone *
                </label>
                <Input
                  type="tel"
                  name="phone"
                  value={memberData.phone}
                  onChange={handleChange}
                  required
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <label className="block mb-1" style={{ color: theme.colors.text.secondary }}>
                  Age
                </label>
                <Input
                  type="number"
                  name="age"
                  value={memberData.age}
                  onChange={handleChange}
                  min="0"
                  max="120"
                  placeholder="Enter age"
                />
              </div>
              
              <div>
                <label className="block mb-1" style={{ color: theme.colors.text.secondary }}>
                  Gender
                </label>
                <select
                  name="gender"
                  value={memberData.gender}
                  onChange={handleChange}
                  className="w-full p-2 rounded border"
                  style={{ 
                    borderColor: theme.colors.border.default,
                    backgroundColor: theme.colors.input.background,
                    color: theme.colors.text.primary
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              
              <div>
                <label className="block mb-1" style={{ color: theme.colors.text.secondary }}>
                  Date of Birth
                </label>
                <Input
                  type="date"
                  name="dateOfBirth"
                  value={memberData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div>
              <label className="block mb-1" style={{ color: theme.colors.text.secondary }}>
                Address
              </label>
              <textarea
                name="address"
                value={memberData.address}
                onChange={handleChange}
                className="w-full p-2 rounded border"
                style={{ 
                  borderColor: theme.colors.border.default,
                  backgroundColor: theme.colors.input.background,
                  color: theme.colors.text.primary
                }}
                rows="2"
                placeholder="Enter address"
              />
            </div>
            
            <div>
              <label className="block mb-1" style={{ color: theme.colors.text.secondary }}>
                Medical History / Health Concerns
              </label>
              <textarea
                name="medicalHistory"
                value={memberData.medicalHistory}
                onChange={handleChange}
                className="w-full p-2 rounded border"
                style={{ 
                  borderColor: theme.colors.border.default,
                  backgroundColor: theme.colors.input.background,
                  color: theme.colors.text.primary
                }}
                rows="3"
                placeholder="Enter any medical history or health concerns"
              />
            </div>
          </div>
          
          <div className="space-y-6 pt-4 border-t" style={{ borderColor: theme.colors.border.muted }}>
            <h2 className="text-lg font-medium" style={{ color: theme.colors.text.accent }}>Emergency Contact</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1" style={{ color: theme.colors.text.secondary }}>
                  Name *
                </label>
                <Input
                  type="text"
                  name="emergency_name"
                  value={memberData.emergencyContact.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter emergency contact name"
                />
              </div>
              
              <div>
                <label className="block mb-1" style={{ color: theme.colors.text.secondary }}>
                  Phone *
                </label>
                <Input
                  type="tel"
                  name="emergency_phone"
                  value={memberData.emergencyContact.phone}
                  onChange={handleChange}
                  required
                  placeholder="Enter emergency contact phone"
                />
              </div>
              
              <div>
                <label className="block mb-1" style={{ color: theme.colors.text.secondary }}>
                  Relationship *
                </label>
                <Input
                  type="text"
                  name="emergency_relationship"
                  value={memberData.emergencyContact.relationship}
                  onChange={handleChange}
                  required
                  placeholder="E.g., Parent, Spouse, Friend"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-6 pt-4 border-t" style={{ borderColor: theme.colors.border.muted }}>
            <h2 className="text-lg font-medium" style={{ color: theme.colors.text.accent }}>Membership Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1" style={{ color: theme.colors.text.secondary }}>
                  Membership Type *
                </label>
                <select
                  name="membershipType"
                  value={memberData.membershipType}
                  onChange={handleChange}
                  required
                  className="w-full p-2 rounded border"
                  style={{ 
                    borderColor: theme.colors.border.default,
                    backgroundColor: theme.colors.input.background,
                    color: theme.colors.text.primary
                  }}
                >
                  <option value="">Select Membership Type</option>
                  {memberships.map(membership => (
                    <option key={membership.id} value={membership.id}>
                      {membership.name} (${membership.price}/month)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block mb-1" style={{ color: theme.colors.text.secondary }}>
                  Status *
                </label>
                <select
                  name="status"
                  value={memberData.status}
                  onChange={handleChange}
                  required
                  className="w-full p-2 rounded border"
                  style={{ 
                    borderColor: theme.colors.border.default,
                    backgroundColor: theme.colors.input.background,
                    color: theme.colors.text.primary
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              style={{ backgroundColor: theme.colors.button.primary.bg, color: theme.colors.button.primary.text }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
} 