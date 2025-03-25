import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EnvelopeIcon, PhoneIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useClients } from '../context/ClientContext';

const ClientCard = ({ client }) => {
  const { deleteClient } = useClients();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!client) {
    console.error('ClientCard received undefined client');
    return null;
  }

  // Safe access to client properties with fallbacks
  const name = client.name || 'Unbekannt';
  const initials = name.split(' ').map(n => n[0] || '').join('');
  
  // Format date safely
  const formattedDate = client.lastUpdated 
    ? new Date(client.lastUpdated).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : 'Unbekannt';
  
  // Safe access to client ID
  const idDisplay = client.clickupId 
    ? `ID: ${client.clickupId.slice(-6)}` 
    : 'Keine ID';

  // Safe status
  const status = client.status || 'Unbekannt';
  
  // Client ID für die Detailansicht
  const clientId = client._id || 'unknown';
  
  // Handle delete client
  const handleDeleteClient = async (e) => {
    e.preventDefault(); // Verhindert die Navigation zur Detailseite
    e.stopPropagation();
    
    if (!client || !client._id) return;
    
    try {
      setIsDeleting(true);
      await deleteClient(client._id);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Fehler beim Löschen des Mandanten:', error);
      setIsDeleting(false);
      alert('Fehler beim Löschen: ' + error.message);
    }
  };

  return (
    <Link 
      to={`/client/${clientId}`}
      className="block bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md border border-neutral-light/40 hover:border-gray-300"
    >
      <div className="px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center text-white font-semibold text-lg">
              {initials}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-primary">{name}</h3>
              <p className="text-sm text-neutral-medium">{idDisplay}</p>
            </div>
          </div>
          <div className="flex space-x-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              status === 'Onboarding' 
                ? 'bg-blue-100 text-blue-800' 
                : status === 'Aktiv' 
                ? 'bg-green-100 text-green-800' 
                : status === 'Wartend' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {status}
            </span>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-neutral-medium">
            <EnvelopeIcon className="flex-shrink-0 h-4 w-4 mr-2" />
            <span className="truncate">{client.email || 'Keine E-Mail'}</span>
          </div>
          <div className="flex items-center text-sm text-neutral-medium">
            <PhoneIcon className="flex-shrink-0 h-4 w-4 mr-2" />
            <span>{client.phone || 'Keine Telefonnummer'}</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-3 bg-neutral-lightest flex items-center justify-between">
        <div className="flex items-center text-sm">
          <ClockIcon className="flex-shrink-0 h-4 w-4 mr-1 text-neutral-medium" />
          <span className="text-neutral-medium">Aktualisiert: {formattedDate}</span>
        </div>
        
        <div className="flex items-center">
          {/* ClickUp-Link */}
          {client.clickupId ? (
            <a 
              href={`https://app.clickup.com/t/${client.clickupId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium text-secondary hover:text-secondary-light transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              In ClickUp öffnen
            </a>
          ) : (
            <span className="text-sm text-gray-400">Kein ClickUp-Link</span>
          )}
        </div>
      </div>
      
      {/* Modal-Overlay */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowDeleteConfirm(false);
          }}
        ></div>
      )}
    </Link>
  );
};

export default ClientCard;