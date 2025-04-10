import React, { useState } from 'react';
import { PhoneIcon, PauseIcon, PlayIcon } from '@heroicons/react/24/outline';

const PowerDialerPage = () => {
  // State für den PowerDialer
  const [dialerActive, setDialerActive] = useState(false);
  
  // Beispiel-Daten für aktuellen Kontakt
  const [currentContact, setCurrentContact] = useState({
    name: "Maria Schmidt",
    phone: "+49 123 4567890",
    email: "maria.schmidt@example.com",
    previousAttempts: 2,
    lastContact: "2025-04-08 14:30",
    notes: "War beim letzten Mal interessiert, hatte jedoch noch Bedenken wegen der Kosten."
  });
  
  // PowerDialer aktivieren/deaktivieren
  const toggleDialer = () => {
    setDialerActive(!dialerActive);
  };
  
  return (
    <div className="container mx-auto px-4 py-6 bg-gray-50">
      <div className="mb-6">
        <h1 className="text-3xl font-medium text-gray-900">Power-Dialer</h1>
        <p className="text-gray-500 mt-1">Verkaufsteam-Dashboard</p>
      </div>
      
      {/* Haupt-Dashboard mit vertikalen Trennlinien */}
      <div className="relative flex h-[calc(100vh-180px)] min-h-[600px]">
        {/* Vertikale Trennlinie bei 25% */}
        <div className="absolute left-1/4 top-0 bottom-0 w-px bg-gray-200"></div>
        
        {/* Vertikale Trennlinie bei 75% */}
        <div className="absolute left-3/4 top-0 bottom-0 w-px bg-gray-200"></div>
        
        {/* Linker Bereich - PowerDialer Steuerung (25%) */}
        <div className="w-1/4 pr-6">
          {/* PowerDialer Steuerung */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-5 flex items-center">
              <PhoneIcon className="w-5 h-5 mr-2 text-blue-500" />
              PowerDialer-Steuerung
            </h2>
            
            <div className="flex justify-center mb-8">
              <button
                onClick={toggleDialer}
                className={`relative flex items-center justify-center w-24 h-24 rounded-full shadow-lg transition-all duration-300 ${
                  dialerActive 
                    ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                }`}
              >
                {dialerActive ? (
                  <PauseIcon className="w-12 h-12 text-white" />
                ) : (
                  <PlayIcon className="w-12 h-12 text-white ml-1" />
                )}
                <div className="absolute -bottom-9 text-sm font-medium bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                  {dialerActive ? 'AKTIV' : 'INAKTIV'}
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mittlerer Bereich - Eingebettetes Formular (50%) */}
        <div className="w-1/2 px-6 flex flex-col">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Formular</h2>
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <iframe 
              src="https://formular-mitarbeiter.vercel.app/form/8698jchba" 
              className="w-full h-full"
              title="Mitarbeiter Formular"
              frameBorder="0"
            ></iframe>
          </div>
        </div>
        
        {/* Rechter Bereich - Kontaktinformationen (25%) */}
        <div className="w-1/4 pl-6">
          {/* Kontaktinformationen */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Aktueller Kontakt</h2>
            
            <div className="text-center mb-5">
              <h3 className="text-2xl font-medium text-gray-900">{currentContact.name}</h3>
              <a href={`tel:${currentContact.phone}`} className="text-blue-500 hover:text-blue-700 transition-colors duration-200 block mb-1 mt-1">
                {currentContact.phone}
              </a>
              <a href={`mailto:${currentContact.email}`} className="text-blue-500 hover:text-blue-700 transition-colors duration-200 text-sm">
                {currentContact.email}
              </a>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Bisherige Versuche:</span>
                <span className="font-medium text-gray-900">{currentContact.previousAttempts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Letzter Kontakt:</span>
                <span className="font-medium text-gray-900">{currentContact.lastContact}</span>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-medium text-sm mb-2 text-gray-700">Notizen zu vorherigen Gesprächen:</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">{currentContact.notes}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerDialerPage;