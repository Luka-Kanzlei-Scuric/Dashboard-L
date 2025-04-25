import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define a simple User schema to match your existing schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date,
  updatedAt: Date
});

async function listUsers() {
  try {
    // Get the MongoDB connection string from your .env file
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/scuric-dashboard';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Create a temporary model for User
    const User = mongoose.model('User', UserSchema);
    
    // Find all users
    const users = await User.find({}).select('_id name email role');
    
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`ID: ${user._id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    return users;
  } catch (error) {
    console.error('Error listing users:', error.message);
    process.exit(1);
  }
}

// Run the function
listUsers();