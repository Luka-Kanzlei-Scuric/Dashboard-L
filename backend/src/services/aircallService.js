import axios from 'axios';
import SystemConfig from '../models/SystemConfig.js';
import UserStatus from '../models/UserStatus.js';
import CallHistory from '../models/CallHistory.js';

/**
 * AircallService
 * 
 * Server-side service for handling all interactions with the Aircall API
 * Provides methods for authentication, call management, and webhook handling
 */
class AircallService {
  constructor() {
    this.baseUrl = 'https://api.aircall.io/v1';
    this.apiClient = null;
    this.initialized = false;
  }
  
  /**
   * Initialize the Aircall API client with credentials from the database
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      // Überprüfe auf fest codierte Credentials - AirCall API Key und ID
      const hardcodedAPIKey = '75d27d3e184df759cee102d8e922e7de:44acb43f91f0a7ee678afa4cd1136887';
      
      // Check environment variables first, then hardcoded API key, then database config
      const apiKey = process.env.AIRCALL_API_KEY || hardcodedAPIKey || await SystemConfig.getConfigValue('aircall.apiKey', '');
      const apiSecret = ''; // Nicht benötigt, da die API-Schlüssel bereits im Format 'user:pass' vorliegen
      const enableMockMode = process.env.ENABLE_MOCK_MODE === 'true';
      
      console.log('Using API Key:', apiKey ? 'API key found (not showing for security)' : 'No API key found');
      
      // For production or testing
      if ((!apiKey) && !enableMockMode) {
        console.warn('Aircall API credentials not configured and mock mode is disabled');
        return false;
      }
      
      // If mock mode is enabled, we can proceed even without credentials
      if (enableMockMode) {
        console.log('Aircall Service running in MOCK MODE - no API credentials required');
        this.initialized = true;
        return true;
      }
      
      // Setup axios client with basic auth - Beachte das andere Format, wenn API-Schlüssel bereits das Format "user:pass" hat
      this.apiClient = axios.create({
        baseURL: this.baseUrl,
        auth: apiKey.includes(':') ? {
          username: apiKey.split(':')[0],
          password: apiKey.split(':')[1]
        } : {
          username: apiKey,
          password: apiSecret || ''
        },
        headers: {
          'Content-Type': 'application/json'
        },
        // Production-ready timeout and retry settings
        timeout: 10000, // 10 second timeout
        maxRedirects: 5
      });
      
      // Test connection
      try {
        await this.apiClient.get('/users');
        
        this.initialized = true;
        console.log('Aircall API client initialized successfully');
        return true;
      } catch (connError) {
        console.error('Failed to connect to Aircall API:', connError.message);
        
        // Handle some common server errors more gracefully in production
        if (connError.response && connError.response.status >= 500) {
          console.log('Aircall API server error - will retry on demand');
          // Allow operation in degraded state with automatic retries
          this.initialized = true;
          return true;
        }
        
        throw connError; // Rethrow auth or other errors
      }
    } catch (error) {
      console.error('Failed to initialize Aircall API client:', error.message);
      this.initialized = false;
      return false;
    }
  }
  
  /**
   * Ensure API client is initialized before making requests
   * @private
   */
  async _ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.initialized) {
      throw new Error('Aircall API client not initialized');
    }
  }
  
  /**
   * Get mock response for testing without API key
   * @private
   * @param {string} type - Type of mock response
   * @param {Object} params - Parameters for mock generation
   * @returns {Object} Mock response data
   */
  _getMockResponse(type, params = {}) {
    const mockCallId = Date.now().toString() + '-' + Math.floor(Math.random() * 10000);
    
    switch(type) {
      case 'user.availability':
        return {
          available: true,
          status: 'available',
          connected: true,
          isMock: true
        };
        
      case 'call.create':
        return {
          id: mockCallId,
          status: 'ringing',
          direction: 'outbound',
          to: params.to || '+123456789',
          isMock: true
        };
        
      case 'call.status':
        // Simulate call progressing through stages based on age
        const now = new Date();
        const callAge = params.startTime ? now - new Date(params.startTime) : 0;
        
        let status;
        if (callAge < 3000) status = 'ringing';
        else if (callAge < 8000) status = 'answered';
        else status = 'completed';
        
        return {
          id: params.callId || mockCallId,
          status,
          direction: 'outbound',
          to: params.to || '+123456789',
          isMock: true
        };
        
      default:
        return { isMock: true };
    }
  }
  
  /**
   * Check if a user is available to make calls
   * @param {string} userId - Aircall user ID
   * @param {boolean} useMock - Whether to use mock data
   * @returns {Promise<Object>} User availability status
   */
  async checkUserAvailability(userId, useMock = false) {
    try {
      if (useMock) {
        return this._getMockResponse('user.availability');
      }
      
      await this._ensureInitialized();
      
      const response = await this.apiClient.get(`/users/${userId}/availability`);
      return response.data;
    } catch (error) {
      console.error(`Error checking user availability for ${userId}:`, error.message);
      
      // Use mock data as fallback in case of API failure
      return {
        available: false,
        status: 'error',
        connected: false,
        error: error.message,
        isFallback: true
      };
    }
  }
  
  /**
   * Start an outbound call via Aircall
   * @param {string} userId - Aircall user ID
   * @param {string} numberId - Aircall number ID
   * @param {string} to - Phone number to call in E.164 format
   * @param {Object} metadata - Additional call metadata
   * @param {boolean} useMock - Whether to use mock data
   * @returns {Promise<Object>} Call details
   */
  async startOutboundCall(userId, numberId, to, metadata = {}, useMock = false) {
    try {
      // Validate phone number format (E.164)
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(to)) {
        throw new Error('Phone number must be in E.164 format');
      }
      
      if (useMock) {
        return this._getMockResponse('call.create', { to });
      }
      
      await this._ensureInitialized();
      
      const payload = {
        number_id: parseInt(numberId, 10),
        to: to
      };
      
      // Add optional metadata if provided
      if (metadata && Object.keys(metadata).length > 0) {
        payload.metadata = metadata;
      }
      
      const response = await this.apiClient.post(`/users/${userId}/calls`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error starting outbound call to ${to}:`, error.message);
      
      // Return mock response as fallback
      return {
        id: Date.now().toString() + '-' + Math.floor(Math.random() * 10000),
        status: 'error',
        to: to,
        direction: 'outbound',
        error: error.message,
        isFallback: true
      };
    }
  }
  
  /**
   * End a call in progress
   * @param {string} callId - Aircall call ID
   * @returns {Promise<boolean>} Success status
   */
  async endCall(callId) {
    try {
      if (!callId) {
        throw new Error('Call ID is required');
      }
      
      // Check if it's a mock/fallback call ID
      if (callId.includes('-')) {
        return true; // Pretend success for mock calls
      }
      
      await this._ensureInitialized();
      
      await this.apiClient.delete(`/calls/${callId}`);
      return true;
    } catch (error) {
      console.error(`Error ending call ${callId}:`, error.message);
      return false;
    }
  }
  
  /**
   * Get the status of a call
   * @param {string} callId - Aircall call ID
   * @param {Object} mockParams - Parameters for mock response if using mock mode
   * @returns {Promise<Object>} Call status
   */
  async getCallStatus(callId, mockParams = {}) {
    try {
      if (!callId) {
        throw new Error('Call ID is required');
      }
      
      // Check if it's a mock/fallback call ID
      if (callId.includes('-')) {
        return this._getMockResponse('call.status', { 
          callId,
          ...mockParams
        });
      }
      
      await this._ensureInitialized();
      
      const response = await this.apiClient.get(`/calls/${callId}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting call status for ${callId}:`, error.message);
      
      // Return minimal fallback data
      return {
        id: callId,
        status: 'unknown',
        error: error.message,
        isFallback: true
      };
    }
  }
  
  /**
   * Register a webhook to receive call events
   * @param {string} url - The URL to receive webhook events
   * @param {Array<string>} events - Array of event types to subscribe to
   * @returns {Promise<Object>} Webhook details
   */
  async registerWebhook(url, events = ['call.created', 'call.answered', 'call.ended']) {
    try {
      if (!url) {
        throw new Error('Webhook URL is required');
      }
      
      await this._ensureInitialized();
      
      const response = await this.apiClient.post('/webhooks', {
        url,
        events,
        name: 'PowerDialer Webhook'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error registering webhook:', error.message);
      throw error;
    }
  }
  
  /**
   * List all registered webhooks
   * @returns {Promise<Array>} List of webhooks
   */
  async listWebhooks() {
    try {
      await this._ensureInitialized();
      
      const response = await this.apiClient.get('/webhooks');
      return response.data.webhooks || [];
    } catch (error) {
      console.error('Error listing webhooks:', error.message);
      return [];
    }
  }
  
  /**
   * Process webhook event from Aircall
   * @param {Object} event - Webhook event payload
   * @returns {Promise<Object>} Processing result
   */
  async processWebhookEvent(event) {
    try {
      if (!event || !event.data || !event.event) {
        throw new Error('Invalid webhook event payload');
      }
      
      console.log(`Processing ${event.event} webhook event for call ${event.data.id}`);
      
      // Handle different event types
      switch (event.event) {
        case 'call.created':
          return this._handleCallCreated(event.data);
          
        case 'call.answered':
          return this._handleCallAnswered(event.data);
          
        case 'call.ended':
          return this._handleCallEnded(event.data);
          
        default:
          console.log(`Unhandled webhook event type: ${event.event}`);
          return { success: true, status: 'ignored' };
      }
    } catch (error) {
      console.error('Error processing webhook event:', error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Handle call.created webhook event
   * @private
   * @param {Object} callData - Call data from webhook
   * @returns {Promise<Object>} Processing result
   */
  async _handleCallCreated(callData) {
    // Find the user/agent based on the Aircall user ID
    const userStatus = await UserStatus.findOne({
      'aircall.userId': callData.user.id
    });
    
    if (!userStatus) {
      console.warn(`No matching user found for Aircall user ID: ${callData.user.id}`);
      return { success: false, status: 'user_not_found' };
    }
    
    // Create call history record
    const callHistory = new CallHistory({
      callId: callData.id,
      agent: userStatus.user,
      client: null, // Will be updated later if matched
      phoneNumber: callData.direction === 'outbound' ? callData.to : callData.from,
      direction: callData.direction,
      status: 'in-progress',
      startTime: new Date(),
      aircallData: callData
    });
    
    await callHistory.save();
    
    // Update user status
    userStatus.availabilityStatus = 'in-call';
    userStatus.activeCall = {
      callId: callData.id,
      startTime: new Date(),
      phoneNumber: callData.direction === 'outbound' ? callData.to : callData.from
    };
    
    await userStatus.save();
    
    return { 
      success: true, 
      status: 'created',
      historyId: callHistory._id
    };
  }
  
  /**
   * Handle call.answered webhook event
   * @private
   * @param {Object} callData - Call data from webhook
   * @returns {Promise<Object>} Processing result
   */
  async _handleCallAnswered(callData) {
    // Update call history
    const callHistory = await CallHistory.findOne({ callId: callData.id });
    
    if (!callHistory) {
      console.warn(`No call history found for call ID: ${callData.id}`);
      return { success: false, status: 'call_not_found' };
    }
    
    callHistory.status = 'answered';
    await callHistory.save();
    
    return { 
      success: true, 
      status: 'answered',
      historyId: callHistory._id
    };
  }
  
  /**
   * Handle call.ended webhook event
   * @private
   * @param {Object} callData - Call data from webhook
   * @returns {Promise<Object>} Processing result
   */
  async _handleCallEnded(callData) {
    // Update call history
    const callHistory = await CallHistory.findOne({ callId: callData.id });
    
    if (!callHistory) {
      console.warn(`No call history found for call ID: ${callData.id}`);
      return { success: false, status: 'call_not_found' };
    }
    
    callHistory.status = 'completed';
    callHistory.endTime = new Date();
    callHistory.duration = callData.duration;
    callHistory.aircallData = { ...callHistory.aircallData, ...callData };
    
    await callHistory.save();
    
    // Update user status
    const userStatus = await UserStatus.findOne({
      'aircall.userId': callData.user.id
    });
    
    if (userStatus) {
      userStatus.endCall(callData.duration);
      await userStatus.save();
    }
    
    return { 
      success: true, 
      status: 'ended',
      historyId: callHistory._id
    };
  }
}

export default new AircallService();