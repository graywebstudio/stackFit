'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from "sonner"
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { getAuthToken } from '@/utils/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const token = getAuthToken()
      if (!token) {
        toast.error('You must be logged in to register new admins')
        router.push('/')
        return
      }

      const response = await fetch('http://localhost:3001/api/admin/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register new admin')
      }

      // Clear form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      })
      
      toast.success('New admin registered successfully!')

      // Redirect to settings page after a delay
      setTimeout(() => {
        router.push('/settings')
      }, 2000)
    } catch (err) {
      console.error('Registration error:', err)
      toast.error(err.message || 'Failed to register. Please try again.')
      
      // If token is invalid, redirect to login
      if (err.message.includes('Invalid token')) {
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Card className="w-full max-w-md bg-black border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">
            Register New Admin
          </h1>
          <Link href="/settings">
            <Button 
              variant="outline" 
              className="text-sm border-white/10 text-white hover:bg-white/10"
            >
              Back to Settings
            </Button>
          </Link>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isLoading}
            className="bg-black border-white/10"
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={isLoading}
            className="bg-black border-white/10"
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={isLoading}
            minLength={6}
            className="bg-black border-white/10"
          />
          <Input
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            disabled={isLoading}
            minLength={6}
            className="bg-black border-white/10"
          />
          <Button 
            type="submit" 
            className="w-full bg-white/10 hover:bg-white/20 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Register New Admin'}
          </Button>
        </form>
      </Card>
    </div>
  )
} 