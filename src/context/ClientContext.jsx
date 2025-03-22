import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../config/api';

// Sample test data for when API is unavailable
const SAMPLE_DATA = [
  {
    _id: 'sample1',
    name: 'Max Mustermann',
    email: 'max@example.com',
    phone: '+49 123 456789',
    clickupId: 'sample123456',
    status: 'Onboarding',
    lastUpdated: new Date().toISOString()
  },
  {
    _id: 'sample2',
    name: 'Anna Fischer',
    email: 'anna@example.com',
    phone: '+49 123 987654',
    clickupId: 'sample654321',
    status: 'Aktiv',
    lastUpdated: new Date().toISOString()
  }
];

const ClientContext = createContext();

export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [usingSampleData, setUsingSampleData] = useState(false);
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState(null);

  // Reset error state
  const resetError = () => {
    setError(null);
  };

  // Fetch all clients with retry logic
  const fetchClients = useCallback(async (forceRefresh = false) => {
    // Don't fetch if we're already loading, unless forced
    if (loading && !forceRefresh) return;
    
    try {
      setLoading(true);
      resetError();
      
      console.log(`Fetching clients from: ${api.defaults.baseURL} (Attempt ${retryCount + 1})`);
      
      // Set a timeout to detect stuck requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - took too long')), 15000);
      });
      
      // First try the test endpoint to ensure backend is responsive
      try {
        console.log('Testing backend with /api/test-data endpoint');
        await api.get('/test-data', { timeout: 5000 });
        console.log('Test endpoint successful, proceeding with main request');
      } catch (testError) {
        console.error('Test endpoint failed:', testError);
        // Continue with the main request anyway
      }
      
      // Race between the actual request and the timeout
      const response = await Promise.race([
        api.get('/clients'),
        timeoutPromise
      ]);
      
      const { data } = response;
      
      console.log('Received clients data:', data);
      
      if (Array.isArray(data)) {
        // Ensure we have the data for at least 500ms to avoid flickering UI
        const minLoadingTime = 500;
        const loadingStartTime = Date.now();
        const timeElapsed = Date.now() - loadingStartTime;
        
        if (timeElapsed < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - timeElapsed));
        }
        
        setClients(data);
        setUsingSampleData(false);
        setLastSuccessfulFetch(new Date());
        setRetryCount(0); // Reset retry counter on success
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      console.error('Request details:', {
        baseURL: api.defaults.baseURL,
        timeout: err.message.includes('timeout') ? true : false,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data,
        isAxiosError: err.isAxiosError
      });
      
      // Set error message
      setError(err.response?.data?.message || err.message || 'Failed to fetch clients');
      
      // Increment retry counter
      setRetryCount(prev => prev + 1);
      
      // Check if this is a CORS error
      const isCorsError = err.message?.includes('CORS') || 
                          err.message?.includes('Access-Control');
      
      // For CORS errors, try one more time after a short delay
      if (isCorsError && retryCount === 0) {
        console.log('CORS error detected, retrying after delay...');
        setTimeout(() => {
          fetchClients(true);
        }, 2000);
      }
                          
      // After 2 failed attempts, use sample data
      if (retryCount >= 1 && clients.length === 0) {
        console.log('Using sample data after multiple failed attempts');
        setClients(SAMPLE_DATA);
        setUsingSampleData(true);
      }
    } finally {
      // Ensure we don't turn off loading state too quickly
      setTimeout(() => {
        setLoading(false);
      }, 200);
    }
  }, [loading, retryCount, clients.length]);

  // Get a single client by ID
  const getClient = async (id) => {
    try {
      // Try to get from local state first for better UX
      const localClient = clients.find(client => client._id === id);
      if (localClient) {
        return localClient;
      }
      
      // Otherwise fetch from API
      const { data } = await api.get(`/clients/${id}`);
      return data;
    } catch (err) {
      console.error('Error getting client:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to get client');
    }
  };

  // Create a new client
  const createClient = async (clientData) => {
    try {
      if (usingSampleData) {
        // In sample mode, just simulate creation
        const newClient = {
          _id: `sample${Date.now()}`,
          ...clientData,
          lastUpdated: new Date().toISOString()
        };
        setClients(prev => [newClient, ...prev]);
        return newClient;
      }
      
      const { data } = await api.post('/clients', clientData);
      setClients((prevClients) => [data, ...prevClients]);
      return data;
    } catch (err) {
      console.error('Error creating client:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to create client');
    }
  };

  // Update a client
  const updateClient = async (id, clientData) => {
    try {
      if (usingSampleData) {
        // In sample mode, just simulate update
        const updatedClient = {
          ...clients.find(c => c._id === id),
          ...clientData,
          lastUpdated: new Date().toISOString()
        };
        setClients(prev => prev.map(c => c._id === id ? updatedClient : c));
        return updatedClient;
      }
      
      const { data } = await api.put(`/clients/${id}`, clientData);
      setClients((prevClients) =>
        prevClients.map((client) => (client._id === id ? data : client))
      );
      return data;
    } catch (err) {
      console.error('Error updating client:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to update client');
    }
  };

  // Delete a client
  const deleteClient = async (id) => {
    try {
      if (usingSampleData) {
        // In sample mode, just simulate deletion
        setClients(prev => prev.filter(c => c._id !== id));
        return true;
      }
      
      await api.delete(`/clients/${id}`);
      setClients((prevClients) =>
        prevClients.filter((client) => client._id !== id)
      );
      return true;
    } catch (err) {
      console.error('Error deleting client:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to delete client');
    }
  };

  // Initial data fetch when component mounts
  useEffect(() => {
    // Immediately try to fetch data
    fetchClients();
    
    // Also fetch when the backend connection is established
    const handleBackendConnected = () => {
      console.log('Backend connection established, fetching data immediately');
      fetchClients(true);
    };
    
    // Listen for the custom event
    window.addEventListener('backendConnected', handleBackendConnected);
    
    // Clean up
    return () => {
      window.removeEventListener('backendConnected', handleBackendConnected);
    };
  }, [fetchClients]);

  // Refresh data periodically
  useEffect(() => {
    let timeoutId;
    
    const scheduleNextRefresh = () => {
      // If we got data successfully, set a refresh interval
      // If we're using sample data, try to reconnect more frequently
      const refreshInterval = usingSampleData ? 45 * 1000 : 10 * 1000; // Reduce to 10 seconds
      
      // Clear any existing timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      console.log(`Scheduling next data refresh in ${refreshInterval/1000} seconds`);
      
      // Schedule next refresh
      timeoutId = setTimeout(() => {
        // Only refresh if we're not currently loading
        if (!loading) {
          console.log('Executing scheduled data refresh');
          fetchClients(true).catch(err => {
            console.error('Scheduled refresh failed:', err);
          });
        } else {
          console.log('Skipping data refresh - previous request still in progress');
          // Reschedule refresh without making a request
          scheduleNextRefresh();
        }
      }, refreshInterval);
    };
    
    // Start the refresh cycle
    scheduleNextRefresh();
    
    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fetchClients, usingSampleData, loading]);

  return (
    <ClientContext.Provider
      value={{
        clients,
        loading,
        error,
        fetchClients,
        getClient,
        createClient,
        updateClient,
        deleteClient,
        usingSampleData,
        lastSuccessfulFetch,
        resetError
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};

export const useClients = () => {
  return useContext(ClientContext);
};

export default ClientContext;