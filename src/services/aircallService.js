import api from '../config/api';

/**
 * Service for Aircall API integration
 */
class AircallService {
  /**
   * Start an outbound call
   * @param {number} userId - The Aircall user ID
   * @param {number} numberId - The Aircall number ID to use for the call
   * @param {string} to - The phone number to dial in E.164 format (e.g. "+18001231234")
   * @returns {Promise} - Promise resolving to the response
   */
  async startOutboundCall(userId, numberId, to) {
    try {
      return await api.post(`/aircall/users/${userId}/calls`, {
        number_id: numberId,
        to: to
      });
    } catch (error) {
      console.error('Error starting outbound call:', error);
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
}

export default new AircallService();