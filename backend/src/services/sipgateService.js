/**
 * SipGate Service - Handles SipGate API calls using OAuth2 authentication
 * Production-ready implementation with MongoDB token storage
 */

import axios from 'axios';
import querystring from 'querystring';
import dotenv from 'dotenv';
import SipgateToken from '../models/SipgateToken.js';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Constants
const SIPGATE_API_BASE_URL = 'https://api.sipgate.com/v2';
const SIPGATE_LOGIN_URL = 'https://login.sipgate.com/auth/realms/third-party/protocol/openid-connect';

// Configuration
const SIPGATE_CLIENT_ID = process.env.SIPGATE_CLIENT_ID;
const SIPGATE_CLIENT_SECRET = process.env.SIPGATE_CLIENT_SECRET;
const SIPGATE_REDIRECT_URI = process.env.SIPGATE_REDIRECT_URI || 'https://dashboard-l.onrender.com/api/dialer/auth/sipgate/callback';

// In-memory cache for tokens to reduce database load
// Maps userId to { token, expires } for quick access checking
const tokenCache = new Map();

/**
 * Validates if a phone number is in E.164 format.
 * @param {string} phoneNumber - The phone number to validate.
 * @returns {boolean} True if the phone number is in valid E.164 format, false otherwise.
 */
function isValidE164(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== "string") {
        console.warn(`Invalid input for phone number validation: ${phoneNumber}`);
        return false;
    }
    // Regex for E.164 format
    const e164Pattern = /^\+[1-9]\d{1,14}$/;
    return e164Pattern.test(phoneNumber);
}

/**
 * Generates the authorization URL for the OAuth2 flow.
 * @returns {string} The authorization URL to redirect the user to.
 */
function getAuthorizationUrl() {
    console.log('Generating SipGate authorization URL');
    
    if (!SIPGATE_CLIENT_ID || !SIPGATE_REDIRECT_URI) {
        throw new Error('SIPGATE_CLIENT_ID and SIPGATE_REDIRECT_URI must be configured');
    }
    
    const params = {
        client_id: SIPGATE_CLIENT_ID,
        redirect_uri: SIPGATE_REDIRECT_URI,
        response_type: 'code',
        scope: 'call:write device:read',
    };
    
    const authUrl = `${SIPGATE_LOGIN_URL}/auth?${querystring.stringify(params)}`;
    console.log(`Authorization URL: ${authUrl}`);
    return authUrl;
}

/**
 * Exchanges an authorization code for an access token.
 * @param {string} code - The authorization code from the callback
 * @param {string} userId - The user ID to associate with these tokens
 * @returns {Promise<Object>} The token data
 */
async function exchangeCodeForTokens(code, userId) {
    console.log(`Exchanging code for tokens for user: ${userId}`);
    
    if (!SIPGATE_CLIENT_ID || !SIPGATE_CLIENT_SECRET || !SIPGATE_REDIRECT_URI) {
        throw new Error('SIPGATE_CLIENT_ID, SIPGATE_CLIENT_SECRET, and SIPGATE_REDIRECT_URI must be configured');
    }
    
    // Validate userId is a proper MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID format');
    }
    
    const tokenUrl = `${SIPGATE_LOGIN_URL}/token`;
    const requestBody = {
        client_id: SIPGATE_CLIENT_ID,
        client_secret: SIPGATE_CLIENT_SECRET,
        code: code,
        redirect_uri: SIPGATE_REDIRECT_URI,
        grant_type: 'authorization_code',
    };
    
    try {
        const response = await axios.post(tokenUrl, querystring.stringify(requestBody), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        
        const tokenData = response.data;
        // Calculate expiry time
        const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
        
        // Encrypt tokens before storing them in the database
        const encryptedAccessToken = SipgateToken.encryptToken(tokenData.access_token);
        const encryptedRefreshToken = SipgateToken.encryptToken(tokenData.refresh_token);
        
        // Find existing token or create a new one
        let tokenRecord = await SipgateToken.findOne({ userId });
        
        if (tokenRecord) {
            // Update existing token
            tokenRecord.accessToken = encryptedAccessToken.token;
            tokenRecord.refreshToken = encryptedRefreshToken.token;
            tokenRecord.iv = encryptedAccessToken.iv; // Store the IV for decryption
            tokenRecord.expiresAt = expiresAt;
            tokenRecord.lastRefreshed = new Date();
            
            await tokenRecord.save();
        } else {
            // Create a new token record
            tokenRecord = new SipgateToken({
                userId,
                accessToken: encryptedAccessToken.token,
                refreshToken: encryptedRefreshToken.token,
                iv: encryptedAccessToken.iv,
                expiresAt: expiresAt
            });
            
            await tokenRecord.save();
        }
        
        // Store in memory cache for quick access
        tokenCache.set(userId, {
            access_token: tokenData.access_token,
            expires_at: expiresAt.getTime()
        });
        
        console.log(`Tokens obtained and securely stored for user: ${userId}`);
        
        // Return token data (but don't expose sensitive data)
        return {
            authenticated: true,
            expires_at: expiresAt,
            token_type: tokenData.token_type
        };
    } catch (error) {
        console.error('Error exchanging code for tokens:', error.message);
        if (error.response) {
            console.error('Error details:', error.response.data);
        }
        throw new Error(`Failed to exchange code for tokens: ${error.message}`);
    }
}

