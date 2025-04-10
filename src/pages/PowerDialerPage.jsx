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
  CheckCircleIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import aircallService from '../services/aircallService';

const PowerDialerPage = () => {
  // States für den PowerDialer
  const [dialerActive, setDialerActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionInterval, setSessionInterval] = useState(null);
  const [callAnswered, setCallAnswered] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);
  const [showDialerControls, setShowDialerControls] = useState(false);
  
  // States für Aircall
  const [showManualDialer, setShowManualDialer] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [callError, setCallError] = useState(null);
  
  // Aircall Konfiguration
  const aircallConfig = {
    userId: "1527216", // Deine Aircall-Benutzer-ID
    numberId: "967647" // Deine Aircall-Nummer-ID für "Dorsten - Lokal"
  };
  
  // Beispiel-Daten für aktuellen Kontakt
  const [currentContact, setCurrentContact] = useState({
    name: "Maria Schmidt",
    phone: "+49 123 4567890", // Sollte im E.164-Format sein, z.B. "+491234567890"
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
  
  // Funktion zum Starten eines Anrufs mit Aircall
  const startCall = async (phoneNumberToCall) => {
    try {
      setCallError(null);
      setIsCallInProgress(true);
      
      // Entweder die eingegebene Nummer oder die des aktuellen Kontakts verwenden
      const number = phoneNumberToCall || phoneNumber;
      
      // Validiere, dass die Nummer im E.164-Format ist (mit Ländervorwahl)
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(number)) {
        throw new Error('Telefonnummer muss im E.164-Format sein (z.B. +491234567890)');
      }
      
      // Anruf über Aircall API starten
      await aircallService.startOutboundCall(
        aircallConfig.userId,
        aircallConfig.numberId,
        number
      );
      
      // Anruf erfolgreich gestartet, simuliere Anruf angenommen
      simulateAnsweredCall();
      
      // Wenn manueller Dialer geöffnet war, schließen
      setShowManualDialer(false);
      
      // Telefonnummer im Eingabefeld zurücksetzen
      setPhoneNumber("");
    } catch (error) {
      console.error('Fehler beim Starten des Anrufs:', error);
      setCallError(error.message || 'Fehler beim Starten des Anrufs');
      setIsCallInProgress(false);
    }
  };
  
  // Funktion zum Anrufen des aktuellen Kontakts
  const callCurrentContact = async () => {
    try {
      // Prüfe, ob ein aktueller Kontakt vorhanden ist
      if (!currentContact || !currentContact.phone) {
        throw new Error('Keine Telefonnummer für aktuellen Kontakt verfügbar');
      }
      
      // Starte Anruf mit der Telefonnummer des aktuellen Kontakts
      await startCall(currentContact.phone);
    } catch (error) {
      console.error('Fehler beim Anrufen des aktuellen Kontakts:', error);
      setCallError(error.message || 'Fehler beim Anrufen des aktuellen Kontakts');
    }
  };
  
  // Funktion zum Formatieren einer Telefonnummer in E.164-Format
  const formatToE164 = (number) => {
    // Entferne alle Zeichen außer Ziffern
    const digitsOnly = number.replace(/\D/g, '');
    
    // Wenn die Nummer mit einer führenden 0 beginnt, ersetze sie durch die deutsche Ländervorwahl
    if (digitsOnly.startsWith('0')) {
      return '+49' + digitsOnly.substring(1);
    }
    
    // Wenn keine Ländervorwahl vorhanden ist, füge deutsche Vorwahl hinzu
    if (!number.startsWith('+')) {
      return '+49' + digitsOnly;
    }
    
    // Wenn die Nummer bereits mit + beginnt, stelle sicher, dass das + erhalten bleibt
    return '+' + digitsOnly;
  };
  
  // Handler für Änderungen im Telefonnummern-Eingabefeld
  const handlePhoneNumberChange = (e) => {
    setPhoneNumber(e.target.value);
  };
  
  // Handler für das Absenden des manuellen Dialer-Formulars
  const handleDialSubmit = (e) => {
    e.preventDefault();
    
    // Formatiere die Telefonnummer und starte den Anruf
    const formattedNumber = formatToE164(phoneNumber);
    startCall(formattedNumber);
  };
  
  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      if (sessionInterval) {
        clearInterval(sessionInterval);
      }
    };
  }, [sessionInterval]);
  
  // Klick-Handler für das Dokument (schließt Dropdown beim Klick außerhalb)
  useEffect(() => {
    const handleOutsideClick = (event) => {
      const controlsElement = document.getElementById('dialer-controls');
      const toggleElement = document.getElementById('dialer-toggle');
      const manualDialerElement = document.getElementById('manual-dialer');
      
      // Schließe Dialer-Steuerung bei Klick außerhalb
      if (showDialerControls && 
          controlsElement && 
          !controlsElement.contains(event.target) && 
          toggleElement && 
          !toggleElement.contains(event.target)) {
        setShowDialerControls(false);
      }
      
      // Schließe den manuellen Dialer bei Klick außerhalb
      if (showManualDialer &&
          manualDialerElement &&
          !manualDialerElement.contains(event.target)) {
        setShowManualDialer(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showDialerControls, showManualDialer]);
  
  return (
    <div className="h-full w-full bg-[#f5f5f7] overflow-hidden">
      {/* Header mit PowerDialer-Steuerung */}
      <div className="bg-white px-4 sm:px-6 md:px-8 py-4 md:py-5 border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-light text-gray-800">Power-Dialer</h1>
            <p className="text-xs md:text-sm text-gray-500 font-light">Verkaufsteam-Dashboard</p>
          </div>
          
          {/* PowerDialer-Steuerung in der Header-Leiste */}
          <div className="relative">
            <button 
              id="dialer-toggle"
              onClick={() => setShowDialerControls(!showDialerControls)}
              className={`flex items-center rounded-full py-1.5 md:py-2 pl-2 md:pl-3 pr-3 md:pr-4 transition-all duration-300 border ${
                dialerActive 
                  ? 'bg-green-50 border-green-100 text-green-600 hover:bg-green-100' 
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full mr-1.5 md:mr-2 flex items-center justify-center ${
                dialerActive ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <PhoneIcon className={`w-3 h-3 md:w-4 md:h-4 ${dialerActive ? 'text-green-500' : 'text-gray-500'}`} />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                {dialerActive ? (
                  <>
                    <span className="text-xs font-light">PowerDialer aktiv</span>
                    <span className="text-xs font-medium">{formatTime(sessionTime)}</span>
                  </>
                ) : (
                  <span className="text-xs md:text-sm font-light">PowerDialer starten</span>
                )}
              </div>
              <ChevronDownIcon className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2" />
            </button>
            
            {/* Dropdown für PowerDialer Steuerung */}
            {showDialerControls && (
              <div 
                id="dialer-controls"
                className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 w-64 sm:w-72 md:w-80 overflow-hidden z-20"
              >
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                    <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                    PowerDialer-Steuerung
                  </h3>
                  
                  {dialerActive && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                          <ClockIcon className="w-3 h-3 text-gray-500" />
                        </div>
                        <span className="text-sm font-light font-mono">{formatTime(sessionTime)}</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-1.5 ${
                          callAnswered ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                        }`}></div>
                        <span className="text-xs font-light">
                          {callAnswered ? 'Telefonat läuft' : 'Warte auf Anruf'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 font-light">
                        {dialerActive 
                          ? "PowerDialer ist aktiv. Heute wurden 15 Anrufe getätigt." 
                          : "PowerDialer starten, um Kontakte anzurufen und Gespräche zu dokumentieren."
                        }
                      </p>
                    </div>
                    
                    <button
                      onClick={toggleDialer}
                      className={`ml-4 flex items-center justify-center rounded-full transition-all duration-300 px-3 py-1.5 ${
                        dialerActive 
                          ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {dialerActive ? (
                        <>
                          <PauseIcon className="w-3 h-3 mr-1.5" />
                          <span className="text-xs font-light">Stoppen</span>
                        </>
                      ) : (
                        <>
                          <PlayIcon className="w-3 h-3 mr-1.5" />
                          <span className="text-xs font-light">Starten</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {dialerActive && !callAnswered && (
                  <div className="p-4 bg-gray-50">
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={simulateAnsweredCall}
                        className="w-full flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:bg-gray-50 py-2 border border-gray-200"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm font-light">Anruf angenommen</span>
                      </button>
                      
                      <button
                        onClick={() => setShowManualDialer(true)}
                        className="w-full flex items-center justify-center bg-white rounded-lg shadow-sm text-gray-600 hover:bg-gray-50 py-2 border border-gray-200"
                      >
                        <PhoneIcon className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="text-sm font-light">Nummer wählen</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Manueller Dialer (Modal) */}
      {showManualDialer && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center px-4">
          <div 
            id="manual-dialer" 
            className="bg-white rounded-2xl shadow-lg max-w-md w-full p-5 md:p-6"
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-light text-gray-800">Nummer wählen</h2>
              <button 
                onClick={() => setShowManualDialer(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {callError && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {callError}
              </div>
            )}
            
            <form onSubmit={handleDialSubmit}>
              <div className="mb-4">
                <label htmlFor="phoneNumber" className="block text-sm text-gray-600 mb-1">
                  Telefonnummer
                </label>
                <input
                  type="text"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  placeholder="+49 123 456789"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Bitte im Format +49... eingeben oder die Umwandlung erfolgt automatisch
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowManualDialer(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isCallInProgress}
                  className={`px-4 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 flex items-center ${
                    isCallInProgress ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isCallInProgress ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Verbinde...
                    </>
                  ) : (
                    <>
                      <PhoneIcon className="w-4 h-4 mr-2" />
                      Anrufen
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Haupt-Dashboard */}
      <div className="max-w-screen-xl mx-auto pt-4 md:pt-6 px-4 md:px-6">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100vh-120px)] overflow-y-auto lg:overflow-visible">
          {/* Linker Bereich - PowerDialer Info (20%) */}
          <div className="w-full lg:w-1/5 flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 mb-4 md:mb-5 flex-1">
              <h2 className="text-base font-light text-gray-800 mb-4 md:mb-5 flex items-center border-b pb-3">
                <InformationCircleIcon className="w-4 h-4 mr-2 text-gray-400" />
                PowerDialer-Info
              </h2>
              
              {!dialerActive ? (
                <div className="flex-1 flex flex-col h-full">
                  <div className="bg-[#f5f5f7] rounded-xl md:rounded-2xl p-4 md:p-5 mb-4 md:mb-5">
                    <p className="text-sm font-light text-gray-600 mb-4 leading-relaxed">
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
                  
                </div>
              ) : (
                <div className="flex-1 flex flex-col h-full">
                  <div className="bg-[#f5f5f7] rounded-xl md:rounded-2xl p-4 md:p-5 mb-4 md:mb-5">
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
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-gray-100 flex items-center justify-center relative mb-4">
                      <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                        <ArrowPathIcon className={`w-6 h-6 md:w-8 md:h-8 text-gray-300 ${
                          dialerActive ? 'animate-spin' : ''
                        }`} />
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
                        <PhoneIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-500" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 font-light">PowerDialer ist aktiv</p>
                  </div>
                  
                  {!callAnswered && (
                    <button 
                      onClick={simulateAnsweredCall}
                      className="mt-auto transition-all duration-300 bg-white rounded-full border border-gray-200 py-2 md:py-3 px-4 md:px-6 flex items-center justify-center text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow group"
                    >
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gray-100 flex items-center justify-center mr-2 md:mr-3 group-hover:bg-gray-200 transition-colors">
                        <CheckCircleIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-500" />
                      </div>
                      <span className="text-sm font-light">Anruf angenommen</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Mittlerer Bereich - Eingebettetes Formular (60%) */}
          <div className="w-full lg:w-3/5 flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col min-h-[400px] lg:min-h-0">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex items-center justify-between">
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
                      <div className="rounded-full h-10 w-10 md:h-12 md:w-12 bg-[#f5f5f7] flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 md:h-6 md:w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                  <div className="absolute inset-0 bg-[#f5f5f7] flex flex-col items-center justify-center z-10 p-4">
                    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm p-4 md:p-8 max-w-sm md:max-w-md w-full text-center">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <DocumentTextIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-300" />
                        </div>
                      </div>
                      <h3 className="text-base md:text-lg font-light text-gray-800 mb-2">Formular-Ansicht</h3>
                      <p className="text-xs md:text-sm font-light text-gray-500 mb-4">
                        {dialerActive 
                          ? "Warten auf Gesprächsbeginn. Wenn ein Kontakt den Anruf annimmt, wird hier das entsprechende Formular geladen."
                          : "Starten Sie den PowerDialer, um die Formular-Ansicht zu aktivieren."}
                      </p>
                      {dialerActive && (
                        <button 
                          onClick={simulateAnsweredCall}
                          className="text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors inline-flex items-center"
                        >
                          <CheckCircleIcon className="w-3 h-3 md:w-4 md:h-4 mr-2" />
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
          <div className="w-full lg:w-1/5 flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 mb-4 md:mb-5 flex-1">
              <h2 className="text-base font-light text-gray-800 mb-4 md:mb-5 flex items-center justify-between border-b pb-3">
                <div className="flex items-center">
                  <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Aktueller Kontakt</span>
                </div>
                {(dialerActive && callAnswered) && 
                  <span className="text-xs bg-green-50 text-green-500 px-2 py-0.5 rounded-full">Aktiv</span>
                }
              </h2>
              
              {(!dialerActive || !callAnswered) ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center text-gray-400 py-4 md:py-8">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <UserIcon className="w-8 h-8 md:w-10 md:h-10 text-gray-200" />
                  </div>
                  <p className="text-xs md:text-sm font-light max-w-[200px]">
                    {!dialerActive 
                      ? "Starten Sie den PowerDialer, um Kontaktdaten zu sehen" 
                      : "Warten auf Gesprächsbeginn..."}
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-4 md:mb-6 bg-[#f5f5f7] rounded-xl md:rounded-2xl p-3 md:p-4 shadow-inner">
                    <div className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center mb-2">
                      <span className="text-lg md:text-xl font-light text-gray-400">
                        {currentContact.name.split(' ').map(name => name[0]).join('')}
                      </span>
                    </div>
                    <h3 className="text-lg md:text-xl font-light text-gray-800">{currentContact.name}</h3>
                    
                    <div className="mt-2 mb-2 flex items-center justify-center space-x-2">
                      <a href={`tel:${currentContact.phone}`} className="text-gray-500 hover:text-gray-700 transition-colors duration-200 block text-xs md:text-sm">
                        {currentContact.phone}
                      </a>
                      
                      <button
                        onClick={callCurrentContact}
                        disabled={isCallInProgress || !dialerActive}
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          dialerActive 
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        title={dialerActive ? "Kontakt anrufen" : "Aktivieren Sie zuerst den PowerDialer"}
                      >
                        <PhoneIcon className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <a href={`mailto:${currentContact.email}`} className="text-gray-500 hover:text-gray-700 transition-colors duration-200 text-xs block">
                      {currentContact.email}
                    </a>
                    
                    {callError && (
                      <div className="mt-2 bg-red-50 text-red-600 p-2 rounded-lg text-xs">
                        {callError}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-[#f5f5f7] rounded-xl md:rounded-2xl p-3 md:p-4 mb-4 md:mb-5">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-500">Bisherige Versuche:</span>
                      <span className="font-normal text-gray-800">{currentContact.previousAttempts}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Letzter Kontakt:</span>
                      <span className="font-normal text-gray-800">{currentContact.lastContact}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-3 md:pt-4 flex-1">
                    <h4 className="font-normal text-xs mb-2 text-gray-500 flex items-center">
                      <DocumentTextIcon className="w-3 h-3 mr-1.5" />
                      Notizen:
                    </h4>
                    <div className="bg-[#f5f5f7] p-3 rounded-xl md:rounded-2xl flex-1 overflow-auto shadow-inner">
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