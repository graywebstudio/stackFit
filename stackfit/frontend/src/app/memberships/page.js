'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from "sonner"
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { getAuthToken } from '@/utils/auth'
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi'

export default function MembershipsPage() {
  const router = useRouter()
  const [memberships, setMemberships] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 1,
    price: '',
    features: [],
    status: 'active'
  })
  const [newFeature, setNewFeature] = useState('')

  useEffect(() => {
    fetchMemberships()
  }, [])

  const fetchMemberships = async () => {
    try {
      setIsLoading(true)
      const token = getAuthToken()
      if (!token) {
        toast.error('Please login to continue')
        router.push('/')
        return
      }

      const response = await fetch('http://localhost:3001/api/memberships', {
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
      toast.error(error.message || 'Failed to load memberships')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: 1,
      price: '',
      features: [],
      status: 'active'
    })
    setNewFeature('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let processedValue = value

    // Convert numeric values
    if (name === 'duration') {
      processedValue = parseInt(value) || 1
    } else if (name === 'price') {
      processedValue = value === '' ? '' : parseFloat(value) || 0
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }))
  }

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature('')
    }
  }

  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      const token = getAuthToken()
      if (!token) {
        toast.error('Please login to continue')
        router.push('/')
        return
      }

      const isEditing = editingId !== null
      const url = isEditing 
        ? `http://localhost:3001/api/memberships/${editingId}`
        : 'http://localhost:3001/api/memberships'
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save membership')
      }

      toast.success(isEditing ? 'Membership updated successfully' : 'Membership created successfully')
      
      // Reset form and state
      resetForm()
      setShowAddForm(false)
      setEditingId(null)
      
      // Refresh memberships list
      fetchMemberships()
    } catch (error) {
      console.error('Error saving membership:', error)
      toast.error(error.message || 'Failed to save membership')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (membership) => {
    setFormData({
      name: membership.name,
      description: membership.description,
      duration: membership.duration,
      price: membership.price,
      features: Array.isArray(membership.features) ? membership.features : [],
      status: membership.status
    })
    setEditingId(membership.id)
    setShowAddForm(true)
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the "${name}" membership plan?`)) {
      return
    }
    
    try {
      setIsLoading(true)
      const token = getAuthToken()
      if (!token) {
        toast.error('Please login to continue')
        router.push('/')
        return
      }

      const response = await fetch(`http://localhost:3001/api/memberships/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const data = await response.json()
        
        // Handle case where membership is in use
        if (response.status === 400 && data.memberCount) {
          throw new Error(`Cannot delete: This membership is being used by ${data.memberCount} members.`)
        }
        
        throw new Error(data.error || 'Failed to delete membership')
      }

      toast.success('Membership deleted successfully')
      fetchMemberships()
    } catch (error) {
      console.error('Error deleting membership:', error)
      toast.error(error.message || 'Failed to delete membership')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    setShowAddForm(false)
    setEditingId(null)
  }

  return (
    <div className="p-6 space-y-6 bg-black">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          Membership Plans
        </h1>
        {!showAddForm && (
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            <FiPlus className="mr-2" /> Add New Plan
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="p-6 bg-black border border-white/10">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {editingId ? 'Edit Membership Plan' : 'Create New Membership Plan'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-white/80">
                  Plan Name *
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="E.g., Basic Monthly, Premium Annual"
                  className="bg-black border-white/10 text-white"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-white/80">
                  Duration (months) *
                </label>
                <Input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="Duration in months"
                  className="bg-black border-white/10 text-white"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-white/80">
                  Price ($) *
                </label>
                <Input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="Price per month"
                  className="bg-black border-white/10 text-white"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-white/80">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full p-2 rounded border bg-black border-white/10 text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block mb-1 text-white/80">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full p-2 rounded border bg-black border-white/10 text-white"
                rows="3"
                placeholder="Describe the membership plan"
              />
            </div>
            
            <div>
              <label className="block mb-1 text-white/80">
                Features
              </label>
              <div className="flex mb-2">
                <Input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a feature"
                  className="flex-grow bg-black border-white/10 text-white"
                />
                <Button
                  type="button"
                  onClick={handleAddFeature}
                  className="ml-2 bg-white/10 hover:bg-white/20 text-white"
                >
                  Add
                </Button>
              </div>
              
              <div className="mt-2 space-y-2">
                {formData.features.map((feature, index) => (
                  <div 
                    key={index} 
                    className="flex items-center p-2 rounded bg-black border border-white/10"
                  >
                    <span className="flex-grow text-white">{feature}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="text-white/70 hover:text-white"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
                
                {formData.features.length === 0 && (
                  <p className="text-sm text-white/60">
                    No features added yet
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                onClick={handleCancel}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                {isLoading ? 'Saving...' : editingId ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading && !showAddForm ? (
        <div className="flex items-center justify-center py-12 text-white">
          Loading membership plans...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberships.length > 0 ? (
            memberships.map((membership) => (
              <Card 
                key={membership.id} 
                className="p-6 flex flex-col bg-black border border-white/10"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-white">
                    {membership.name}
                  </h3>
                  <span 
                    className="px-2 py-1 rounded-full text-xs bg-white/10 text-white"
                  >
                    {membership.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="mt-2 mb-4">
                  <span className="text-2xl font-bold text-white">
                    ${membership.price}
                  </span>
                  <span className="text-sm ml-1 text-white/60">
                    / {membership.duration} {membership.duration === 1 ? 'month' : 'months'}
                  </span>
                </div>
                
                <p className="text-sm mb-4 text-white/80">
                  {membership.description}
                </p>
                
                <div className="mt-auto">
                  <h4 className="font-medium mb-2 text-white">Features:</h4>
                  <ul className="space-y-1 mb-4">
                    {Array.isArray(membership.features) && membership.features.length > 0 ? (
                      membership.features.map((feature, index) => (
                        <li key={index} className="text-sm flex items-start text-white">
                          <span className="mr-2">•</span>
                          <span>{feature}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-white/60">No features listed</li>
                    )}
                  </ul>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-white/10">
                  <Button
                    onClick={() => handleEdit(membership)}
                    className="bg-white/10 hover:bg-white/20 text-white"
                  >
                    <FiEdit2 className="mr-1" /> Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(membership.id, membership.name)}
                    className="bg-white/10 hover:bg-white/20 text-white"
                  >
                    <FiTrash2 className="mr-1" /> Delete
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-white/60">
              <p className="mb-4">No membership plans found</p>
              {!showAddForm && (
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-white/10 hover:bg-white/20 text-white"
                >
                  <FiPlus className="mr-2" /> Create Your First Plan
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 