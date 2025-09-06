'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { theme } from '@/styles/theme'
import { getAuthToken } from '@/utils/auth'

export default function AddMembershipPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '',
    price: '',
    features: [''],
    status: 'active'
  })

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData({ ...formData, features: newFeatures })
  }

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, '']
    })
  }

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index)
    setFormData({ ...formData, features: newFeatures })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token found')
      }

      // Filter out empty features
      const cleanedFeatures = formData.features.filter(feature => feature.trim() !== '')

      const response = await fetch('http://localhost:3001/api/memberships', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          features: cleanedFeatures,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create membership type')
      }

      toast.success('Membership type created successfully!')
      router.push('/memberships')
    } catch (error) {
      console.error('Error creating membership:', error)
      toast.error(error.message || 'Failed to create membership type')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen p-6"
      style={{ 
        backgroundColor: theme.colors.background.primary,
        fontFamily: theme.typography.fontFamily.primary 
      }}
    >
      <Card className={`max-w-2xl mx-auto ${theme.glass.background} ${theme.glass.border} ${theme.glass.shadow}`}>
        <div className="flex items-center justify-between mb-6">
          <h1 className={`${theme.typography.sizes['2xl']} ${theme.typography.weights.bold}`} style={{ color: theme.colors.text.primary }}>
            Add New Membership Type
          </h1>
          <Link href="/memberships">
            <Button 
              variant="secondary"
              className={`hover:${theme.colors.button.secondary.hover}`}
              style={{
                backgroundColor: theme.colors.button.secondary.bg,
                color: theme.colors.button.secondary.text
              }}
            >
              Back to Memberships
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input
              label="Membership Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-transparent"
              style={{ color: theme.colors.text.primary }}
              placeholder="e.g., Premium Plan"
            />

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.colors.text.primary }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                className={`w-full px-3 py-2 rounded-xl border bg-transparent ${theme.glass.border}`}
                style={{ color: theme.colors.text.primary }}
                rows={3}
                placeholder="Describe the membership benefits"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Duration (months)"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
                className="bg-transparent"
                style={{ color: theme.colors.text.primary }}
              />

              <Input
                label="Price ($)"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="bg-transparent"
                style={{ color: theme.colors.text.primary }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                Features
              </label>
              {formData.features.map((feature, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder={`Feature ${index + 1}`}
                    className="bg-transparent"
                    style={{ color: theme.colors.text.primary }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-2"
                    style={{ color: theme.colors.status.error.text }}
                    onClick={() => removeFeature(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                className="mt-2"
                style={{ color: theme.colors.text.accent }}
                onClick={addFeature}
              >
                Add Feature
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text.primary }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl border bg-transparent ${theme.glass.border}`}
                style={{ color: theme.colors.text.primary }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            className={`w-full hover:${theme.colors.button.primary.hover}`}
            disabled={isLoading}
            style={{
              backgroundColor: theme.colors.button.primary.bg,
              color: theme.colors.button.primary.text
            }}
          >
            {isLoading ? 'Creating Membership Type...' : 'Create Membership Type'}
          </Button>
        </form>
      </Card>
    </div>
  )
} 