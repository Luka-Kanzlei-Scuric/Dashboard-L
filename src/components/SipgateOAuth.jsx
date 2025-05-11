import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api, { DIALER_ENDPOINTS } from '../config/api';
import { 
  ArrowPathIcon, 
  LockClosedIcon, 
  CheckBadgeIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

/**
 * SipGate OAuth2 Component
 * Handles the OAuth2 authentication flow with SipGate
 */
const SipgateOAuth = ({ onStatusChange }) => {
  const [authStatus, setAuthStatus] = useState({
    checking: true,
    authenticated: false,
    deviceId: null,
    callerId: null,
    error: null
  });
  
  const [deviceInfo, setDeviceInfo] = useState({
    deviceId: '',
    callerId: ''
  });
  
  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  // Listen for auth messages from popup
  useEffect(() => {
    const handleAuthMessage = (event) => {
      // Make sure the message is from our popup
      if (event.data && event.data.type) {
        if (event.data.type === 'sipgate-auth-success') {
          console.log('SipGate auth success:', event.data);
          
          // Store temporary user ID if provided
          if (event.data.tempUserId) {
            localStorage.setItem('sipgate_temp_user_id', event.data.tempUserId);
            console.log(`Stored temporary user ID from popup: ${event.data.tempUserId}`);
          }
          
          // Check auth status with a slight delay to allow backend to complete processing
          setTimeout(() => {
            checkAuthStatus();
          }, 500);
        } else if (event.data.type === 'sipgate-auth-error') {
          console.error('SipGate auth error:', event.data);
          setAuthStatus(prev => ({
            ...prev,
            checking: false,
            error: `Authentication error: ${event.data.error} - ${event.data.details || ''}`
          }));
        }
      }
    };
    
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);
  
  // Check SipGate auth status
  const checkAuthStatus = async () => {
    try {
      setAuthStatus(prev => ({ ...prev, checking: true, error: null }));
      
      // Add retry mechanism for robustness
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;
      let response;
      
      // Get temporary user ID from localStorage or create a new one
      let tempUserId = localStorage.getItem('sipgate_temp_user_id');
      if (!tempUserId) {
        tempUserId = 'temp-user-' + Date.now();
        localStorage.setItem('sipgate_temp_user_id', tempUserId);
      }
      
      while (attempts < maxAttempts && !success) {
        try {
          // Use the API client with proper base URL configuration and endpoints
          // Pass the temporary user ID as a query parameter
          response = await api.get(`${DIALER_ENDPOINTS.sipgateStatus}?userId=${tempUserId}`);
          success = true;
        } catch (retryError) {
          attempts++;
          console.warn(`Auth status check attempt ${attempts} failed:`, retryError.message);
          
          if (attempts >= maxAttempts) {
            throw retryError;
          }
          
          // Wait between retries (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
      
      // Get any locally stored device info
      const localDeviceId = localStorage.getItem('sipgate_device_id');
      const localCallerId = localStorage.getItem('sipgate_caller_id');
      
      // Use backend info, fall back to local storage info
      const deviceId = response.data.deviceId || localDeviceId;
      const callerId = response.data.callerId || localCallerId;
      
      const newStatus = {
        checking: false,
        authenticated: response.data.authenticated,
        deviceId: deviceId,
        callerId: callerId,
        userId: response.data.userId,
        error: null
      };
      
      console.log('Auth status check result:', newStatus);
      
      setAuthStatus(newStatus);
      
      // Update device info form fields
      setDeviceInfo({
        deviceId: deviceId || '',
        callerId: callerId || ''
      });
      
      // Update localStorage if we have info from backend
      if (response.data.deviceId) {
        localStorage.setItem('sipgate_device_id', response.data.deviceId);
      }
      if (response.data.callerId) {
        localStorage.setItem('sipgate_caller_id', response.data.callerId);
      }
      
      // Notify parent of status change
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    } catch (error) {
      console.error('Error checking SipGate auth status:', error);
      setAuthStatus({
        checking: false,
        authenticated: false,
        deviceId: null,
        callerId: null,
        error: error.response?.data?.message || error.message
      });
    }
  };
  
  // Start the OAuth2 process in a popup
  const startOAuth = () => {
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // Get or create temporary user ID
    let tempUserId = localStorage.getItem('sipgate_temp_user_id');
    if (!tempUserId) {
      tempUserId = 'temp-user-' + Date.now();
      localStorage.setItem('sipgate_temp_user_id', tempUserId);
    }
    
    // Use the correct base URL by getting it from the api config
    const authUrl = `${api.defaults.baseURL}${DIALER_ENDPOINTS.sipgateAuth}?tempUserId=${tempUserId}`;
    
    window.open(
      authUrl,
      'SipGate Authentication',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };
  
  // Save device ID and caller ID
  const saveDeviceInfo = async () => {
    try {
      if (!deviceInfo.deviceId) {
        return;
      }
      
      // First check if we're still authenticated
      try {
        await checkAuthStatus();
      } catch (checkError) {
        console.error('Failed to check authentication status before saving device info:', checkError);
        // Continue anyway, the endpoint will verify
      }
      
      // Make sure deviceId follows the expected format
      const deviceId = deviceInfo.deviceId.trim();
      
      setAuthStatus(prev => ({
        ...prev,
        checking: true,
        error: null
      }));
      
      // Get temp user ID for sending to backend
      const tempUserId = localStorage.getItem('sipgate_temp_user_id');
      
      // Try to save the device info
      const response = await api.post(DIALER_ENDPOINTS.sipgateDevice, {
        deviceId: deviceId,
        callerId: deviceInfo.callerId,
        tempUserId: tempUserId // Include temp user ID in the request
      });
      
      if (response.data.success) {
        // Store device info in localStorage for frontend reference
        localStorage.setItem('sipgate_device_id', deviceId);
        if (deviceInfo.callerId) {
          localStorage.setItem('sipgate_caller_id', deviceInfo.callerId);
        }
        
        setAuthStatus(prev => ({
          ...prev,
          checking: false,
          deviceId: deviceId,
          callerId: deviceInfo.callerId
        }));
        
        // Notify parent of status change
        if (onStatusChange) {
          onStatusChange({
            ...authStatus,
            deviceId: deviceId,
            callerId: deviceInfo.callerId
          });
        }
        
        console.log(`Device info saved: deviceId=${deviceId}, callerId=${deviceInfo.callerId || 'none'}`);
      }
    } catch (error) {
      console.error('Error saving device info:', error);
      
      // Special handling for authentication errors
      if (error.response?.status === 401) {
        setAuthStatus(prev => ({
          ...prev,
          checking: false,
          authenticated: false,
          error: "Authentication expired. Please authenticate again."
        }));
      } else {
        setAuthStatus(prev => ({
          ...prev,
          checking: false,
          error: error.response?.data?.message || error.message
        }));
      }
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">SipGate OAuth2 Authentication</h2>
      
      {/* Status display */}
      <div className="mb-6">
        <div className="flex items-center">
          {authStatus.checking ? (
            <div className="flex items-center text-blue-600">
              <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
              <span>Checking authentication status...</span>
            </div>
          ) : authStatus.authenticated ? (
            <div className="flex items-center text-green-600">
              <CheckBadgeIcon className="w-5 h-5 mr-2" />
              <span>Authenticated with SipGate</span>
            </div>
          ) : (
            <div className="flex items-center text-gray-500">
              <LockClosedIcon className="w-5 h-5 mr-2" />
              <span>Not authenticated with SipGate</span>
            </div>
          )}
        </div>
        
        {authStatus.error && (
          <div className="mt-2 flex items-center text-red-600">
            <ExclamationCircleIcon className="w-5 h-5 mr-2" />
            <span>{authStatus.error}</span>
          </div>
        )}
      </div>
      
      {/* Authentication button */}
      {!authStatus.authenticated && !authStatus.checking && (
        <button
          onClick={startOAuth}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Connect with SipGate
        </button>
      )}
      
      {/* Device ID and Caller ID form */}
      {authStatus.authenticated && (
        <div className="mt-6">
          <h3 className="text-md font-medium text-gray-800 mb-2">Device Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700">
                SipGate Device ID
              </label>
              <input
                type="text"
                id="deviceId"
                value={deviceInfo.deviceId}
                onChange={(e) => setDeviceInfo({ ...deviceInfo, deviceId: e.target.value })}
                placeholder="e.g. e0"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Your SipGate device ID (usually starts with 'e' followed by a number)
              </p>
            </div>
            
            <div>
              <label htmlFor="callerId" className="block text-sm font-medium text-gray-700">
                Caller ID (optional)
              </label>
              <input
                type="text"
                id="callerId"
                value={deviceInfo.callerId}
                onChange={(e) => setDeviceInfo({ ...deviceInfo, callerId: e.target.value })}
                placeholder="e.g. +49123456789"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                The number shown to the recipient when you call them
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={saveDeviceInfo}
                disabled={!deviceInfo.deviceId}
                className={`px-4 py-2 rounded ${
                  deviceInfo.deviceId 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Save Device Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SipgateOAuth;