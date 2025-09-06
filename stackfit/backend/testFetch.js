// testFetch.js
require('dotenv').config();

async function testFetch() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    console.log('Testing connection to:', supabaseUrl);
    
    // Use built-in fetch (Node.js 18+)
    const response = await fetch(supabaseUrl);
    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);
    
    return response.ok;
  } catch (error) {
    console.error('Error testing connection:', error.message);
    return false;
  }
}

// Run the test
testFetch()
  .then(isConnected => {
    if (!isConnected) {
      console.log('Connection test failed.');
      process.exit(1);
    } else {
      console.log('Connection test successful!');
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  }); 