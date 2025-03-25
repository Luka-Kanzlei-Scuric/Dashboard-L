import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import App from './App';
import './index.css';

// Komponente für Weiterleitungshandling von 404-Seite
const RedirectHandler = ({ children }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Prüfe, ob eine Weiterleitung aus der 404-Seite vorliegt
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
      // Entferne die gespeicherte Weiterleitung
      sessionStorage.removeItem('redirect');
      
      // Navigiere zum gespeicherten Pfad
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