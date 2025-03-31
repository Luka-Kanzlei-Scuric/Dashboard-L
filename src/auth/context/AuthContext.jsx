import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import api, { API_BASE_URL } from '../../config/api';

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
        // Check for bypass first
        if (localStorage.getItem('auth_bypass') === 'true') {
          console.log('Development bypass is active - skipping authentication');
          // Create a minimal mock user for the UI
          setUser({
            name: 'Development User',
            email: 'dev@example.com',
            role: 'admin'
          });
          setLoading(false);
          return;
        }
        
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          console.log('No token found in localStorage');
          setLoading(false);
          return;
        }
        
        // Set auth token in axios defaults and api instance
        axios.defaults.headers.common['x-auth-token'] = token;
        api.defaults.headers.common['x-auth-token'] = token;

        // Try multiple endpoints to find a working one
        let userData = null;
        let authError = null;
        
        try {
          // Try the optimized API first
          console.log('Trying to authenticate with api instance...');
          const apiRes = await api.get(`/auth/me`);
          userData = apiRes.data;
          console.log('Authentication successful with api instance');
        } catch (apiError) {
          console.log('Failed to authenticate with api instance:', apiError.message);
          authError = apiError;
          
          // Try with absolute URLs
          const backendUrls = [
            'https://dashboard-l-backend.onrender.com/api/auth/me',
            'https://scuric-dashboard-backend.onrender.com/api/auth/me',
            'http://localhost:5000/api/auth/me'
          ];
          
          for (const url of backendUrls) {
            try {
              console.log(`Trying to authenticate with ${url}...`);
              const fallbackRes = await axios.get(url, {
                headers: {
                  'x-auth-token': token,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              });
              userData = fallbackRes.data;
              console.log(`Authentication successful with ${url}`);
              break;
            } catch (fallbackError) {
              console.log(`Failed to authenticate with ${url}:`, fallbackError.message);
            }
          }
        }
        
        if (userData) {
          setUser(userData);
          setLoading(false);
        } else {
          throw authError || new Error('Failed to authenticate with any endpoint');
        }
      } catch (err) {
        console.error('Auth check error:', err);
        
        // Check if server is returning 404 (endpoints don't exist yet)
        // In production, we'll be stricter, but during initial deployment 
        // we'll allow access with the token even if the endpoints aren't ready
        const is404Error = err.response?.status === 404;
        
        if (is404Error) {
          console.log('Auth endpoints not available yet - using token-based auth temporarily');
          // Create a temporary user based on the token to allow access
          try {
            // Try to decode the JWT token to at least get some user info
            const tokenParts = localStorage.getItem('auth_token').split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log('Extracted payload from token:', payload);
              
              setUser({
                id: payload.id || 'temp-id',
                email: payload.email || 'admin@scuric.de',
                name: 'Temporärer Benutzer',
                role: payload.role || 'admin'
              });
              
              setLoading(false);
              return;
            }
          } catch (tokenError) {
            console.error('Error extracting data from token:', tokenError);
          }
        }
        
        // Only clear token if it's definitely invalid (not just server issues)
        if (!is404Error) {
          localStorage.removeItem('auth_token');
          delete axios.defaults.headers.common['x-auth-token'];
          delete api.defaults.headers.common['x-auth-token'];
        }
        
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
      console.log('Attempting login with email:', email);
      
      // Try multiple endpoints for login
      let loginResult = null;
      
      // Try the API instance first
      try {
        console.log('Trying to login with api instance...');
        const apiRes = await api.post(`/auth/login`, { email, password });
        loginResult = apiRes.data;
        console.log('Login successful with api instance');
      } catch (apiError) {
        console.log('Failed to login with api instance:', apiError.message);
        
        // Try with absolute URLs
        const backendUrls = [
          'https://dashboard-l-backend.onrender.com/api/auth/login',
          'https://scuric-dashboard-backend.onrender.com/api/auth/login',
          'http://localhost:5000/api/auth/login'
        ];
        
        for (const url of backendUrls) {
          try {
            console.log(`Trying to login with ${url}...`);
            const fallbackRes = await axios.post(url, 
              { email, password },
              {
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              }
            );
            loginResult = fallbackRes.data;
            console.log(`Login successful with ${url}`);
            break;
          } catch (fallbackError) {
            console.log(`Failed to login with ${url}:`, fallbackError.message);
          }
        }
      }
      
      if (!loginResult) {
        throw new Error('Failed to login with any endpoint');
      }
      
      const { token, user } = loginResult;
      
      // Save token to localStorage
      localStorage.setItem('auth_token', token);
      
      // Set token in axios defaults and api instance
      axios.defaults.headers.common['x-auth-token'] = token;
      api.defaults.headers.common['x-auth-token'] = token;
      
      setUser(user);
      setLoading(false);
      
      console.log('Login completed successfully');
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
      
      // Try with API first
      try {
        const apiRes = await api.put(`/auth/profile`, profileData);
        const { token, user: updatedUser } = apiRes.data;
        
        // Update token in localStorage
        localStorage.setItem('auth_token', token);
        
        // Update token in axios defaults and api instance
        axios.defaults.headers.common['x-auth-token'] = token;
        api.defaults.headers.common['x-auth-token'] = token;
        
        setUser(updatedUser);
        setLoading(false);
        
        return true;
      } catch (apiError) {
        console.log('Failed to update profile with api instance:', apiError.message);
        
        // Try with absolute URLs
        const backendUrls = [
          'https://dashboard-l-backend.onrender.com/api/auth/profile',
          'https://scuric-dashboard-backend.onrender.com/api/auth/profile',
          'http://localhost:5000/api/auth/profile'
        ];
        
        for (const url of backendUrls) {
          try {
            const fallbackRes = await axios.put(url, 
              profileData,
              {
                headers: {
                  'x-auth-token': localStorage.getItem('auth_token'),
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              }
            );
            
            const { token, user: updatedUser } = fallbackRes.data;
            
            // Update token in localStorage
            localStorage.setItem('auth_token', token);
            
            // Update token in axios defaults and api instance
            axios.defaults.headers.common['x-auth-token'] = token;
            api.defaults.headers.common['x-auth-token'] = token;
            
            setUser(updatedUser);
            setLoading(false);
            
            return true;
          } catch (fallbackError) {
            console.log(`Failed to update profile with ${url}:`, fallbackError.message);
          }
        }
      }
      
      throw new Error('Failed to update profile with any endpoint');
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
      
      // Try with API first
      try {
        const apiRes = await api.put(`/auth/change-password`, passwordData);
        setLoading(false);
        return { success: true, message: apiRes.data.message };
      } catch (apiError) {
        console.log('Failed to change password with api instance:', apiError.message);
        
        // Try with absolute URLs
        const backendUrls = [
          'https://dashboard-l-backend.onrender.com/api/auth/change-password',
          'https://scuric-dashboard-backend.onrender.com/api/auth/change-password',
          'http://localhost:5000/api/auth/change-password'
        ];
        
        for (const url of backendUrls) {
          try {
            const fallbackRes = await axios.put(url, 
              passwordData,
              {
                headers: {
                  'x-auth-token': localStorage.getItem('auth_token'),
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              }
            );
            
            setLoading(false);
            return { success: true, message: fallbackRes.data.message };
          } catch (fallbackError) {
            console.log(`Failed to change password with ${url}:`, fallbackError.message);
          }
        }
      }
      
      throw new Error('Failed to change password with any endpoint');
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