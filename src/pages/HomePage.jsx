import React, { useState } from 'react';
import ClientCard from '../components/ClientCard';
import { UserPlusIcon, ArrowsUpDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useClients } from '../context/ClientContext';

const HomePage = () => {
  const [sortOption, setSortOption] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const { clients, loading, error } = useClients();

  // Sort clients based on selected option
  const sortedClients = [...(clients || [])].sort((a, b) => {
    if (sortOption === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortOption === 'status') {
      return a.status.localeCompare(b.status);
    } else if (sortOption === 'recent') {
      return new Date(b.lastUpdated) - new Date(a.lastUpdated);
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
        <button 
          disabled
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-neutral-medium opacity-60 cursor-not-allowed transition-colors duration-200"
          title="Diese Funktion ist noch nicht verfügbar"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Neuer Mandant
        </button>
      </div>

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

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-secondary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Fehler beim Laden der Mandanten: {error}
        </div>
      ) : sortedClients.length === 0 ? (
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
    </div>
  );
};

export default HomePage;