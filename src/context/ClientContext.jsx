import { createContext, useState, useEffect, useContext } from 'react';
import api from '../config/api';

const ClientContext = createContext();

export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      console.log('Fetching clients from:', api.defaults.baseURL);
      const { data } = await api.get('/clients');
      console.log('Received clients data:', data);
      setClients(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch clients');
      setLoading(false);
    }
  };

  // Get a single client by ID
  const getClient = async (id) => {
    try {
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

  useEffect(() => {
    fetchClients();

    // Refresh client data every 2 minutes
    const interval = setInterval(() => {
      fetchClients();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

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
        deleteClient
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