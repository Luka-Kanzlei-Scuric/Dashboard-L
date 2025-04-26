/**
 * Test script for the dialer service
 * 
 * Usage: node test-dialer.js <phone_number>
 * Example: node test-dialer.js +15551234567
 */

import dotenv from 'dotenv';
import dialerService from './src/services/dialer/index.js';

// Load environment variables
dotenv.config();

// Get phone number from command line argument
const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.error('Please provide a phone number to call');
  console.error('Usage: node test-dialer.js <phone_number>');
  console.error('Example: node test-dialer.js +15551234567');
  process.exit(1);
}

// Validate phone number format (E.164)
const e164Regex = /^\+[1-9]\d{1,14}$/;
if (!e164Regex.test(phoneNumber)) {
  console.error('Phone number must be in E.164 format (e.g. +18001231234)');
  process.exit(1);
}

// Test making a call
const testDialer = async () => {
  try {
    console.log('Initializing dialer service...');
    
    // Initialize dialer service
    await dialerService.initialize();
    
    console.log(`Making test call to ${phoneNumber}...`);
    
    // Make the call
    const callResult = await dialerService.makeCall(phoneNumber);
    
    console.log('Call initiated successfully:');
    console.log(JSON.stringify(callResult, null, 2));
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error testing dialer:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
};

// Run the test
testDialer();