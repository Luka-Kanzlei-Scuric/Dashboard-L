import CallRecord from '../models/CallRecord.js';
import dialerService from '../services/dialer/index.js';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants for Aircall API
const AIRCALL_USER_ID = '1527216';
const AIRCALL_NUMBER_ID = '967647';
const AIRCALL_API_KEY = process.env.AIRCALL_API_KEY || '741a32c4ab34d47a2d2dd929efbfb925:090aaff4ece9c050715ef58bd38d149d';

// SipGate API credentials from environment variables
const SIPGATE_TOKEN_ID = process.env.SIPGATE_TOKEN_ID;
const SIPGATE_TOKEN = process.env.SIPGATE_TOKEN;
const SIPGATE_DEVICE_ID = process.env.SIPGATE_DEVICE_ID;
const SIPGATE_CALLER_ID = process.env.SIPGATE_CALLER_ID;
const SIPGATE_BASE_URL = 'https://api.sipgate.com/v2';

// In-memory storage for active users and call queue
let activeUsers = {};
let callQueue = [];

/**
 * Make a call to a phone number using Aircall API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const makeCall = async (req, res) => {
  try {
    const { phoneNumber, clientId } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    // Validate phone number format (E.164)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be in E.164 format (e.g. +18001231234)'
      });
    }
    
    // Get user ID from authenticated user
    const userId = req.user?.id || '123456789';
    
    console.log(`User ${userId} initiating call to ${phoneNumber}`);
    
    // Direct Aircall API call
    try {
      const apiKey = '741a32c4ab34d47a2d2dd929efbfb925:090aaff4ece9c050715ef58bd38d149d';
      const [apiId, apiToken] = apiKey.split(':');
      
      const response = await axios.post(
        `https://api.aircall.io/v1/users/${AIRCALL_USER_ID}/calls`,
        { 
          number_id: AIRCALL_NUMBER_ID, 
          to: phoneNumber 
        },
        {
          auth: {
            username: apiId,
            password: apiToken
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Aircall returns 204 No Content on success
      if (response.status === 204) {
        // Generate call ID
        const callId = `call-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Create call record
        const callRecord = new CallRecord({
          userId,
          clientId: clientId || null,
          phoneNumber,
          aircallUserId: AIRCALL_USER_ID,
          aircallNumberId: AIRCALL_NUMBER_ID,
          aircallCallId: callId,
          status: 'initiated',
          startTime: new Date(),
          provider: 'aircall'
        });
        
        await callRecord.save();
        
        // Return success with call details
        return res.status(200).json({
          success: true,
          message: 'Call initiated successfully (direct API)',
          callId,
          call: {
            id: callRecord._id,
            phoneNumber,
            status: 'initiated',
            startTime: callRecord.startTime
          }
        });
      }
    } catch (aircallError) {
      console.error('Error making direct Aircall API call:', aircallError);
      
      // Return detailed error for debugging
      return res.status(500).json({
        success: false,
        message: 'Error making Aircall API call',
        error: aircallError.message,
        response: aircallError.response ? {
          status: aircallError.response.status,
          data: aircallError.response.data
        } : null
      });
    }
  } catch (error) {
    console.error('Error making call:', error);
    
    // Return appropriate error response
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error initiating call'
    });
  }
};

/**
 * Make a call using SipGate API
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const makeSipgateCall = async (req, res) => {
  try {
    const { phoneNumber, clientId } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    // Validate phone number format (E.164)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be in E.164 format (e.g. +49123456789)'
      });
    }
    
    // Checking SipGate API credentials
    if (!SIPGATE_TOKEN_ID || !SIPGATE_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'SipGate API credentials not configured'
      });
    }
    
    if (!SIPGATE_DEVICE_ID) {
      return res.status(500).json({
        success: false,
        message: 'SipGate device ID not configured'
      });
    }
    
    // Get user ID from authenticated user or use default
    const userId = req.user?.id || '123456789';
    
    console.log(`User ${userId} initiating SipGate call to ${phoneNumber}`);
    
    // Prepare SipGate API request
    const requestBody = {
      deviceId: SIPGATE_DEVICE_ID,
      callerId: SIPGATE_CALLER_ID || phoneNumber,
      caller: SIPGATE_DEVICE_ID, // The web phone extension making the call (e.g., 'e0')
      callee: phoneNumber, // The number to call
    };
    
    // Make SipGate API call
    try {
      const response = await axios({
        method: 'POST',
        url: `${SIPGATE_BASE_URL}/sessions/calls`,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        auth: {
          username: SIPGATE_TOKEN_ID,
          password: SIPGATE_TOKEN,
        },
        data: requestBody,
      });
      
      console.log('SipGate API response:', response.status, response.data);
      
      // Generate call ID
      const callId = `sipgate-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Create call record
      const callRecord = new CallRecord({
        userId,
        clientId: clientId || null,
        phoneNumber,
        callerId: SIPGATE_CALLER_ID || phoneNumber,
        deviceId: SIPGATE_DEVICE_ID,
        sipgateCallId: response.data?.sessionId || callId, // Store the SipGate session ID if available
        status: 'initiated',
        startTime: new Date(),
        provider: 'sipgate'
      });
      
      await callRecord.save();
      
      // Return success with call details
      return res.status(200).json({
        success: true,
        message: 'Call initiated successfully via SipGate',
        callId: response.data?.sessionId || callId,
        call: {
          id: callRecord._id,
          phoneNumber,
          status: 'initiated',
          startTime: callRecord.startTime
        }
      });
      
    } catch (sipgateError) {
      console.error('Error making SipGate API call:', sipgateError);
      
      // Return detailed error for debugging
      return res.status(500).json({
        success: false,
        message: 'Error making SipGate API call',
        error: sipgateError.message,
        response: sipgateError.response ? {
          status: sipgateError.response.status,
          data: sipgateError.response.data
        } : null
      });
    }
  } catch (error) {
    console.error('Error making SipGate call:', error);
    
    // Return appropriate error response
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error initiating SipGate call'
    });
  }
};

/**
 * Get call history for the user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page = 1, startDate, endDate, status } = req.query;
    
    // In development, just return an empty array for now
    res.status(200).json({
      success: true,
      totalCount: 0,
      callHistory: []
    });
  } catch (error) {
    console.error('Error getting call history:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving call history'
    });
  }
};

/**
 * Get details for a specific call
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCallDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get call record from database
    const callRecord = await CallRecord.findById(id);
    
    if (!callRecord) {
      return res.status(404).json({
        success: false,
        message: 'Call record not found'
      });
    }
    
    // Check if user is authorized to view this call
    if (callRecord.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this call'
      });
    }
    
    // If call has an Aircall ID and is not completed, try to get live status
    let liveCallDetails = null;
    if (callRecord.aircallCallId && callRecord.status !== 'completed') {
      try {
        if (dialerService && typeof dialerService.getCallDetails === 'function') {
          liveCallDetails = await dialerService.getCallDetails(callRecord.aircallCallId);
          
          // Update call record with latest details
          if (liveCallDetails) {
            callRecord.status = mapAircallStatus(liveCallDetails.status);
            
            if (liveCallDetails.ended_at) {
              callRecord.endTime = new Date(liveCallDetails.ended_at);
            }
            
            if (liveCallDetails.duration) {
              callRecord.duration = liveCallDetails.duration;
            }
            
            await callRecord.save();
          }
        } else {
          // Update status based on time passed
          const now = new Date();
          const callAge = now - new Date(callRecord.startTime);
          
          if (callAge > 30000) { // 30 seconds
            callRecord.status = 'completed';
            callRecord.endTime = now;
            callRecord.duration = Math.floor(callAge / 1000);
            await callRecord.save();
          } else if (callAge > 5000 && callRecord.status === 'initiated') { // 5 seconds
            callRecord.status = 'in-progress';
            await callRecord.save();
          }
        }
      } catch (error) {
        console.error('Error getting live call details:', error);
        // Continue with existing call record data
      }
    }
    
    // Return call details
    res.status(200).json({
      success: true,
      call: {
        ...callRecord.toObject(),
        liveDetails: liveCallDetails
      }
    });
  } catch (error) {
    console.error('Error getting call details:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving call details'
    });
  }
};

/**
 * Update call notes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateCallNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    if (!notes) {
      return res.status(400).json({
        success: false,
        message: 'Notes are required'
      });
    }
    
    // Get call record from database
    const callRecord = await CallRecord.findById(id);
    
    if (!callRecord) {
      return res.status(404).json({
        success: false,
        message: 'Call record not found'
      });
    }
    
    // Check if user is authorized to update this call
    if (callRecord.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this call'
      });
    }
    
    // Update notes
    callRecord.notes = notes;
    await callRecord.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Call notes updated successfully'
    });
  } catch (error) {
    console.error('Error updating call notes:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error updating call notes'
    });
  }
};

/**
 * Get dialer status for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDialerStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if requested user is the current user
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view dialer status for other users'
      });
    }
    
    // Get user's dialer status (or return default status)
    const userStatus = activeUsers[userId] || {
      active: false,
      status: 'offline',
      aircallUserId: null,
      aircallNumberId: null,
      startTime: null
    };
    
    // Count pending calls in queue for this user
    const pendingCalls = callQueue.filter(
      item => item.userId === userId && item.status === 'pending'
    ).length;
    
    // Count completed calls for this user
    const completedCalls = await CallRecord.countDocuments({ 
      userId, 
      status: 'completed' 
    });
    
    // Calculate total call duration
    const callDurationResult = await CallRecord.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), status: 'completed' } },
      { $group: { _id: null, totalDuration: { $sum: '$duration' } } }
    ]);
    
    const totalCallDuration = callDurationResult.length > 0 ? 
      callDurationResult[0].totalDuration : 0;
    
    // Return dialer status
    res.status(200).json({
      success: true,
      status: userStatus.status,
      online: userStatus.active,
      connected: userStatus.active,
      activeCall: null, // We don't track this in the simple implementation
      sessionStats: {
        startTime: userStatus.startTime,
        callsCompleted: completedCalls,
        totalCallDuration: totalCallDuration
      },
      pendingCallsCount: pendingCalls
    });
  } catch (error) {
    console.error('Error getting dialer status:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving dialer status'
    });
  }
};

/**
 * Start dialer for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const startDialer = async (req, res) => {
  try {
    const { userId } = req.params;
    const { aircallUserId, numberId } = req.body;
    
    // Check if requested user is the current user
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start dialer for other users'
      });
    }
    
    // Start dialer for user
    activeUsers[userId] = {
      active: true,
      status: 'available',
      aircallUserId: aircallUserId || AIRCALL_USER_ID,
      aircallNumberId: numberId || AIRCALL_NUMBER_ID,
      startTime: new Date()
    };
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'PowerDialer started successfully',
      userStatus: {
        user: userId,
        availabilityStatus: 'available',
        online: true,
        connected: true,
        aircall: {
          userId: aircallUserId || AIRCALL_USER_ID,
          numberId: numberId || AIRCALL_NUMBER_ID,
          aircallStatus: 'online',
          lastSyncTime: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error starting dialer:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error starting dialer'
    });
  }
};

/**
 * Stop dialer for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const stopDialer = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if requested user is the current user
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to stop dialer for other users'
      });
    }
    
    // Stop dialer for user
    delete activeUsers[userId];
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'PowerDialer stopped successfully'
    });
  } catch (error) {
    console.error('Error stopping dialer:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error stopping dialer'
    });
  }
};

/**
 * Pause dialer for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const pauseDialer = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    // Check if requested user is the current user
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pause dialer for other users'
      });
    }
    
    // Get current user status
    const userStatus = activeUsers[userId];
    
    if (!userStatus) {
      return res.status(400).json({
        success: false,
        message: 'PowerDialer is not active for this user'
      });
    }
    
    // Pause dialer for user
    activeUsers[userId] = {
      ...userStatus,
      status: 'paused',
      pauseReason: reason || 'User paused',
      pauseTime: new Date()
    };
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'PowerDialer paused successfully'
    });
  } catch (error) {
    console.error('Error pausing dialer:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error pausing dialer'
    });
  }
};

/**
 * Get call queue for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCallQueue = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 20, skip = 0 } = req.query;
    
    // If userId provided, check authorization
    if (userId && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view call queue for other users'
      });
    }
    
    // Filter queue items
    let filteredQueue = userId 
      ? callQueue.filter(item => item.userId === userId)
      : callQueue;
    
    if (status) {
      filteredQueue = filteredQueue.filter(item => item.status === status);
    }
    
    // Sort by priority and scheduled time
    filteredQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower priority number = higher priority
      }
      return new Date(a.scheduledFor) - new Date(b.scheduledFor);
    });
    
    // Apply pagination
    const paginatedQueue = filteredQueue.slice(
      parseInt(skip), 
      parseInt(skip) + parseInt(limit)
    );
    
    // Return queue items
    res.status(200).json({
      success: true,
      totalCount: filteredQueue.length,
      queueItems: paginatedQueue
    });
  } catch (error) {
    console.error('Error getting call queue:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving call queue'
    });
  }
};

/**
 * Add phone numbers or clients to the call queue
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const addToQueue = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { phoneNumbers, clients, options = {} } = req.body;
    
    // Initialize results array
    const results = [];
    
    // Process phone numbers
    if (phoneNumbers && Array.isArray(phoneNumbers)) {
      for (const phoneNumber of phoneNumbers) {
        // Validate phone number format (E.164)
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        if (!e164Regex.test(phoneNumber)) {
          results.push({
            success: false,
            phoneNumber,
            message: 'Invalid phone number format'
          });
          continue;
        }
        
        // Create queue item
        const queueItem = {
          id: `queue-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId,
          phoneNumber,
          status: 'pending',
          priority: options.priority || 2,
          scheduledFor: options.scheduledFor || new Date(),
          notes: options.notes || '',
          createdAt: new Date()
        };
        
        // Add to queue
        callQueue.push(queueItem);
        
        // Add to results
        results.push({
          success: true,
          phoneNumber,
          queueItemId: queueItem.id,
          scheduledFor: queueItem.scheduledFor
        });
      }
    }
    
    // Process clients
    if (clients && Array.isArray(clients)) {
      for (const client of clients) {
        // Validate client has phone number
        if (!client.phone) {
          results.push({
            success: false,
            client,
            message: 'Client must have a phone number'
          });
          continue;
        }
        
        // Validate phone number format (E.164)
        const phoneNumber = client.phone;
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        if (!e164Regex.test(phoneNumber)) {
          results.push({
            success: false,
            client,
            message: 'Invalid phone number format'
          });
          continue;
        }
        
        // Create queue item
        const queueItem = {
          id: `queue-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId,
          phoneNumber,
          client: {
            id: client.id,
            name: client.name,
            email: client.email
          },
          status: 'pending',
          priority: options.priority || 2,
          scheduledFor: options.scheduledFor || new Date(),
          notes: options.notes || '',
          createdAt: new Date()
        };
        
        // Add to queue
        callQueue.push(queueItem);
        
        // Add to results
        results.push({
          success: true,
          client: { id: client.id, name: client.name },
          phoneNumber,
          queueItemId: queueItem.id,
          scheduledFor: queueItem.scheduledFor
        });
      }
    }
    
    // Return results
    res.status(200).json({
      success: true,
      message: `${results.length} items added to queue successfully`,
      results
    });
  } catch (error) {
    console.error('Error adding to call queue:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error adding to call queue'
    });
  }
};

/**
 * Remove an item from the call queue
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const removeFromQueue = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();
    
    // Find queue item
    const queueItemIndex = callQueue.findIndex(item => item.id === id);
    
    if (queueItemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Queue item not found'
      });
    }
    
    const queueItem = callQueue[queueItemIndex];
    
    // Check if user is authorized to remove this item
    if (queueItem.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove this queue item'
      });
    }
    
    // Remove item from queue
    callQueue.splice(queueItemIndex, 1);
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'Queue item removed successfully'
    });
  } catch (error) {
    console.error('Error removing from call queue:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error removing from call queue'
    });
  }
};

/**
 * Map Aircall status to our internal status
 * @param {string} aircallStatus - Status from Aircall API
 * @returns {string} - Internal status
 */
function mapAircallStatus(aircallStatus) {
  switch (aircallStatus) {
    case 'answered':
      return 'completed';
    case 'busy':
      return 'failed';
    case 'no-answer':
      return 'no-answer';
    case 'canceled':
      return 'failed';
    case 'failed':
      return 'failed';
    default:
      return 'in-progress';
  }
}

/**
 * Holt die Telefonie-Einstellungen des Benutzers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTelefonieSettings = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    
    // In realer Implementierung würden die Einstellungen aus der Datenbank geholt werden
    // Hier geben wir die Standardwerte zurück, die im Backend konfiguriert sind
    
    // Provider bestimmen: Falls SipGate Credentials vorhanden sind, wird SipGate als Default gesetzt, sonst Aircall
    const defaultProvider = SIPGATE_TOKEN_ID && SIPGATE_TOKEN ? 'sipgate' : 'aircall';
    
    // Antwort zusammenstellen
    const response = {
      success: true,
      provider: defaultProvider,
      sipgateTokenId: SIPGATE_TOKEN_ID || '',
      sipgateToken: '', // Aus Sicherheitsgründen geben wir das Token nicht zurück
      sipgateDeviceId: SIPGATE_DEVICE_ID || '',
      sipgateCallerId: SIPGATE_CALLER_ID || '',
      aircallUserId: AIRCALL_USER_ID || '',
      aircallNumberId: AIRCALL_NUMBER_ID || ''
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting telefonie settings:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error retrieving telefonie settings'
    });
  }
};

/**
 * Aktualisiert die Telefonie-Einstellungen des Benutzers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateTelefonieSettings = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const {
      provider,
      sipgateTokenId,
      sipgateToken,
      sipgateDeviceId,
      sipgateCallerId,
      aircallUserId,
      aircallNumberId
    } = req.body;
    
    // In einer realen Implementierung würden die Einstellungen in der Datenbank gespeichert
    // Hier simulieren wir eine erfolgreiche Speicherung
    
    // Simuliere Validierung
    if (provider === 'sipgate' && (!sipgateTokenId || !sipgateDeviceId)) {
      return res.status(400).json({
        success: false,
        message: 'SipGate Token ID und Device ID sind erforderlich'
      });
    }
    
    if (provider === 'aircall' && (!aircallUserId || !aircallNumberId)) {
      return res.status(400).json({
        success: false,
        message: 'Aircall User ID und Number ID sind erforderlich'
      });
    }
    
    // Erfolgreiche Antwort
    res.status(200).json({
      success: true,
      message: 'Telefonie-Einstellungen erfolgreich aktualisiert'
    });
  } catch (error) {
    console.error('Error updating telefonie settings:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error updating telefonie settings'
    });
  }
};