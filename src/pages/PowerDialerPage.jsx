import React, { useState, useEffect, useCallback } from 'react';
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
  XMarkIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import aircallService from '../services/aircallService';

/**
 * PowerDialerPage Komponente - Vollständig überarbeitet
 * 
 * Anzeige und Steuerung des PowerDialers mit Aircall-Integration
 * 
 * Funktionsweise:
 * 1. Benutzer aktiviert den PowerDialer
 * 2. System prüft die Verfügbarkeit des Sales Reps bei Aircall
 * 3. Bei Verfügbarkeit kann ein Anruf getätigt werden (manuell oder automatisch)
 * 4. Anrufstatus wird aktiv überwacht (Polling oder Webhooks im Produktivbetrieb)
 * 5. Bei Anrufende wird entsprechend reagiert (nächste Nummer wählen, Formular schließen)
 */
const PowerDialerPage = () => {
  // -------------------- States --------------------
  
  // PowerDialer States
  const [dialerActive, setDialerActive] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [sessionInterval, setSessionInterval] = useState(null);
  const [showDialerControls, setShowDialerControls] = useState(false);
  
  // Anruf-UI States
  const [callAnswered, setCallAnswered] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);
  const [showManualDialer, setShowManualDialer] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Anruf-Tracking States
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [callError, setCallError] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [statusPollingActive, setStatusPollingActive] = useState(false);
  
  // Kontakt-States
  const [contactList, setContactList] = useState([
    {
      id: "contact1",
      name: "Maria Schmidt",
      phone: "+4917693176785", // Echte Testnummer
      email: "maria.schmidt@example.com",
      previousAttempts: 2,
      lastContact: "2025-04-08 14:30",
      notes: "War beim letzten Mal interessiert, hatte jedoch noch Bedenken wegen der Kosten."
    },
    {
      id: "contact2",
      name: "Thomas Müller",
      phone: "+491767255021", // Echte Testnummer (ohne Leerzeichen für E.164-Format)
      email: "thomas.mueller@example.com",
      previousAttempts: 0,
      lastContact: "Noch kein Kontakt",
      notes: "Neuer Interessent, wurde noch nicht kontaktiert."
    }
  ]);
  const [currentContact, setCurrentContact] = useState(null);
  const [currentContactIndex, setCurrentContactIndex] = useState(0);
  
  // Automatische Wählsequenz States
  const [autoDialingActive, setAutoDialingActive] = useState(false);
  
  // Aircall-Konfiguration
  const aircallConfig = {
    userId: "1527216", // Aircall-Benutzer-ID
    numberId: "967647", // Aircall-Nummer-ID
    useMockMode: true,  // Mock-Modus für Tests
    webhookUrl: window.location.origin + "/api/aircall-webhook" // Optional: URL für Webhooks in Produktivumgebung
  };
  
  // -------------------- Hilfsfunktionen --------------------
  
  /**
   * Formatiert Sekunden in das Format HH:MM:SS
   */
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
  
  /**
   * Formatiert eine Telefonnummer in das E.164-Format
   */
  const formatToE164 = (number) => {
    const digitsOnly = number.replace(/\D/g, '');
    
    if (digitsOnly.startsWith('0')) {
      return '+49' + digitsOnly.substring(1);
    }
    
    if (!number.startsWith('+')) {
      return '+49' + digitsOnly;
    }
    
    return '+' + digitsOnly;
  };
  
  // -------------------- Effekte --------------------
  
  /**
   * Effekt: Überprüft die Verfügbarkeit des aircallService
   */
  useEffect(() => {
    if (!aircallService || typeof aircallService !== 'object') {
      console.error("aircallService ist nicht verfügbar oder kein Objekt");
      setCallError("Anrufservice ist nicht verfügbar. Bitte versuchen Sie es später erneut.");
    } else {
      console.log("aircallService erfolgreich initialisiert:", 
                  Object.keys(aircallService).join(', '));
    }
  }, []);
  
  /**
   * Effekt: Bereinigung beim Component-Unmount
   */
  useEffect(() => {
    return () => {
      // Timer stoppen
      if (sessionInterval) {
        clearInterval(sessionInterval);
      }
      
      // Alle aktiven Anrufe beenden
      console.log("Komponente wird unmounted - Beende alle aktiven Anrufe");
      if (aircallService && typeof aircallService.clearCallState === 'function') {
        try {
          aircallService.clearCallState().catch(error => {
            console.error("Fehler beim Beenden der Anrufe beim Unmount:", error);
          });
        } catch (error) {
          console.error("Fehler beim Zugriff auf aircallService beim Unmount:", error);
        }
      }
    };
  }, [sessionInterval]);
  
  /**
   * Effekt: Stellt sicher, dass kein Anruf läuft, wenn der Dialer deaktiviert ist
   */
  useEffect(() => {
    if (!dialerActive && aircallService && typeof aircallService.hasActiveCall === 'function' 
        && aircallService.hasActiveCall()) {
      console.log("PowerDialer wurde deaktiviert. Beende aktive Anrufe.");
      try {
        aircallService.clearCallState().catch(error => {
          console.error("Fehler beim Beenden der Anrufe nach Dialer-Deaktivierung:", error);
        });
      } catch (error) {
        console.error("Fehler beim Zugriff auf aircallService:", error);
      }
    }
    
    // Prüfe Benutzerverfügbarkeit, wenn der Dialer aktiviert wird
    if (dialerActive) {
      checkSalesRepAvailability();
    }
  }, [dialerActive]);
  
  /**
   * Effekt: Klick-Handler für das Dokument (schließt Dropdowns bei Klick außerhalb)
   */
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
  
  /**
   * Effekt: Regelmäßige Überprüfung des User-Status, wenn der Dialer aktiv ist
   */
  useEffect(() => {
    let statusInterval = null;
    
    if (dialerActive && !statusPollingActive) {
      statusInterval = setInterval(() => {
        checkSalesRepAvailability();
      }, 60000); // Jede Minute prüfen
      
      setStatusPollingActive(true);
    }
    
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
        setStatusPollingActive(false);
      }
    };
  }, [dialerActive]);
  
  // -------------------- Anruf-Verwaltung --------------------
  
  /**
   * Überprüft die Verfügbarkeit des Sales Reps bei Aircall
   */
  const checkSalesRepAvailability = async () => {
    if (!aircallService) return;
    
    try {
      const availability = await aircallService.checkUserAvailability(
        aircallConfig.userId, 
        aircallConfig.useMockMode
      );
      
      setUserStatus(availability);
      
      if (!availability.available || !availability.connected) {
        console.warn(`Sales Rep ist nicht verfügbar. Status: ${availability.status}`);
        setCallError(`Sales Rep ist nicht verfügbar (${availability.status}). Bitte später versuchen.`);
      } else {
        setCallError(null);
      }
      
      return availability;
    } catch (error) {
      console.error("Fehler bei der Überprüfung der Sales Rep Verfügbarkeit:", error);
      setCallError("Fehler bei der Überprüfung der Verfügbarkeit. Bitte versuchen Sie es später erneut.");
      setUserStatus({ available: false, status: 'error', connected: false });
      return null;
    }
  };
  
  /**
   * Startet einen Anruf über die Aircall-API
   */
  const startCall = async (phoneNumberToCall) => {
    try {
      // Prüfe, ob der PowerDialer aktiv ist
      if (!dialerActive) {
        console.log("PowerDialer ist nicht aktiv. Anruf wird nicht getätigt.");
        return;
      }
      
      // Prüfe Sales Rep Verfügbarkeit
      const availability = await checkSalesRepAvailability();
      if (!availability || !availability.available || !availability.connected) {
        throw new Error(`Sales Rep ist nicht verfügbar (${availability?.status || 'unbekannt'})`);
      }
      
      // Prüfe, ob bereits ein Anruf läuft
      if (aircallService.hasActiveCall()) {
        console.log("Es gibt bereits einen aktiven Anruf. Beende diesen zuerst.");
        await aircallService.clearCallState();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      setCallError(null);
      setIsCallInProgress(true);
      
      // Zu wählende Nummer
      const number = phoneNumberToCall || phoneNumber;
      
      // Validierung des E.164-Formats
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(number)) {
        throw new Error('Telefonnummer muss im E.164-Format sein (z.B. +491234567890)');
      }
      
      console.log(`Starte Anruf an ${number}...`);
      
      // Anruf über Aircall API starten
      const response = await aircallService.startOutboundCall(
        aircallConfig.userId,
        aircallConfig.numberId,
        number,
        aircallConfig.useMockMode
      );
      
      console.log("Anruf gestartet:", response?.data?.id || "ID nicht verfügbar");
      
      // UI-Updates
      if (showManualDialer) setShowManualDialer(false);
      setPhoneNumber("");
      
      // Prüfe Zielrufnummer für Sicherheit
      const activeCall = aircallService.getActiveCall();
      if (activeCall && activeCall.to !== number) {
        console.error(`Anruf geht an falsche Nummer: ${activeCall.to} statt ${number}`);
        await aircallService.clearCallState();
        throw new Error('Anruf wurde an falsche Nummer weitergeleitet');
      }
      
      // Anruf-Timeout nach 120 Sekunden
      const callTimeoutId = setTimeout(async () => {
        if (isCallInProgress) {
          console.log("Anruf-Timeout erreicht. Beende Anruf automatisch.");
          await endCurrentCall();
        }
      }, 120000);
      
      // Anruf-Status-Überwachung
      handleCallStatusChanges(response?.data?.id, callTimeoutId);
      
      return response;
    } catch (error) {
      console.error('Fehler beim Starten des Anrufs:', error);
      setCallError(error.message || 'Fehler beim Starten des Anrufs');
      setIsCallInProgress(false);
      
      // Bereinige eventuelle hängende Anrufe
      if (aircallService && typeof aircallService.clearCallState === 'function') {
        await aircallService.clearCallState();
      }
      
      // Bei Auto-Dialing zum nächsten Kontakt gehen
      if (autoDialingActive && dialerActive) {
        setTimeout(() => {
          moveToNextContact();
        }, 3000);
      }
    }
  };
  
  /**
   * Überwacht Änderungen des Anrufstatus
   */
  const handleCallStatusChanges = (callId, timeoutId) => {
    if (!callId) return;
    
    // In einer Produktivumgebung würden wir Webhooks verwenden
    // Im Testmodus verwenden wir die Simulationsfunktion des aircallService
    
    // Simulierte Anrufannahme nach zufälliger Zeit (nur für Demo/Test)
    if (aircallConfig.useMockMode) {
      const randomDelay = Math.random() > 0.3 ? 2000 + Math.random() * 3000 : 0;
      
      if (randomDelay > 0) {
        // Simuliere Klingeln und dann Annahme
        setTimeout(() => {
          if (dialerActive && isCallInProgress) {
            setCallAnswered(true);
            setFormLoading(true);
            
            // Formular laden
            setTimeout(() => {
              if (dialerActive && isCallInProgress) {
                setFormLoading(false);
                setFormLoaded(true);
              }
            }, 1500);
            
            // Nach einer gewissen Zeit Anruf beenden (wenn automatisch)
            if (autoDialingActive) {
              setTimeout(() => {
                if (dialerActive && isCallInProgress) {
                  clearTimeout(timeoutId);
                  endCurrentCall();
                }
              }, 8000 + Math.random() * 5000);
            }
          }
        }, randomDelay);
      } else {
        // Simuliere, dass niemand antwortet
        setTimeout(() => {
          if (dialerActive && isCallInProgress) {
            console.log("Anruf wurde nicht beantwortet");
            clearTimeout(timeoutId);
            
            if (autoDialingActive) {
              moveToNextContact();
            } else {
              setIsCallInProgress(false);
              aircallService.clearCallState();
            }
          }
        }, 5000);
      }
    }
    
    // In einer Produktivumgebung würden wir hier auf Webhook-Events reagieren
    // oder regelmäßig den Status abfragen
  };
  
  /**
   * Beendet den aktuellen Anruf
   */
  const endCurrentCall = async () => {
    setCallAnswered(false);
    setFormLoaded(false);
    setIsCallInProgress(false);
    
    // Anruf über die Aircall API beenden
    let apiEndSuccessful = false;
    if (aircallService && typeof aircallService.clearCallState === 'function') {
      try {
        await aircallService.clearCallState();
        console.log("Anruf erfolgreich beendet");
        apiEndSuccessful = true;
      } catch (error) {
        console.error("Fehler beim Beenden des Anrufs:", error);
      }
    }
    
    // Kurze Pause vor dem nächsten Anruf
    await new Promise(resolve => setTimeout(resolve, apiEndSuccessful ? 1000 : 2000));
    
    // Bei aktivem Auto-Dialing zum nächsten Kontakt gehen
    if (dialerActive && autoDialingActive) {
      console.log("Gehe zum nächsten Kontakt");
      moveToNextContact();
    }
  };
  
  /**
   * Ruft den aktuellen Kontakt an
   */
  const callCurrentContact = async () => {
    try {
      if (!currentContact?.phone) {
        throw new Error('Keine Telefonnummer für aktuellen Kontakt verfügbar');
      }
      
      if (!dialerActive) {
        throw new Error('PowerDialer nicht aktiv');
      }
      
      // Beende ggf. laufende Anrufe
      if (isCallInProgress || aircallService.hasActiveCall()) {
        await endCurrentCall();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Starte Anruf
      await startCall(currentContact.phone);
    } catch (error) {
      console.error('Fehler beim Anrufen des aktuellen Kontakts:', error);
      setCallError(error.message || 'Fehler beim Anrufen des aktuellen Kontakts');
      setIsCallInProgress(false);
    }
  };
  
  // -------------------- PowerDialer-Steuerung --------------------
  
  /**
   * Aktiviert oder deaktiviert den PowerDialer
   */
  const toggleDialer = async () => {
    const newDialerState = !dialerActive;
    setDialerActive(newDialerState);
    setCallAnswered(false);
    setFormLoaded(false);
    
    if (newDialerState) {
      // PowerDialer aktivieren
      const interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
      setSessionInterval(interval);
      
      // Kontakt setzen
      setCurrentContactIndex(0);
      setCurrentContact(contactList[0]);
      
      // Verfügbarkeit prüfen
      const availability = await checkSalesRepAvailability();
      
      // Anrufe beenden, die eventuell noch aktiv sind
      if (aircallService.hasActiveCall()) {
        await aircallService.clearCallState();
      }
      
      // Auto-Dial starten, wenn aktiviert
      if (autoDialingActive && availability?.available) {
        dialNextContact();
      }
    } else {
      // PowerDialer deaktivieren
      clearInterval(sessionInterval);
      setSessionInterval(null);
      setAutoDialingActive(false);
      setIsCallInProgress(false);
      setCallAnswered(false);
      setCallError(null);
      
      // Laufende Anrufe beenden
      if (aircallService && typeof aircallService.clearCallState === 'function') {
        await aircallService.clearCallState();
      }
    }
  };
  
  /**
   * Startet die automatische Wählsequenz
   */
  const startDialingSequence = () => {
    if (!dialerActive) return;
    
    setAutoDialingActive(true);
    dialNextContact();
  };
  
  /**
   * Stoppt die automatische Wählsequenz
   */
  const stopDialingSequence = () => {
    setAutoDialingActive(false);
  };
  
  /**
   * Wählt den nächsten Kontakt in der Liste
   */
  const dialNextContact = async () => {
    try {
      // Sicherheitschecks
      if (!dialerActive) {
        console.log("PowerDialer ist nicht aktiv, kein Anruf wird getätigt");
        return;
      }
      
      // Verfügbarkeit prüfen
      const availability = await checkSalesRepAvailability();
      if (!availability?.available) {
        console.log("Sales Rep ist nicht verfügbar. Auto-Dialing wird angehalten.");
        setAutoDialingActive(false);
        return;
      }
      
      // Laufende Anrufe beenden
      if (isCallInProgress || aircallService.hasActiveCall()) {
        await endCurrentCall();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Prüfe, ob wir am Ende der Liste sind
      if (currentContactIndex >= contactList.length) {
        console.log("Ende der Kontaktliste erreicht");
        setAutoDialingActive(false);
        return;
      }
      
      // Nächsten Kontakt anrufen
      const contactToCall = contactList[currentContactIndex];
      setCurrentContact(contactToCall);
      setIsCallInProgress(true);
      setCallAnswered(false);
      setFormLoaded(false);
      setCallError(null);
      
      console.log(`Rufe ${contactToCall.name} unter ${contactToCall.phone} an...`);
      await startCall(contactToCall.phone);
      
    } catch (error) {
      console.error("Fehler beim Anrufen des nächsten Kontakts:", error);
      setCallError(error.message);
      setIsCallInProgress(false);
      
      // Bei Fehler zum nächsten Kontakt
      if (autoDialingActive && dialerActive) {
        setTimeout(() => {
          moveToNextContact();
        }, 3000);
      }
    }
  };
  
  /**
   * Wechselt zum nächsten Kontakt in der Liste
   */
  const moveToNextContact = () => {
    const nextIndex = currentContactIndex + 1;
    setCurrentContactIndex(nextIndex);
    
    if (nextIndex < contactList.length) {
      setCurrentContact(contactList[nextIndex]);
      
      // Wenn Auto-Dialing aktiv, nächsten Kontakt anrufen
      if (autoDialingActive && dialerActive) {
        setTimeout(() => {
          dialNextContact();
        }, 1500);
      }
    } else {
      console.log("Ende der Kontaktliste erreicht");
      setAutoDialingActive(false);
    }
  };
  
  /**
   * Simuliert einen angenommenen Anruf (nur für Tests)
   */
  const simulateAnsweredCall = () => {
    if (dialerActive && !callAnswered) {
      setCallAnswered(true);
      setFormLoading(true);
      
      // Formular laden simulieren
      setTimeout(() => {
        setFormLoading(false);
        setFormLoaded(true);
      }, 1500);
    }
  };
  
  // -------------------- Event-Handler --------------------
  
  /**
   * Handler für Änderungen der Telefonnummer
   */
  const handlePhoneNumberChange = (e) => {
    setPhoneNumber(e.target.value);
  };
  
  /**
   * Handler für das Absenden des manuellen Dialer-Formulars
   */
  const handleDialSubmit = (e) => {
    e.preventDefault();
    const formattedNumber = formatToE164(phoneNumber);
    startCall(formattedNumber);
  };
  
  // -------------------- Render-Funktionen --------------------
  
  /**
   * Rendert den Verbindungsstatus
   */
  const renderConnectionStatus = () => {
    if (!userStatus) return null;
    
    return (
      <div className="mt-2 flex items-center justify-center">
        <div className={`flex items-center rounded-full px-2 py-0.5 ${
          userStatus.available && userStatus.connected
            ? 'bg-green-50 text-green-600'
            : 'bg-red-50 text-red-500'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-1.5 ${
            userStatus.available && userStatus.connected ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-xs font-light">
            {userStatus.available && userStatus.connected
              ? 'Verbunden mit Telefonsystem'
              : `Nicht verbunden (${userStatus.status})`}
          </span>
        </div>
      </div>
    );
  };
  
  // -------------------- Komponenten-Rendering --------------------
  
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
                          callAnswered ? 'bg-green-500 animate-pulse' : isCallInProgress ? 'bg-yellow-500' : 'bg-gray-300'
                        }`}></div>
                        <span className="text-xs font-light">
                          {callAnswered 
                            ? 'Telefonat läuft' 
                            : (isCallInProgress ? 'Anruf wird getätigt' : 'Bereit')}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {userStatus && dialerActive && (
                    <div className="mb-4 bg-gray-50 p-2 rounded-lg">
                      <div className="flex items-center text-xs mb-1">
                        <div className={`w-5 h-5 rounded-full ${userStatus.available ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center mr-1.5`}>
                          {userStatus.available 
                            ? <ShieldCheckIcon className="w-3 h-3 text-green-500" /> 
                            : <ExclamationCircleIcon className="w-3 h-3 text-red-500" />
                          }
                        </div>
                        <span className="font-medium">{userStatus.status}</span>
                      </div>
                      <p className="text-xs font-light text-gray-500">
                        {userStatus.available 
                          ? "Sales Rep ist verfügbar und kann Anrufe tätigen." 
                          : "Sales Rep ist nicht verfügbar. Auto-Dialing deaktiviert."}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-light mb-3">
                      {dialerActive 
                        ? `PowerDialer ist aktiv. ${contactList.length} Kontakte in der Liste.` 
                        : "PowerDialer starten, um Kontakte anzurufen und Gespräche zu dokumentieren."
                      }
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <button
                        onClick={toggleDialer}
                        className={`flex items-center justify-center rounded-full transition-all duration-300 px-3 py-1.5 ${
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
                      
                      {dialerActive && userStatus?.available && (
                        <button
                          onClick={autoDialingActive ? stopDialingSequence : startDialingSequence}
                          className={`flex items-center justify-center rounded-full transition-all duration-300 px-3 py-1.5 ${
                            autoDialingActive 
                              ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' 
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          {autoDialingActive ? (
                            <>
                              <PauseIcon className="w-3 h-3 mr-1.5" />
                              <span className="text-xs font-light">Auto-Dial pausieren</span>
                            </>
                          ) : (
                            <>
                              <PhoneIcon className="w-3 h-3 mr-1.5" />
                              <span className="text-xs font-light">Auto-Dial starten</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {dialerActive && !callAnswered && userStatus?.available && (
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
                  disabled={isCallInProgress || !userStatus?.available}
                  className={`px-4 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 flex items-center ${
                    isCallInProgress || !userStatus?.available ? 'opacity-50 cursor-not-allowed' : ''
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
            
            {renderConnectionStatus()}
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
                          <div className={`w-2 h-2 rounded-full mr-1.5 ${
                            userStatus?.available ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                          }`}></div>
                          <span className="text-xs font-light text-gray-800">
                            {userStatus?.available ? 'Verfügbar' : 'Nicht verfügbar'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {callError && (
                      <div className="mt-3 p-2 bg-red-50 rounded-lg text-xs text-red-600">
                        {callError}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-gray-100 flex items-center justify-center relative mb-4">
                      <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                        {autoDialingActive ? (
                          <span className="text-lg md:text-xl font-light text-gray-500">
                            {contactList.length - currentContactIndex}
                          </span>
                        ) : (
                          <ArrowPathIcon className={`w-6 h-6 md:w-8 md:h-8 text-gray-300 ${
                            isCallInProgress ? 'animate-spin' : ''
                          }`} />
                        )}
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
                        <PhoneIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-green-500" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 font-light">
                      {autoDialingActive 
                        ? `Auto-Dial aktiv - ${contactList.length - currentContactIndex} verbleibend` 
                        : (isCallInProgress ? "Anruf wird getätigt..." : "PowerDialer ist aktiv")}
                    </p>
                    
                    {isCallInProgress && (
                      <div className="mt-4 text-center">
                        <div className="inline-flex items-center bg-blue-50 rounded-full px-3 py-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-2"></div>
                          <span className="text-xs text-blue-700">
                            {callAnswered ? "Gespräch läuft..." : "Anruf wird getätigt..."}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {callAnswered && (
                      <button 
                        onClick={endCurrentCall}
                        className="mt-4 flex items-center justify-center rounded-full transition-all duration-300 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100"
                      >
                        <span className="text-xs font-light">Gespräch beenden</span>
                      </button>
                    )}
                  </div>
                  
                  {!callAnswered && dialerActive && !isCallInProgress && (
                    <button 
                      onClick={userStatus?.available ? simulateAnsweredCall : checkSalesRepAvailability}
                      className="mt-auto transition-all duration-300 bg-white rounded-full border border-gray-200 py-2 md:py-3 px-4 md:px-6 flex items-center justify-center text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow group"
                    >
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gray-100 flex items-center justify-center mr-2 md:mr-3 group-hover:bg-gray-200 transition-colors">
                        {userStatus?.available 
                          ? <CheckCircleIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-500" />
                          : <ArrowPathIcon className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-500" />
                        }
                      </div>
                      <span className="text-sm font-light">
                        {userStatus?.available 
                          ? "Anruf angenommen" 
                          : "Verbindung prüfen"}
                      </span>
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
                      {dialerActive && userStatus?.available && (
                        <button 
                          onClick={simulateAnsweredCall}
                          className="text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors inline-flex items-center"
                        >
                          <CheckCircleIcon className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                          Gesprächsbeginn simulieren
                        </button>
                      )}
                      
                      {renderConnectionStatus()}
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
              
              {(!dialerActive || !currentContact) ? (
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
                        disabled={isCallInProgress || !dialerActive || !userStatus?.available}
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          (dialerActive && !isCallInProgress && userStatus?.available)
                            ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        title={!dialerActive 
                          ? "Aktivieren Sie zuerst den PowerDialer" 
                          : (isCallInProgress 
                              ? "Anruf läuft bereits" 
                              : (!userStatus?.available 
                                  ? "Sales Rep nicht verfügbar" 
                                  : "Kontakt anrufen"))}
                      >
                        <PhoneIcon className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <a href={`mailto:${currentContact.email}`} className="text-gray-500 hover:text-gray-700 transition-colors duration-200 text-xs block">
                      {currentContact.email}
                    </a>
                    
                    {autoDialingActive && (
                      <div className="mt-2 bg-blue-50 text-blue-700 p-2 rounded-lg text-xs">
                        Kontakt {currentContactIndex + 1} von {contactList.length}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-[#f5f5f7] rounded-xl md:rounded-2xl p-3 md:p-4 mb-4 md:mb-5">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-500">Bisherige Versuche:</span>
                      <span className="font-normal text-gray-800">{currentContact?.previousAttempts || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Letzter Kontakt:</span>
                      <span className="font-normal text-gray-800">{currentContact?.lastContact || "Keiner"}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-3 md:pt-4 flex-1">
                    <h4 className="font-normal text-xs mb-2 text-gray-500 flex items-center">
                      <DocumentTextIcon className="w-3 h-3 mr-1.5" />
                      Notizen:
                    </h4>
                    <div className="bg-[#f5f5f7] p-3 rounded-xl md:rounded-2xl flex-1 overflow-auto shadow-inner">
                      <p className="text-xs text-gray-600 leading-relaxed">{currentContact?.notes || "Keine Notizen verfügbar"}</p>
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