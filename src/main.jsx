import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Only remove console logs in production, keep them in development for debugging
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  // Keep console.warn and console.error for debugging critical issues
} else {
  console.log('Running in development mode - logs are enabled');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode is kept for better debugging in development, but doesn't affect production
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);