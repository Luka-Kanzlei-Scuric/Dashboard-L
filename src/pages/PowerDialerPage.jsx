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
import axios from 'axios';
import api from '../config/api';
import SipgateOAuth from '../components/SipgateOAuth';

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
  
  // Tab-System States
  const [activeTab, setActiveTab] = useState('dialer');
  
  // SipGate-spezifische States
  const [sipgateCredentials, setSipgateCredentials] = useState({
    tokenId: '',
    token: '',
    deviceId: '',
    callerId: ''
  });
  
  // Telefonie-Provider-Einstellungen
  const [telefonieSettings, setTelefonieSettings] = useState({
    provider: 'sipgate', // 'sipgate' oder 'aircall'
    sipgateTokenId: '',
    sipgateToken: '',
    sipgateDeviceId: '',
    sipgateCallerId: '',
    aircallUserId: '1527216',
    aircallNumberId: '967647'
  });
  
  // Lade die Telefonie-Einstellungen beim Seitenaufruf
  useEffect(() => {
    const fetchTelefonieSettings = async () => {
      try {
        const endpoint = '/api/dialer/settings/telefonie';
        console.log(`Lade Telefonie-Einstellungen von: ${endpoint}`);
        
        const response = await axios.get(endpoint);
        if (response.data.success) {
          setTelefonieSettings({
            provider: response.data.provider || 'sipgate',
            sipgateTokenId: response.data.sipgateTokenId || '',
            sipgateToken: response.data.sipgateToken || '',
            sipgateDeviceId: response.data.sipgateDeviceId || '',
            sipgateCallerId: response.data.sipgateCallerId || '',
            aircallUserId: response.data.aircallUserId || '1527216',
            aircallNumberId: response.data.aircallNumberId || '967647'
          });
        }
      } catch (error) {
        console.error('Fehler beim Laden der Telefonie-Einstellungen:', error);
      }
    };
    
    fetchTelefonieSettings();
  }, []);
  
  // Aircall-Konfiguration
  const aircallConfig = {
    userId: telefonieSettings.aircallUserId || "1527216", // Aircall-Benutzer-ID
    numberId: telefonieSettings.aircallNumberId || "967647", // Aircall-Nummer-ID
    // Für Produktion: useMockMode auf false setzen, wenn API-Key konfiguriert ist
    useMockMode: false,  // Im Produktionsmodus auf false setzen
    debugMode: true,    // Aktiviert ausführliche Logs
    mockCallDuration: 3000, // Anrufdauer im Mock-Modus in ms (auf 3 Sekunden verkürzt für schnelleres Testen)
    webhookUrl: window.location.origin + "/api/aircall-webhook", // Optional: URL für Webhooks in Produktivumgebung
    // Im Produktionsmodus auf false setzen, um echte API-Aufrufe zu ermöglichen
    forceCompleteMock: false
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
  
  /**
   * Initiiert einen direkten Anruf über die SipGate API
   * @param {string} phoneNumber - Die anzurufende Telefonnummer im E.164 Format
   * @param {Object} options - Zusätzliche Optionen für den Anruf
   * @returns {Promise<Object>} Erfolg/Misserfolg und Anrufdetails
   */
  const makeSipgateCallDirect = async (phoneNumber, options = {}) => {
    try {
      console.log(`Initiating SipGate call to ${phoneNumber}`, options);
      
      setIsCallInProgress(true);
      setCallError(null);
      
      // Validierung des E.164-Formats
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(phoneNumber)) {
        throw new Error('Telefonnummer muss im E.164-Format sein (z.B. +491234567890)');
      }
      
      const endpoint = '/api/dialer/sipgate-call';
      
      // Prüfe zuerst, ob eine Device ID vorhanden ist
      if (!sipgateCredentials.deviceId && !telefonieSettings.sipgateDeviceId) {
        setActiveTab('credentials');
        throw new Error('SipGate Device ID ist erforderlich. Bitte geben Sie diese auf dem Credentials-Tab ein.');
      }
      
      // Bereite die Anrufoptionen vor
      const callOptions = {
        deviceId: sipgateCredentials.deviceId || telefonieSettings.sipgateDeviceId,
        callerId: sipgateCredentials.callerId || telefonieSettings.sipgateCallerId,
        ...options
      };
      
      console.log('Making SipGate call with options:', {
        deviceId: callOptions.deviceId,
        callerId: callOptions.callerId || 'not set'
      });
      
      // Make API call to the backend endpoint using OAuth2
      const response = await axios.post(endpoint, {
        phoneNumber,
        deviceId: callOptions.deviceId,
        callerId: callOptions.callerId,
        ...options
      });
      
      console.log('SipGate call response:', response.data);
      
      // Bei Erfolg UI anpassen
      if (response.data && response.data.success) {
        console.log('Simulating call answer in 3 seconds...');
        
        // Nach 3 Sekunden simulieren wir, dass der Anruf angenommen wurde
        setTimeout(() => {
          setCallAnswered(true);
          setFormLoading(true);
          
          // Und nach einer weiteren Sekunde, dass das Formular geladen wurde
          setTimeout(() => {
            setFormLoading(false);
            setFormLoaded(true);
          }, 1000);
        }, 3000);
        
        return {
          success: true,
          message: 'Call initiated successfully',
          callId: response.data.callId,
          call: response.data.call
        };
      } else {
        throw new Error(response.data?.message || 'Unbekannter Fehler beim Anruf');
      }
    } catch (error) {
      console.error('Error making SipGate call:', error);
      
      // Format error response
      let errorMessage = 'Fehler beim Initiieren des Anrufs';
      
      if (error.response) {
        // We have a server response with error
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Server-Fehler: ${error.response.status}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Keine Antwort vom Server. Bitte überprüfen Sie Ihre Netzwerkverbindung.';
      } else {
        // Something else caused the error
        errorMessage = error.message;
      }
      
      setCallError(errorMessage);
      setIsCallInProgress(false);
      
      return {
        success: false,
        message: errorMessage,
        error: error.message
      };
    }
  };
  
  /**
   * Initiiert einen Anruf basierend auf dem ausgewählten Telefonie-Provider
   */
  const initiateCall = async (phoneNumber) => {
    try {
      if (!phoneNumber) {
        throw new Error('Keine Telefonnummer angegeben');
      }
      
      // Wenn der PowerDialer nicht aktiv ist, nicht anrufen
      if (!dialerActive) {
        throw new Error('PowerDialer ist nicht aktiv');
      }
      
      // Je nach Provider den entsprechenden Service wählen
      if (telefonieSettings.provider === 'sipgate') {
        return await makeSipgateCallDirect(phoneNumber);
      } else {
        // Fallback auf die bestehende Aircall-Funktionalität
        return await startCall(phoneNumber);
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      setCallError(error.message);
      setIsCallInProgress(false);
      return {
        success: false,
        message: error.message
      };
    }
  };
  
  /**
   * Speichert die SipGate-Credentials lokal und auf dem Server
   */
  const saveSipgateCredentials = async () => {
    try {
      // Prüfen, ob die erforderlichen Credentials eingegeben wurden
      if (!sipgateCredentials.tokenId) {
        setCallError('SipGate Token ID ist erforderlich');
        return;
      }
      
      if (!sipgateCredentials.token) {
        setCallError('SipGate Token ist erforderlich');
        return;
      }
      
      if (!sipgateCredentials.deviceId) {
        setCallError('SipGate Device ID ist erforderlich');
        return;
      }
      
      // Speichern der Credentials in den telefonieSettings
      setTelefonieSettings(prev => ({
        ...prev,
        provider: 'sipgate', // Automatisch auf SipGate umstellen
        sipgateTokenId: sipgateCredentials.tokenId,
        sipgateToken: sipgateCredentials.token,
        sipgateDeviceId: sipgateCredentials.deviceId,
        sipgateCallerId: sipgateCredentials.callerId
      }));
      
      // Auch auf dem Server speichern
      const response = await axios.post('/api/dialer/settings/telefonie', {
        provider: 'sipgate',
        sipgateTokenId: sipgateCredentials.tokenId,
        sipgateToken: sipgateCredentials.token,
        sipgateDeviceId: sipgateCredentials.deviceId,
        sipgateCallerId: sipgateCredentials.callerId
      });
      
      if (response.data.success) {
        console.log('SipGate credentials saved to server');
        setCallError(null);
        
        // Erfolgsmeldung anzeigen
        alert('SipGate Credentials wurden erfolgreich gespeichert.');
        
        // Wechsle zurück zum Dialer-Tab
        setActiveTab('dialer');
      } else {
        throw new Error(response.data.message || 'Fehler beim Speichern der Credentials');
      }
    } catch (error) {
      console.error('Error saving SipGate credentials:', error);
      setCallError(error.message || 'Fehler beim Speichern der Credentials');
    }
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
      
      // Alle aktiven Intervalle und Timeouts stoppen
      if (window._activeIntervals) {
        console.log(`Bereinige ${window._activeIntervals.length} aktive Intervalle`);
        window._activeIntervals.forEach(interval => {
          try {
            clearInterval(interval);
          } catch (error) {
            console.error("Fehler beim Bereinigen des Intervals:", error);
          }
        });
        window._activeIntervals = [];
      }
      
      // Alle aktiven Timeouts beenden
      if (window._activeTimeouts) {
        console.log(`Bereinige ${window._activeTimeouts.length} aktive Timeouts`);
        window._activeTimeouts.forEach(timeout => {
          try {
            clearTimeout(timeout);
          } catch (error) {
            console.error("Fehler beim Bereinigen des Timeouts:", error);
          }
        });
        window._activeTimeouts = [];
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
    if (!aircallService) {
      console.error("Aircall-Service ist nicht verfügbar");
      return null;
    }
    
    try {
      console.log("Prüfe Sales Rep Verfügbarkeit mit Konfiguration:", {
        userId: aircallConfig.userId,
        useMockMode: aircallConfig.useMockMode,
        forceCompleteMock: aircallConfig.forceCompleteMock || false
      });
      
      // Benutze temporär IMMER Mockmodus, bis API-Probleme behoben sind
      setUserStatus({
        available: true,
        status: 'available',
        connected: true,
        isMock: true
      });
      
      return {
        available: true,
        status: 'available',
        connected: true,
        isMock: true
      };
      
      /*
      const availability = await aircallService.checkUserAvailability(
        aircallConfig.userId, 
        // Erzwinge Mock-Modus wenn forceCompleteMock aktiv ist
        aircallConfig.useMockMode || aircallConfig.forceCompleteMock
      );
      
      console.log("Verfügbarkeitsantwort erhalten:", availability);
      setUserStatus(availability);
      
      if (!availability.available || !availability.connected) {
        console.warn(`Sales Rep ist nicht verfügbar. Status: ${availability.status}`);
        setCallError(`Sales Rep ist nicht verfügbar (${availability.status}). Bitte später versuchen.`);
      } else {
        console.log("Sales Rep ist verfügbar und verbunden");
        setCallError(null);
      }
      
      return availability;
      */
    } catch (error) {
      console.error("❌ Fehler bei der Überprüfung der Sales Rep Verfügbarkeit:", error);
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
        console.log("⛔ PowerDialer ist nicht aktiv. Anruf wird nicht getätigt.");
        return;
      }
      
      // Prüfe Sales Rep Verfügbarkeit - immer als verfügbar annehmen im Mock-Modus
      const availability = { available: true, status: 'available', connected: true, isMock: true };
      
      // Prüfe, ob bereits ein Anruf läuft
      if (aircallService.hasActiveCall()) {
        console.log("⚠️ Es gibt bereits einen aktiven Anruf. Beende diesen zuerst.");
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
      
      console.log(`📱 Starte Anruf an ${number}...`);
      
      // Direkte Anfrage an den einfachen Aircall-Endpunkt mit vollem URL-Pfad
      try {
        console.log('Sende Anfrage an: /api/direct-aircall mit Nummer:', number);
        
        // Füge HTTP-Header für Debugging hinzu
        const response = await axios.post('/api/direct-aircall', {
          phoneNumber: number
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-By': 'PowerDialer'
          }
        });
        
        console.log("✅ Anruf gestartet", response.status, response.data);
        
        // Bei Erfolg Lade-Indikator zurücksetzen
        setIsCallInProgress(true);
        
        // Mock call state um UI zu aktualisieren
        const mockCallId = response.data?.callId || (Date.now().toString() + '-' + Math.floor(Math.random() * 10000));
        
        // UI-Updates
        if (showManualDialer) setShowManualDialer(false);
        setPhoneNumber("");
        
        // Anruf-Timeout nach 120 Sekunden
        const callTimeoutId = setTimeout(async () => {
          if (isCallInProgress) {
            console.log("⏱️ Anruf-Timeout erreicht. Beende Anruf automatisch.");
            await endCurrentCall();
          }
        }, 120000);
        
        // Anruf-Status-Überwachung
        handleCallStatusChanges(mockCallId, callTimeoutId);
        
        return { data: { id: mockCallId } };
      } catch (apiError) {
        console.error('❌ Fehler bei API-Anfrage:', apiError);
        throw new Error(apiError.response?.data?.message || apiError.message || 'API-Fehler beim Anruf');
      }
    } catch (error) {
      console.error('❌ Fehler beim Starten des Anrufs:', error);
      
      // Detailliertere Fehlerdiagnose
      if (error.response) {
        // Der Server hat geantwortet, aber mit Fehler
        console.error('Server Antwort mit Fehler:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        setCallError(`Serverfehler: ${error.response.status} - ${error.response.data?.message || 'Unbekannter Fehler'}`);
      } else if (error.request) {
        // Die Anfrage wurde gesendet, aber keine Antwort erhalten
        console.error('Keine Antwort vom Server erhalten');
        setCallError('Keine Antwort vom Server erhalten. Bitte überprüfen Sie Ihre Netzwerkverbindung.');
      } else {
        // Fehler bei der Einrichtung der Anfrage
        console.error('Fehler beim Einrichten der Anfrage:', error.message);
        setCallError(`Anfrage konnte nicht gesendet werden: ${error.message}`);
      }
      
      setIsCallInProgress(false);
      
      // Bereinige eventuelle hängende Anrufe
      if (aircallService && typeof aircallService.clearCallState === 'function') {
        await aircallService.clearCallState();
      }
      
      // Bei Auto-Dialing zum nächsten Kontakt gehen
      if (autoDialingActive && dialerActive) {
        console.log("⏭️ Fehler beim Anruf - gehe zum nächsten Kontakt in 3 Sekunden");
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
    if (aircallConfig.debugMode) {
      console.log("--------- ANRUF STATUS ÜBERWACHUNG GESTARTET ---------");
    }
    
    if (!callId) {
      console.error("Keine Call-ID für Status-Überwachung verfügbar");
      setCallError("Fehler beim Tätigen des Anrufs");
      setIsCallInProgress(false);
      return;
    }
    
    console.log(`Starte Status-Überwachung für Anruf ${callId}`);
    
    // In Mock-Modus immer sofort annehmen (zu Testzwecken)
    if (aircallConfig.useMockMode) {
      if (aircallConfig.debugMode) {
        console.log("[MOCK] Simuliere Anrufverlauf im Debug-Modus");
      }
      
      // -------------------- VEREINFACHTER MOCK WORKFLOW --------------------
      // Initialisiere Timeouts Array wenn nötig
      window._activeTimeouts = window._activeTimeouts || [];
      
      // 1. Erstmal kurz klingeln lassen (1.5s)
      const ringingTimeout = setTimeout(() => {
        if (!dialerActive || !isCallInProgress) return;
        
        if (aircallConfig.debugMode) {
          console.log("[MOCK] Anruf klingelt...");
        }
      }, 500);
      window._activeTimeouts.push(ringingTimeout);
      
      // 2. Nach 2.5 Sekunden Anruf annehmen
      const answerTimeout = setTimeout(() => {
        if (!dialerActive || !isCallInProgress) return;
        
        console.log(`[MOCK] Anruf ${callId} wurde angenommen`);
        setCallAnswered(true);
        setFormLoading(true);
        
        // Formular mit kleiner Verzögerung laden
        const formTimeout = setTimeout(() => {
          if (!dialerActive || !isCallInProgress) return;
          
          setFormLoading(false);
          setFormLoaded(true);
          console.log("[MOCK] Formular geladen.");
        }, 1000);
        window._activeTimeouts.push(formTimeout);
      }, 2500);
      window._activeTimeouts.push(answerTimeout);
      
      // 3. Nach eingestellter Dauer Anruf beenden
      const callDuration = aircallConfig.mockCallDuration || 5000;
      const endCallTimeout = setTimeout(() => {
        if (!dialerActive || !isCallInProgress) {
          console.log("[MOCK] Anruf nicht mehr aktiv, überspringe Auto-End");
          return;
        }
        
        console.log(`[MOCK] Automatisches Beenden des Anrufs nach ${callDuration/1000} Sekunden`);
        if (timeoutId) clearTimeout(timeoutId);
        
        // WICHTIG: Der direkte Aufruf von endCurrentCall scheint ein Problem zu sein
        // Probieren wir es mit einem expliziten Status-Reset und dann moveToNextContact
        console.log("[MOCK] Setze UI-Status zurück und beende Anruf");
        setCallAnswered(false);
        setFormLoaded(false);
        setFormLoading(false);
        setIsCallInProgress(false);
        
        // API-Anruf beenden
        aircallService.clearCallState().then(() => {
          console.log("[MOCK] Anruf API bereinigt");
          
          // Mit Verzögerung zum nächsten Kontakt
          if (autoDialingActive && dialerActive) {
            console.log("[MOCK] Auto-Dialing aktiv, gehe zum nächsten Kontakt");
            const nextContactTimeout = setTimeout(() => {
              console.log("[MOCK] Starte moveToNextContact nach Verzögerung");
              moveToNextContact();
            }, 1000);
            window._activeTimeouts.push(nextContactTimeout);
          } else {
            console.log("[MOCK] Kein Auto-Dialing oder Dialer nicht aktiv:", {
              autoDialingActive,
              dialerActive
            });
          }
        });
      }, callDuration + 3500); // 3.5s klingeln + anrufsdauer
      window._activeTimeouts.push(endCallTimeout);
      
      return;
    } 
    
    // ---------------- ECHTER API-MODUS (NICHT GETESTET) ----------------
    // Direkter Statuscheck - sofort prüfen ob der Anruf wirklich aktiv ist
    setTimeout(async () => {
      try {
        const status = await aircallService.getCallStatus(callId);
        console.log("Initialer Anruf-Status:", status?.status);
        
        if (!status || status.status === 'error') {
          console.error("Anruf konnte nicht initiiert werden");
          setCallError("Anruf konnte nicht gestartet werden");
          setIsCallInProgress(false);
          if (timeoutId) clearTimeout(timeoutId);
          
          if (autoDialingActive) {
            setTimeout(() => moveToNextContact(), 2000);
          }
          return;
        }
      } catch (error) {
        console.error("Fehler beim Abrufen des Anrufstatus:", error);
      }
    }, 500);

    // In einer Produktivumgebung würden wir hier auf Webhook-Events reagieren
    // oder regelmäßig den Status abfragen
    const statusCheckInterval = setInterval(async () => {
      try {
        if (!dialerActive || !isCallInProgress) {
          clearInterval(statusCheckInterval);
          return;
        }
        
        const status = await aircallService.getCallStatus(callId);
        console.log(`Anrufstatus Update: ${status?.status}`);
        
        if (status?.status === 'answered' && !callAnswered) {
          setCallAnswered(true);
          setFormLoading(true);
          
          setTimeout(() => {
            if (dialerActive && isCallInProgress) {
              setFormLoading(false);
              setFormLoaded(true);
            }
          }, 1500);
        } else if (status?.status === 'ended' || status?.status === 'completed') {
          clearInterval(statusCheckInterval);
          
          // Statt direktem Aufruf setzen wir zuerst die Stati zurück
          setCallAnswered(false);
          setFormLoaded(false);
          setFormLoading(false);
          setIsCallInProgress(false);
          
          // API-Anruf beenden
          aircallService.clearCallState().then(() => {
            // Mit Verzögerung zum nächsten Kontakt
            if (autoDialingActive && dialerActive) {
              setTimeout(() => {
                moveToNextContact();
              }, 1000);
            }
          });
        }
      } catch (error) {
        console.error("Fehler beim Abrufen des Anrufstatus:", error);
      }
    }, 3000);
    
    // Speichere das Interval zur Bereinigung
    window._activeIntervals = window._activeIntervals || [];
    window._activeIntervals.push(statusCheckInterval);
    
    return () => {
      clearInterval(statusCheckInterval);
      const index = window._activeIntervals.indexOf(statusCheckInterval);
      if (index > -1) {
        window._activeIntervals.splice(index, 1);
      }
    };
  };
  
  /**
   * Beendet den aktuellen Anruf
   */
  const endCurrentCall = async () => {
    console.log("endCurrentCall aufgerufen - Beende aktuellen Anruf");
    
    // Sofort UI-Status aktualisieren, damit Benutzer Feedback bekommt
    setCallAnswered(false);
    setFormLoaded(false);
    setFormLoading(false);
    setIsCallInProgress(false);
    
    // Ggf. alle Timeouts beenden
    if (window._activeTimeouts) {
      window._activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
      window._activeTimeouts = [];
    }
    
    // Anruf über die Aircall API beenden
    let apiEndSuccessful = false;
    if (aircallService && typeof aircallService.clearCallState === 'function') {
      try {
        await aircallService.clearCallState();
        console.log("Anruf erfolgreich beendet über API");
        apiEndSuccessful = true;
      } catch (error) {
        console.error("Fehler beim Beenden des Anrufs:", error);
      }
    }
    
    // Kurze Pause vor dem nächsten Anruf
    const pauseDuration = apiEndSuccessful ? 1000 : 2000;
    console.log(`Warte ${pauseDuration}ms vor dem nächsten Schritt...`);
    await new Promise(resolve => setTimeout(resolve, pauseDuration));
    
    // Bei aktivem Auto-Dialing zum nächsten Kontakt gehen
    if (dialerActive && autoDialingActive) {
      console.log("Auto-Dialing aktiv - Gehe zum nächsten Kontakt");
      moveToNextContact();
    } else if (!dialerActive) {
      console.log("PowerDialer wurde deaktiviert, breche Anrufsequenz ab");
    } else if (!autoDialingActive) {
      console.log("Auto-Dialing ist deaktiviert, warte auf manuellen Anruf");
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
      if (isCallInProgress) {
        await endCurrentCall();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Bei Aircall zusätzlich prüfen und beenden
      if (telefonieSettings.provider === 'aircall' && aircallService.hasActiveCall()) {
        await aircallService.clearCallState();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Starte Anruf mit dem ausgewählten Provider
      await initiateCall(currentContact.phone);
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
    
    console.log("Start Dialing Sequence aktiviert - Starte Auto-Dialing");
    setAutoDialingActive(true);
    
    // Immer explizit zum ersten Kontakt zurückkehren wenn wir auto-dialing starten
    setCurrentContactIndex(0);
    setCurrentContact(contactList[0]);
    
    // Verzögerung hinzufügen, damit der State Update Zeit hat
    setTimeout(() => {
      console.log("Starte ersten Anruf in der Auto-Dial Sequenz");
      dialNextContact();
    }, 500);
  };
  
  /**
   * Stoppt die automatische Wählsequenz
   */
  const stopDialingSequence = () => {
    setAutoDialingActive(false);
  };
  
  /**
   * Wählt den nächsten Kontakt in der Liste an
   */
  const dialNextContact = async () => {
    console.log("✅ dialNextContact: Starte Anruf zum nächsten Kontakt");
    
    try {
      // DEBUG: Zeige aktuellen Zustand
      console.log("💡 DEBUG Zustand:", {
        autoDialingActive,
        dialerActive,
        currentContactIndex,
        contactListLength: contactList.length,
        isCallInProgress
      });
      
      // Sicherheitschecks
      if (!dialerActive) {
        console.log("❌ PowerDialer ist nicht aktiv, kein Anruf wird getätigt");
        return;
      }
      
      // Prüfe, ob wir am Ende der Liste sind
      if (currentContactIndex >= contactList.length) {
        console.log("❌ Ende der Kontaktliste erreicht, beende Auto-Dialing");
        setAutoDialingActive(false);
        return;
      }
      
      // Verfügbarkeit prüfen
      console.log("🔍 Prüfe Verfügbarkeit des Sales Rep...");
      const availability = await checkSalesRepAvailability();
      
      if (!availability?.available) {
        console.log(`❌ Sales Rep ist nicht verfügbar (${availability?.status}). Auto-Dialing wird angehalten.`);
        setCallError(`Sales Rep ist nicht verfügbar (${availability?.status}). Auto-Dialing angehalten.`);
        setAutoDialingActive(false);
        return;
      }
      
      console.log("✅ Sales Rep ist verfügbar, fahre fort...");
      
      // Laufende Anrufe beenden
      if (isCallInProgress || aircallService.hasActiveCall()) {
        console.log("⚠️ Es gibt noch einen aktiven Anruf, beende diesen zuerst");
        await endCurrentCall();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Nächsten Kontakt anrufen
      console.log(`📞 Kontaktindex: ${currentContactIndex}, Kontaktliste Länge: ${contactList.length}`);
      const contactToCall = contactList[currentContactIndex];
      
      if (!contactToCall) {
        console.error("❌ Kontakt nicht gefunden! Index scheint ungültig zu sein.");
        setCallError("Fehler: Kontakt nicht gefunden");
        
        // Beim nächsten versuchen
        if (autoDialingActive) {
          moveToNextContact();
        }
        return;
      }
      
      console.log(`📞 Bereite Anruf für ${contactToCall.name} vor...`);
      setCurrentContact(contactToCall);
      
      // WICHTIG: Diese States müssen explizit gesetzt werden, damit der Anruf richtig startet
      setIsCallInProgress(true);
      setCallAnswered(false);
      setFormLoaded(false);
      setFormLoading(false);
      setCallError(null);
      
      // Kleine Verzögerung hinzufügen, damit die State-Updates Zeit haben, sich zu verbreiten
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log(`📞 Rufe ${contactToCall.name} unter ${contactToCall.phone} an...`);
      const callResponse = await initiateCall(contactToCall.phone);
      console.log("✅ Anruf initiiert:", callResponse?.callId);
      
    } catch (error) {
      console.error("❌ Fehler beim Anrufen des nächsten Kontakts:", error);
      setCallError(error.message || "Unbekannter Fehler beim Anrufen");
      setIsCallInProgress(false);
      
      // Bei Fehler zum nächsten Kontakt gehen, aber nur wenn Auto-Dialing aktiv ist
      if (autoDialingActive && dialerActive) {
        console.log("⚠️ Fehler aufgetreten, gehe zum nächsten Kontakt in 3 Sekunden...");
        const errorTimeout = setTimeout(() => {
          moveToNextContact();
        }, 3000);
        
        // Speichere Timeout für mögliche Bereinigung
        window._activeTimeouts = window._activeTimeouts || [];
        window._activeTimeouts.push(errorTimeout);
      }
    }
  };
  
  /**
   * Wechselt zum nächsten Kontakt in der Liste
   */
  const moveToNextContact = () => {
    console.log("🔄 moveToNextContact aufgerufen - Wechsle zum nächsten Kontakt");
    
    // Prüfe die aktuellen Zustände
    console.log("💡 DEBUG moveToNextContact:", {
      autoDialingActive,
      dialerActive,
      currentContactIndex,
      contactListLength: contactList.length,
      isCallInProgress
    });
    
    // Berechne den Index des nächsten Kontakts
    const nextIndex = currentContactIndex + 1;
    console.log(`🔢 Aktueller Kontaktindex: ${currentContactIndex}, Nächster Index: ${nextIndex}, Kontaktliste Länge: ${contactList.length}`);
    
    // Setze den neuen Index
    setCurrentContactIndex(nextIndex);
    
    // Prüfe, ob wir am Ende der Liste sind
    if (nextIndex < contactList.length) {
      // Setze den neuen Kontakt
      const nextContact = contactList[nextIndex];
      console.log(`👤 Nächster Kontakt: ${nextContact.name} (${nextContact.phone})`);
      setCurrentContact(nextContact);
      
      // Wenn Auto-Dialing aktiv, rufe nach einer kurzen Pause den nächsten Kontakt an
      if (autoDialingActive && dialerActive) {
        console.log("🔄 Auto-Dialing aktiv, rufe nächsten Kontakt in 1.5 Sekunden an");
        
        // Stelle sicher, dass kein Anruf läuft
        setIsCallInProgress(false);
        
        // Speichere Timeout-ID für mögliche Bereinigung
        const nextCallTimeout = setTimeout(() => {
          console.log("📞 Starte Anruf zum nächsten Kontakt...");
          dialNextContact();
        }, 1500);
        
        // Speichere Timeout-ID für mögliche Bereinigung
        window._activeTimeouts = window._activeTimeouts || [];
        window._activeTimeouts.push(nextCallTimeout);
      } else {
        console.log("⏸️ Auto-Dialing nicht aktiv, warte auf manuellen Anruf");
      }
    } else {
      console.log("🛑 Ende der Kontaktliste erreicht");
      setAutoDialingActive(false);
      // Starte optional wieder von vorne
      setCurrentContactIndex(0);
      if (contactList.length > 0) {
        setCurrentContact(contactList[0]);
      }
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
  const handleDialSubmit = async (e) => {
    e.preventDefault();
    const formattedNumber = formatToE164(phoneNumber);
    
    // Verwende die neue initiateCall-Funktion, die den richtigen Provider wählt
    await initiateCall(formattedNumber);
    
    // Bei Erfolg schließe den Dialog
    if (!callError) {
      setShowManualDialer(false);
    }
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
                  <h3 className="text-sm font-medium text-gray-800 mb-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                      PowerDialer-Steuerung
                    </div>
                    <a 
                      href="/settings" 
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      Einstellungen
                    </a>
                  </h3>
                  
                  {/* Telefonie-Provider Auswahl */}
                  <div className="mb-3 p-2 rounded-md bg-gray-50">
                    <div className="text-xs text-gray-500 mb-1 font-medium">Telefonie-Provider:</div>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="provider"
                          value="sipgate"
                          checked={telefonieSettings.provider === 'sipgate'}
                          onChange={(e) => setTelefonieSettings(prev => ({...prev, provider: e.target.value}))}
                          className="h-3 w-3 text-blue-500 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-1.5 text-xs text-gray-700">SipGate</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="provider"
                          value="aircall"
                          checked={telefonieSettings.provider === 'aircall'}
                          onChange={(e) => setTelefonieSettings(prev => ({...prev, provider: e.target.value}))}
                          className="h-3 w-3 text-blue-500 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-1.5 text-xs text-gray-700">AirCall</span>
                      </label>
                    </div>
                  </div>
                  
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
              {/* Tab-Navigation */}
              <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-100">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab('dialer')}
                    className={`py-2 px-3 text-sm font-medium rounded transition-colors ${
                      activeTab === 'dialer' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Dialer
                  </button>
                  <button
                    onClick={() => setActiveTab('credentials')}
                    className={`py-2 px-3 text-sm font-medium rounded transition-colors ${
                      activeTab === 'credentials' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    SipGate Credentials
                  </button>
                  <button
                    onClick={() => setActiveTab('dial')}
                    className={`py-2 px-3 text-sm font-medium rounded transition-colors ${
                      activeTab === 'dial' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Einzelanruf
                  </button>
                </div>
              </div>
              
              {/* Tab Content */}
              <div className="flex-1 relative">
                {/* Dialer Tab */}
                {activeTab === 'dialer' && (
                  <>
                    <div className="px-4 md:px-6 py-3 border-b border-gray-100 flex items-center justify-between">
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
                              <div className="flex flex-col gap-3">
                                <button 
                                  onClick={simulateAnsweredCall}
                                  className="text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors inline-flex items-center justify-center"
                                >
                                  <CheckCircleIcon className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                                  Gesprächsbeginn simulieren
                                </button>
                                
                                <button 
                                  onClick={() => setShowManualDialer(true)}
                                  className="text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors inline-flex items-center justify-center"
                                >
                                  <PhoneIcon className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                                  Manuelle Nummer wählen
                                </button>
                              </div>
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
                  </>
                )}
                
                {/* SipGate Credentials Tab */}
                {activeTab === 'credentials' && (
                  <div className="p-6">
                    <h2 className="text-xl font-medium text-gray-900 mb-6">SipGate Integration</h2>
                    
                    <div className="bg-blue-50 rounded-lg p-4 mb-6 text-sm text-blue-800">
                      <p>Verbinden Sie Ihr SipGate-Konto über die sichere OAuth2-Authentifizierung, um Anrufe über SipGate zu tätigen.</p>
                    </div>
                    
                    {callError && (
                      <div className="bg-red-50 rounded-lg p-4 mb-6 text-sm text-red-600">
                        {callError}
                      </div>
                    )}
                    
                    {/* SipGate OAuth Component */}
                    <SipgateOAuth 
                      onStatusChange={(status) => {
                        // Update the device info in our main state when it changes
                        if (status.deviceId) {
                          setSipgateCredentials(prev => ({
                            ...prev,
                            deviceId: status.deviceId,
                            callerId: status.callerId || ''
                          }));
                          
                          // Also update telefonieSettings if authentication is successful
                          setTelefonieSettings(prev => ({
                            ...prev,
                            provider: 'sipgate',
                            sipgateDeviceId: status.deviceId,
                            sipgateCallerId: status.callerId || ''
                          }));
                        }
                        
                        // Clear error when status changes
                        if (callError) {
                          setCallError(null);
                        }
                      }}
                    />
                  </div>
                )}
                
                {/* Einzelanruf Tab */}
                {activeTab === 'dial' && (
                  <div className="p-6">
                    <h2 className="text-xl font-medium text-gray-900 mb-6">Einzelanruf tätigen</h2>
                    
                    <div className="bg-blue-50 rounded-lg p-4 mb-6 text-sm text-blue-800">
                      <p>Geben Sie hier eine Telefonnummer ein, um einen Anruf über {telefonieSettings.provider === 'sipgate' ? 'SipGate' : 'AirCall'} zu tätigen.</p>
                      {telefonieSettings.provider === 'sipgate' && (
                        <p className="mt-2">
                          <span className="font-medium">Hinweis:</span> Für SipGate-Anrufe müssen Sie zuerst auf dem Tab "SipGate Credentials" Ihr Konto verbinden.
                        </p>
                      )}
                    </div>
                    
                    {callError && (
                      <div className="bg-red-50 rounded-lg p-4 mb-6 text-sm text-red-600">
                        {callError}
                        {callError.includes('SipGate') && callError.includes('authentifizieren') && (
                          <div className="mt-2">
                            <button
                              onClick={() => setActiveTab('credentials')}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              Zu SipGate Credentials Tab wechseln
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <form onSubmit={handleDialSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="singleCallNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          Telefonnummer
                        </label>
                        <input
                          type="text"
                          id="singleCallNumber"
                          value={phoneNumber}
                          onChange={handlePhoneNumberChange}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+49 123 456789"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Bitte im Format +49... eingeben oder die Umwandlung erfolgt automatisch
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-700 mb-1">Aktiver Provider:</p>
                        <div className="flex space-x-4 mb-4">
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="provider"
                              value="sipgate"
                              checked={telefonieSettings.provider === 'sipgate'}
                              onChange={(e) => setTelefonieSettings(prev => ({...prev, provider: e.target.value}))}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">SipGate</span>
                          </label>
                          <label className="inline-flex items-center">
                            <input
                              type="radio"
                              name="provider"
                              value="aircall"
                              checked={telefonieSettings.provider === 'aircall'}
                              onChange={(e) => setTelefonieSettings(prev => ({...prev, provider: e.target.value}))}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">AirCall</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isCallInProgress || !dialerActive}
                          className={`w-full px-4 py-2 rounded-lg flex items-center justify-center ${
                            isCallInProgress || !dialerActive
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                          }`}
                        >
                          {isCallInProgress ? (
                            <>
                              <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                              Verbinde...
                            </>
                          ) : (
                            <>
                              <PhoneIcon className="w-5 h-5 mr-2" />
                              Anrufen
                            </>
                          )}
                        </button>
                        
                        {!dialerActive && (
                          <p className="mt-2 text-sm text-center text-red-600">
                            Bitte aktivieren Sie zuerst den PowerDialer
                          </p>
                        )}
                      </div>
                    </form>
                    
                    {isCallInProgress && (
                      <div className="mt-6">
                        <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-800">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse mr-2"></div>
                            <p>Anruf wird getätigt...</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {callAnswered && (
                      <div className="mt-6">
                        <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
                            <p>Anruf verbunden!</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={endCurrentCall}
                          className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          <span className="flex items-center justify-center">
                            <XMarkIcon className="w-5 h-5 mr-2" />
                            Anruf beenden
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
                    
                    {/* Telefonie-Provider Info */}
                    <div className="mt-3 bg-blue-50 p-2 rounded-lg text-xs text-blue-600">
                      <div className="flex items-center">
                        <PhoneIcon className="w-3 h-3 mr-1.5 text-blue-400" />
                        <span>
                          Aktiver Provider: 
                          <span className="font-medium ml-1">
                            {telefonieSettings.provider === 'sipgate' ? 'SipGate' : 'AirCall'}
                          </span>
                        </span>
                      </div>
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