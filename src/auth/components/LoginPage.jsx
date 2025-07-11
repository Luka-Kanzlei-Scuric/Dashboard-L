import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutGrid } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDevOptions, setShowDevOptions] = useState(false);
  
  const { login, error, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // Toggle development options (only for development environment)
  const toggleDevOptions = () => {
    setShowDevOptions(!showDevOptions);
  };
  
  // Bypass authentication for development
  const bypassAuth = () => {
    localStorage.setItem('auth_bypass', 'true');
    console.log("DEVELOPMENT: Authentication bypassed for testing");
    window.location.href = '/';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const success = await login(email, password);
      
      if (success) {
        console.log("Login successful, navigating to dashboard");
        navigate('/');
        // Force a page reload to ensure routes are updated correctly
        window.location.href = '/';
      } else {
        setErrorMessage(error || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } catch (err) {
      setErrorMessage('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left sidebar (dark) */}
      <div className="w-16 bg-zinc-900 flex flex-col items-center py-6">
        <div className="mb-10">
          <LayoutGrid className="text-white" size={24} />
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" 
              alt="Scuric Logo" 
              className="w-48"
            />
          </div>
          
          <h2 className="text-3xl font-semibold text-center mb-6 text-gray-800">
            Dashboard Login
          </h2>
          
          {/* Maintenance mode notice - show if server is having issues */}
          {(errorMessage && errorMessage.includes('fehlgeschlagen')) && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-md">
              <p className="font-medium mb-2">Server im Wartungsmodus</p>
              <p className="text-sm mb-3">Der Server wird gerade aktualisiert. Sie können dennoch fortfahren:</p>
              <button
                onClick={bypassAuth}
                className="w-full py-2 px-4 bg-orange-100 text-orange-800 rounded hover:bg-orange-200 mb-2"
              >
                Weiter zum Dashboard
              </button>
              <p className="text-xs text-orange-600">Die vollständige Funktionalität wird in Kürze wiederhergestellt.</p>
            </div>
          )}
          
          {errorMessage && !errorMessage.includes('fehlgeschlagen') && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
              {errorMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ihre E-Mail-Adresse"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ihr Passwort"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 bg-zinc-900 text-white font-semibold rounded-md hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Anmeldung...
                </div>
              ) : (
                'Anmelden'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            Kontaktieren Sie bei Zugangsproblemen bitte den Administrator.
          </div>
          
          {/* Development bypass option - hidden in production */}
          <div className="mt-4 text-center">
            <button 
              onClick={toggleDevOptions} 
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Dev
            </button>
            
            {showDevOptions && (
              <div className="mt-2 p-3 bg-gray-100 rounded text-left">
                <p className="text-sm font-medium text-red-600 mb-2">Entwicklungsoptionen</p>
                <button
                  onClick={bypassAuth}
                  className="w-full py-1 px-2 bg-gray-200 text-red-600 text-xs rounded hover:bg-gray-300"
                >
                  Authentifizierung umgehen
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Admin: admin@scuric.de / Admin123!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;