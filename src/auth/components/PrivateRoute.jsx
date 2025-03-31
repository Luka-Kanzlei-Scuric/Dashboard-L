import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const token = localStorage.getItem('auth_token');
  
  // Flexible authentication for development/testing
  // For now, we'll allow access even if authentication is still loading
  // to prevent immediate redirect
  const isLoading = loading && token;
  
  // Display temporary bypass option during development
  const bypassAuth = () => {
    console.log("DEVELOPMENT: Bypassing authentication for testing");
    localStorage.setItem('auth_bypass', 'true');
    window.location.reload();
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-900 mb-4"></div>
        <p className="text-gray-600 mb-4">Authentifizierung wird überprüft...</p>
      </div>
    );
  }

  // For development only - temporary bypass
  const bypassEnabled = localStorage.getItem('auth_bypass') === 'true';
  
  // If auth check is complete and no user is found and bypass is not enabled, redirect to login
  if (!isLoading && !isAuthenticated && !token && !bypassEnabled) {
    console.log("No auth token found, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  // If auth check is complete and auth failed and bypass is not enabled, redirect to login
  if (!isLoading && !isAuthenticated && !bypassEnabled) {
    console.log("Auth check completed but failed, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Render child routes if authenticated or bypassed
  console.log(user ? "User authenticated, rendering protected route" : "BYPASSED AUTH: Rendering protected route");
  return <Outlet />;
};

export default PrivateRoute;