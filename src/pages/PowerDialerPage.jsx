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
    <div className="h-full w-full bg-white">
      <div className="px-6 py-5 border-b border-gray-100">
        <h1 className="text-2xl font-light text-gray-800">Power-Dialer</h1>
        <p className="text-gray-500 font-light">Verkaufsteam-Dashboard</p>
      </div>
      
      {/* Haupt-Dashboard */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Linker Bereich - PowerDialer Steuerung (20%) */}
        <div className="w-1/5 border-r border-gray-100 p-6 flex flex-col">
          <h2 className="text-base font-light text-gray-800 mb-4 flex items-center">
            <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
            PowerDialer-Steuerung
          </h2>
          
          <div className="flex-1 flex flex-col justify-center items-center">
            <button
              onClick={toggleDialer}
              className="relative group"
            >
              <div className={`w-32 h-32 rounded-full flex items-center justify-center 
                transition-all duration-300 bg-white shadow-sm 
                ${dialerActive ? 'border-4 border-gray-100' : 'border border-gray-200'}`}
              >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center 
                  transition-all duration-300
                  ${dialerActive 
                    ? 'bg-gray-200 group-hover:bg-gray-300' 
                    : 'bg-gray-100 group-hover:bg-gray-200'}`}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center
                    ${dialerActive ? 'bg-red-300' : 'bg-gray-400'}`}
                  >
                    {dialerActive ? (
                      <PauseIcon className="w-8 h-8 text-white" />
                    ) : (
                      <PlayIcon className="w-8 h-8 text-white ml-1" />
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <span className={`text-sm font-light px-4 py-1 rounded-full 
                  ${dialerActive 
                    ? 'text-red-500 bg-red-50' 
                    : 'text-gray-500 bg-gray-50'}`}
                >
                  {dialerActive ? 'AKTIV' : 'INAKTIV'}
                </span>
              </div>
            </button>
          </div>
        </div>
        
        {/* Mittlerer Bereich - Eingebettetes Formular (60%) */}
        <div className="w-3/5 flex flex-col bg-gray-50">
          <div className="p-6 border-b border-gray-100 bg-white">
            <h2 className="text-base font-light text-gray-800">Formular</h2>
          </div>
          <div className="flex-1 p-4">
            <div className="h-full bg-white rounded-lg shadow-sm overflow-hidden">
              <iframe 
                src="https://formular-mitarbeiter.vercel.app/form/8698jchba" 
                className="w-full h-full"
                title="Mitarbeiter Formular"
                frameBorder="0"
              ></iframe>
            </div>
          </div>
        </div>
        
        {/* Rechter Bereich - Kontaktinformationen (20%) */}
        <div className="w-1/5 border-l border-gray-100 p-6 flex flex-col">
          <h2 className="text-base font-light text-gray-800 mb-4">Aktueller Kontakt</h2>
          
          <div className="text-center mb-6">
            <h3 className="text-xl font-light text-gray-800">{currentContact.name}</h3>
            <a href={`tel:${currentContact.phone}`} className="text-gray-500 hover:text-gray-700 transition-colors duration-200 block mb-1 mt-1">
              {currentContact.phone}
            </a>
            <a href={`mailto:${currentContact.email}`} className="text-gray-500 hover:text-gray-700 transition-colors duration-200 text-sm">
              {currentContact.email}
            </a>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Bisherige Versuche:</span>
              <span className="font-normal text-gray-800">{currentContact.previousAttempts}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Letzter Kontakt:</span>
              <span className="font-normal text-gray-800">{currentContact.lastContact}</span>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-4 flex-1">
            <h4 className="font-normal text-sm mb-2 text-gray-600">Notizen:</h4>
            <div className="bg-gray-50 p-3 rounded-lg h-[calc(100%-30px)] overflow-auto">
              <p className="text-sm text-gray-600">{currentContact.notes}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerDialerPage;