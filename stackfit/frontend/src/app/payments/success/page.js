'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { theme } from '@/styles/theme'

export default function PaymentSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // You could verify the payment status here if needed
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: theme.colors.background.primary }}>
      <Card className={`w-full max-w-md text-center ${theme.glass.background} ${theme.glass.border} ${theme.glass.shadow}`}>
        <div className="mb-6">
          <svg
            className="mx-auto h-12 w-12"
            style={{ color: theme.colors.status.success.text }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className={`text-2xl ${theme.typography.weights.bold} mb-4`} style={{ color: theme.colors.text.accent }}>
          Payment Successful!
        </h1>
        <p className="mb-6" style={{ color: theme.colors.text.secondary }}>
          Your payment has been processed successfully. Thank you for your payment.
        </p>
        <Button
          onClick={() => router.push('/payments')}
          className="w-full"
          style={{
            backgroundColor: theme.colors.button.primary.bg,
            color: theme.colors.button.primary.text
          }}
        >
          Return to Payments
        </Button>
      </Card>
    </div>
  )
} 