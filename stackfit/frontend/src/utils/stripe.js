import { loadStripe } from '@stripe/stripe-js';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripe_key = "pk_test_51RbQGlQk6o246hNbHO0jSjlBxKFXF7LYqozCJrEJGfupIotXKbO2hYur0B9R8O36pDbJOwaJht2GAdJuRxfo3Dfw00iFkb7Qcy"
const stripePromise = loadStripe(stripe_key);

export default stripePromise; 