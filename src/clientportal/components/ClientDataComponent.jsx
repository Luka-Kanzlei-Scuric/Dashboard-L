import React from 'react';
import { EnvelopeIcon, PhoneIcon, UserIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

/**
 * A mobile-optimized read-only client data component with support email button
 * 
 * @param {Object} props Component props
 * @param {Object} props.client Client data object
 */
const ClientDataComponent = ({ client }) => {
  if (!client) return null;
  
  // Handle support email click
  const handleSupportEmail = () => {
    window.location.href = `mailto:support@scuric.de?subject=Support%20Anfrage%20${client.caseNumber || ''}&body=Sehr%20geehrtes%20Team,%0A%0AIch%20benötige%20Unterstützung%20bezüglich%20meines%20Falls.%0A%0AKundennummer:%20${client.caseNumber || 'Nicht bekannt'}%0AName:%20${client.name || ''}%0A%0AMit%20freundlichen%20Grüßen,%0A${client.name || ''}`;
  };
  
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Nicht verfügbar';
    try {
      return new Date(dateString).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Ungültiges Datum';
    }
  };
  
  return (
    <div className="px-4 py-5 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Ihre Daten</h3>
        <button
          onClick={handleSupportEmail}
          className="px-3 py-1.5 bg-[#9c1a1b] text-white text-sm rounded-full"
        >
          <span className="flex items-center">
            <EnvelopeIcon className="h-4 w-4 mr-1" />
            Support
          </span>
        </button>
      </div>
      
      {/* Client profile */}
      <div className="flex items-center mb-5">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#9c1a1b] to-[#b03c3d] flex items-center justify-center text-white font-semibold text-lg">
          {client.name?.split(' ').map(n => n[0] || '').join('') || '?'}
        </div>
        <div className="ml-4">
          <h4 className="text-lg font-semibold text-gray-900">{client.name || 'Name nicht verfügbar'}</h4>
          <p className="text-sm text-gray-500">
            {client.caseNumber ? `Aktenzeichen: ${client.caseNumber}` : 'Kein Aktenzeichen'}
          </p>
        </div>
      </div>
      
      {/* Client info card */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
        <div className="grid gap-3">
          <div className="flex items-center">
            <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-xs text-gray-500">E-Mail</p>
              <p className="text-sm font-medium text-gray-900 break-all">{client.email || 'Nicht verfügbar'}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-xs text-gray-500">Telefon</p>
              <p className="text-sm font-medium text-gray-900">{client.phone || 'Nicht verfügbar'}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
            <div>
              <p className="text-xs text-gray-500">Kunde seit</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(client.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment info */}
      {(client.honorar || client.raten || client.monatlicheRate) && (
        <div className="bg-[#9c1a1b]/5 rounded-lg border border-[#9c1a1b]/20 p-4">
          <div className="flex items-start">
            <InformationCircleIcon className="h-5 w-5 text-[#9c1a1b] mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-gray-900 mb-1">Zahlungsinformationen</h5>
              <div className="grid gap-1 text-sm">
                {client.honorar && (
                  <p className="text-gray-700">Gesamtbetrag: <span className="font-medium">{client.honorar} €</span></p>
                )}
                {client.raten && client.monatlicheRate && (
                  <p className="text-gray-700">
                    Rate: <span className="font-medium">{client.monatlicheRate.toFixed(2)} €</span> 
                    {client.raten > 1 && <span> ({client.raten}x monatlich)</span>}
                  </p>
                )}
                {client.zahlungStatus && (
                  <p className="text-gray-700">
                    Status: <span className="font-medium">{client.zahlungStatus}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDataComponent;