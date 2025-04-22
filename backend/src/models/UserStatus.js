import mongoose from 'mongoose';

/**
 * UserStatus Schema
 * 
 * Tracks the availability and status of users, particularly for PowerDialer agents
 * Maintains real-time connection status with telephony systems
 */
const userStatusSchema = new mongoose.Schema({
  // Reference to user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Overall availability status
  availabilityStatus: {
    type: String,
    enum: ['available', 'busy', 'offline', 'in-call', 'break', 'meeting', 'training'],
    default: 'offline'
  },
  
  // Whether the user is currently online/logged in
  online: {
    type: Boolean,
    default: false
  },
  
  // Whether the user is connected to telephony system
  connected: {
    type: Boolean,
    default: false
  },
  
  // Aircall-specific integration data
  aircall: {
    userId: {
      type: String
    },
    numberId: {
      type: String
    },
    aircallStatus: {
      type: String
    },
    lastSyncTime: {
      type: Date
    }
  },
  
  // Current active call (if any)
  activeCall: {
    callId: String,
    startTime: Date,
    clientId: mongoose.Schema.Types.ObjectId,
    phoneNumber: String
  },
  
  // Statistics for current session
  sessionStats: {
    startTime: Date,
    callsCompleted: {
      type: Number,
      default: 0
    },
    totalCallDuration: {
      type: Number,
      default: 0
    },
    lastCallEndTime: Date
  },
  
  // Additional availability info
  availability: {
    nextAvailableTime: Date,
    autoBreakEnabled: {
      type: Boolean,
      default: true
    },
    breakInterval: {
      type: Number, 
      default: 30 // time in minutes between automatic breaks
    },
    breakDuration: {
      type: Number,
      default: 5 // break duration in minutes
    }
  },
  
  // Custom status message
  statusMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
userStatusSchema.index({ availabilityStatus: 1 });
userStatusSchema.index({ online: 1, connected: 1 });

// Instance methods
userStatusSchema.methods.setAvailable = function() {
  this.availabilityStatus = 'available';
  this.online = true;
  return this.save();
};

userStatusSchema.methods.setBusy = function(reason = 'busy') {
  this.availabilityStatus = reason;
  return this.save();
};

userStatusSchema.methods.setOffline = function() {
  this.availabilityStatus = 'offline';
  this.online = false;
  this.connected = false;
  return this.save();
};

userStatusSchema.methods.startCall = function(callId, clientId, phoneNumber) {
  this.availabilityStatus = 'in-call';
  this.activeCall = {
    callId,
    startTime: new Date(),
    clientId,
    phoneNumber
  };
  return this.save();
};

userStatusSchema.methods.endCall = function(duration) {
  // Increment stats
  if (!this.sessionStats.startTime) {
    this.sessionStats.startTime = new Date();
  }
  
  this.sessionStats.callsCompleted += 1;
  this.sessionStats.totalCallDuration += (duration || 0);
  this.sessionStats.lastCallEndTime = new Date();
  
  // Clear active call
  this.activeCall = null;
  
  // Check if should take auto-break
  if (this.availability.autoBreakEnabled && 
      this.sessionStats.callsCompleted % 10 === 0) { // Every 10 calls
    this.availabilityStatus = 'break';
    this.availability.nextAvailableTime = new Date(
      Date.now() + this.availability.breakDuration * 60 * 1000
    );
  } else {
    this.availabilityStatus = 'available';
  }
  
  return this.save();
};

// Static methods
userStatusSchema.statics.getAvailableAgents = function() {
  return this.find({
    availabilityStatus: 'available',
    online: true,
    connected: true
  })
  .populate('user', 'name email')
  .sort({ 'sessionStats.callsCompleted': 1 }); // Load balancing
};

userStatusSchema.statics.getAgentStatus = function(userId) {
  return this.findOne({ user: userId })
    .populate('user', 'name email')
    .exec();
};

const UserStatus = mongoose.model('UserStatus', userStatusSchema);

export default UserStatus;