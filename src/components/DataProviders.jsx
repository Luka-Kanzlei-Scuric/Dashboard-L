import React from 'react';
import { Outlet } from 'react-router-dom';
import { useClients } from '../context/ClientContext';

/**
 * This component ensures data is loaded properly as we navigate between pages
 * It connects to the client context and makes sure that data is loaded when needed
 */
const DataProviders = () => {
  const { clients, loading, error, fetchClients } = useClients();

  // Load clients data if needed
  React.useEffect(() => {
    if (clients.length === 0 && !loading && !error) {
      console.log('DataProviders: Loading clients data');
      fetchClients(true);
    }
  }, [clients.length, loading, error, fetchClients]);

  return <Outlet />;
};

export default DataProviders;