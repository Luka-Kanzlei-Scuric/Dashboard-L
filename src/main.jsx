import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// HashRouter verwenden statt BrowserRouter für bessere Kompatibilität mit
// statischen Hosting-Diensten wie Render.com und Vercel
// HashRouter verwendet URLs wie /#/route anstelle von /route
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);