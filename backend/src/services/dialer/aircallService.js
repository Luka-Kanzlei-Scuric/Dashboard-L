import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Aircall API Service for making and managing calls
 */
const aircallService = {
  
  /**
   * Make an outbound call using Aircall API
   * @param {string} userId - Aircall user ID making the call
   * @param {string} numberId - ID of the number to use for outbound call
   * @param {string} phoneNumber - Phone number to call (must be in E.164 format)
   * @returns {Promise<object>} - Call details
   */
  makeCall: async (userId, numberId, phoneNumber) => {
    try {
      // Validate phone number (E.164 format)
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(phoneNumber)) {
        throw new Error('Phone number must be in E.164 format (e.g. +18001231234)');
      }

      // Get Aircall API key from environment variables
      const aircallApiKey = process.env.AIRCALL_API_KEY || '741a32c4ab34d47a2d2dd929efbfb925:090aaff4ece9c050715ef58bd38d149d';
      
      if (!aircallApiKey) {
        throw new Error('Aircall API key not configured');
      }
      
      console.log('Making Aircall API call to create outbound call');
      
      // Make request to Aircall API
      const response = await axios.post(
        `https://api.aircall.io/v1/users/${userId}/calls`,
        { 
          number_id: numberId, 
          to: phoneNumber 
        },
        {
          auth: {
            username: aircallApiKey.split(':')[0],
            password: aircallApiKey.split(':')[1]
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Call initiated successfully, response status:', response.status);
      
      // Aircall returns 204 No Content on successful call initiation
      if (response.status === 204) {
        return {
          success: true,
          userId,
          phoneNumber,
          numberId,
          callId: `aircall-${Date.now()}`, // Generate temporary ID since Aircall doesn't return one
          timestamp: new Date().toISOString()
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error making Aircall call:', error.message);
      
      // Handle specific API errors
      if (error.response) {
        if (error.response.status === 400) {
          throw new Error('Invalid number or number not found');
        } else if (error.response.status === 405) {
          throw new Error('User not available to make calls');
        } else if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('Authentication failed - check API credentials');
        }
      }
      
      throw error;
    }
  },
  
  /**
   * Get call details from Aircall API
   * @param {string} callId - Aircall call ID
   * @returns {Promise<object>} - Call details
   */
  getCallDetails: async (callId) => {
    try {
      const aircallApiKey = process.env.AIRCALL_API_KEY || '741a32c4ab34d47a2d2dd929efbfb925:090aaff4ece9c050715ef58bd38d149d';
      
      if (!aircallApiKey) {
        throw new Error('Aircall API key not configured');
      }
      
      const response = await axios.get(
        `https://api.aircall.io/v1/calls/${callId}`,
        {
          auth: {
            username: aircallApiKey.split(':')[0],
            password: aircallApiKey.split(':')[1]
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching call details for ${callId}:`, error.message);
      throw error;
    }
  }
};

export default aircallService;