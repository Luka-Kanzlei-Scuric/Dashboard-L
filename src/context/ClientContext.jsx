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
    lastUpdated: new Date().toISOString(),
    label: 'gläubigeranfrage & re'  // Beispiel für einen Mandanten mit Gläubigeranfrage-Status
  },
  {
    _id: 'sample2',
    name: 'Anna Fischer',
    email: 'anna@example.com',
    phone: '+49 123 987654',
    clickupId: 'sample654321',
    status: 'Aktiv',
    lastUpdated: new Date().toISOString()
  },
  {
    _id: 'sample3',
    name: 'Stefan Müller',
    email: 'stefan@example.com',
    phone: '+49 123 555444',
    clickupId: 'sample789012',
    status: 'Onboarding',
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

  // Hilfsfunktion zur Synchronisierung der Labels mit den Phasen
  const synchronizeLabelsWithPhases = (clientsList) => {
    if (!Array.isArray(clientsList)) return clientsList;
    
    return clientsList.map(client => {
      if (!client) return client;
      
      // Kopiere den Client, um die Originalreferenz nicht zu verändern
      const updatedClient = { ...client };
      
      // Synchronisiere Label basierend auf der Phase
      if (updatedClient.currentPhase) {
        if (updatedClient.currentPhase >= 3 && (!updatedClient.label || !updatedClient.label.toLowerCase().includes("gläubigeranfrage"))) {
          // Wenn Phase 3 oder höher, setze "gläubigeranfrage & re" (blau)
          console.log(`Synchronisiere Dashboard-Label für Client ${updatedClient.name} in Phase ${updatedClient.currentPhase}`);
          updatedClient.label = "gläubigeranfrage & re";
        } else if (updatedClient.currentPhase === 2 && (!updatedClient.label || updatedClient.label.toLowerCase().includes("gläubigeranfrage"))) {
          // Wenn Phase 2, setze "rechnung offen" (rot)
          console.log(`Synchronisiere Dashboard-Label für Client ${updatedClient.name} in Phase ${updatedClient.currentPhase}`);
          updatedClient.label = "rechnung offen";
        }
      }
      
      return updatedClient;
    });
  };

  // Fetch all clients with retry logic
  const fetchClients = useCallback(async (forceRefresh = false, backgroundRefresh = false) => {
    // Don't fetch if we're already loading, unless forced
    if (loading && !forceRefresh) return;
    
    // Track if this is a background refresh (don't show loading if we have data)
    const isBackgroundRefresh = backgroundRefresh || clients.length > 0;
    
    try {
      // Only set loading state if we don't have data yet or it's forced
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
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
        
        // Synchronisiere Labels vor dem Speichern der Daten
        const synchronizedData = synchronizeLabelsWithPhases(data);
        
        setClients(synchronizedData);
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
        // Synchronisiere Labels für die Sample-Daten
        const synchronizedSampleData = synchronizeLabelsWithPhases(SAMPLE_DATA);
        setClients(synchronizedSampleData);
        setUsingSampleData(true);
      }
    } finally {
      // Ensure we don't turn off loading state too quickly, but only if we're not doing background refresh
      if (!isBackgroundRefresh) {
        setTimeout(() => {
          setLoading(false);
        }, 200);
      }
    }
  }, [loading, retryCount, clients.length]);

  // Get a single client by ID
  const getClient = async (id) => {
    try {
      // Try to get from local state first for better UX
      const localClient = clients.find(client => client._id === id);
      if (localClient) {
        // Synchronisiere die Labels basierend auf der Phase des Clients
        if (localClient.currentPhase) {
          if (localClient.currentPhase >= 3 && (!localClient.label || !localClient.label.toLowerCase().includes("gläubigeranfrage"))) {
            // Wenn der Client in Phase 3 oder höher ist, aber nicht das richtige Label hat
            console.log(`Synchronisiere Label für Client in Phase ${localClient.currentPhase}`);
            localClient.label = "gläubigeranfrage & re";
          } else if (localClient.currentPhase === 2 && (!localClient.label || localClient.label.toLowerCase().includes("gläubigeranfrage"))) {
            // Wenn der Client in Phase 2 ist, aber nicht das richtige Label hat
            console.log(`Synchronisiere Label für Client in Phase ${localClient.currentPhase}`);
            localClient.label = "rechnung offen";
          }
        }
        return localClient;
      }
      
      // Otherwise fetch from API
      const { data } = await api.get(`/clients/${id}`);
      
      // Synchronisiere die Labels basierend auf der Phase des Clients
      if (data && data.currentPhase) {
        if (data.currentPhase >= 3 && (!data.label || !data.label.toLowerCase().includes("gläubigeranfrage"))) {
          // Wenn der Client in Phase 3 oder höher ist, aber nicht das richtige Label hat
          console.log(`Synchronisiere Label für Client in Phase ${data.currentPhase}`);
          data.label = "gläubigeranfrage & re";
        } else if (data.currentPhase === 2 && (!data.label || data.label.toLowerCase().includes("gläubigeranfrage"))) {
          // Wenn der Client in Phase 2 ist, aber nicht das richtige Label hat
          console.log(`Synchronisiere Label für Client in Phase ${data.currentPhase}`);
          data.label = "rechnung offen";
        }
      }
      
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
      // First load should not be a background refresh
      fetchClients(true, false);
    };
    
    // Listen for the custom event
    window.addEventListener('backendConnected', handleBackendConnected);
    
    // Clean up
    return () => {
      window.removeEventListener('backendConnected', handleBackendConnected);
    };
  }, [fetchClients]);

  // Refresh data periodically, but with a much longer interval
  useEffect(() => {
    let timeoutId;
    
    const scheduleNextRefresh = () => {
      // Verwende ein viel längeres Intervall, um den Server zu entlasten
      // Nutze 5 Minuten für normale Daten und 2 Minuten bei Sample-Daten
      const refreshInterval = usingSampleData ? 120 * 1000 : 300 * 1000; // 2-5 Minuten
      
      // Clear any existing timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      console.log(`Scheduling next data refresh in ${refreshInterval/1000} seconds`);
      
      // Schedule next refresh
      timeoutId = setTimeout(() => {
        // Only refresh if we're not currently loading
        if (!loading) {
          console.log('Executing scheduled data refresh in background');
          // Use backgroundRefresh=true to avoid showing loading state when we already have data
          fetchClients(true, true).catch(err => {
            console.error('Scheduled refresh failed:', err);
            // Retry after 30 seconds if failed
            setTimeout(scheduleNextRefresh, 30000);
          });
        } else {
          console.log('Skipping data refresh - previous request still in progress');
          // Reschedule refresh without making a request, but with a delay
          setTimeout(scheduleNextRefresh, 30000);
        }
      }, refreshInterval);
    };
    
    // Starte den Refresh-Zyklus, aber nur wenn wir in der Übersicht sind
    // In der Detailansicht benötigen wir keinen automatischen Refresh
    if (window.location.pathname === '/') {
      scheduleNextRefresh();
    }
    
    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fetchClients, usingSampleData, loading]);

  // Send invoice email to client
  const sendInvoiceEmail = async (clientId, invoiceData) => {
    try {
      // Holen Sie den Client, um Ihre Daten zu bekommen
      const client = clients.find(c => c._id === clientId) || await getClient(clientId);
      
      // Rufen Sie direkt den Welcome-Email mit Rechnung-Service auf
      const response = await api.post(`/clients/${clientId}/email/welcome`, { 
        invoiceData,
        invoiceFilePath: invoiceData.filePath // Übergeben Sie den Dateipfad an den Server
      });
      
      // Aktualisieren Sie den Client-Status
      const updatedClient = await updateClient(clientId, { 
        emailSent: true,
        // Wenn Client in Phase 1 ist, wechseln Sie zu Phase 2
        currentPhase: 2 
      });
      
      return response.data;
    } catch (err) {
      console.error('Error sending invoice email:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to send invoice email');
    }
  };

  // Request documents from client
  const requestDocuments = async (clientId, documentType) => {
    try {
      const response = await api.post(`/clients/${clientId}/request-documents`, { 
        documentType 
      });
      
      // Update client in state to reflect that documents were requested
      const client = clients.find(c => c._id === clientId);
      if (client && !client.emailSent) {
        await updateClient(clientId, { 
          emailSent: true,
          // If client is in phase 1, move to phase 2
          currentPhase: client.currentPhase === 1 ? 2 : client.currentPhase
        });
      }
      
      return response.data;
    } catch (err) {
      console.error('Error requesting documents:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to request documents');
    }
  };
  
  // Send welcome email with portal details to client
  const sendWelcomeEmail = async (clientId) => {
    try {
      const response = await api.post(`/clients/${clientId}/email/welcome`);
      
      // Update client in state to reflect that email has been sent
      const client = clients.find(c => c._id === clientId);
      if (client) {
        await updateClient(clientId, { 
          emailSent: true,
          // If client is in phase 1, move to phase 2
          currentPhase: client.currentPhase === 1 ? 2 : client.currentPhase
        });
      }
      
      return response.data;
    } catch (err) {
      console.error('Error sending welcome email:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to send welcome email');
    }
  };
  
  // Mark client documents as uploaded
  const markDocumentsUploaded = async (clientId) => {
    try {
      const client = await updateClient(clientId, { 
        documentsUploaded: true,
        // Update phase if applicable
        currentPhase: 3 
      });
      return client;
    } catch (err) {
      console.error('Error marking documents as uploaded:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to mark documents as uploaded');
    }
  };
  
  // Mark first payment as received
  const markPaymentReceived = async (clientId) => {
    try {
      const client = await updateClient(clientId, { 
        firstPaymentReceived: true,
        status: 'Aktiv',
        // Update phase if applicable
        currentPhase: 3 
      });
      return client;
    } catch (err) {
      console.error('Error marking payment as received:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to mark payment as received');
    }
  };

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
        resetError,
        sendInvoiceEmail,
        requestDocuments,
        sendWelcomeEmail,
        markDocumentsUploaded,
        markPaymentReceived
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