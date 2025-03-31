import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on page load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Set auth token in axios defaults
        axios.defaults.headers.common['x-auth-token'] = token;
        
        // Get current user data
        const res = await axios.get(`${API_BASE_URL}/auth/me`);
        
        setUser(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Auth check error:', err);
        
        // Clear token if invalid
        localStorage.removeItem('auth_token');
        delete axios.defaults.headers.common['x-auth-token'];
        
        setError('Authentifizierung fehlgeschlagen. Bitte erneut anmelden.');
        setUser(null);
        setLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = res.data;
      
      // Save token to localStorage
      localStorage.setItem('auth_token', token);
      
      // Set token in axios defaults
      axios.defaults.headers.common['x-auth-token'] = token;
      
      setUser(user);
      setLoading(false);
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Anmeldung fehlgeschlagen');
      setLoading(false);
      return false;
    }
  };

  // Register user (admin only)
  const registerUser = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      setLoading(false);
      return res.data;
    } catch (err) {
      console.error('Register error:', err);
      setError(err.response?.data?.message || 'Registrierung fehlgeschlagen');
      setLoading(false);
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('auth_token');
    
    // Remove token from axios defaults
    delete axios.defaults.headers.common['x-auth-token'];
    
    // Clear user state
    setUser(null);
  };

  // Update user axios config on token change
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
    }
  }, [user]);

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.put(`${API_BASE_URL}/auth/profile`, profileData);
      
      const { token, user: updatedUser } = res.data;
      
      // Update token in localStorage
      localStorage.setItem('auth_token', token);
      
      // Update token in axios defaults
      axios.defaults.headers.common['x-auth-token'] = token;
      
      setUser(updatedUser);
      setLoading(false);
      
      return true;
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.message || 'Fehler beim Aktualisieren des Profils');
      setLoading(false);
      return false;
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.put(`${API_BASE_URL}/auth/change-password`, passwordData);
      
      setLoading(false);
      return { success: true, message: res.data.message };
    } catch (err) {
      console.error('Change password error:', err);
      setError(err.response?.data?.message || 'Fehler beim Ändern des Passworts');
      setLoading(false);
      return { success: false, message: err.response?.data?.message || 'Fehler beim Ändern des Passworts' };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    registerUser,
    updateProfile,
    changePassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;