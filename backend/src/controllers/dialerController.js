import CallQueue from '../models/CallQueue.js';
import CallHistory from '../models/CallHistory.js';
import UserStatus from '../models/UserStatus.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
import SystemConfig from '../models/SystemConfig.js';
import aircallService from '../services/aircallService.js';
import jobService from '../services/jobService.js';

/**
 * PowerDialer Controller
 * 
 * Manages all API interactions for the PowerDialer system
 * Handles queue management, agent status, and call control
 */
class DialerController {
  /**
   * Initialize the dialer and services
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async initialize(req, res) {
    try {
      console.log('Starting PowerDialer initialization...');
      
      // Ensure system configs are set first
      await SystemConfig.ensureDefaultConfigs();
      console.log('System configurations initialized');
      
      // Initialize services with better error handling for production
      let aircallStatus = false;
      try {
        aircallStatus = await aircallService.initialize();
        console.log('Aircall service initialization complete:', aircallStatus ? 'success' : 'warning');
      } catch (aircallError) {
        console.error('Aircall service initialization error:', aircallError);
        // Continue even if Aircall fails - might be temporary and we can retry later
      }
      
      let jobServiceStatus = false;
      try {
        jobServiceStatus = await jobService.initialize();
        console.log('Job service initialization complete:', jobServiceStatus ? 'success' : 'warning');
      } catch (jobError) {
        console.error('Job service initialization error:', jobError);
        // This is more critical, but we'll still report status rather than fail completely
      }
      
      // Production-friendly response with detailed status
      const allServicesReady = aircallStatus && jobServiceStatus;
      
      res.status(allServicesReady ? 200 : 207).json({
        success: allServicesReady,
        message: allServicesReady 
          ? 'PowerDialer system initialized successfully' 
          : 'PowerDialer initialized with warnings',
        services: {
          aircall: {
            status: aircallStatus ? 'ready' : 'warning',
            mockMode: process.env.ENABLE_MOCK_MODE === 'true'
          },
          jobService: {
            status: jobServiceStatus ? 'ready' : 'warning',
            redisConnected: jobServiceStatus
          },
          database: {
            status: 'ready' // We would have thrown earlier if DB was unavailable
          }
        },
        serverEnvironment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      console.error('Critical failure initializing dialer system:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initialize dialer system',
        error: error.message,
        serverEnvironment: process.env.NODE_ENV || 'development'
      });
    }
  }
  
  /**
   * Start the PowerDialer for a specific agent
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async startDialer(req, res) {
    try {
      const { userId } = req.params;
      const { aircallUserId, numberId } = req.body;
      
      // Validate required fields
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      if (!aircallUserId || !numberId) {
        return res.status(400).json({
          success: false,
          message: 'Aircall User ID and Number ID are required'
        });
      }
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check Aircall availability
      const availability = await aircallService.checkUserAvailability(aircallUserId);
      if (!availability.available || !availability.connected) {
        return res.status(400).json({
          success: false,
          message: 'Agent is not available in Aircall',
          status: availability.status,
          available: availability.available,
          connected: availability.connected
        });
      }
      
      // Create or update user status
      let userStatus = await UserStatus.findOne({ user: userId });
      if (!userStatus) {
        userStatus = new UserStatus({
          user: userId,
          availabilityStatus: 'available',
          online: true,
          connected: true,
          aircall: {
            userId: aircallUserId,
            numberId: numberId,
            aircallStatus: availability.status,
            lastSyncTime: new Date()
          },
          sessionStats: {
            startTime: new Date(),
            callsCompleted: 0,
            totalCallDuration: 0
          }
        });
      } else {
        userStatus.availabilityStatus = 'available';
        userStatus.online = true;
        userStatus.connected = true;
        userStatus.aircall = {
          userId: aircallUserId,
          numberId: numberId,
          aircallStatus: availability.status,
          lastSyncTime: new Date()
        };
        userStatus.sessionStats = {
          startTime: new Date(),
          callsCompleted: 0,
          totalCallDuration: 0
        };
      }
      
      await userStatus.save();
      
      res.status(200).json({
        success: true,
        message: 'PowerDialer started successfully',
        userStatus
      });
    } catch (error) {
      console.error('Error starting PowerDialer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start PowerDialer',
        error: error.message
      });
    }
  }
  
  /**
   * Pause the PowerDialer for a specific agent
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async pauseDialer(req, res) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      
      // Get user status
      const userStatus = await UserStatus.findOne({ user: userId });
      if (!userStatus) {
        return res.status(404).json({
          success: false,
          message: 'User status not found'
        });
      }
      
      // End any active call
      if (userStatus.activeCall && userStatus.activeCall.callId) {
        await aircallService.endCall(userStatus.activeCall.callId);
      }
      
      // Update user status
      userStatus.availabilityStatus = reason || 'busy';
      await userStatus.save();
      
      res.status(200).json({
        success: true,
        message: 'PowerDialer paused successfully',
        userStatus
      });
    } catch (error) {
      console.error('Error pausing PowerDialer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to pause PowerDialer',
        error: error.message
      });
    }
  }
  
  /**
   * Stop the PowerDialer for a specific agent
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async stopDialer(req, res) {
    try {
      const { userId } = req.params;
      
      // Get user status
      const userStatus = await UserStatus.findOne({ user: userId });
      if (!userStatus) {
        return res.status(404).json({
          success: false,
          message: 'User status not found'
        });
      }
      
      // End any active call
      if (userStatus.activeCall && userStatus.activeCall.callId) {
        await aircallService.endCall(userStatus.activeCall.callId);
      }
      
      // Calculate session statistics
      const sessionDuration = userStatus.sessionStats.startTime 
        ? Math.floor((new Date() - userStatus.sessionStats.startTime) / 1000) 
        : 0;
      
      // Update user status
      userStatus.setOffline();
      
      // Capture session stats for reporting
      const sessionStats = {
        userId: userId,
        startTime: userStatus.sessionStats.startTime,
        endTime: new Date(),
        duration: sessionDuration,
        callsCompleted: userStatus.sessionStats.callsCompleted,
        totalCallDuration: userStatus.sessionStats.totalCallDuration
      };
      
      res.status(200).json({
        success: true,
        message: 'PowerDialer stopped successfully',
        sessionStats
      });
    } catch (error) {
      console.error('Error stopping PowerDialer:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop PowerDialer',
        error: error.message
      });
    }
  }
  
  /**
   * Get the status of the PowerDialer for a specific agent
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDialerStatus(req, res) {
    try {
      const { userId } = req.params;
      
      // Get user status
      const userStatus = await UserStatus.findOne({ user: userId })
        .populate('user', 'name email');
      
      if (!userStatus) {
        return res.status(404).json({
          success: false,
          message: 'User status not found'
        });
      }
      
      // Get active call details if available
      let activeCall = null;
      if (userStatus.activeCall && userStatus.activeCall.callId) {
        const callHistory = await CallHistory.findOne({ callId: userStatus.activeCall.callId })
          .populate('client', 'name email phone');
        
        if (callHistory) {
          activeCall = {
            callId: callHistory.callId,
            client: callHistory.client,
            phoneNumber: callHistory.phoneNumber,
            startTime: callHistory.startTime,
            status: callHistory.status
          };
        }
      }
      
      // Get pending calls count
      const pendingCallsCount = await CallQueue.countDocuments({
        status: 'pending',
        assignedTo: userId
      });
      
      res.status(200).json({
        success: true,
        status: userStatus.availabilityStatus,
        online: userStatus.online,
        connected: userStatus.connected,
        activeCall,
        sessionStats: userStatus.sessionStats,
        pendingCallsCount
      });
    } catch (error) {
      console.error('Error getting PowerDialer status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get PowerDialer status',
        error: error.message
      });
    }
  }
  
  /**
   * Add clients to the call queue
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addToQueue(req, res) {
    try {
      const { clients, options, phoneNumbers, userId } = req.body;
      
      // Neue Funktionalität: Direkte Hinzufügung von Telefonnummern ohne Client-Zuordnung
      if (phoneNumbers && Array.isArray(phoneNumbers) && phoneNumbers.length > 0) {
        return this.addPhoneNumbersToQueue(req, res);
      }
      
      if (!clients || !Array.isArray(clients) || clients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Clients list is required'
        });
      }
      
      const results = [];
      let failureCount = 0;
      
      // Process each client
      for (const clientData of clients) {
        try {
          const { clientId, phoneNumber, priority, scheduledFor, notes } = clientData;
          
          // Validate client ID
          if (!clientId) {
            results.push({
              success: false,
              message: 'Client ID is required',
              clientData
            });
            failureCount++;
            continue;
          }
          
          // Validate phone number
          if (!phoneNumber) {
            results.push({
              success: false,
              message: 'Phone number is required',
              clientId
            });
            failureCount++;
            continue;
          }
          
          // Check E.164 format
          const e164Regex = /^\+[1-9]\d{1,14}$/;
          if (!e164Regex.test(phoneNumber)) {
            results.push({
              success: false,
              message: 'Phone number must be in E.164 format (e.g. +49123456789)',
              clientId,
              phoneNumber
            });
            failureCount++;
            continue;
          }
          
          // Verify client exists
          const client = await Client.findById(clientId);
          if (!client) {
            results.push({
              success: false,
              message: 'Client not found',
              clientId
            });
            failureCount++;
            continue;
          }
          
          // Add to queue
          const queueItem = await jobService.addToCallQueue(clientId, phoneNumber, {
            priority: priority || options?.priority,
            assignedTo: options?.assignedTo,
            scheduledFor: scheduledFor || options?.scheduledFor,
            notes: notes || options?.notes
          });
          
          results.push({
            success: true,
            clientId,
            queueItemId: queueItem._id,
            scheduledFor: queueItem.scheduledFor
          });
        } catch (error) {
          console.error('Error adding client to queue:', error);
          results.push({
            success: false,
            message: error.message,
            clientData
          });
          failureCount++;
        }
      }
      
      res.status(failureCount === clients.length ? 400 : 200).json({
        success: failureCount < clients.length,
        message: `${clients.length - failureCount} of ${clients.length} clients added to queue successfully`,
        results
      });
    } catch (error) {
      console.error('Error adding to call queue:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add clients to call queue',
        error: error.message
      });
    }
  }
  
  /**
   * Add phone numbers directly to the call queue without client association
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addPhoneNumbersToQueue(req, res) {
    try {
      const { phoneNumbers, userId, options = {} } = req.body;
      
      if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Phone numbers list is required'
        });
      }
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required to assign the calls'
        });
      }
      
      // Verify that user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const results = [];
      let failureCount = 0;
      
      // Normalisiere Telefonnummern und entferne Duplikate
      const uniquePhoneNumbers = [...new Set(phoneNumbers.map(num => {
        // Einfache Normalisierung: Entferne alle Leerzeichen
        return num.replace(/\s+/g, '');
      }))];
      
      // Process each phone number
      for (const phoneNumber of uniquePhoneNumbers) {
        try {
          // Check E.164 format
          const e164Regex = /^\+[1-9]\d{1,14}$/;
          if (!e164Regex.test(phoneNumber)) {
            results.push({
              success: false,
              message: 'Phone number must be in E.164 format (e.g. +49123456789)',
              phoneNumber
            });
            failureCount++;
            continue;
          }
          
          // Create call queue entry without client
          const queueItem = new CallQueue({
            phoneNumber,
            priority: options.priority || 10,
            assignedTo: userId,
            scheduledFor: options.scheduledFor || new Date(),
            notes: options.notes || `Direkt hinzugefügt am ${new Date().toLocaleDateString()}`
          });
          
          await queueItem.save();
          
          results.push({
            success: true,
            phoneNumber,
            queueItemId: queueItem._id,
            scheduledFor: queueItem.scheduledFor
          });
        } catch (error) {
          console.error('Error adding phone number to queue:', error);
          results.push({
            success: false,
            message: error.message,
            phoneNumber
          });
          failureCount++;
        }
      }
      
      res.status(failureCount === uniquePhoneNumbers.length ? 400 : 200).json({
        success: failureCount < uniquePhoneNumbers.length,
        message: `${uniquePhoneNumbers.length - failureCount} of ${uniquePhoneNumbers.length} phone numbers added to queue successfully`,
        results
      });
    } catch (error) {
      console.error('Error adding phone numbers to call queue:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add phone numbers to call queue',
        error: error.message
      });
    }
  }
  
  /**
   * Get the call queue for a specific agent or all agents
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getQueue(req, res) {
    try {
      const { userId } = req.params;
      const { status, limit = 50, skip = 0 } = req.query;
      
      // Build query
      const query = {};
      
      if (userId) {
        query.assignedTo = userId;
      }
      
      if (status) {
        query.status = status;
      }
      
      // Get call queue items
      const queueItems = await CallQueue.find(query)
        .sort({ priority: 1, scheduledFor: 1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .populate('client', 'name email phone')
        .populate('assignedTo', 'name email');
      
      // Get total count
      const totalCount = await CallQueue.countDocuments(query);
      
      res.status(200).json({
        success: true,
        totalCount,
        queueItems
      });
    } catch (error) {
      console.error('Error getting call queue:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get call queue',
        error: error.message
      });
    }
  }
  
  /**
   * Update a call queue item
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateQueueItem(req, res) {
    try {
      const { queueItemId } = req.params;
      const { assignedTo, priority, scheduledFor, notes, status } = req.body;
      
      // Find queue item
      const queueItem = await CallQueue.findById(queueItemId);
      if (!queueItem) {
        return res.status(404).json({
          success: false,
          message: 'Queue item not found'
        });
      }
      
      // Update fields if provided
      if (assignedTo !== undefined) {
        // Verify user exists
        if (assignedTo) {
          const user = await User.findById(assignedTo);
          if (!user) {
            return res.status(400).json({
              success: false,
              message: 'Assigned user not found'
            });
          }
        }
        queueItem.assignedTo = assignedTo || null;
      }
      
      if (priority !== undefined) {
        queueItem.priority = priority;
      }
      
      if (scheduledFor !== undefined) {
        queueItem.scheduledFor = new Date(scheduledFor);
      }
      
      if (notes !== undefined) {
        queueItem.notes = notes;
      }
      
      // Update status if provided
      if (status !== undefined) {
        switch (status) {
          case 'pending':
            // Reset to pending
            queueItem.status = 'pending';
            break;
            
          case 'skipped':
            // Mark as skipped
            queueItem.status = 'skipped';
            break;
            
          case 'completed':
            // Mark as completed
            await queueItem.complete('manual');
            break;
            
          case 'failed':
            // Mark as failed
            await queueItem.complete('failed');
            break;
            
          default:
            return res.status(400).json({
              success: false,
              message: 'Invalid status value'
            });
        }
      } else {
        // Save if only fields were updated
        await queueItem.save();
      }
      
      res.status(200).json({
        success: true,
        message: 'Queue item updated successfully',
        queueItem
      });
    } catch (error) {
      console.error('Error updating queue item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update queue item',
        error: error.message
      });
    }
  }
  
  /**
   * Remove an item from the call queue
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async removeFromQueue(req, res) {
    try {
      const { queueItemId } = req.params;
      
      // Find and remove queue item
      const queueItem = await CallQueue.findByIdAndDelete(queueItemId);
      
      if (!queueItem) {
        return res.status(404).json({
          success: false,
          message: 'Queue item not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Queue item removed successfully',
        queueItemId
      });
    } catch (error) {
      console.error('Error removing from call queue:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove from call queue',
        error: error.message
      });
    }
  }
  
  /**
   * Get call history for a user or client
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCallHistory(req, res) {
    try {
      const { userId, clientId } = req.query;
      const { startDate, endDate, limit = 50, skip = 0, status } = req.query;
      
      // Build query
      const query = {};
      
      if (userId) {
        query.agent = userId;
      }
      
      if (clientId) {
        query.client = clientId;
      }
      
      if (status) {
        query.status = status;
      }
      
      // Add date filters if provided
      if (startDate || endDate) {
        query.startTime = {};
        
        if (startDate) {
          query.startTime.$gte = new Date(startDate);
        }
        
        if (endDate) {
          query.startTime.$lte = new Date(endDate);
        }
      }
      
      // Get call history
      const callHistory = await CallHistory.find(query)
        .sort({ startTime: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .populate('client', 'name email phone')
        .populate('agent', 'name email');
      
      // Get total count
      const totalCount = await CallHistory.countDocuments(query);
      
      res.status(200).json({
        success: true,
        totalCount,
        callHistory
      });
    } catch (error) {
      console.error('Error getting call history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get call history',
        error: error.message
      });
    }
  }
  
  /**
   * Get call statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCallStats(req, res) {
    try {
      const { userId, startDate, endDate } = req.query;
      
      // Get call stats
      const stats = await CallHistory.getCallStats(
        userId || null,
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      );
      
      // Get additional agent stats if userId is provided
      let agentStats = null;
      if (userId) {
        const userStatus = await UserStatus.findOne({ user: userId });
        
        if (userStatus) {
          agentStats = {
            currentStatus: userStatus.availabilityStatus,
            online: userStatus.online,
            connected: userStatus.connected,
            sessionStats: userStatus.sessionStats
          };
        }
      }
      
      res.status(200).json({
        success: true,
        stats,
        agentStats
      });
    } catch (error) {
      console.error('Error getting call statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get call statistics',
        error: error.message
      });
    }
  }
  
  /**
   * Process webhook from Aircall
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processWebhook(req, res) {
    try {
      const webhookEvent = req.body;
      
      if (!webhookEvent || !webhookEvent.event || !webhookEvent.data) {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook payload'
        });
      }
      
      // Queue webhook for processing
      const result = await jobService.processWebhookEvent(webhookEvent);
      
      // Return 200 status quickly to acknowledge receipt
      res.status(200).json({
        success: true,
        message: 'Webhook received and queued for processing',
        jobId: result.jobId
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process webhook',
        error: error.message
      });
    }
  }
  
  /**
   * Get available agents for PowerDialer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAvailableAgents(req, res) {
    try {
      // Get available agents
      const agents = await UserStatus.getAvailableAgents();
      
      res.status(200).json({
        success: true,
        agents
      });
    } catch (error) {
      console.error('Error getting available agents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available agents',
        error: error.message
      });
    }
  }
  
  /**
   * Update configuration for PowerDialer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateConfig(req, res) {
    try {
      const { key, value } = req.body;
      
      if (!key) {
        return res.status(400).json({
          success: false,
          message: 'Config key is required'
        });
      }
      
      if (value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Config value is required'
        });
      }
      
      // Update config
      const config = await SystemConfig.updateConfigValue(key, value);
      
      res.status(200).json({
        success: true,
        message: 'Configuration updated successfully',
        config
      });
    } catch (error) {
      console.error('Error updating configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update configuration',
        error: error.message
      });
    }
  }
  
  /**
   * Get configuration for PowerDialer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getConfig(req, res) {
    try {
      const { category } = req.query;
      
      let configs;
      
      if (category) {
        // Get configs by category
        configs = await SystemConfig.getConfigsByCategory(category);
      } else {
        // Get all configs
        configs = await SystemConfig.find().sort('category key');
      }
      
      res.status(200).json({
        success: true,
        configs
      });
    } catch (error) {
      console.error('Error getting configurations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get configurations',
        error: error.message
      });
    }
  }
}

export default new DialerController();