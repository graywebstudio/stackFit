'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from "sonner"
import Input from './components/ui/Input'
import Button from './components/ui/Button'
import Card from './components/ui/Card'
import { setAuthToken } from '@/utils/auth'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      })

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = 'Failed to login';
        try {
          // Try to parse error message from response
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use status text
          errorMessage = `${response.status}: ${response.statusText || errorMessage}`;
        }
        throw new Error(errorMessage);
      }

      // Parse JSON response
      const data = await response.json();

      // Store the token from the response
      if (data.token) {
        setAuthToken(data.token)
        toast.success('Login successful!')
        router.push('/dashboard')
      } else {
        throw new Error('No token received from server')
      }
    } catch (err) {
      console.error('Login error:', err)
      toast.error(err.message || 'Failed to login. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Card className="w-full max-w-md bg-black border border-white/10">
        <h1 className="text-2xl font-bold text-white text-center mb-6">
          Login to StackFit
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            disabled={isLoading}
            placeholder="Enter your username"
            className="bg-black border-white/10"
          />
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={isLoading}
            placeholder="Enter your password"
            className="bg-black border-white/10"
          />
          <div className="text-sm text-white/50">
            Default credentials: username: admin, password: password123
          </div>
          <Button 
            type="submit" 
            className="w-full bg-white/10 hover:bg-white/20 text-white"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-white/70">
          Don't have an account?{' '}
          <Link 
            href="/signup" 
            className="text-white hover:underline"
          >
            Sign up here
          </Link>
        </p>
      </Card>
    </div>
  )
}
