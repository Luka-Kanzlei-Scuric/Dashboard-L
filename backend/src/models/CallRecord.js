import mongoose from 'mongoose';

const callRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false
  },
  phoneNumber: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    default: 'aircall'
  },
  aircallUserId: {
    type: String
  },
  aircallNumberId: {
    type: String
  },
  aircallCallId: {
    type: String
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'in-progress', 'completed', 'failed', 'no-answer'],
    default: 'initiated'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// Create indexes for better query performance
callRecordSchema.index({ userId: 1 });
callRecordSchema.index({ clientId: 1 });
callRecordSchema.index({ startTime: -1 });
callRecordSchema.index({ aircallCallId: 1 });

const CallRecord = mongoose.model('CallRecord', callRecordSchema);

export default CallRecord;