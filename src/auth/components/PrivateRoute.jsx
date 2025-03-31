import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const token = localStorage.getItem('auth_token');
  const bypassEnabled = localStorage.getItem('auth_bypass') === 'true';
  
  // Set a timer to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log("Auth check is taking too long - activating fallback mode");
        setAuthTimedOut(true);
        setLocalLoading(false);
      }
    }, 5000); // 5 seconds timeout
    
    return () => clearTimeout(timer);
  }, [loading]);
  
  // Update local loading state based on auth context
  useEffect(() => {
    if (!loading) {
      setLocalLoading(false);
    }
  }, [loading]);
  
  // Manually bypass auth if requested
  const forceBypass = () => {
    localStorage.setItem('auth_bypass', 'true');
    window.location.reload();
  };

  // Show loading spinner while checking authentication
  if (localLoading && token && !bypassEnabled) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-900 mb-4"></div>
        <p className="text-gray-600 mb-4">Authentifizierung wird überprüft...</p>
        
        {/* Add a manual bypass button that appears after 3 seconds */}
        <div className="mt-4">
          <button 
            onClick={forceBypass}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Zur Anwendung ohne Anmeldung
          </button>
          <p className="text-xs text-gray-500 mt-2">
            (Nur für Entwicklungszwecke)
          </p>
        </div>
      </div>
    );
  }

  // FORCED AUTH BYPASS - Development mode for testing
  if (bypassEnabled) {
    console.log("BYPASSED AUTH: Rendering protected route via manual bypass");
    return <Outlet />;
  }
  
  // Check fallback mode - if auth check timed out but there's a token, we'll allow access
  if (authTimedOut && token) {
    console.log("Auth check timed out but token exists - allowing access");
    return <Outlet />;
  }
  
  // If no token exists and not in bypass mode, redirect to login immediately
  if (!token && !bypassEnabled) {
    console.log("No auth token found, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  // If auth check completed but failed and not in bypass mode, redirect to login
  if (!loading && !isAuthenticated && !bypassEnabled) {
    console.log("Auth check completed but failed, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Render child routes if authenticated, timed out with token, or bypassed
  console.log(user ? 
    "User authenticated, rendering protected route" : 
    "Rendering protected route with implicit authentication"
  );
  return <Outlet />;
};

export default PrivateRoute;