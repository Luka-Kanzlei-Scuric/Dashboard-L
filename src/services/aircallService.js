import api from '../config/api';

/**
 * Service for Aircall API integration
 */
class AircallService {
  // Track active calls
  constructor() {
    this.activeCallId = null;
    this.activeCallStatus = null;
    this.callHistory = [];
  }

  /**
   * Start an outbound call
   * @param {number} userId - The Aircall user ID
   * @param {number} numberId - The Aircall number ID to use for the call
   * @param {string} to - The phone number to dial in E.164 format (e.g. "+18001231234")
   * @returns {Promise} - Promise resolving to the response with call ID
   */
  async startOutboundCall(userId, numberId, to) {
    try {
      // Check if there's already an active call
      if (this.activeCallId) {
        console.warn('Call already in progress. Ending active call before starting new one.');
        await this.endCall(this.activeCallId);
      }

      // Start the new call
      const response = await api.post(`/aircall/users/${userId}/calls`, {
        number_id: numberId,
        to: to
      });
      
      // Store the call ID and set status to 'initiated'
      if (response && response.data && response.data.id) {
        this.activeCallId = response.data.id;
        this.activeCallStatus = 'initiated';
        
        // Add to call history
        this.callHistory.push({
          id: this.activeCallId,
          to: to,
          status: 'initiated',
          startTime: new Date(),
          endTime: null
        });
        
        console.log(`Call initiated with ID: ${this.activeCallId}`);
      }
      
      return response;
    } catch (error) {
      console.error('Error starting outbound call:', error);
      throw error;
    }
  }

  /**
   * End an active call
   * @param {number} callId - The Aircall call ID to end (if not provided, ends active call)
   * @returns {Promise} - Promise resolving to the response
   */
  async endCall(callId = null) {
    const idToEnd = callId || this.activeCallId;
    
    if (!idToEnd) {
      console.warn('No active call to end');
      return null;
    }
    
    try {
      // Call Aircall API to end the call
      const response = await api.delete(`/aircall/calls/${idToEnd}`);
      
      // Update call history
      const callIndex = this.callHistory.findIndex(call => call.id === idToEnd);
      if (callIndex !== -1) {
        this.callHistory[callIndex].status = 'ended';
        this.callHistory[callIndex].endTime = new Date();
      }
      
      // Reset active call if it's the one we're ending
      if (idToEnd === this.activeCallId) {
        this.activeCallId = null;
        this.activeCallStatus = null;
      }
      
      console.log(`Call ${idToEnd} ended successfully`);
      return response;
    } catch (error) {
      console.error(`Error ending call ${idToEnd}:`, error);
      
      // Even if API fails, we should reset our local state
      if (idToEnd === this.activeCallId) {
        this.activeCallId = null;
        this.activeCallStatus = null;
      }
      
      throw error;
    }
  }

  /**
   * Get the status of a call
   * @param {number} callId - The Aircall call ID (if not provided, gets active call)
   * @returns {Promise} - Promise resolving to the call status
   */
  async getCallStatus(callId = null) {
    const idToCheck = callId || this.activeCallId;
    
    if (!idToCheck) {
      console.warn('No call ID to check status');
      return null;
    }
    
    try {
      const response = await api.get(`/aircall/calls/${idToCheck}`);
      
      // Update our local status
      if (idToCheck === this.activeCallId) {
        this.activeCallStatus = response.data.status;
      }
      
      return response.data;
    } catch (error) {
      console.error(`Error getting call status for ${idToCheck}:`, error);
      throw error;
    }
  }

  /**
   * Dial a phone number in the user's Aircall phone app
   * @param {number} userId - The Aircall user ID
   * @param {string} to - The phone number to dial in E.164 format (e.g. "+18001231234")
   * @returns {Promise} - Promise resolving to the response
   */
  async dialPhoneNumber(userId, to) {
    try {
      return await api.post(`/aircall/users/${userId}/dial`, {
        to: to
      });
    } catch (error) {
      console.error('Error dialing phone number:', error);
      throw error;
    }
  }
  
  /**
   * Check if there is an active call
   * @returns {boolean} - True if there's an active call
   */
  hasActiveCall() {
    return this.activeCallId !== null;
  }
  
  /**
   * Get active call information
   * @returns {Object|null} - Active call info or null if no active call
   */
  getActiveCall() {
    if (!this.activeCallId) return null;
    
    const activeCall = this.callHistory.find(call => call.id === this.activeCallId);
    return activeCall || null;
  }
  
  /**
   * Clear all call state (use when shutting down dialer)
   */
  clearCallState() {
    // Try to end active call if there is one
    if (this.activeCallId) {
      this.endCall(this.activeCallId).catch(err => {
        console.error('Error ending call during clearCallState:', err);
      });
    }
    
    // Reset state regardless of API success
    this.activeCallId = null;
    this.activeCallStatus = null;
  }
}

export default new AircallService();