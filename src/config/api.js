import axios from 'axios';

// Available backend URLs to try if the primary one fails
const BACKEND_URLS = [
  import.meta.env.VITE_API_URL,
  'https://scuric-dashboard-backend.onrender.com/api',
  'https://dashboard-l-backend.onrender.com/api',
  'http://localhost:5000/api'
].filter(Boolean); // Remove null/undefined entries

console.log('Available backend URLs:', BACKEND_URLS);

// Current backend URL index
let currentUrlIndex = 0;

// Create axios instance with initial base URL
const api = axios.create({
  baseURL: BACKEND_URLS[currentUrlIndex] || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
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

// Attempt to find a working backend on startup
// This runs once when the module is imported
(async () => {
  let foundWorking = false;
  
  for (let i = 0; i < BACKEND_URLS.length; i++) {
    api.defaults.baseURL = BACKEND_URLS[i];
    console.log(`Testing backend connection to ${api.defaults.baseURL}...`);
    
    if (await testBackendConnection()) {
      currentUrlIndex = i;
      foundWorking = true;
      console.log(`Found working backend at ${api.defaults.baseURL}`);
      break;
    }
    
    console.log(`Backend at ${api.defaults.baseURL} not responding, trying next...`);
  }
  
  if (!foundWorking) {
    console.error('Could not connect to any backend servers. Using first URL as fallback.');
    currentUrlIndex = 0;
    api.defaults.baseURL = BACKEND_URLS[0];
  }
})();

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  async error => {
    // Get the failed request
    const originalRequest = error.config;
    
    const isCorsError = error.message?.includes('Origin') || 
                         error.message?.includes('access control checks') ||
                         error.message?.includes('CORS');
    
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
      
      // Try a different API URL
      const newUrl = tryNextApiUrl();
      console.log(`Retrying request with new API URL: ${newUrl} (Attempt ${originalRequest._retryCount})`);
      
      // Update the baseURL for this request
      originalRequest.baseURL = newUrl;
      
      // Add headers that might help with CORS
      originalRequest.headers = {
        ...originalRequest.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      // Disable credentials to avoid CORS preflight
      originalRequest.withCredentials = false;
      
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