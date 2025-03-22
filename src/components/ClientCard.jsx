import React from 'react';
import { EnvelopeIcon, PhoneIcon, ClockIcon } from '@heroicons/react/24/outline';

const ClientCard = ({ client }) => {
  const initials = client.name.split(' ').map(n => n[0]).join('');
  const formattedDate = new Date(client.lastUpdated).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md border border-neutral-light/40">
      <div className="px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center text-white font-semibold text-lg">
              {initials}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-primary">{client.name}</h3>
              <p className="text-sm text-neutral-medium">ID: {client.clickupId.slice(-6)}</p>
            </div>
          </div>
          <div className="flex space-x-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              client.status === 'Onboarding' 
                ? 'bg-blue-100 text-blue-800' 
                : client.status === 'Aktiv' 
                ? 'bg-green-100 text-green-800' 
                : client.status === 'Wartend' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {client.status}
            </span>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-neutral-medium">
            <EnvelopeIcon className="flex-shrink-0 h-4 w-4 mr-2" />
            <span className="truncate">{client.email}</span>
          </div>
          <div className="flex items-center text-sm text-neutral-medium">
            <PhoneIcon className="flex-shrink-0 h-4 w-4 mr-2" />
            <span>{client.phone}</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-3 bg-neutral-lightest flex items-center justify-between">
        <div className="flex items-center text-sm">
          <ClockIcon className="flex-shrink-0 h-4 w-4 mr-1 text-neutral-medium" />
          <span className="text-neutral-medium">Aktualisiert: {formattedDate}</span>
        </div>
        
        <a 
          href={`https://app.clickup.com/t/${client.clickupId}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm font-medium text-secondary hover:text-secondary-light transition-colors"
        >
          In ClickUp öffnen
        </a>
      </div>
    </div>
  );
};

export default ClientCard;