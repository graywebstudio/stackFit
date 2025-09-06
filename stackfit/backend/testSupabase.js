// testSupabase.js
require('dotenv').config();
const supabase = require('./config/supabaseClient');

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Try to query a table - we'll use memberships as an example
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful!');
    console.log('Sample data:', data);
    return true;
  } catch (error) {
    console.error('Error testing Supabase connection:', error.message);
    return false;
  }
}

// Run the test
testSupabaseConnection()
  .then(isConnected => {
    if (!isConnected) {
      console.log('Supabase connection test failed.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  }); 