import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import App from './App';
import './index.css';

// Redirect handler component for 404 redirects
const RedirectHandler = ({ children }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if there's a redirect stored from 404 page
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
      // Remove the stored redirect
      sessionStorage.removeItem('redirect');
      
      // Navigate to the stored path
      console.log('Redirecting to', redirect);
      navigate(redirect);
    }
  }, [navigate]);
  
  return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <RedirectHandler>
        <App />
      </RedirectHandler>
    </BrowserRouter>
  </React.StrictMode>
);