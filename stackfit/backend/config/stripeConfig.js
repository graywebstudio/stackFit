const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing required environment variable: STRIPE_SECRET_KEY');
    process.exit(1);
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = stripe; 