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
  },
  timeout: 10000, // 10 second timeout
  withCredentials: false // Don't send cookies to avoid CORS issues
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
    await axios.get(`${api.defaults.baseURL}/health`, { timeout: 5000 });
    console.log(`Backend connection successful at ${api.defaults.baseURL}`);
    return true;
  } catch (healthError) {
    try {
      // Then try root endpoint
      await axios.get(api.defaults.baseURL.replace(/\/api$/, ''), { timeout: 5000 });
      console.log(`Backend root connection successful at ${api.defaults.baseURL.replace(/\/api$/, '')}`);
      return true;
    } catch (rootError) {
      try {
        // Finally try CORS test endpoint
        await axios.get(`${api.defaults.baseURL.replace(/\/api$/, '')}/test-cors`, { timeout: 5000 });
        console.log(`Backend CORS test successful at ${api.defaults.baseURL.replace(/\/api$/, '')}/test-cors`);
        return true;
      } catch (corsError) {
        console.error('All backend connection tests failed', {
          healthError,
          rootError,
          corsError
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
    
    // Only retry if it's a network error or 5xx error and we haven't retried this request before
    if ((error.message === 'Network Error' || (error.response && error.response.status >= 500)) && 
        !originalRequest._retry && 
        !originalRequest.url.includes('test-cors')) {
      
      originalRequest._retry = true;
      
      // Try a different API URL
      const newUrl = tryNextApiUrl();
      console.log(`Retrying request with new API URL: ${newUrl}`);
      
      // Update the baseURL for this request
      originalRequest.baseURL = newUrl;
      
      // Retry the request with the new URL
      return api(originalRequest);
    }
    
    // Log errors
    console.error('API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Return the error for handling in components
    return Promise.reject(error);
  }
);

export default api;