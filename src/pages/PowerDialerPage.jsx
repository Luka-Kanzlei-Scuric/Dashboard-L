import React, { useState, useEffect } from 'react';
import { 
  PhoneIcon, 
  PauseIcon, 
  PlayIcon, 
  ClockIcon, 
  ArrowPathIcon, 
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const PowerDialerPage = () => {
  // State für den PowerDialer
  const [dialerActive, setDialerActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionInterval, setSessionInterval] = useState(null);
  
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
    
    // Timer starten oder stoppen
    if (!dialerActive) {
      const interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
      setSessionInterval(interval);
    } else {
      clearInterval(sessionInterval);
      setSessionInterval(null);
    }
  };
  
  // Formatiert die Zeit im Format HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };
  
  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      if (sessionInterval) {
        clearInterval(sessionInterval);
      }
    };
  }, [sessionInterval]);
  
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
          
          {!dialerActive ? (
            <div className="flex-1 flex flex-col">
              <div className="bg-gray-50 rounded-lg p-5 mb-5">
                <p className="text-gray-600 text-sm font-light mb-3">
                  Der PowerDialer ermöglicht es Ihnen, Kontakte effizient zu verwalten und Gespräche zu dokumentieren.
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <InformationCircleIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Heute wurden 15 Anrufe getätigt</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Letzte Session: 1:45:32</span>
                </div>
              </div>
              
              <button
                onClick={toggleDialer}
                className="mt-auto bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors duration-200 group"
              >
                <PlayIcon className="w-5 h-5 mr-2 text-gray-400 group-hover:text-gray-600" />
                <span className="font-light">PowerDialer starten</span>
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 font-light">Session-Zeit:</span>
                  <span className="text-sm font-medium text-gray-700 font-mono">{formatTime(sessionTime)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 font-light">Status:</span>
                  <span className="text-sm font-medium bg-green-50 text-green-600 px-2 py-0.5 rounded">Aktiv</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center flex-1">
                <div className="relative">
                  <ArrowPathIcon className={`w-6 h-6 text-gray-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
                    dialerActive ? 'animate-spin' : ''
                  }`} />
                </div>
              </div>
              
              <button
                onClick={toggleDialer}
                className="mt-auto bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors duration-200 group"
              >
                <PauseIcon className="w-5 h-5 mr-2 text-red-400 group-hover:text-red-600" />
                <span className="font-light">PowerDialer stoppen</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Mittlerer Bereich - Eingebettetes Formular (60%) */}
        <div className="w-3/5 flex flex-col bg-gray-50">
          <div className="p-6 border-b border-gray-100 bg-white flex items-center justify-between">
            <h2 className="text-base font-light text-gray-800">Formular</h2>
            {dialerActive && (
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm font-light text-gray-500">Verbindung aktiv</span>
              </div>
            )}
          </div>
          <div className="flex-1 p-4">
            <div className={`h-full transition-all duration-300 ${
              dialerActive ? 'opacity-100' : 'opacity-50'
            }`}>
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
        </div>
        
        {/* Rechter Bereich - Kontaktinformationen (20%) */}
        <div className="w-1/5 border-l border-gray-100 p-6 flex flex-col">
          <h2 className="text-base font-light text-gray-800 mb-4 flex items-center justify-between">
            <span>Aktueller Kontakt</span>
            {dialerActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Aktiv</span>}
          </h2>
          
          {!dialerActive ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-400">
              <PhoneIcon className="w-10 h-10 mb-3 text-gray-200" />
              <p className="text-sm font-light">
                Starten Sie den PowerDialer, <br />um Kontaktdaten zu sehen
              </p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PowerDialerPage;