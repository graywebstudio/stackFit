'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAuthToken } from '@/utils/auth'
import MembershipPause from '../../components/ui/MembershipPause'

export default function MemberDetailPage({ params }) {
  const router = useRouter()
  const { id } = params
  const [member, setMember] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [pauseHistory, setPauseHistory] = useState([])
  const [isPauseHistoryLoading, setIsPauseHistoryLoading] = useState(false)

  useEffect(() => {
    fetchMemberDetails()
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

      const data = await response.json()
      setMember(data)
      
      // If member is paused, fetch pause history
      if (data.is_paused) {
        fetchPauseHistory()
      }
    } catch (error) {
      console.error('Error fetching member details:', error)
      toast.error(error.message || 'Failed to load member details')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPauseHistory = async () => {
    try {
      setIsPauseHistoryLoading(true)
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`http://localhost:3001/api/members/${id}/pauses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch pause history')
      }

      const data = await response.json()
      setPauseHistory(data || [])
    } catch (error) {
      console.error('Error fetching pause history:', error)
    } finally {
      setIsPauseHistoryLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'pauses' && member?.is_paused) {
      fetchPauseHistory()
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-foreground">
        Loading member details...
      </div>
    )
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-foreground">
        <p className="mb-4">Member not found</p>
        <Button onClick={() => router.push('/members')} variant="outline">Back to Members</Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">
          Member Details
        </h1>
        <Button onClick={() => router.push('/members')} variant="outline">
          Back to Members
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Member Summary Card */}
        <Card className="md:w-1/3 p-4">
          <div className="flex flex-col items-center mb-4">
            <div className="w-24 h-24 rounded-full mb-3 flex items-center justify-center text-3xl bg-foreground text-background">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-xl font-semibold text-foreground">{member.name}</h2>
            <p className="text-sm text-muted-foreground">{member.email}</p>
            
            <div className="mt-2">
              <span className={`px-3 py-1 rounded-full text-xs ${
                member.status === 'active' 
                  ? 'bg-emerald-500/15 text-emerald-500' 
                  : 'bg-destructive/15 text-destructive'
              }`}>
                {member.status.toUpperCase()}
              </span>
              
              {member.is_paused && (
                <span className="ml-2 px-3 py-1 rounded-full text-xs bg-yellow-500/15 text-yellow-500">
                  PAUSED
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-2">
            <h3 className="font-medium mb-2 text-foreground">Membership Info</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="text-foreground">{member.memberships?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="text-foreground">{formatDate(member.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date:</span>
                <span className="text-foreground">{formatDate(member.end_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Days Left:</span>
                <span className={`${
                  member.daysRemaining < 0 
                    ? 'text-destructive' 
                    : member.daysRemaining < 7 
                      ? 'text-yellow-500' 
                      : 'text-foreground'
                }`}>
                  {member.daysRemaining < 0 ? 'Expired' : `${member.daysRemaining} days`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <MembershipPause 
              memberId={id} 
              memberName={member.name}
              isCurrentlyPaused={member.is_paused}
              onPauseComplete={fetchMemberDetails}
            />
          </div>
        </Card>

        {/* Tabs and Content */}
        <div className="md:w-2/3">
          <div className="flex border-b border-border mb-4">
            {['profile', 'attendance', 'payments', 'pauses'].map((tab) => (
              <button 
                key={tab}
                className={`px-4 py-2 ${activeTab === tab ? 'border-b-2 border-foreground font-medium text-foreground' : 'text-muted-foreground'}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <Card className="p-4">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-4 text-foreground">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1 text-muted-foreground">Full Name</label>
                    <p className="text-foreground">{member.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 text-muted-foreground">Email</label>
                    <p className="text-foreground">{member.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 text-muted-foreground">Phone</label>
                    <p className="text-foreground">{member.phone}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 text-muted-foreground">Age</label>
                    <p className="text-foreground">{member.age || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 text-muted-foreground">Gender</label>
                    <p className="text-foreground">{member.gender || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 text-muted-foreground">Date of Birth</label>
                    <p className="text-foreground">{member.date_of_birth ? formatDate(member.date_of_birth) : 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm mb-1 text-muted-foreground">Address</label>
                  <p className="text-foreground">{member.address || 'Not specified'}</p>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm mb-1 text-muted-foreground">Medical History</label>
                  <p className="text-foreground">{member.medical_history || 'No medical history provided'}</p>
                </div>
                
                <h3 className="text-lg font-medium mt-6 mb-4 text-foreground">Emergency Contact</h3>
                
                {member.emergency_contact ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1 text-muted-foreground">Name</label>
                      <p className="text-foreground">{member.emergency_contact.name}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm mb-1 text-muted-foreground">Phone</label>
                      <p className="text-foreground">{member.emergency_contact.phone}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm mb-1 text-muted-foreground">Relationship</label>
                      <p className="text-foreground">{member.emergency_contact.relationship}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No emergency contact provided</p>
                )}
                
                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={() => router.push(`/members/edit/${id}`)}
                  >
                    Edit Profile
                  </Button>
                </div>
              </div>
            )}
            
            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
              <div>
                <h3 className="text-lg font-medium mb-4 text-foreground">Attendance History</h3>
                
                {member.attendanceStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="p-3 text-center">
                      <p className="text-sm text-muted-foreground">Present Days</p>
                      <p className="text-2xl font-semibold text-emerald-500">{member.attendanceStats.presentDays}</p>
                    </Card>
                    
                    <Card className="p-3 text-center">
                      <p className="text-sm text-muted-foreground">Absent Days</p>
                      <p className="text-2xl font-semibold text-destructive">{member.attendanceStats.absentDays}</p>
                    </Card>
                    
                    <Card className="p-3 text-center">
                      <p className="text-sm text-muted-foreground">Attendance Rate</p>
                      <p className="text-2xl font-semibold text-foreground">
                        {member.attendanceStats.attendancePercentage.toFixed(1)}%
                      </p>
                    </Card>
                  </div>
                )}
                
                {member.attendance && member.attendance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-4 py-2 text-left text-muted-foreground">Date</th>
                          <th className="px-4 py-2 text-left text-muted-foreground">Status</th>
                          <th className="px-4 py-2 text-left text-muted-foreground">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {member.attendance.map((record) => (
                          <tr key={record.id} className="border-b border-border">
                            <td className="px-4 py-2 text-foreground">{formatDate(record.date)}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                record.status === 'present' 
                                  ? 'bg-emerald-500/15 text-emerald-500'
                                  : record.status === 'absent'
                                    ? 'bg-destructive/15 text-destructive'
                                    : 'bg-yellow-500/15 text-yellow-500'
                              }`}>
                                {record.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-foreground">{record.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">No attendance records found</p>
                )}
              </div>
            )}
            
            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-medium mb-4 text-foreground">Payment History</h3>
                
                {member.paymentStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="p-3 text-center">
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-2xl font-semibold text-foreground">${member.paymentStats.totalPaid.toFixed(2)}</p>
                    </Card>
                    
                    <Card className="p-3 text-center">
                      <p className="text-sm text-muted-foreground">Last Payment</p>
                      <p className="text-2xl font-semibold text-foreground">
                        {member.paymentStats.lastPayment || 'No payments'}
                      </p>
                    </Card>
                  </div>
                )}
                
                {member.payments && member.payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-4 py-2 text-left text-muted-foreground">Date</th>
                          <th className="px-4 py-2 text-left text-muted-foreground">Amount</th>
                          <th className="px-4 py-2 text-left text-muted-foreground">Method</th>
                          <th className="px-4 py-2 text-left text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {member.payments.map((payment) => (
                          <tr key={payment.id} className="border-b border-border">
                            <td className="px-4 py-2 text-foreground">{formatDate(payment.payment_date)}</td>
                            <td className="px-4 py-2 text-foreground">${payment.amount.toFixed(2)}</td>
                            <td className="px-4 py-2 text-foreground">{payment.payment_method}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                payment.status === 'completed' 
                                  ? 'bg-emerald-500/15 text-emerald-500'
                                  : payment.status === 'pending'
                                    ? 'bg-yellow-500/15 text-yellow-500'
                                    : 'bg-destructive/15 text-destructive'
                              }`}>
                                {payment.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">No payment records found</p>
                )}
              </div>
            )}
            
            {/* Pauses Tab */}
            {activeTab === 'pauses' && (
              <div>
                <h3 className="text-lg font-medium mb-4 text-foreground">Membership Pause History</h3>
                
                {isPauseHistoryLoading ? (
                  <p className="text-center py-4 text-muted-foreground">Loading pause history...</p>
                ) : pauseHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-4 py-2 text-left text-muted-foreground">Start Date</th>
                          <th className="px-4 py-2 text-left text-muted-foreground">End Date</th>
                          <th className="px-4 py-2 text-left text-muted-foreground">Duration</th>
                          <th className="px-4 py-2 text-left text-muted-foreground">Reason</th>
                          <th className="px-4 py-2 text-left text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pauseHistory.map((pause) => {
                          const startDate = new Date(pause.start_date);
                          const endDate = new Date(pause.end_date);
                          const durationDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <tr key={pause.id} className="border-b border-border">
                              <td className="px-4 py-2 text-foreground">{formatDate(pause.start_date)}</td>
                              <td className="px-4 py-2 text-foreground">{formatDate(pause.end_date)}</td>
                              <td className="px-4 py-2 text-foreground">{durationDays} days</td>
                              <td className="px-4 py-2 text-foreground">{pause.reason}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  pause.status === 'approved' ? 'bg-emerald-500/15 text-emerald-500' :
                                  pause.status === 'pending' ? 'bg-yellow-500/15 text-yellow-500' :
                                  pause.status === 'completed' ? 'bg-blue-500/15 text-blue-500' :
                                  'bg-destructive/15 text-destructive'
                                }`}>
                                  {pause.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-4 text-muted-foreground">No membership pause history found</p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
} 