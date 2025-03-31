import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const token = localStorage.getItem('auth_token');

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  // If no token exists, redirect to login immediately
  if (!token) {
    console.log("No auth token found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Render child routes if authenticated
  console.log("User authenticated, rendering protected route");
  return <Outlet />;
};

export default PrivateRoute;