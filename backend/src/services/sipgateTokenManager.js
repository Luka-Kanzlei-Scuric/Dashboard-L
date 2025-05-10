/**
 * SipGate Token Manager - Service for managing SipGate OAuth tokens
 * Includes cron job for refreshing tokens before they expire
 */

import SipgateToken from '../models/SipgateToken.js';
import sipgateService from './sipgateService.js';

/**
 * Schedules a periodic task to refresh tokens that are about to expire
 * This helps ensure tokens remain valid for all users
 */
async function refreshExpiringTokens() {
  try {
    console.log('Running SipGate token refresh task...');
    
    // Find tokens that will expire within the next hour
    const expiryThreshold = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    
    const expiringTokens = await SipgateToken.find({
      expiresAt: { $lt: expiryThreshold, $gt: new Date() }
    });
    
    console.log(`Found ${expiringTokens.length} tokens that need refreshing`);
    
    // Process each token
    for (const tokenRecord of expiringTokens) {
      try {
        // Call getAccessToken which will automatically refresh if needed
        await sipgateService.getAccessToken(tokenRecord.userId);
        console.log(`Successfully refreshed token for user ${tokenRecord.userId}`);
      } catch (error) {
        console.error(`Error refreshing token for user ${tokenRecord.userId}:`, error);
        // We don't delete failed tokens - they'll be refreshed when the user tries to use them again
      }
    }
    
    console.log('SipGate token refresh task completed');
  } catch (error) {
    console.error('Error in SipGate token refresh task:', error);
  }
}

/**
 * Initializes the token manager and starts cron jobs
 */
function init() {
  console.log('Initializing SipGate token manager...');
  
  // Run token refresh every 30 minutes
  setInterval(refreshExpiringTokens, 30 * 60 * 1000);
  
  // Run initial refresh after 1 minute (allows server to start up fully)
  setTimeout(refreshExpiringTokens, 60 * 1000);
  
  console.log('SipGate token manager initialized');
}

export default {
  init,
  refreshExpiringTokens
};