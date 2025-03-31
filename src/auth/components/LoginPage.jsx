import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { login, error } = useAuth();
  const navigate = useNavigate();

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
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
        
        {errorMessage && (
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900"
              placeholder="Ihr Passwort"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 bg-blue-900 text-white font-semibold rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 ${
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
      </div>
      
      <div className="mt-8 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Kanzlei Scuric. Alle Rechte vorbehalten.
      </div>
    </div>
  );
};

export default LoginPage;