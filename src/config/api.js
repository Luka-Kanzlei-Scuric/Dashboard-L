import axios from 'axios';

// Base URL for API requests
export const API_BASE_URL = '/api';

// Available backend URLs to try if the primary one fails
let BACKEND_URLS = [
  import.meta.env.VITE_API_URL,
  '/api', // Lokaler Pfad über Render-Rewrites
  'https://dashboard-l-backend.onrender.com/api',
  'https://scuric-dashboard-backend.onrender.com/api',
  'http://localhost:5000/api'
].filter(Boolean); // Remove null/undefined entries

// Explizite Dialer-Endpunkte - ohne führende /api weil die baseURL das bereits enthält
export const DIALER_ENDPOINTS = {
  status: (userId) => `/dialer/status/${userId}`,
  start: (userId) => `/dialer/start/${userId}`,
  pause: (userId) => `/dialer/pause/${userId}`,
  stop: (userId) => `/dialer/stop/${userId}`,
  queue: (userId) => userId ? `/dialer/queue/${userId}` : '/dialer/queue',
  history: '/dialer/history',
  stats: '/dialer/stats',
  agents: '/dialer/agents',
  config: '/dialer/config',
  initialize: '/dialer/initialize',
  webhook: '/dialer/webhook'
};

// Remove duplicates
BACKEND_URLS = [...new Set(BACKEND_URLS)];

console.log('Available backend URLs:', BACKEND_URLS);

// Current backend URL index
let currentUrlIndex = 0;

