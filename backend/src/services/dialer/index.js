import aircallService from './aircallService.js';

/**
 * Main dialer service that coordinates all dialer functionality
 * Uses Aircall as the current implementation but can be swapped with other providers
 */
const dialerService = {
  // Store default configuration
  config: {
    defaultUserId: '1527216',    // Default Aircall user ID
    defaultNumberId: '967647',   // Default Aircall number ID
    provider: 'aircall'          // Current telephony provider
  },
  
  /**
   * Initialize the dialer service with configuration
   * @param {Object} config - Configuration options
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  initialize: async (config = {}) => {
    try {
      console.log('Initializing dialer service');
      
      // Merge provided config with default config
      dialerService.config = {
        ...dialerService.config,
        ...config
      };
      
      console.log('Dialer service initialized with config:', {
        provider: dialerService.config.provider,
        defaultUserId: dialerService.config.defaultUserId,
        defaultNumberId: dialerService.config.defaultNumberId
      });
      
      return true;
    } catch (error) {
      console.error('Error initializing dialer service:', error);
      return false;
    }
  },
  
  /**
   * Make an outbound call
   * @param {string} phoneNumber - Phone number to call
   * @param {Object} options - Additional options (userId, numberId, etc.)
   * @returns {Promise<Object>} - Call details
   */
  makeCall: async (phoneNumber, options = {}) => {
    try {
      // Use specified userId or default
      const userId = options.userId || dialerService.config.defaultUserId;
      
      // Use specified numberId or default
      const numberId = options.numberId || dialerService.config.defaultNumberId;
      
      console.log(`Dialer service making call to ${phoneNumber} using user ${userId} and number ${numberId}`);
      
      // Make call using current provider (Aircall)
      const callResult = await aircallService.makeCall(userId, numberId, phoneNumber);
      
      return callResult;
    } catch (error) {
      console.error('Error in dialer service makeCall:', error);
      throw error;
    }
  },
  
  /**
   * Get call details
   * @param {string} callId - ID of the call
   * @returns {Promise<Object>} - Call details
   */
  getCallDetails: async (callId) => {
    try {
      // Get call details from current provider (Aircall)
      const callDetails = await aircallService.getCallDetails(callId);
      return callDetails;
    } catch (error) {
      console.error(`Error getting call details for ${callId}:`, error);
      throw error;
    }
  }
};

export default dialerService;