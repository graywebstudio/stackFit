'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from "sonner"
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table'
import StripePayment from '../components/ui/StripePayment'
import { getAuthToken } from '@/utils/auth'

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })
  const [payments, setPayments] = useState([])
  const [members, setMembers] = useState({ members: [], totalPages: 0, currentPage: 1, totalMembers: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isMembersLoading, setIsMembersLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [clientSecret, setClientSecret] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchPayments()
    fetchMembers()
  }, [dateRange, debouncedSearchTerm])

  useEffect(() => {
    if (selectedPayment) {
      fetchPaymentDetails(selectedPayment.id)
    }
  }, [selectedPayment])

  // Log payment details for debugging
  useEffect(() => {
    if (paymentDetails) {
      console.log('Payment details received:', paymentDetails);
    }
  }, [paymentDetails]);

  const fetchMembers = async () => {
    try {
      setIsMembersLoading(true)
      const token = getAuthToken()
      if (!token) {
        toast.error('Please login to continue')
        return
      }

      const response = await fetch('http://localhost:3001/api/members?status=active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }

      const data = await response.json()
      setMembers(data)
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load members')
      setMembers({ members: [], totalPages: 0, currentPage: 1, totalMembers: 0 })
    } finally {
      setIsMembersLoading(false)
    }
  }

  const fetchPaymentDetails = async (paymentId) => {
    try {
      setIsDetailLoading(true)
      const token = getAuthToken()
      if (!token) {
        toast.error('Please login to continue')
        return
      }

      // Check if paymentId is valid
      if (!paymentId) {
        console.error('Invalid payment ID')
        setPaymentDetails(null)
        return
      }

      try {
        const response = await fetch(`http://localhost:3001/api/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch payment details: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setPaymentDetails(data)
      } catch (error) {
        console.error('Error fetching payment details:', error)
        toast.error(error.message || 'Failed to load payment details')
        setPaymentDetails(null)
      }
    } catch (error) {
      console.error('Error in fetchPaymentDetails:', error)
      toast.error('Failed to load payment details')
      setPaymentDetails(null)
    } finally {
      setIsDetailLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      setIsLoading(true)
      const token = getAuthToken()
      if (!token) {
        toast.error('Please login to continue')
        return
      }

      let url = 'http://localhost:3001/api/payments'
      const params = new URLSearchParams()
      
      if (dateRange.start && dateRange.end) {
        params.append('startDate', dateRange.start)
        params.append('endDate', dateRange.end)
      }
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm)
      }

      const queryString = params.toString()
      if (queryString) {
        url += `?${queryString}`
      }

      console.log('Fetching payments from:', url)
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch payments')
      }

      const data = await response.json()
      console.log('Payments data received:', data)
      setPayments(data.payments || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error(error.message || 'Failed to load payments')
      setPayments([])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaymentIntent = async (memberId, amount) => {
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error('Please login to continue')
        return
      }

      const response = await fetch('http://localhost:3001/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          memberId,
          membershipType: selectedMember?.membership_type
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const data = await response.json()
      setClientSecret(data.clientSecret)
    } catch (error) {
      console.error('Error creating payment intent:', error)
      toast.error('Failed to initialize payment')
    }
  }

  const handleManualPayment = async () => {
    try {
      const token = getAuthToken()
      if (!token) {
        toast.error('Please login to continue')
        return
      }

      const response = await fetch('http://localhost:3001/api/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          memberId: selectedMember?.id,
          amount: parseFloat(paymentAmount),
          paymentDate,
          paymentMethod,
          paymentType: 'membership_fee',
          notes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to record payment')
      }

      toast.success('Payment recorded successfully!')
      setShowPaymentModal(false)
      setSelectedMember(null)
      setPaymentAmount('')
      setPaymentMethod('cash')
      setPaymentDate(new Date().toISOString().split('T')[0])
      setNotes('')
      fetchPayments()
    } catch (error) {
      console.error('Error recording payment:', error)
      toast.error('Failed to record payment')
    }
  }

  const handlePaymentSuccess = () => {
    toast.success('Payment successful!')
    setShowPaymentModal(false)
    setSelectedMember(null)
    setClientSecret('')
    fetchPayments()
  }

  const handlePaymentError = (error) => {
    console.error('Payment error:', error)
    toast.error('Payment failed. Please try again.')
  }

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment)
    setShowDetailModal(true)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  }

  return (
    <div className="space-y-6 p-6 mt-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <Button 
          onClick={() => setShowPaymentModal(true)}
          className="bg-white/10 hover:bg-white/20 text-white"
        >
          Record New Payment
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            placeholder="Search by member name or payment details..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <Input
            type="date"
            label="Start Date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <Input
            type="date"
            label="End Date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-white">
            Loading payments...
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow isHeader>
                <TableCell isHeader className="text-white/70">Date</TableCell>
                <TableCell isHeader className="text-white/70">Member</TableCell>
                <TableCell isHeader className="text-white/70">Amount</TableCell>
                <TableCell isHeader className="text-white/70">Payment Method</TableCell>
                <TableCell isHeader className="text-white/70">Status</TableCell>
                <TableCell isHeader className="text-white/70">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => {
                return (
                  <TableRow key={payment.id} className="border-white/10">
                    <TableCell>
                      <span className="text-white">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-white">
                        {payment.members.name || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-white">
                        ${payment.amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-white">
                      {payment.payment_method}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payment.status === 'completed' 
                          ? 'bg-white/20 text-white' 
                          : 'bg-white/10 text-white/70'
                      }`}>
                        {payment.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-3">
                        <Button 
                          variant="ghost" 
                          className="text-sm px-3 py-1 text-white/70 hover:text-white"
                          onClick={() => handleViewPayment(payment)}
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-lg font-medium mb-2 text-white">
            Total Revenue
          </h3>
          <p className="text-3xl font-bold text-white">
            ${(payments || []).reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
          </p>
        </Card>
        <Card>
          <h3 className="text-lg font-medium mb-2 text-white">
            Total Payments
          </h3>
          <p className="text-3xl font-bold text-white">
            {(payments || []).length}
          </p>
        </Card>
        <Card>
          <h3 className="text-lg font-medium mb-2 text-white">
            Average Payment
          </h3>
          <p className="text-3xl font-bold text-white">
            ${(payments || []).length ? ((payments || []).reduce((sum, p) => sum + p.amount, 0) / payments.length).toFixed(2) : '0.00'}
          </p>
        </Card>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Record Payment
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-white/70">
                  Member
                </label>
                {isMembersLoading ? (
                  <div className="text-center py-2 text-white/50">
                    Loading members...
                  </div>
                ) : (
                  <select
                    value={selectedMember?.id || ''}
                    onChange={(e) => {
                      const member = members.members.find(m => m.id === e.target.value)
                      setSelectedMember(member)
                    }}
                    className="w-full p-2 rounded-md bg-black border border-white/10 text-white"
                  >
                    <option value="">Select a member</option>
                    {members.members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <Input
                label="Amount"
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value || '')}
              />
              <div>
                <label className="block mb-2 text-white/70">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 rounded-md bg-black border border-white/10 text-white"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card (Manual)</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="stripe">Online Card Payment (Stripe)</option>
                </select>
              </div>
              <Input
                label="Payment Date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
              <Input
                label="Notes (Optional)"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              {paymentMethod === 'stripe' ? (
                clientSecret ? (
                  <StripePayment
                    clientSecret={clientSecret}
                    amount={paymentAmount}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                ) : (
                  <Button
                    onClick={() => handlePaymentIntent(selectedMember?.id, parseFloat(paymentAmount) || 0)}
                    className="w-full bg-white/10 hover:bg-white/20 text-white"
                    disabled={!selectedMember || !paymentAmount || parseFloat(paymentAmount) <= 0}
                  >
                    Continue to Online Payment
                  </Button>
                )
              ) : (
                <Button
                  onClick={handleManualPayment}
                  className="w-full bg-white/10 hover:bg-white/20 text-white"
                  disabled={!selectedMember || !paymentAmount || parseFloat(paymentAmount) <= 0}
                >
                  Record Payment
                </Button>
              )}
            </div>
            <Button
              onClick={() => {
                setShowPaymentModal(false)
                setSelectedMember(null)
                setClientSecret('')
                setPaymentAmount('')
                setPaymentMethod('cash')
                setPaymentDate(new Date().toISOString().split('T')[0])
                setNotes('')
              }}
              variant="ghost"
              className="mt-4 text-white/50 hover:text-white"
            >
              Cancel
            </Button>
          </Card>
        </div>
      )}

      {/* Payment Details Modal */}
      {showDetailModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                Payment Details
              </h2>
              <Button
                variant="ghost"
                className="p-1 text-white/50 hover:text-white"
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedPayment(null)
                  setPaymentDetails(null)
                }}
              >
                ✕
              </Button>
            </div>

            {isDetailLoading ? (
              <div className="text-center py-8 text-white">
                Loading payment details...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-md font-medium mb-1 text-white/70">
                      Member Information
                    </h3>
                    <div className="p-3 rounded-md" style={{ backgroundColor: '#f0f2f5' }}>
                      <p style={{ color: '#333' }}>
                        <span style={{ color: '#666' }}>Name:</span> {selectedPayment.members?.name || 'N/A'}
                      </p>
                      <p style={{ color: '#333' }}>
                        <span style={{ color: '#666' }}>Email:</span> {selectedPayment.members?.email || 'N/A'}
                      </p>
                      <p style={{ color: '#333' }}>
                        <span style={{ color: '#666' }}>Membership:</span> {selectedPayment.members?.membership_type || 'Standard'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium mb-1 text-white/70">
                      Payment Information
                    </h3>
                    <div className="p-3 rounded-md" style={{ backgroundColor: '#f0f2f5' }}>
                      <p style={{ color: '#333' }}>
                        <span style={{ color: '#666' }}>Amount:</span>{' '}
                        <span style={{ color: '#22c55e' }}>${selectedPayment.amount.toFixed(2)}</span>
                      </p>
                      <p style={{ color: '#333' }}>
                        <span style={{ color: '#666' }}>Date:</span> {formatDate(selectedPayment.payment_date)}
                      </p>
                      <p style={{ color: '#333' }}>
                        <span style={{ color: '#666' }}>Method:</span> {selectedPayment.payment_method}
                      </p>
                      <p style={{ color: '#333' }}>
                        <span style={{ color: '#666' }}>Status:</span>{' '}
                        <span
                          className="px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: selectedPayment.status === 'completed' 
                              ? '#d1fae5' 
                              : '#fee2e2',
                            color: selectedPayment.status === 'completed'
                              ? '#065f46'
                              : '#991b1b'
                          }}
                        >
                          {selectedPayment.status}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium mb-1 text-white/70">
                    Subscription Period
                  </h3>
                  <div className="p-3 rounded-md" style={{ backgroundColor: '#f0f2f5' }}>
                    {paymentDetails?.subscription_period ? (
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between">
                          <p style={{ color: '#333' }}>
                            <span style={{ color: '#666' }}>From:</span> {formatDate(paymentDetails.subscription_period.start_date)}
                          </p>
                          <p style={{ color: '#333' }}>
                            <span style={{ color: '#666' }}>To:</span> {formatDate(paymentDetails.subscription_period.end_date)}
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                          <div 
                            className="h-2.5 rounded-full" 
                            style={{ 
                              width: `${paymentDetails.subscription_period.progress || 0}%`,
                              backgroundColor: '#d1fae5'
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-center" style={{ color: '#666' }}>
                          {paymentDetails.subscription_period.progress || 0}% of subscription period completed
                        </p>
                      </div>
                    ) : (
                      <p style={{ color: '#666' }}>No subscription period information available</p>
                    )}
                  </div>
                </div>

                {selectedPayment.notes && (
                  <div>
                    <h3 className="text-md font-medium mb-1 text-white/70">
                      Notes
                    </h3>
                    <div className="p-3 rounded-md" style={{ backgroundColor: '#f0f2f5' }}>
                      <p style={{ color: '#333' }}>{selectedPayment.notes}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-md font-medium mb-1 text-white/70">
                    Payment History
                  </h3>
                  <div className="p-3 rounded-md" style={{ backgroundColor: '#f0f2f5' }}>
                    {paymentDetails?.payment_history && paymentDetails.payment_history.length > 0 ? (
                      <div className="space-y-2">
                        {paymentDetails.payment_history.map((historyItem, index) => (
                          <div key={index} className="flex justify-between items-center py-1 border-b" style={{ borderColor: '#e5e7eb' }}>
                            <p style={{ color: '#333' }}>{formatDate(historyItem.payment_date)}</p>
                            <p style={{ color: '#22c55e' }}>${historyItem.amount.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#666' }}>No payment history available</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedPayment(null)
                      setPaymentDetails(null)
                    }}
                    style={{
                      backgroundColor: '#e5e7eb',
                      color: '#666'
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
} 