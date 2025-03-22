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
      
      const { data } = await api.get('/clients');
      
      console.log('Received clients data:', data);
      
      if (Array.isArray(data)) {
        setClients(data);
        setUsingSampleData(false);
        setLastSuccessfulFetch(new Date());
        setRetryCount(0); // Reset retry counter on success
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      
      // Set error message
      setError(err.response?.data?.message || err.message || 'Failed to fetch clients');
      
      // Increment retry counter
      setRetryCount(prev => prev + 1);
      
      // After 3 failed attempts, use sample data
      if (retryCount >= 2 && clients.length === 0) {
        console.log('Using sample data after multiple failed attempts');
        setClients(SAMPLE_DATA);
        setUsingSampleData(true);
      }
    } finally {
      setLoading(false);
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

  // Initial data fetch
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Refresh data periodically
  useEffect(() => {
    // If using sample data, try to reconnect more frequently
    const interval = setInterval(() => {
      fetchClients(true);
    }, usingSampleData ? 30 * 1000 : 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchClients, usingSampleData]);

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