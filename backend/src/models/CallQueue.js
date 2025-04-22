import mongoose from 'mongoose';

/**
 * CallQueue Schema
 * 
 * Stores the queue of calls to be made by the PowerDialer
 * Each entry represents a planned call with status tracking
 */
const callQueueSchema = new mongoose.Schema({
  // Reference to client/contact that will be called
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  
  // Phone number to call in E.164 format
  phoneNumber: {
    type: String,
    required: true,
    match: /^\+[1-9]\d{1,14}$/ // E.164 validation
  },
  
  // Queue status
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed', 'skipped'],
    default: 'pending'
  },
  
  // Priority level (lower number = higher priority)
  priority: {
    type: Number,
    default: 10
  },
  
  // Assigned agent/user
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Scheduling information
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  
  // Tracking information
  attempts: {
    type: Number,
    default: 0
  },
  
  // Last attempt timestamp
  lastAttempt: {
    type: Date
  },
  
  // Result of the last attempt
  lastResult: {
    type: String,
    enum: ['', 'no-answer', 'busy', 'connected', 'voicemail', 'wrong-number', 'error'],
    default: ''
  },
  
  // Notes for this queue entry
  notes: {
    type: String
  },
  
  // Metadata for integrations
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
callQueueSchema.index({ status: 1, priority: 1, scheduledFor: 1 });
callQueueSchema.index({ assignedTo: 1, status: 1 });
callQueueSchema.index({ client: 1 });

// Methods
callQueueSchema.methods.markInProgress = function() {
  this.status = 'in-progress';
  this.lastAttempt = new Date();
  this.attempts += 1;
  return this.save();
};

callQueueSchema.methods.complete = function(result = 'connected') {
  this.status = 'completed';
  this.lastResult = result;
  return this.save();
};

callQueueSchema.methods.reschedule = function(delayMinutes = 60, result = 'no-answer') {
  this.status = 'pending';
  this.lastResult = result;
  this.scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);
  return this.save();
};

// Static methods
callQueueSchema.statics.getNextInQueue = function(userId) {
  return this.findOne({ 
    status: 'pending',
    scheduledFor: { $lte: new Date() },
    $or: [
      { assignedTo: userId },
      { assignedTo: { $exists: false } }
    ]
  })
  .sort({ priority: 1, scheduledFor: 1 })
  .populate('client', 'name email phone');
};

callQueueSchema.statics.getPendingCount = function(userId) {
  return this.countDocuments({ 
    status: 'pending',
    $or: [
      { assignedTo: userId },
      { assignedTo: { $exists: false } }
    ]
  });
};

const CallQueue = mongoose.model('CallQueue', callQueueSchema);

export default CallQueue;