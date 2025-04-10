import React, { useState, useEffect } from 'react';
import { 
  PhoneIcon, 
  PauseIcon, 
  PlayIcon, 
  ClockIcon, 
  ArrowPathIcon, 
  InformationCircleIcon,
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const PowerDialerPage = () => {
  // States für den PowerDialer
  const [dialerActive, setDialerActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionInterval, setSessionInterval] = useState(null);
  const [callAnswered, setCallAnswered] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);
  
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
    setCallAnswered(false);
    setFormLoaded(false);
    
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
  
  // Simuliere einen angenommenen Anruf
  const simulateAnsweredCall = () => {
    if (dialerActive && !callAnswered) {
      setCallAnswered(true);
      setFormLoading(true);
      
      // Simuliere Ladezeit für das Formular
      setTimeout(() => {
        setFormLoading(false);
        setFormLoaded(true);
      }, 1500);
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
    <div className="h-full w-full bg-[#f5f5f7] overflow-hidden">
      {/* Header mit abgerundeten Ecken */}
      <div className="bg-white px-8 py-6 border-b border-gray-100 rounded-b-2xl shadow-sm">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-light text-gray-800">Power-Dialer</h1>
          <p className="text-gray-500 font-light">Verkaufsteam-Dashboard</p>
        </div>
      </div>
      
      {/* Haupt-Dashboard */}
      <div className="max-w-screen-xl mx-auto pt-6 px-6">
        <div className="flex gap-6 h-[calc(100vh-160px)]">
          {/* Linker Bereich - PowerDialer Steuerung (20%) */}
          <div className="w-1/5 flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 flex-1">
              <h2 className="text-base font-light text-gray-800 mb-5 flex items-center border-b pb-3">
                <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                PowerDialer-Steuerung
              </h2>
              
              {!dialerActive ? (
                <div className="flex-1 flex flex-col h-full">
                  <div className="bg-[#f5f5f7] rounded-2xl p-5 mb-5">
                    <p className="text-gray-600 text-sm font-light mb-4 leading-relaxed">
                      Der PowerDialer ermöglicht es Ihnen, Kontakte effizient zu verwalten und Gespräche zu dokumentieren.
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <InformationCircleIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <span>Heute wurden 15 Anrufe getätigt</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                      </div>
                      <span>Letzte Session: 1:45:32</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={toggleDialer}
                    className="mt-auto transition-all duration-300 bg-white rounded-full border border-gray-200 py-3 px-6 flex items-center justify-center text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow group"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-gray-200 transition-colors">
                      <PlayIcon className="w-3 h-3 text-gray-500 ml-0.5" />
                    </div>
                    <span className="font-light">PowerDialer starten</span>
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col h-full">
                  <div className="bg-[#f5f5f7] rounded-2xl p-5 mb-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-3">
                          <ClockIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 font-light block leading-none">Session-Zeit</span>
                          <span className="text-lg font-light text-gray-800 font-mono">{formatTime(sessionTime)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500 font-light block leading-none mb-1">Status</span>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                          <span className="text-xs font-light text-gray-800">Live</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <button 
                        onClick={simulateAnsweredCall}
                        disabled={callAnswered}
                        className={`text-xs px-3 py-1.5 rounded-full flex items-center transition-all ${
                          callAnswered 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <CheckCircleIcon className="w-3 h-3 mr-1.5" />
                        Anruf angenommen
                      </button>
                      <span className="text-xs font-light text-gray-500">
                        {callAnswered ? 'Telefonat läuft...' : 'Warte auf Anruf...'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <div className="w-28 h-28 rounded-full border-4 border-gray-100 flex items-center justify-center relative mb-4">
                      <div className="w-20 h-20 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                        <ArrowPathIcon className={`w-8 h-8 text-gray-300 ${
                          dialerActive ? 'animate-spin' : ''
                        }`} />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
                        <PhoneIcon className="w-3 h-3 text-green-500" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 font-light">PowerDialer ist aktiv</p>
                  </div>
                  
                  <button
                    onClick={toggleDialer}
                    className="mt-auto transition-all duration-300 bg-white rounded-full border border-gray-200 py-3 px-6 flex items-center justify-center text-red-500 hover:bg-red-50 shadow-sm hover:shadow group"
                  >
                    <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center mr-3 group-hover:bg-red-100 transition-colors">
                      <PauseIcon className="w-3 h-3 text-red-500" />
                    </div>
                    <span className="font-light">PowerDialer stoppen</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Mittlerer Bereich - Eingebettetes Formular (60%) */}
          <div className="w-3/5 flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-light text-gray-800 flex items-center">
                  <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-400" />
                  Formular
                </h2>
                {dialerActive && (
                  <div className="flex items-center">
                    {callAnswered ? (
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${formLoaded ? 'bg-green-500' : 'bg-yellow-500'} mr-2 ${formLoading ? 'animate-pulse' : ''}`}></div>
                        <span className="text-xs font-light text-gray-500">
                          {formLoading ? 'Formular wird geladen...' : (formLoaded ? 'Formular aktiv' : 'Warten auf Formular')}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-300 mr-2"></div>
                        <span className="text-xs font-light text-gray-500">Warten auf Gespräch</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex-1 relative">
                {/* Loading Animation */}
                {(dialerActive && callAnswered && formLoading) && (
                  <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-10">
                    <div className="flex items-center justify-center mb-4">
                      <div className="rounded-full h-12 w-12 bg-[#f5f5f7] flex items-center justify-center">
                        <svg className="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm font-light text-gray-500">Formular wird geladen...</p>
                    <p className="text-xs font-light text-gray-400 mt-1">Dies kann einen Moment dauern</p>
                  </div>
                )}
                
                {/* Placeholder wenn kein Gespräch */}
                {(!dialerActive || !callAnswered) && (
                  <div className="absolute inset-0 bg-[#f5f5f7] flex flex-col items-center justify-center z-10">
                    <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <DocumentTextIcon className="w-8 h-8 text-gray-300" />
                        </div>
                      </div>
                      <h3 className="text-lg font-light text-gray-800 mb-2">Formular-Ansicht</h3>
                      <p className="text-sm font-light text-gray-500 mb-4">
                        {dialerActive 
                          ? "Warten auf Gesprächsbeginn. Wenn ein Kontakt den Anruf annimmt, wird hier das entsprechende Formular geladen."
                          : "Starten Sie den PowerDialer, um die Formular-Ansicht zu aktivieren."}
                      </p>
                      {dialerActive && (
                        <button 
                          onClick={simulateAnsweredCall}
                          className="text-sm px-4 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors inline-flex items-center"
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-2" />
                          Gesprächsbeginn simulieren
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Das eigentliche Formular */}
                <div className={`h-full transition-all duration-500 ${
                  (dialerActive && callAnswered && formLoaded) ? 'opacity-100' : 'opacity-0'
                }`}>
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
          <div className="w-1/5 flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 flex-1">
              <h2 className="text-base font-light text-gray-800 mb-5 flex items-center justify-between border-b pb-3">
                <div className="flex items-center">
                  <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Aktueller Kontakt</span>
                </div>
                {(dialerActive && callAnswered) && 
                  <span className="text-xs bg-green-50 text-green-500 px-2 py-0.5 rounded-full">Aktiv</span>
                }
              </h2>
              
              {(!dialerActive || !callAnswered) ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-400 py-8">
                  <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <UserIcon className="w-10 h-10 text-gray-200" />
                  </div>
                  <p className="text-sm font-light max-w-[200px]">
                    {!dialerActive 
                      ? "Starten Sie den PowerDialer, um Kontaktdaten zu sehen" 
                      : "Warten auf Gesprächsbeginn..."}
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-6 bg-[#f5f5f7] rounded-2xl p-4 shadow-inner">
                    <div className="w-16 h-16 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
                      <span className="text-xl font-light text-gray-400">
                        {currentContact.name.split(' ').map(name => name[0]).join('')}
                      </span>
                    </div>
                    <h3 className="text-xl font-light text-gray-800">{currentContact.name}</h3>
                    <a href={`tel:${currentContact.phone}`} className="text-gray-500 hover:text-gray-700 transition-colors duration-200 block mb-1 mt-1 text-sm">
                      {currentContact.phone}
                    </a>
                    <a href={`mailto:${currentContact.email}`} className="text-gray-500 hover:text-gray-700 transition-colors duration-200 text-xs">
                      {currentContact.email}
                    </a>
                  </div>
                  
                  <div className="bg-[#f5f5f7] rounded-2xl p-4 mb-5">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-500">Bisherige Versuche:</span>
                      <span className="font-normal text-gray-800">{currentContact.previousAttempts}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Letzter Kontakt:</span>
                      <span className="font-normal text-gray-800">{currentContact.lastContact}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4 flex-1">
                    <h4 className="font-normal text-xs mb-2 text-gray-500 flex items-center">
                      <DocumentTextIcon className="w-3 h-3 mr-1.5" />
                      Notizen:
                    </h4>
                    <div className="bg-[#f5f5f7] p-3 rounded-2xl flex-1 overflow-auto shadow-inner">
                      <p className="text-xs text-gray-600 leading-relaxed">{currentContact.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerDialerPage;