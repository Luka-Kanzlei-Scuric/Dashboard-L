import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define User and UserStatus schemas
const UserSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String
});

const UserStatusSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  availabilityStatus: {
    type: String,
    enum: ['available', 'busy', 'offline', 'in-call', 'break', 'meeting', 'training'],
    default: 'offline'
  },
  online: {
    type: Boolean,
    default: false
  },
  connected: {
    type: Boolean,
    default: false
  },
  aircall: {
    userId: String,
    numberId: String,
    aircallStatus: String,
    lastSyncTime: Date
  },
  activeCall: {
    callId: String,
    startTime: Date,
    clientId: mongoose.Schema.Types.ObjectId,
    phoneNumber: String
  },
  sessionStats: {
    startTime: Date,
    callsCompleted: {
      type: Number,
      default: 0
    },
    totalCallDuration: {
      type: Number,
      default: 0
    }
  }
});

// Fix user status function
async function fixUserStatus() {
  try {
    // Get MongoDB connection string
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scuric-dashboard';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Create models
    const User = mongoose.model('User', UserSchema);
    const UserStatus = mongoose.model('UserStatus', UserStatusSchema);
    
    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users in database`);
    
    // For each user, fix their status
    for (const user of users) {
      console.log(`Checking status for user: ${user.name} (${user._id})`);
      
      // Find existing status or create a new one
      let status = await UserStatus.findOne({ user: user._id });
      
      if (!status) {
        console.log(' - No status record found, creating new one');
        status = new UserStatus({
          user: user._id,
          availabilityStatus: 'available',
          online: true,
          connected: true,
          aircall: {
            userId: '1527216',
            numberId: '967647',
            aircallStatus: 'available',
            lastSyncTime: new Date()
          },
          sessionStats: {
            startTime: new Date(),
            callsCompleted: 0,
            totalCallDuration: 0
          }
        });
        await status.save();
        console.log(' - Created new status record and set as available');
      } else {
        console.log(' - Found existing status record:', 
          `availabilityStatus=${status.availabilityStatus}, `,
          `online=${status.online}, `,
          `connected=${status.connected}`);
        
        // Ensure all required fields are set correctly
        status.availabilityStatus = 'available';
        status.online = true;
        status.connected = true;
        
        // Make sure Aircall info is set
        if (!status.aircall || !status.aircall.userId) {
          status.aircall = {
            userId: '1527216',
            numberId: '967647',
            aircallStatus: 'available',
            lastSyncTime: new Date()
          };
        }
        
        await status.save();
        console.log(' - Updated status to available, online, and connected');
      }
    }
    
    // Check if we now have available agents
    const availableAgents = await UserStatus.find({
      availabilityStatus: 'available',
      online: true,
      connected: true
    }).populate('user', 'name email');
    
    console.log(`\nAVAILABLE AGENTS COUNT: ${availableAgents.length}`);
    console.log('Available agents:');
    availableAgents.forEach(agent => {
      console.log(` - ${agent.user.name} (${agent.user.email}): status=${agent.availabilityStatus}, online=${agent.online}, connected=${agent.connected}`);
    });
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
    console.log('\nRestart your server now to see the changes take effect!');
  } catch (error) {
    console.error('Error fixing user status:', error);
    process.exit(1);
  }
}

// Run the function
fixUserStatus();