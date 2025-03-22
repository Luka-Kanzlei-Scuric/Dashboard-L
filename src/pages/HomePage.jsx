import React, { useState, useEffect } from 'react';
import ClientCard from '../components/ClientCard';
import { UserPlusIcon, ArrowsUpDownIcon, ChevronDownIcon, ExclamationTriangleIcon, ArrowPathIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useClients } from '../context/ClientContext';

const HomePage = () => {
  const [sortOption, setSortOption] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [retryInProgress, setRetryInProgress] = useState(false);
  const { 
    clients, 
    loading, 
    error, 
    fetchClients, 
    usingSampleData, 
    lastSuccessfulFetch,
    resetError
  } = useClients();

  // Debug output - reduced to minimize console spam
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // Only log changes in data state, not every render
      const clientCount = Array.isArray(clients) ? clients.length : 0;
      console.log(`HomePage state: ${clientCount} clients, loading=${loading}, error=${!!error}, sampleData=${usingSampleData}`);
    }
  }, [clients.length, loading, error, usingSampleData]);

  // Force manual retry with loading indicator
  const handleRetry = async () => {
    setRetryInProgress(true);
    resetError();
    await fetchClients(true);
    setTimeout(() => setRetryInProgress(false), 1000);
  };
  
  // Immediate data fetch on first mount to reduce initial wait time
  useEffect(() => {
    // Check if we need to fetch data (no clients or error)
    if (clients.length === 0 || error) {
      console.log('Triggering immediate data fetch on page load');
      fetchClients(true);
    }
  }, []);

  // Safely sort clients
  const sortedClients = Array.isArray(clients) ? [...clients].sort((a, b) => {
    try {
      if (sortOption === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortOption === 'status') {
        return (a.status || '').localeCompare(b.status || '');
      } else if (sortOption === 'recent') {
        const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0);
        const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0);
        return dateB - dateA;
      }
      return 0;
    } catch (err) {
      console.error('Error sorting clients:', err);
      return 0;
    }
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
          {usingSampleData && (
            <div className="ml-3 flex items-center">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <InformationCircleIcon className="w-4 h-4 mr-1" />
                Demo-Modus
              </span>
            </div>
          )}
        </div>
        <button 
          disabled
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-neutral-medium opacity-60 cursor-not-allowed transition-colors duration-200"
          title="Diese Funktion ist noch nicht verfügbar"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Neuer Mandant
        </button>
      </div>
      
      {usingSampleData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium">Das Dashboard verwendet aktuell Beispieldaten.</p>
            <p className="mt-1">Es konnte keine Verbindung zum Backend-Server hergestellt werden. Die Anzeige wird automatisch aktualisiert, sobald die Verbindung wiederhergestellt ist.</p>
          </div>
          <button 
            onClick={handleRetry}
            disabled={retryInProgress || loading}
            className="ml-4 flex-shrink-0 inline-flex items-center px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-amber-800 text-sm font-medium hover:bg-amber-100 transition-colors"
          >
            {retryInProgress || loading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                Verbinde...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                Verbindung prüfen
              </>
            )}
          </button>
        </div>
      )}

      {error && !usingSampleData && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium">Fehler beim Laden der Mandanten</p>
            <p className="mt-1">{error}</p>
          </div>
          <button 
            onClick={handleRetry}
            disabled={retryInProgress || loading}
            className="ml-4 flex-shrink-0 inline-flex items-center px-3 py-1.5 bg-white border border-red-300 rounded-lg text-red-800 text-sm font-medium hover:bg-red-100 transition-colors"
          >
            {retryInProgress || loading ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                Erneut laden...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                Erneut versuchen
              </>
            )}
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'grid' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-neutral-medium hover:text-primary'
            }`}
            onClick={() => setViewMode('grid')}
          >
            Kacheln
          </button>
          <button 
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-neutral-medium hover:text-primary'
            }`}
            onClick={() => setViewMode('list')}
          >
            Liste
          </button>
        </div>

        <div className="relative">
          <button 
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-neutral-dark bg-white rounded-lg shadow-sm focus:outline-none"
            onClick={() => {
              setSortOption(
                sortOption === 'name' 
                  ? 'status' 
                  : sortOption === 'status' 
                  ? 'recent' 
                  : 'name'
              );
            }}
          >
            <ArrowsUpDownIcon className="h-4 w-4 mr-1.5" />
            <span>
              {sortOption === 'name' 
                ? 'Name' 
                : sortOption === 'status' 
                ? 'Status' 
                : 'Neueste'
              }
            </span>
            <ChevronDownIcon className="h-4 w-4 ml-1.5" />
          </button>
        </div>
      </div>

      {loading && !usingSampleData ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-secondary"></div>
        </div>
      ) : sortedClients.length === 0 && !usingSampleData ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-700 mb-2">Keine Mandanten gefunden</p>
          <p className="text-blue-600 text-sm">Neue Mandanten aus ClickUp werden alle 15 Minuten synchronisiert.</p>
        </div>
      ) : (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-5`}>
          {sortedClients.map(client => (
            <ClientCard key={client._id} client={client} />
          ))}
        </div>
      )}
      
      {lastSuccessfulFetch && !usingSampleData && (
        <div className="text-xs text-neutral-medium text-center pt-4 pb-2">
          Zuletzt aktualisiert: {new Date(lastSuccessfulFetch).toLocaleString('de-DE')}
        </div>
      )}
    </div>
  );
};

export default HomePage;