// Create axios instance with initial base URL
const api = axios.create({
  baseURL: BACKEND_URLS[currentUrlIndex] || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Temporär einen Auth-Header hinzufügen für den PowerDialer mit dem API-Schlüssel (75d27d3e184df759cee102d8e922e7de:44acb43f91f0a7ee678afa4cd1136887)
    'Authorization': 'Basic NzVkMjdkM2UxODRkZjc1OWNlZTEwMmQ4ZTkyMmU3ZGU6NDRhY2I0M2Y5MWYwYTdlZTY3OGFmYTRjZDExMzY4ODc=', 
    // Temporarily remove Cache-Control to avoid CORS issues
    // 'Cache-Control': 'no-cache',
    // Add timestamp to prevent caching issues with CORS preflight responses
    'X-Requested-With': 'XMLHttpRequest'
  },
  timeout: 10000, // 10 second timeout
  withCredentials: false, // Don't send cookies to avoid CORS issues
  // Add timestamp parameter to URLs to bust cache for preflight requests
  paramsSerializer: params => {
    const newParams = { ...params, _t: new Date().getTime() };
    return Object.keys(newParams)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(newParams[key])}`)
      .join('&');
  }
});

// Function to try next available API URL
const tryNextApiUrl = () => {
  currentUrlIndex = (currentUrlIndex + 1) % BACKEND_URLS.length;
  const newUrl = BACKEND_URLS[currentUrlIndex];
  console.log(`Switching to next API URL: ${newUrl}`);
  api.defaults.baseURL = newUrl;
  return newUrl;
};

// Test if the backend is reachable
const testBackendConnection = async () => {
  try {
    // First try health endpoint
    const healthResponse = await axios.get(`${api.defaults.baseURL}/health`, { 
      timeout: 5000,
      withCredentials: false,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (healthResponse.status === 200) {
      console.log(`Backend connection successful at ${api.defaults.baseURL}`);
      return true;
    }
    
    throw new Error('Health check responded with non-200 status');
  } catch (healthError) {
    try {
      // Then try root endpoint
      const rootUrl = api.defaults.baseURL.replace(/\/api$/, '');
      const rootResponse = await axios.get(rootUrl, { 
        timeout: 5000,
        withCredentials: false,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (rootResponse.status === 200) {
        console.log(`Backend root connection successful at ${rootUrl}`);
        return true;
      }
      
      throw new Error('Root endpoint responded with non-200 status');
    } catch (rootError) {
      try {
        // Finally try CORS test endpoint
        const corsUrl = `${api.defaults.baseURL.replace(/\/api$/, '')}/test-cors`;
        const corsResponse = await axios.get(corsUrl, { 
          timeout: 5000,
          withCredentials: false,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (corsResponse.status === 200) {
          console.log(`Backend CORS test successful at ${corsUrl}`);
          return true;
        }
        
        throw new Error('CORS test responded with non-200 status');
      } catch (corsError) {
        console.error('All backend connection tests failed', {
          healthUrl: `${api.defaults.baseURL}/health`,
          rootUrl: api.defaults.baseURL.replace(/\/api$/, ''),
          corsUrl: `${api.defaults.baseURL.replace(/\/api$/, '')}/test-cors`,
          healthError: healthError.message,
          rootError: rootError.message,
          corsError: corsError.message
        });
        return false;
      }
    }
  }
};

// Track what backends we've already tried in this session
const triedBackends = new Map(); // URL -> retry count
let isConnecting = false;
let connectionAttempts = 0;

// Check if site is in development/maintenance mode
const isMaintenanceMode = () => {
  return localStorage.getItem('auth_bypass') === 'true';
};

// Attempt to find a working backend on startup
// This runs once when the module is imported
const findWorkingBackend = async () => {
  // Prevent multiple concurrent connection attempts
  if (isConnecting) {
    console.log('Connection attempt already in progress, skipping');
    return false;
  }
  
  isConnecting = true;
  let foundWorking = false;
  connectionAttempts++;
  
  try {
    // Only try each backend URL once per session to avoid loops
    for (let i = 0; i < BACKEND_URLS.length; i++) {
      // Get current retry count for this URL
      const retryCount = triedBackends.get(BACKEND_URLS[i]) || 0;
      
      if (connectionAttempts > 3 && retryCount > 2) {
        console.log(`Already tried ${BACKEND_URLS[i]} ${retryCount} times, skipping`);
        continue;
      }
      
      api.defaults.baseURL = BACKEND_URLS[i];
      console.log(`Testing backend connection to ${api.defaults.baseURL}...`);
      triedBackends.set(BACKEND_URLS[i], retryCount + 1);
      
      if (await testBackendConnection()) {
        currentUrlIndex = i;
        foundWorking = true;
        console.log(`Found working backend at ${api.defaults.baseURL}`);
        break;
      }
      
      console.log(`Backend at ${api.defaults.baseURL} not responding, trying next...`);
    }
  } catch (error) {
    console.error('Error during backend connection tests:', error);
  } finally {
    if (!foundWorking) {
      console.error('Could not connect to any backend servers. Using first URL as fallback.');
      currentUrlIndex = 0;
      api.defaults.baseURL = BACKEND_URLS[0];
    }
    
    isConnecting = false;
  }
  
  return foundWorking;
};

// Run the initial connection check and trigger an event when done
findWorkingBackend().then(() => {
  // Dispatch a custom event to notify the app that we found a working backend
  window.dispatchEvent(new CustomEvent('backendConnected'));
});

// Global request counter to avoid infinite loops
let globalRetryCount = 0;
const MAX_GLOBAL_RETRIES = 8;

// Response interceptor for error handling
api.interceptors.response.use(
  response => {
    // Reset global retry counter on successful requests
    globalRetryCount = 0;
    return response;
  },
  async error => {
    // Get the failed request
    const originalRequest = error.config;
    
    // If we're in maintenance mode, don't retry too aggressively
    if (isMaintenanceMode()) {
      console.log('Request failed in maintenance mode - reducing retries');
      // Still return the error but don't retry as aggressively
      if (originalRequest._retryCount >= 1) {
        return Promise.reject(error);
      }
    }
    
    const isCorsError = error.message?.includes('Origin') || 
                         error.message?.includes('access control checks') ||
                         error.message?.includes('CORS');
    
    // Global retry limit to prevent infinite retry loops
    if (globalRetryCount >= MAX_GLOBAL_RETRIES) {
      console.warn(`Global retry limit (${MAX_GLOBAL_RETRIES}) reached. Stopping retry attempts.`);
      return Promise.reject(error);
    }
    
    // Retry if it's a network/CORS error or 5xx error and we haven't retried this request before
    if ((!originalRequest._retry) && 
        (error.message === 'Network Error' || 
         isCorsError ||
         (error.response && error.response.status >= 500))) {
      
      // Limit to 2 retries per request
      originalRequest._retryCount = originalRequest._retryCount || 0;
      if (originalRequest._retryCount >= 2) {
        console.log(`Max retries reached for ${originalRequest.url}`);
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      originalRequest._retryCount++;
      globalRetryCount++;
      
      // Try a different API URL, but only if the URL hasn't been tried more than twice in this session
      if (triedBackends.has(BACKEND_URLS[currentUrlIndex]) && triedBackends.get(BACKEND_URLS[currentUrlIndex]) > 2) {
        const newUrl = tryNextApiUrl();
        console.log(`Retrying request with new API URL: ${newUrl} (Attempt ${originalRequest._retryCount})`);
        originalRequest.baseURL = newUrl;
      }
      
      // Add headers that might help with CORS
      originalRequest.headers = {
        ...originalRequest.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // Temporarily remove problematic headers
        // 'Cache-Control': 'no-cache',
        // 'Pragma': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest',
        // Add a random parameter to avoid caching issues
        'X-Random': Math.random().toString(36).substring(7)
      };
      
      // Disable credentials to avoid CORS preflight
      originalRequest.withCredentials = false;
      
      // Add a small delay before retrying to avoid hammering the server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Retry the request with the new URL
      return api(originalRequest);
    }
    
    // Log errors
    console.error('API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      isCorsError: isCorsError ? true : false
    });
    
    // Return the error for handling in components
    return Promise.reject(error);
  }
);

export default api;