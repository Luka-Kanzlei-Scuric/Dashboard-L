import axios from 'axios';

// API base URLs based on environment
const API_URL = 
  import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://scuric-dashboard-backend.onrender.com/api' // Aktualisierte Render-Backend-URL
    : 'http://localhost:5000/api');

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Log errors to console in development
    if (import.meta.env.DEV) {
      console.error('API Error:', error.response || error);
    }
    
    // Return the error for handling in components
    return Promise.reject(error);
  }
);

export default api;