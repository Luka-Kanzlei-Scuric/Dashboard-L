import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * Schema for storing SipGate OAuth2 tokens securely
 * Includes encryption for sensitive token data
 */
const sipgateTokenSchema = new mongoose.Schema({
  // User ID reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Encrypted access token
  accessToken: {
    type: String,
    required: true
  },
  // Encrypted refresh token
  refreshToken: {
    type: String,
    required: true
  },
  // When the access token expires
  expiresAt: {
    type: Date,
    required: true
  },
  // SipGate device ID (e.g., "e0")
  deviceId: {
    type: String
  },
  // SipGate caller ID for outgoing calls
  callerId: {
    type: String
  },
  // Initialization vector for encryption
  iv: {
    type: String,
    required: true
  },
  // Last time the token was refreshed
  lastRefreshed: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// Create unique index on userId
sipgateTokenSchema.index({ userId: 1 }, { unique: true });

// Encryption methods
sipgateTokenSchema.statics.encryptToken = function(token) {
  // Get encryption key from environment or use a fallback (in production, always use env)
  const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || 
    'af9d6f7b992f5f939fee49b5a19a593fc8598115c466868cfeafd5e4a7d3b0ec';
  
  // Generate initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher with AES-256-CBC
  const cipher = crypto.createCipheriv(
    'aes-256-cbc', 
    Buffer.from(ENCRYPTION_KEY, 'hex'), 
    iv
  );
  
  // Encrypt the token
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return encrypted token and IV
  return {
    token: encrypted,
    iv: iv.toString('hex')
  };
};

sipgateTokenSchema.statics.decryptToken = function(encryptedToken, ivHex) {
  try {
    // Get encryption key from environment or use a fallback
    const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || 
      'af9d6f7b992f5f939fee49b5a19a593fc8598115c466868cfeafd5e4a7d3b0ec';
    
    // Convert IV from hex to buffer
    const iv = Buffer.from(ivHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc', 
      Buffer.from(ENCRYPTION_KEY, 'hex'), 
      iv
    );
    
    // Decrypt the token
    let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting token:', error);
    return null;
  }
};

const SipgateToken = mongoose.model('SipgateToken', sipgateTokenSchema);

export default SipgateToken;