/**
 * Refreshes the access token if needed.
 * @param {string} userId - The user ID whose token to refresh
 * @returns {Promise<string>} The valid access token
 */
async function getAccessToken(userId) {
    // Check memory cache first
    const cachedToken = tokenCache.get(userId);
    
    if (cachedToken && cachedToken.access_token && Date.now() < cachedToken.expires_at - 60000) {
        console.log(`Using cached access token for user: ${userId}`);
        return cachedToken.access_token;
    }
    
    // Try to get token from database
    try {
        const tokenRecord = await SipgateToken.findOne({ userId });
        
        if (!tokenRecord) {
            console.log(`No tokens found in database for user: ${userId}`);
            tokenCache.delete(userId); // Clear any stale cache
            throw new Error('No authentication tokens found. Please authenticate first.');
        }
        
        // Check if token is still valid (with a 60 second buffer)
        if (tokenRecord.expiresAt && new Date() < new Date(tokenRecord.expiresAt.getTime() - 60000)) {
            // Token still valid, decrypt and return
            const accessToken = SipgateToken.decryptToken(tokenRecord.accessToken, tokenRecord.iv);
            
            if (!accessToken) {
                throw new Error('Failed to decrypt access token. Please authenticate again.');
            }
            
            // Update memory cache
            tokenCache.set(userId, {
                access_token: accessToken,
                expires_at: tokenRecord.expiresAt.getTime()
            });
            
            console.log(`Using valid access token from database for user: ${userId}`);
            return accessToken;
        }
        
        // Token expired, try to refresh it
        const refreshToken = SipgateToken.decryptToken(tokenRecord.refreshToken, tokenRecord.iv);
        
        if (!refreshToken) {
            throw new Error('Failed to decrypt refresh token. Please authenticate again.');
        }
        
        console.log(`Refreshing access token for user: ${userId}`);
        
        const tokenUrl = `${SIPGATE_LOGIN_URL}/token`;
        const requestBody = {
            client_id: SIPGATE_CLIENT_ID,
            client_secret: SIPGATE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        };
        
        try {
            const response = await axios.post(tokenUrl, querystring.stringify(requestBody), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            
            // Calculate new expiry time
            const expiresAt = new Date(Date.now() + (response.data.expires_in * 1000));
            
            // Encrypt new access token
            const encryptedAccessToken = SipgateToken.encryptToken(response.data.access_token);
            
            // If we received a new refresh token, encrypt and store it
            let newRefreshToken = refreshToken;
            if (response.data.refresh_token) {
                const encryptedRefreshToken = SipgateToken.encryptToken(response.data.refresh_token);
                tokenRecord.refreshToken = encryptedRefreshToken.token;
                newRefreshToken = response.data.refresh_token;
            }
            
            // Update token record
            tokenRecord.accessToken = encryptedAccessToken.token;
            tokenRecord.iv = encryptedAccessToken.iv;
            tokenRecord.expiresAt = expiresAt;
            tokenRecord.lastRefreshed = new Date();
            
            await tokenRecord.save();
            
            // Update memory cache
            tokenCache.set(userId, {
                access_token: response.data.access_token,
                expires_at: expiresAt.getTime()
            });
            
            console.log(`Access token refreshed for user: ${userId}`);
            return response.data.access_token;
        } catch (error) {
            console.error('Error refreshing access token:', error.message);
            // Don't delete the token record, but mark it as requiring re-auth
            tokenRecord.expiresAt = new Date(0); // Expired token
            await tokenRecord.save();
            
            // Clear cache
            tokenCache.delete(userId);
            
            throw new Error('Failed to refresh access token. Please authenticate again.');
        }
    } catch (error) {
        console.error('Error in getAccessToken:', error);
        // Clear cache
        tokenCache.delete(userId);
        throw error;
    }
}

/**
 * Checks if a user is authenticated
 * @param {string} userId - The user ID to check 
 * @returns {Promise<boolean>} Whether the user is authenticated
 */
async function isAuthenticated(userId) {
    // Check memory cache first for quick response
    const cachedToken = tokenCache.get(userId);
    if (cachedToken && cachedToken.access_token && Date.now() < cachedToken.expires_at) {
        return true;
    }
    
    try {
        // Check database
        const tokenRecord = await SipgateToken.findOne({ userId });
        
        if (!tokenRecord) {
            return false;
        }
        
        // Check if token is expired but can be refreshed
        if (tokenRecord.expiresAt && new Date() >= tokenRecord.expiresAt) {
            // Will need to refresh, but we have a record
            return true;
        }
        
        return true;
    } catch (error) {
        console.error(`Error checking authentication status for user ${userId}:`, error);
        return false;
    }
}

/**
 * Makes a call using SipGate API with OAuth2 authentication
 * @param {string} callee - The phone number to call
 * @param {string} userId - The user ID making the call
 * @param {Object} options - Call options like deviceId and callerId
 * @returns {Promise<Object>} API Response data
 */
async function makeCall(callee, userId, options = {}) {
    console.log(`Making SipGate call to ${callee} for user ${userId}`);
    
    // Validate phone number
    if (!isValidE164(callee)) {
        throw new Error(`Invalid callee phone number format: ${callee}. Must be E.164 format (e.g. +491234567890).`);
    }
    
    // Validate device ID
    if (!options.deviceId) {
        throw new Error('Device ID is required to make a call');
    }
    
    try {
        // Get a valid access token
        const accessToken = await getAccessToken(userId);
        
        // Prepare request data
        const requestBody = {
            deviceId: options.deviceId,
            caller: options.deviceId, // Web phone extension making the call
            callee: callee, // The number to call
        };
        
        // Add callerId if provided
        if (options.callerId) {
            requestBody.callerId = options.callerId;
        }
        
        console.log(`Making SipGate API call with deviceId: ${options.deviceId}`);
        const response = await axios({
            method: 'POST',
            url: `${SIPGATE_API_BASE_URL}/sessions/calls`,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            data: requestBody,
        });
        
        console.log(`SipGate call successful. Status: ${response.status}`);
        return {
            success: true,
            sessionId: response.data.sessionId,
            message: 'Call initiated successfully'
        };
    } catch (error) {
        console.error('Error making SipGate call:', error.message);
        
        let errorMessage = 'Failed to make call with SipGate';
        
        if (error.response) {
            console.error('SipGate API error details:', error.response.data);
            errorMessage = `SipGate API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
        }
        
        throw new Error(errorMessage);
    }
}

/**
 * Stores the device ID for a user
 * @param {string} userId - The user ID
 * @param {string} deviceId - The device ID to store
 * @param {string} callerId - Optional caller ID to store
 * @returns {Promise<boolean>} Success indicator
 */
async function storeUserDeviceId(userId, deviceId, callerId = null) {
    try {
        // Find the user's token record
        let tokenRecord = await SipgateToken.findOne({ userId });
        
        if (!tokenRecord) {
            console.log(`No token record found for user ${userId} when storing device ID`);
            return false;
        }
        
        // Update the device ID and caller ID
        tokenRecord.deviceId = deviceId;
        if (callerId) {
            tokenRecord.callerId = callerId;
        }
        
        // Save to database
        await tokenRecord.save();
        
        // If we have a cached token, update it with the device info too
        const cachedToken = tokenCache.get(userId);
        if (cachedToken) {
            cachedToken.deviceId = deviceId;
            cachedToken.callerId = callerId || cachedToken.callerId;
            tokenCache.set(userId, cachedToken);
        }
        
        console.log(`Stored device ID ${deviceId} for user ${userId}`);
        return true;
    } catch (error) {
        console.error(`Error storing device ID for user ${userId}:`, error);
        return false;
    }
}

/**
 * Retrieves the stored device ID for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} The device ID and caller ID
 */
async function getUserDeviceId(userId) {
    try {
        // Check memory cache first
        const cachedToken = tokenCache.get(userId);
        if (cachedToken && cachedToken.deviceId) {
            return {
                deviceId: cachedToken.deviceId,
                callerId: cachedToken.callerId
            };
        }
        
        // Check database
        const tokenRecord = await SipgateToken.findOne({ userId });
        
        if (!tokenRecord) {
            return { deviceId: null, callerId: null };
        }
        
        // Return device info
        return {
            deviceId: tokenRecord.deviceId,
            callerId: tokenRecord.callerId
        };
    } catch (error) {
        console.error(`Error getting device ID for user ${userId}:`, error);
        return { deviceId: null, callerId: null };
    }
}

export default {
    makeCall,
    isValidE164,
    getAuthorizationUrl,
    exchangeCodeForTokens,
    getAccessToken,
    isAuthenticated,
    storeUserDeviceId,
    getUserDeviceId
};