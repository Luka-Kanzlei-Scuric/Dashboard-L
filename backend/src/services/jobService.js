import SystemConfig from '../models/SystemConfig.js';
import aircallService from './aircallService.js';
import CallQueue from '../models/CallQueue.js';
import UserStatus from '../models/UserStatus.js';
import CallHistory from '../models/CallHistory.js';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

/**
 * JobService
 * 
 * Background job processor for PowerDialer using in-memory queues
 * Handles scheduling, queueing, and processing of calls and related tasks
 */
class JobService {
  constructor() {
    this.initialized = false;
    this.queues = {
      calls: null,
      webhooks: null,
      maintenance: null
    };
    
    console.log('JobService constructor - Environment:', process.env.NODE_ENV || 'development');
    console.log('Running in in-memory mode (no Redis)');
  }
  
  /**
   * Initialize the job processor using in-memory implementation
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      console.log('Initializing job service with in-memory implementation...');
      
      // Set up memory-based queue system
      this._setupMemoryImplementation();
      
      // Set up processors
      this._setupProcessors();
      
      // Set up recurring jobs
      this._setupRecurringJobs();
      
      this.initialized = true;
      console.log('Job service initialized successfully (in-memory mode)');
      return true;
    } catch (error) {
      console.error('Failed to initialize job service:', error.message);
      this.initialized = false;
      return false;
    }
  }
  
  /**
   * Make sure the service is initialized
   * @private
   */
  async _ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.initialized) {
      throw new Error('Job service not initialized');
    }
  }
  
  /**
   * Set up in-memory implementation
   * This is a simplified version that mimics the Queue interface
   * but stores jobs in memory (will be lost on restart)
   * @private
   */
  _setupMemoryImplementation() {
    console.log('Setting up in-memory queue implementation...');
    
    // Simple in-memory queues
    const createMemoryQueue = (name) => {
      const jobs = [];
      const eventHandlers = {};
      const recurringJobs = new Map();
      
      // Simulate recurring jobs with setInterval
      const setupRecurring = (jobName, data, options) => {
        if (options.repeat && options.repeat.cron) {
          // Simple cron parser - this is a very basic implementation!
          // For simplicity, we'll just turn all crons into fixed intervals
          let intervalMinutes = 5; // Default 5 minutes
          
          // Parse common patterns (this is simplified)
          if (options.repeat.cron.includes('* * * * *')) {
            intervalMinutes = 1; // Every minute
          } else if (options.repeat.cron.includes('*/3 * * * *')) {
            intervalMinutes = 3; // Every 3 minutes
          } else if (options.repeat.cron.includes('*/5 * * * *')) {
            intervalMinutes = 5; // Every 5 minutes
          } else if (options.repeat.cron.includes('*/10 * * * *')) {
            intervalMinutes = 10; // Every 10 minutes
          } else if (options.repeat.cron.includes('*/30 * * * *')) {
            intervalMinutes = 30; // Every 30 minutes
          } else if (options.repeat.cron.includes('0 * * * *')) {
            intervalMinutes = 60; // Hourly
          } else if (options.repeat.cron.includes('0 */4 * * *')) {
            intervalMinutes = 240; // Every 4 hours
          } else if (options.repeat.cron.includes('0 2 * * *')) {
            intervalMinutes = 1440; // Daily at 2am
          }
          
          console.log(`[Memory Queue ${name}] Setting up recurring job ${jobName} with interval ${intervalMinutes} minutes`);
          
          // Convert to milliseconds
          const intervalMs = intervalMinutes * 60 * 1000;
          
          // Cancel existing interval if it exists
          if (recurringJobs.has(options.jobId)) {
            clearInterval(recurringJobs.get(options.jobId));
          }
          
          // Set up interval
          const intervalId = setInterval(() => {
            console.log(`[Memory Queue ${name}] Running recurring job ${jobName}`);
            jobs.push({ 
              id: Date.now() + Math.random().toString(36).substring(2, 10),
              name: jobName, 
              data,
              options,
              timestamp: Date.now()
            });
          }, intervalMs);
          
          // Store interval ID for later cleanup
          recurringJobs.set(options.jobId, intervalId);
          
          return true;
        }
        return false;
      };
      
      const queue = {
        name,
        add: (jobName, data, options = {}) => {
          console.log(`[Memory Queue ${name}] Adding job ${jobName}`);
          
          // Check if this is a recurring job
          if (options.repeat) {
            return setupRecurring(jobName, data, options);
          }
          
          const job = { 
            id: Date.now() + Math.random().toString(36).substring(2, 10),
            name: jobName, 
            data,
            options,
            timestamp: Date.now()
          };
          jobs.push(job);
          return Promise.resolve({ id: job.id });
        },
        process: (jobName, handler) => {
          console.log(`[Memory Queue ${name}] Registered processor for ${jobName}`);
          setInterval(() => {
            const job = jobs.find(j => j.name === jobName && !j.processing);
            if (job) {
              job.processing = true;
              console.log(`[Memory Queue ${name}] Processing job ${job.name}`);
              try {
                handler({ data: job.data });
                const index = jobs.indexOf(job);
                if (index > -1) {
                  jobs.splice(index, 1);
                }
              } catch (error) {
                console.error(`[Memory Queue ${name}] Error processing job:`, error);
                job.processing = false;
                job.attempts = (job.attempts || 0) + 1;
                if (job.attempts >= (job.options.attempts || 3)) {
                  const index = jobs.indexOf(job);
                  if (index > -1) {
                    jobs.splice(index, 1);
                  }
                  if (eventHandlers.failed) {
                    eventHandlers.failed(job, error);
                  }
                }
              }
            }
          }, 5000); // Check every 5 seconds
          return this;
        },
        on: (event, handler) => {
          eventHandlers[event] = handler;
          return this;
        },
        getJobCounts: () => {
          return Promise.resolve({
            waiting: jobs.filter(j => !j.processing).length,
            active: jobs.filter(j => j.processing).length,
            completed: 0,
            failed: 0
          });
        },
        empty: () => {
          jobs.length = 0;
          return Promise.resolve();
        },
        close: () => {
          // Clear all intervals
          for (const intervalId of recurringJobs.values()) {
            clearInterval(intervalId);
          }
          recurringJobs.clear();
          jobs.length = 0;
          return Promise.resolve();
        }
      };
      
      return queue;
    };
    
    // Create memory queues
    this.queues.calls = createMemoryQueue('powerdialer-calls');
    this.queues.webhooks = createMemoryQueue('powerdialer-webhooks');
    this.queues.maintenance = createMemoryQueue('powerdialer-maintenance');
    
    console.log('In-memory queue implementation set up successfully');
  }
  
  /**
   * Setup job processors for each queue
   * @private
   */
  _setupProcessors() {
    // Process call queue jobs
    this.queues.calls.process('makeCall', async (job) => {
      const { queueItemId, userId } = job.data;
      console.log(`Processing makeCall job for queue item ${queueItemId}`);
      
      try {
        return await this._processCallQueueItem(queueItemId, userId);
      } catch (error) {
        console.error(`Error processing call queue item ${queueItemId}:`, error.message);
        throw error; // Rethrow to trigger retry mechanism
      }
    });
    
    // Process webhook events
    this.queues.webhooks.process('processWebhook', async (job) => {
      const { event } = job.data;
      console.log(`Processing webhook event ${event.event} for call ${event.data.id}`);
      
      try {
        return await aircallService.processWebhookEvent(event);
      } catch (error) {
        console.error('Error processing webhook event:', error.message);
        throw error;
      }
    });
    
    // Process maintenance tasks
    this.queues.maintenance.process('cleanupOldRecords', async (job) => {
      console.log('Running cleanup task for old records');
      
      try {
        // Get retention period from config (default: 90 days)
        const retentionDays = await SystemConfig.getConfigValue('data.retentionPeriodDays', 90);
        const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
        
        // Delete old call history records
        const { deletedCount: callHistoryDeleted } = await CallHistory.deleteMany({
          startTime: { $lt: cutoffDate },
          status: { $in: ['completed', 'failed', 'missed', 'voicemail'] }
        });
        
        // Delete old call queue records
        const { deletedCount: callQueueDeleted } = await CallQueue.deleteMany({
          createdAt: { $lt: cutoffDate },
          status: { $in: ['completed', 'failed', 'skipped'] }
        });
        
        console.log(`Cleanup complete: Deleted ${callHistoryDeleted} call history records and ${callQueueDeleted} call queue records`);
        return { callHistoryDeleted, callQueueDeleted };
      } catch (error) {
        console.error('Error in cleanup task:', error.message);
        throw error;
      }
    });
    
    // Process agent availability check
    this.queues.maintenance.process('checkAgentAvailability', async (job) => {
      console.log('Running agent availability check');
      
      try {
        const agents = await UserStatus.find({
          online: true
        });
        
        for (const agent of agents) {
          try {
            // Skip if agent doesn't have Aircall configured
            if (!agent.aircall || !agent.aircall.userId) continue;
            
            // Check availability via Aircall API
            const availability = await aircallService.checkUserAvailability(agent.aircall.userId);
            
            // Update agent status
            agent.connected = availability.connected || false;
            
            if (!availability.available || !availability.connected) {
              agent.availabilityStatus = 'offline';
            }
            
            // Save updated status
            await agent.save();
          } catch (error) {
            console.error(`Error checking availability for agent ${agent._id}:`, error.message);
          }
        }
        
        return { agentsChecked: agents.length };
      } catch (error) {
        console.error('Error in agent availability check:', error.message);
        throw error;
      }
    });
    
    // Setup queue error handlers
    Object.entries(this.queues).forEach(([name, queue]) => {
      queue.on('failed', (job, error) => {
        console.error(`Job in queue '${name}' failed:`, error);
      });
      
      queue.on('error', (error) => {
        console.error(`Error in queue '${name}':`, error);
      });
    });
  }
  
  /**
   * Setup recurring maintenance jobs
   * @private
   */
  _setupRecurringJobs() {
    // Production server settings
    const serverEnv = process.env.NODE_ENV || 'development';
    const isProd = serverEnv === 'production';
    
    console.log(`Setting up recurring jobs in ${serverEnv} environment`);
    
    // Clean up old records every day at 2 AM (less frequently in production)
    this.queues.maintenance.add('cleanupOldRecords', {}, {
      repeat: { cron: isProd ? '0 2 * * *' : '0 */4 * * *' },
      jobId: 'cleanup-old-records' // Fixed jobId to prevent duplicates
    });
    
    // Check agent availability (more frequently in production)
    this.queues.maintenance.add('checkAgentAvailability', {}, {
      repeat: { cron: isProd ? '*/3 * * * *' : '*/5 * * * *' },
      jobId: 'check-agent-availability' // Fixed jobId to prevent duplicates
    });
    
    // Process call queue every minute
    this.queues.calls.add('processCallQueue', {}, {
      repeat: { cron: '* * * * *' },
      jobId: 'process-call-queue' // Fixed jobId to prevent duplicates
    });
    
    this.queues.calls.process('processCallQueue', async (job) => {
      console.log('Processing call queue');
      
      try {
        // Check if within business hours
        if (!(await this._isWithinBusinessHours())) {
          console.log('Outside business hours, skipping call queue processing');
          return { skipped: true, reason: 'outside_business_hours' };
        }
        
        // Find available agents
        const availableAgents = await UserStatus.getAvailableAgents();
        
        if (availableAgents.length === 0) {
          console.log('No available agents, skipping call queue processing');
          return { skipped: true, reason: 'no_available_agents' };
        }
        
        let callsScheduled = 0;
        
        // Find and process queue items for each available agent
        for (const agent of availableAgents) {
          try {
            // Get rate limit from config
            const callRateLimit = await SystemConfig.getConfigValue('dialer.callRateLimit', 6);
            
            // Find the next queue items for this agent
            const queueItems = await CallQueue.find({
              status: 'pending',
              scheduledFor: { $lte: new Date() },
              $or: [
                { assignedTo: agent.user._id },
                { assignedTo: { $exists: false } }
              ]
            })
            .sort({ priority: 1, scheduledFor: 1 })
            .limit(callRateLimit)
            .populate('client', 'name email phone');
            
            // Schedule calls for each item
            for (const queueItem of queueItems) {
              // Assign agent if not already assigned
              if (!queueItem.assignedTo) {
                queueItem.assignedTo = agent.user._id;
                await queueItem.save();
              }
              
              // Add call job
              await this.queues.calls.add('makeCall', {
                queueItemId: queueItem._id,
                userId: agent.user._id
              }, {
                attempts: 2,
                backoff: 5000,
                removeOnComplete: true
              });
              
              callsScheduled++;
            }
          } catch (error) {
            console.error(`Error processing queue for agent ${agent.user._id}:`, error.message);
          }
        }
        
        return { success: true, callsScheduled };
      } catch (error) {
        console.error('Error processing call queue:', error.message);
        throw error;
      }
    });
  }
  
  /**
   * Process a single call queue item
   * @private
   * @param {string} queueItemId - ID of the queue item to process
   * @param {string} userId - ID of the user/agent assigned to the call
   * @returns {Promise<Object>} Processing result
   */
  async _processCallQueueItem(queueItemId, userId) {
    const queueItem = await CallQueue.findById(queueItemId)
      .populate('client', 'name email phone')
      .populate('assignedTo', 'name email');
    
    if (!queueItem) {
      throw new Error(`Queue item ${queueItemId} not found`);
    }
    
    // Update status to in-progress
    queueItem.markInProgress();
    
    // Get user status
    const userStatus = await UserStatus.findOne({ user: userId });
    
    if (!userStatus || !userStatus.available || !userStatus.connected) {
      // Agent not available, reschedule the call
      await queueItem.reschedule(5, 'agent-unavailable');
      return { success: false, status: 'agent_unavailable' };
    }
    
    try {
      // Check if user has Aircall config
      if (!userStatus.aircall || !userStatus.aircall.userId || !userStatus.aircall.numberId) {
        throw new Error('User does not have Aircall configuration');
      }
      
      // Start the call via Aircall
      const callResponse = await aircallService.startOutboundCall(
        userStatus.aircall.userId,
        userStatus.aircall.numberId,
        queueItem.phoneNumber,
        {
          clientId: queueItem.client?._id,
          queueItemId: queueItem._id
        }
      );
      
      if (!callResponse || !callResponse.id) {
        throw new Error('Failed to initiate call via Aircall');
      }
      
      // Update user status
      userStatus.startCall(
        callResponse.id, 
        queueItem.client?._id, 
        queueItem.phoneNumber
      );
      await userStatus.save();
      
      // Create call history record
      const callHistory = new CallHistory({
        callId: callResponse.id,
        client: queueItem.client?._id,
        agent: userStatus.user,
        phoneNumber: queueItem.phoneNumber,
        direction: 'outbound',
        status: 'in-progress',
        startTime: new Date(),
        aircallData: callResponse
      });
      
      await callHistory.save();
      
      // Mark queue item as completed
      await queueItem.complete('connected');
      
      return { 
        success: true, 
        callId: callResponse.id,
        historyId: callHistory._id
      };
    } catch (error) {
      console.error(`Error making call for queue item ${queueItemId}:`, error.message);
      
      // Update queue item status based on the error
      const maxRetries = await SystemConfig.getConfigValue('dialer.maxRetries', 3);
      
      if (queueItem.attempts >= maxRetries) {
        await queueItem.complete('failed');
        return { success: false, status: 'max_retries_exceeded', error: error.message };
      } else {
        // Get retry delay from config (default: 10 minutes)
        const retryDelay = await SystemConfig.getConfigValue('dialer.retryDelay', 10);
        await queueItem.reschedule(retryDelay, 'error');
        return { success: false, status: 'rescheduled', error: error.message };
      }
    }
  }
  
  /**
   * Check if current time is within business hours
   * @private
   * @returns {Promise<boolean>} Whether current time is within business hours
   */
  async _isWithinBusinessHours() {
    try {
      // Get business hours from config
      const businessDays = await SystemConfig.getConfigValue('scheduling.businessDays', [1, 2, 3, 4, 5]);
      const startTime = await SystemConfig.getConfigValue('scheduling.businessHoursStart', '09:00');
      const endTime = await SystemConfig.getConfigValue('scheduling.businessHoursEnd', '17:00');
      
      // Parse config values
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Check if current day is a business day
      if (!businessDays.includes(currentDay)) {
        return false;
      }
      
      // Parse business hours
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      // Convert current time to minutes since midnight
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      // Convert business hours to minutes since midnight
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;
      
      // Check if current time is within business hours
      return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
    } catch (error) {
      console.error('Error checking business hours:', error.message);
      return true; // Default to allow calls if config check fails
    }
  }
  
  /**
   * Add a client to the call queue
   * @param {string} clientId - ID of the client to call
   * @param {string} phoneNumber - Phone number to call in E.164 format
   * @param {Object} options - Queue options
   * @returns {Promise<Object>} Queue item
   */
  async addToCallQueue(clientId, phoneNumber, options = {}) {
    await this._ensureInitialized();
    
    const {
      priority = 10,
      assignedTo = null,
      scheduledFor = new Date(),
      notes = ''
    } = options;
    
    // Create queue item
    const queueItem = new CallQueue({
      client: clientId,
      phoneNumber,
      priority,
      assignedTo,
      scheduledFor,
      notes
    });
    
    await queueItem.save();
    
    console.log(`Added client ${clientId} to call queue with ID ${queueItem._id}`);
    return queueItem;
  }
  
  /**
   * Process a webhook event from Aircall
   * @param {Object} event - Webhook event payload
   * @returns {Promise<Object>} Job details
   */
  async processWebhookEvent(event) {
    await this._ensureInitialized();
    
    // Add to webhook processing queue
    const job = await this.queues.webhooks.add('processWebhook', { event });
    
    return { 
      jobId: job.id,
      status: 'queued'
    };
  }
  
  /**
   * Get the status of the job processor
   * @returns {Promise<Object>} Status object
   */
  async getStatus() {
    try {
      await this._ensureInitialized();
      
      const status = {
        initialized: this.initialized,
        mode: 'in-memory',
        queues: {}
      };
      
      // Get counts for each queue
      for (const [name, queue] of Object.entries(this.queues)) {
        const counts = await queue.getJobCounts();
        status.queues[name] = counts;
      }
      
      return status;
    } catch (error) {
      console.error('Error getting job service status:', error.message);
      return {
        initialized: this.initialized,
        error: error.message
      };
    }
  }
  
  /**
   * Clear all jobs from a specific queue
   * @param {string} queueName - Name of the queue to clear
   * @returns {Promise<Object>} Result object
   */
  async clearQueue(queueName) {
    try {
      await this._ensureInitialized();
      
      if (!this.queues[queueName]) {
        throw new Error(`Queue "${queueName}" not found`);
      }
      
      await this.queues[queueName].empty();
      
      return {
        success: true,
        queue: queueName
      };
    } catch (error) {
      console.error(`Error clearing queue ${queueName}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Shutdown all queues gracefully
   * @returns {Promise<boolean>} Success status
   */
  async shutdown() {
    try {
      if (!this.initialized) {
        return true;
      }
      
      for (const [name, queue] of Object.entries(this.queues)) {
        console.log(`Closing queue: ${name}`);
        await queue.close();
      }
      
      this.initialized = false;
      return true;
    } catch (error) {
      console.error('Error shutting down job service:', error.message);
      return false;
    }
  }
}

export default new JobService();