'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from "sonner"
import Card from './Card'
import Button from './Button'
import Input from './Input'
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { theme } from '@/styles/theme'
import { getAuthToken } from '@/utils/auth'

export default function MembershipPause({ memberId, memberName, isCurrentlyPaused, onPauseComplete }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [pauseData, setPauseData] = useState({
    startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], // 30 days from now
    reason: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setPauseData(prev => ({ ...prev, [name]: value }))
  }

  const handlePauseMembership = async (e) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      const token = getAuthToken()
      
      if (!token) {
        toast.error('Please login to continue')
        router.push('/')
        return
      }

      const response = await fetch(`http://localhost:3001/api/members/${memberId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pauseData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to pause membership')
      }

      toast.success('Membership paused successfully')
      setIsOpen(false)
      
      // Reset form
      setPauseData({
        startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        reason: ''
      })
      
      // Callback to refresh parent component
      if (onPauseComplete) {
        onPauseComplete()
      }
    } catch (error) {
      console.error('Error pausing membership:', error)
      toast.error(error.message || 'Failed to pause membership')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResumeMembership = async () => {
    try {
      setIsLoading(true)
      const token = getAuthToken()
      
      if (!token) {
        toast.error('Please login to continue')
        router.push('/')
        return
      }

      const response = await fetch(`http://localhost:3001/api/members/${memberId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resume membership')
      }

      toast.success('Membership resumed successfully')
      
      // Callback to refresh parent component
      if (onPauseComplete) {
        onPauseComplete()
      }
    } catch (error) {
      console.error('Error resuming membership:', error)
      toast.error(error.message || 'Failed to resume membership')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      {isCurrentlyPaused ? (
        <Button
          onClick={handleResumeMembership}
          disabled={isLoading}
          variant="warning"
        >
          {isLoading ? 'Processing...' : 'Resume Membership'}
        </Button>
      ) : (
        <>
          <Button
            onClick={() => setIsOpen(!isOpen)}
            variant="secondary"
          >
            Pause Membership
          </Button>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-lg font-medium">
                  Pause Membership for {memberName}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handlePauseMembership} className="space-y-4 py-4">
                <div>
                  <label className="block mb-1 text-sm">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    name="startDate"
                    value={pauseData.startDate}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div>
                  <label className="block mb-1 text-sm">
                    End Date
                  </label>
                  <Input
                    type="date"
                    name="endDate"
                    value={pauseData.endDate}
                    onChange={handleChange}
                    required
                    min={pauseData.startDate}
                  />
                  <p className="text-xs mt-1 text-muted-foreground">
                    Maximum pause duration is 90 days
                  </p>
                </div>
                
                <div>
                  <label className="block mb-1 text-sm">
                    Reason
                  </label>
                  <Textarea
                    name="reason"
                    value={pauseData.reason}
                    onChange={handleChange}
                    required
                    placeholder="Reason for pausing membership"
                  />
                </div>
                
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Submit Pause Request'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
} 