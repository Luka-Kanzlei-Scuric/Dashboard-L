import React, { useState } from 'react';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  UserIcon, 
  InformationCircleIcon, 
  CurrencyEuroIcon,
  HomeIcon,
  BriefcaseIcon,
  IdentificationIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  DocumentTextIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

/**
 * A mobile-optimized read-only client data component with support email button
 * and expandable sections for detailed client information
 * 
 * @param {Object} props Component props
 * @param {Object} props.client Client data object
 */
const ClientDataComponent = ({ client }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  
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

  // Format boolean helper
  const formatBoolean = (value) => {
    if (value === undefined || value === null) return 'Keine Angabe';
    return value === true ? 'Ja' : 'Nein';
  };
  
  // Toggle section expansion
  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  // Get form data from client object
  let formData = client.formData || {};
  
  // If formDataCache is available and formData is empty, try to parse it
  if (Object.keys(formData).length === 0 && client.formDataCache) {
    try {
      formData = JSON.parse(client.formDataCache);
    } catch (err) {
      console.error('Error parsing formDataCache:', err);
    }
  }
  
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
      
      {/* Basic Client info card */}
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
      
      {/* Payment info - always visible */}
      {(client.honorar || client.raten || client.monatlicheRate) && (
        <div className="bg-[#9c1a1b]/5 rounded-lg border border-[#9c1a1b]/20 p-4 mb-4">
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
                    Rate: <span className="font-medium">{typeof client.monatlicheRate === 'number' ? client.monatlicheRate.toFixed(2) : client.monatlicheRate} €</span> 
                    {client.raten > 1 && <span> ({client.raten}x monatlich)</span>}
                  </p>
                )}
                {client.zahlungStatus && (
                  <p className="text-gray-700">
                    Status: <span className="font-medium">{client.zahlungStatus}</span>
                  </p>
                )}
                {client.ratenStart && (
                  <p className="text-gray-700">
                    Beginn der Zahlung: <span className="font-medium">{client.ratenStart}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Sections */}
      {/* 1. Persönliche Informationen */}
      <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
        <button 
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => toggleSection('personal')}
        >
          <div className="flex items-center">
            <IdentificationIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="font-medium text-gray-900">Persönliche Informationen</span>
          </div>
          {expandedSection === 'personal' ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSection === 'personal' && (
          <div className="p-4 bg-white">
            <div className="grid gap-3">
              {formData.geburtsdatum && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Geburtsdatum:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.geburtsdatum}</span>
                </div>
              )}
              {formData.familienstand && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Familienstand:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.familienstand}</span>
                </div>
              )}
              {formData.kinderAnzahl !== undefined && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Kinder:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.kinderAnzahl}</span>
                </div>
              )}
              {formData.unterhaltspflicht !== undefined && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Unterhaltspflicht:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.unterhaltspflicht)}</span>
                </div>
              )}
              {formData.unterhaltArt && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Art des Unterhalts:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.unterhaltArt}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Adresse */}
      <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
        <button 
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => toggleSection('address')}
        >
          <div className="flex items-center">
            <HomeIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="font-medium text-gray-900">Adresse</span>
          </div>
          {expandedSection === 'address' ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSection === 'address' && (
          <div className="p-4 bg-white">
            <div className="grid gap-3">
              {formData.strasse && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Straße:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.strasse}</span>
                </div>
              )}
              {formData.hausnummer && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Hausnummer:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.hausnummer}</span>
                </div>
              )}
              {formData.plz && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">PLZ:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.plz}</span>
                </div>
              )}
              {(formData.ort || formData.wohnort) && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Ort:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.ort || formData.wohnort}</span>
                </div>
              )}
              {!formData.strasse && client.address && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Adresse:</span>
                  <span className="text-sm font-medium text-gray-900">{client.address}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Beschäftigung */}
      <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
        <button 
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => toggleSection('employment')}
        >
          <div className="flex items-center">
            <BriefcaseIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="font-medium text-gray-900">Beschäftigung</span>
          </div>
          {expandedSection === 'employment' ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSection === 'employment' && (
          <div className="p-4 bg-white">
            <div className="grid gap-3">
              {formData.beruf && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Beruf:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.beruf}</span>
                </div>
              )}
              {formData.beschaeftigungsArt && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Beschäftigungsart:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.beschaeftigungsArt}</span>
                </div>
              )}
              {formData.derzeitigeTaetigkeit && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Tätigkeit:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.derzeitigeTaetigkeit}</span>
                </div>
              )}
              {formData.erlernterBeruf && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Erlernter Beruf:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.erlernterBeruf}</span>
                </div>
              )}
              {formData.selbststaendig !== undefined && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Selbstständig:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.selbststaendig)}</span>
                </div>
              )}
              {formData.warSelbststaendig !== undefined && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">War selbstständig:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.warSelbststaendig)}</span>
                </div>
              )}
              {formData.befristet !== undefined && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Befristet:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.befristet)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Finanzielle Situation */}
      <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
        <button 
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => toggleSection('financial')}
        >
          <div className="flex items-center">
            <CurrencyEuroIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="font-medium text-gray-900">Finanzielle Informationen</span>
          </div>
          {expandedSection === 'financial' ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSection === 'financial' && (
          <div className="p-4 bg-white">
            <div className="grid gap-3">
              {formData.nettoEinkommen && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Nettoeinkommen:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.nettoEinkommen} €</span>
                </div>
              )}
              {formData.gesamtSchulden && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Gesamtschulden:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.gesamtSchulden} €</span>
                </div>
              )}
              {formData.glaeubiger && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Anzahl Gläubiger:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.glaeubiger}</span>
                </div>
              )}
              {formData.aktuelePfaendung !== undefined && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Aktuelle Pfändung:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.aktuelePfaendung)}</span>
                </div>
              )}
              {formData.pfaendungDetails && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Details Pfändung:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.pfaendungDetails}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Vermögenswerte */}
      <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
        <button 
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => toggleSection('assets')}
        >
          <div className="flex items-center">
            <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="font-medium text-gray-900">Vermögenswerte</span>
          </div>
          {expandedSection === 'assets' ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSection === 'assets' && (
          <div className="p-4 bg-white">
            <div className="grid gap-3">
              {/* Fahrzeuge */}
              {formData.fahrzeuge !== undefined && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Fahrzeuge:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.fahrzeuge)}</span>
                </div>
              )}
              {formData.fahrzeugWert && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Fahrzeug-Wert:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.fahrzeugWert} €</span>
                </div>
              )}
              {formData.fahrzeugNotwendig !== undefined && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Notwendig:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.fahrzeugNotwendig)}</span>
                </div>
              )}
              {formData.fahrzeugFinanziert !== undefined && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Finanziert:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.fahrzeugFinanziert)}</span>
                </div>
              )}
              
              {/* Immobilien */}
              {formData.immobilien !== undefined && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500 min-w-28">Immobilien:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.immobilien)}</span>
                </div>
              )}
              {formData.immobilienDetails && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Details:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.immobilienDetails}</span>
                </div>
              )}
              
              {/* Versicherungen */}
              {formData.lebensversicherung !== undefined && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500 min-w-28">Lebensversicherung:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.lebensversicherung)}</span>
                </div>
              )}
              {formData.rentenversicherung !== undefined && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Rentenversicherung:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.rentenversicherung)}</span>
                </div>
              )}
              
              {/* Weitere Vermögenswerte */}
              {formData.weitereVermoegen !== undefined && (
                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500 min-w-28">Weitere Vermögen:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.weitereVermoegen)}</span>
                </div>
              )}
              {formData.sparbuch !== undefined && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Sparbuch:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.sparbuch)}</span>
                </div>
              )}
              {formData.bausparvertrag !== undefined && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Bausparvertrag:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.bausparvertrag)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6. Sonstige Informationen */}
      <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
        <button 
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          onClick={() => toggleSection('other')}
        >
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
            <span className="font-medium text-gray-900">Sonstige Informationen</span>
          </div>
          {expandedSection === 'other' ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {expandedSection === 'other' && (
          <div className="p-4 bg-white">
            <div className="grid gap-3">
              {formData.vorherigeInsolvenz !== undefined && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Vorh. Insolvenz:</span>
                  <span className="text-sm font-medium text-gray-900">{formatBoolean(formData.vorherigeInsolvenz)}</span>
                </div>
              )}
              {formData.insolvenzDatum && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Datum Insolvenz:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.insolvenzDatum}</span>
                </div>
              )}
              {formData.notizen && (
                <div className="flex gap-2">
                  <span className="text-sm text-gray-500 min-w-28">Notizen:</span>
                  <span className="text-sm font-medium text-gray-900">{formData.notizen}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDataComponent;