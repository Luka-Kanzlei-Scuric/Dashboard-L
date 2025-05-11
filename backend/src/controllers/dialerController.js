import CallRecord from '../models/CallRecord.js';
import dialerService from '../services/dialer/index.js';
import sipgateService from '../services/sipgateService.js';
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
 * SipGate OAuth2 authentication endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const authSipgate = async (req, res) => {
  try {
    // Get temp user ID from query parameter if provided
    const tempUserId = req.query.tempUserId;
    
    // Store temp user ID in session for the callback
    if (tempUserId) {
      // Store in session
      req.session = req.session || {};
      req.session.tempUserId = tempUserId;
      console.log(`Stored temporary user ID in session: ${tempUserId}`);
    }
    
    // Generate the authorization URL
    const authUrl = sipgateService.getAuthorizationUrl();
    
    // Redirect the user to SipGate for authentication
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error generating SipGate auth URL:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error generating SipGate authorization URL' 
    });
  }
};

/**
 * SipGate OAuth2 callback endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const sipgateOAuthCallback = async (req, res) => {
  try {
    const { code, error, error_description } = req.query;
    
    // Check for errors from SipGate
    if (error) {
      console.error(`SipGate OAuth error: ${error} - ${error_description}`);
      return res.status(400).send(`
        <html>
          <head><title>SipGate Authentication Error</title></head>
          <body>
            <h1>Authentication Error</h1>
            <p>Error: ${error}</p>
            <p>Details: ${error_description || 'No details provided'}</p>
            <p><a href="javascript:window.close()">Close this window</a></p>
            <script>
              // Send message to parent window if this is in a popup
              window.opener && window.opener.postMessage({ 
                type: 'sipgate-auth-error',
                error: '${error}',
                details: '${error_description || 'No details provided'}'
              }, '*');
              
              // Redirect back to the dashboard after 3 seconds
              setTimeout(() => {
                window.location.href = '/';
              }, 3000);
            </script>
          </body>
        </html>
      `);
    }
    
    if (!code) {
      return res.status(400).send(`
        <html>
          <head><title>SipGate Authentication Error</title></head>
          <body>
            <h1>Authentication Error</h1>
            <p>No authorization code received from SipGate.</p>
            <p><a href="javascript:window.close()">Close this window</a></p>
            <script>
              // Send message to parent window if this is in a popup
              window.opener && window.opener.postMessage({ 
                type: 'sipgate-auth-error',
                error: 'No authorization code received'
              }, '*');
              
              // Redirect back to the dashboard after 3 seconds
              setTimeout(() => {
                window.location.href = '/';
              }, 3000);
            </script>
          </body>
        </html>
      `);
    }
    
    // Get userId from the authenticated user, session, or generate a temporary ID
    let userId;
    
    if (req.user && req.user._id) {
        // User is authenticated
        userId = req.user._id.toString();
        console.log(`User is authenticated, using ID: ${userId}`);
    } else if (req.session && req.session.tempUserId) {
        // Use stored temporary ID from session
        userId = req.session.tempUserId;
        console.log(`Using temporary ID from session: ${userId}`);
    } else {
        // User is not authenticated and no temp ID in session, generate a new one
        userId = 'temp-user-' + Date.now();
        console.log(`No user or session ID found, generating new temporary ID: ${userId}`);
    }
    
    // Exchange the code for tokens
    const tokens = await sipgateService.exchangeCodeForTokens(code, userId);
    
    // Return success page that will communicate with the parent window
    res.send(`
      <html>
        <head><title>SipGate Authentication Success</title></head>
        <body>
          <h1>Authentication Successful!</h1>
          <p>You have successfully authenticated with SipGate.</p>
          <p>You can now close this window and return to the application.</p>
          <p><a href="javascript:window.close()">Close this window</a></p>
          <script>
            // Send message to parent window if this is in a popup
            window.opener && window.opener.postMessage({ 
              type: 'sipgate-auth-success',
              userId: '${userId}',
              tempUserId: ${userId.startsWith('temp-user-') ? `'${userId}'` : 'null'}
            }, '*');
            
            // Store the temporary user ID in localStorage if it's a temporary ID
            if ('${userId}'.startsWith('temp-user-')) {
              localStorage.setItem('sipgate_temp_user_id', '${userId}');
            }
            
            // Redirect back to the dashboard after 3 seconds
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error handling SipGate OAuth callback:', error);
    res.status(500).send(`
      <html>
        <head><title>SipGate Authentication Error</title></head>
        <body>
          <h1>Authentication Error</h1>
          <p>There was an error exchanging the authorization code for tokens:</p>
          <p>${error.message}</p>
          <p><a href="javascript:window.close()">Close this window</a></p>
          <script>
            // Send message to parent window if this is in a popup
            window.opener && window.opener.postMessage({ 
              type: 'sipgate-auth-error',
              error: 'Token exchange error',
              details: '${error.message.replace(/'/g, "\\'")}'
            }, '*');
            
            // Redirect back to the dashboard after 3 seconds
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
          </script>
        </body>
      </html>
    `);
  }
};

/**
 * Check SipGate OAuth2 authentication status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const sipgateOAuthStatus = async (req, res) => {
  try {
    // Determine which user ID to use
    // 1. If userId is provided in query params and is a valid temp ID, use that
    // 2. Otherwise use the authenticated user's ID if available
    // 3. If neither is available, use 'unknown'
    let userId;
    
    if (req.query.userId && req.query.userId.startsWith('temp-user-')) {
      userId = req.query.userId;
      console.log(`Using temporary user ID from query: ${userId}`);
    } else if (req.user && req.user.id) {
      userId = req.user.id;
      console.log(`Using authenticated user ID: ${userId}`);
    } else {
      userId = 'unknown';
      console.log('No valid user ID found, using "unknown"');
    }
    
    const isAuthenticated = await sipgateService.isAuthenticated(userId);
    const deviceInfo = await sipgateService.getUserDeviceId(userId);
    
    res.status(200).json({
      success: true,
      authenticated: isAuthenticated,
      deviceId: deviceInfo.deviceId || null,
      callerId: deviceInfo.callerId || null,
      userId: userId // Include the user ID in the response
    });
  } catch (error) {
    console.error('Error checking SipGate auth status:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error checking SipGate authentication status' 
    });
  }
};

/**
 * Store SipGate device ID and caller ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const sipgateStoreDeviceId = async (req, res) => {
  try {
    const { deviceId, callerId, tempUserId } = req.body;
    
    // Determine which user ID to use
    // 1. If tempUserId is provided in the request body, use that
    // 2. Otherwise use the authenticated user's ID
    // 3. If neither is available, use 'unknown'
    let userId;
    
    if (tempUserId && tempUserId.startsWith('temp-user-')) {
      userId = tempUserId;
      console.log(`Using temporary user ID from request: ${userId}`);
    } else if (req.user && req.user.id) {
      userId = req.user.id;
      console.log(`Using authenticated user ID: ${userId}`);
    } else {
      userId = 'unknown';
      console.log('No valid user ID found, using "unknown"');
    }
    
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }
    
    // Check if the user is authenticated with SipGate
    const isAuthenticated = await sipgateService.isAuthenticated(userId);
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated with SipGate. Please authenticate first.',
        authUrl: sipgateService.getAuthorizationUrl()
      });
    }
    
    // Store the device ID
    const storeResult = await sipgateService.storeUserDeviceId(userId, deviceId, callerId || null);
    
    if (!storeResult) {
      return res.status(500).json({
        success: false,
        message: 'Failed to store device ID. Please try authenticating again.'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Device ID stored successfully',
      deviceId,
      callerId: callerId || null
    });
  } catch (error) {
    console.error('Error storing SipGate device ID:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error storing SipGate device ID' 
    });
  }
};

/**
 * Make a call using SipGate API with OAuth2
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const makeSipgateCall = async (req, res) => {
  try {
    const { phoneNumber, clientId, deviceId, callerId, tempUserId } = req.body;
    
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
    
    // Determine which user ID to use
    // 1. If tempUserId is provided in the request body, use that
    // 2. Otherwise use the authenticated user's ID
    // 3. If neither is available, use a default ID
    let userId;
    
    if (tempUserId && tempUserId.startsWith('temp-user-')) {
      userId = tempUserId;
      console.log(`Using temporary user ID for SipGate call: ${userId}`);
    } else if (req.user && req.user.id) {
      userId = req.user.id;
      console.log(`Using authenticated user ID for SipGate call: ${userId}`);
    } else {
      userId = '123456789';
      console.log('No valid user ID found, using default ID for SipGate call');
    }
    
    // Check if the user is authenticated with SipGate
    const isAuthenticated = await sipgateService.isAuthenticated(userId);
    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated with SipGate. Please authenticate first.',
        authUrl: sipgateService.getAuthorizationUrl()
      });
    }
    
    // Get the device ID (from request, user's stored device, or environment)
    const userDeviceInfo = await sipgateService.getUserDeviceId(userId);
    
    // Prioritize deviceId from request over stored value
    const useDeviceId = deviceId || userDeviceInfo.deviceId || SIPGATE_DEVICE_ID;
    const useCallerId = callerId || userDeviceInfo.callerId || SIPGATE_CALLER_ID;
    
    console.log(`Making call with deviceId: ${useDeviceId}, callerId: ${useCallerId || 'none'}`);
    
    // Verify that we have a device ID
    if (!useDeviceId) {
      console.error(`No device ID available for user ${userId}`);
    }
    
    if (!useDeviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required. Please provide a device ID or set one in your profile.'
      });
    }
    
    console.log(`User ${userId} initiating SipGate call to ${phoneNumber} with device ${useDeviceId}`);
    
    // Make SipGate API call using the OAuth2 service
    try {
      const options = {
        deviceId: useDeviceId,
        callerId: useCallerId
      };
      
      // Use our sipgateService to make the call with OAuth2
      const response = await sipgateService.makeCall(phoneNumber, userId, options);
      
      // Generate call ID
      const callId = response.sessionId || `sipgate-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Create call record
      const callRecord = new CallRecord({
        userId,
        clientId: clientId || null,
        phoneNumber,
        callerId: useCallerId || phoneNumber,
        deviceId: useDeviceId,
        sipgateCallId: callId, // Store the SipGate session ID if available
        status: 'initiated',
        startTime: new Date(),
        provider: 'sipgate'
      });
      
      await callRecord.save();
      
      // Return success with call details
      return res.status(200).json({
        success: true,
        message: 'Call initiated successfully via SipGate',
        callId: response.sessionId || callId,
        call: {
          id: callRecord._id,
          phoneNumber,
          status: 'initiated',
          startTime: callRecord.startTime
        }
      });
      
    } catch (sipgateError) {
      console.error('Error making SipGate API call:', sipgateError);
      
      // If the error is due to token expiration or authentication
      if (sipgateError.message && sipgateError.message.includes('authentication')) {
        return res.status(401).json({
          success: false,
          message: 'SipGate authentication error. Please authenticate again.',
          authUrl: sipgateService.getAuthorizationUrl()
        });
      }
      
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