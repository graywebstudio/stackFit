'use client'
import { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import stripePromise from '@/utils/stripe';
import Button from './Button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { theme } from '@/styles/theme';

const CheckoutForm = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payments/success`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        onError?.(error);
      } else {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage('An unexpected error occurred.');
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {errorMessage && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <Button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full mt-4"
      >
        {isLoading ? 'Processing...' : `Pay $${amount}`}
      </Button>
    </form>
  );
};

const StripePayment = ({ clientSecret, amount, onSuccess, onError }) => {
  if (!clientSecret) {
    return null;
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#8B7CF7', // Use a consistent color with shadcn theme
        colorBackground: 'transparent',
        colorText: 'white',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <div className="mt-4">
        <CheckoutForm amount={amount} onSuccess={onSuccess} onError={onError} />
      </div>
    </Elements>
  );
};

export default StripePayment; 