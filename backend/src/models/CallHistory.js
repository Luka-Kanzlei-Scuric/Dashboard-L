import mongoose from 'mongoose';

/**
 * CallHistory Schema
 * 
 * Records details of completed calls for historical tracking and reporting
 * Each document captures a single call event with related metadata
 */
const callHistorySchema = new mongoose.Schema({
  // Call metadata
  callId: {
    type: String,
    required: true,
    index: true
  },
  
  // References to involved entities
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Call details
  phoneNumber: {
    type: String,
    required: true
  },
  
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    default: 'outbound'
  },
  
  // Call status and timing
  status: {
    type: String,
    enum: ['completed', 'missed', 'rejected', 'no-answer', 'busy', 'failed', 'voicemail'],
    required: true
  },
  
  startTime: {
    type: Date,
    required: true
  },
  
  endTime: {
    type: Date
  },
  
  duration: {
    type: Number,
    default: 0 // duration in seconds
  },
  
  // Recording information
  recordingUrl: {
    type: String
  },
  
  // Call disposition data
  disposition: {
    type: String,
    enum: ['interested', 'not-interested', 'callback', 'do-not-call', 'wrong-number', 'no-disposition']
  },
  
  notes: {
    type: String
  },
  
  // Quality metrics
  qualityScore: {
    type: Number,
    min: 0,
    max: 10
  },
  
  // External integration data
  aircallData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Tags for categorization
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
callHistorySchema.index({ startTime: -1 });
callHistorySchema.index({ agent: 1, startTime: -1 });
callHistorySchema.index({ client: 1, startTime: -1 });
callHistorySchema.index({ status: 1, startTime: -1 });

// Calculate call duration when endTime is set
callHistorySchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

// Static methods
callHistorySchema.statics.getCallStats = async function(userId, startDate, endDate) {
  const query = {};
  
  if (userId) {
    query.agent = userId;
  }
  
  if (startDate || endDate) {
    query.startTime = {};
    if (startDate) query.startTime.$gte = startDate;
    if (endDate) query.startTime.$lte = endDate;
  }
  
  const stats = await this.aggregate([
    { $match: query },
    { $group: {
      _id: '$status',
      count: { $sum: 1 },
      totalDuration: { $sum: '$duration' }
    }},
    { $sort: { count: -1 } }
  ]);
  
  const total = await this.countDocuments(query);
  const totalDuration = stats.reduce((sum, stat) => sum + (stat.totalDuration || 0), 0);
  
  return {
    total,
    totalDuration,
    avgDuration: total > 0 ? Math.floor(totalDuration / total) : 0,
    byStatus: stats
  };
};

callHistorySchema.statics.getRecentCalls = function(userId, limit = 10) {
  const query = {};
  if (userId) {
    query.agent = userId;
  }
  
  return this.find(query)
    .sort({ startTime: -1 })
    .limit(limit)
    .populate('client', 'name email phone')
    .populate('agent', 'name email');
};

const CallHistory = mongoose.model('CallHistory', callHistorySchema);

export default CallHistory;