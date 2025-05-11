import React, { useState, useEffect, useCallback } from 'react';
import { 
  PhoneIcon, 
  PauseIcon, 
  PlayIcon, 
  ClockIcon, 
  UserIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import dialerService from '../services/dialerService';
import axios from 'axios';
import SipgateDialer from '../components/SipgateDialer';
import SipgateOAuth from '../components/SipgateOAuth';

/**
 * SimpleDialerPage - Einfache direkte Anruffunktion über Aircall API
 * 
 * Diese Komponente bietet eine einfache Oberfläche zum direkten Wählen von Telefonnummern
 * über die Aircall API, ohne komplexe Dialer-Funktionalität.
 */
const NewPowerDialerPage = () => {
  // Anruf-Konfiguration
  const [phoneNumber, setPhoneNumber] = useState('');
  const [aircallConfig, setAircallConfig] = useState({
    userId: '1527216',  // Default Aircall User ID
    numberId: '967647'  // Default Aircall Number ID
  });
  
  // Status-Verwaltung
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [callStatus, setCallStatus] = useState(null); // 'ringing', 'connected', 'completed', 'failed'
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  
  // UI-State
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [callHistory, setCallHistory] = useState([]);
  
  // SipGate auth status
  const [sipgateAuthStatus, setSipgateAuthStatus] = useState({
    authenticated: false,
    deviceId: null,
    callerId: null
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
  
  // Handler for SipGate authentication status changes
  const handleSipgateAuthStatusChange = (status) => {
    console.log('SipGate auth status changed:', status);
    setSipgateAuthStatus(status);
    
    // Update device settings if available
    if (status.deviceId || status.callerId) {
      setTelefonieSettings(prev => ({
        ...prev,
        sipgateDeviceId: status.deviceId || prev.sipgateDeviceId,
        sipgateCallerId: status.callerId || prev.sipgateCallerId
      }));
    }
  };

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
          
          // Aktualisiere die AirCall-Konfiguration
          setAircallConfig({
            userId: response.data.aircallUserId || '1527216',
            numberId: response.data.aircallNumberId || '967647'
          });
        }
      } catch (error) {
        console.error('Fehler beim Laden der Telefonie-Einstellungen:', error);
      }
    };
    
    fetchTelefonieSettings();
  }, []);
  
  /**
   * Direkte Anruf-Funktion über die Aircall API
   */
  const makeDirectCall = async (e) => {
    if (e) e.preventDefault();
    
    try {
      // UI-Status zurücksetzen
      setLoading(true);
      setError(null);
      setCallStatus(null);
      
      // 1. Eingaben validieren
      if (!phoneNumber) {
        setError('Bitte geben Sie eine Telefonnummer ein');
        return;
      }
      
      if (!aircallConfig.userId || !aircallConfig.numberId) {
        setError('Aircall User ID und Number ID sind erforderlich');
        return;
      }
      
      // 2. Telefonnummer im E.164-Format formatieren (wichtig für Aircall)
      const formattedNumber = formatE164Number(phoneNumber);
      if (!formattedNumber) {
        setError('Ungültiges Telefonnummernformat. Bitte im Format +49... eingeben.');
        return;
      }
      
      // 3. API-Anfrage vorbereiten und senden
      console.log(`✨ Starte direkten Anruf an ${formattedNumber}`);
      console.log('📞 Sende Anruf an: /api/direct-aircall mit Telefonnummer:', formattedNumber);
      
      // 4. API-Anfrage durchführen
      setCallStatus('initiating');
      
      const response = await axios.post('/api/direct-aircall', {
        phoneNumber: formattedNumber
      }, {
        // Lange Timeout-Zeit setzen, da Aircall-API langsam sein kann
        timeout: 20000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🟢 Anruf-Antwort vom Server:', response.status, response.data);
      
      // 5. Erfolgreiche Antwort verarbeiten
      // Jede 200er Antwort vom Server gilt als erfolgreicher Anruf
      if (response.status === 200) {
        console.log('🟢 Anruf erfolgreich gestartet:', response.data);
        
        // UI-Statusanzeige aktualisieren
        setCallStatus('ringing');
        setCallStartTime(new Date());
        
        // Anruf zur Historie hinzufügen
        const newCall = {
          id: response.data?.callId || Math.random().toString(36).substring(2, 15),
          phoneNumber: formattedNumber,
          userId: aircallConfig.userId,
          numberId: aircallConfig.numberId,
          startTime: new Date(),
          status: 'started',
          apiResponse: response.data || { status: 'success' }
        };
        setCallHistory(prev => [newCall, ...prev]);
        
        // Erfolgsmeldung anzeigen
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
        // Eingabefeld zurücksetzen
        setPhoneNumber('');
      } else {
        console.warn('⚠️ Unerwartete Antwort vom Server:', response);
        throw new Error(
          (response.data && response.data.message) || 
          `Unerwartete Antwort vom Server: ${response.status}`
        );
      }
    } catch (error) {
      console.error('🔴 Fehler beim Anruf:', error);
      
      // Detaillierte Fehlerdiagnose für besseres Debugging
      if (error.response) {
        // Der Server hat geantwortet, aber mit Fehlercode
        console.error('Server-Antwort mit Fehler:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        
        // Benutzerdefinierte Fehlermeldung basierend auf Serverantwort
        let errorMessage = 'Fehler beim Starten des Anrufs';
        
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && error.response.data.error) {
          const errorData = error.response.data.error;
          if (typeof errorData === 'object') {
            // Erweiterte Fehlerstruktur für mehrere Versuche
            errorMessage = 'Alle Verbindungsversuche zu Aircall fehlgeschlagen.';
          } else {
            errorMessage = String(errorData);
          }
        }
        
        setError(`Server-Fehler: ${errorMessage}`);
      } else if (error.request) {
        // Anfrage gesendet, aber keine Antwort erhalten
        console.error('Keine Antwort vom Server erhalten:', error.request);
        setError('Keine Antwort vom Server erhalten. Bitte überprüfen Sie Ihre Internetverbindung oder kontaktieren Sie den Administrator.');
      } else {
        // Fehler beim Einrichten der Anfrage
        console.error('Fehler beim Einrichten der Anfrage:', error.message);
        setError(`Fehler beim Senden der Anfrage: ${error.message}`);
      }
      
      // UI-Status aktualisieren
      setCallStatus('failed');
      
      // Anruf zur Historie hinzufügen (als fehlgeschlagen)
      const failedCall = {
        id: Math.random().toString(36).substring(2, 15),
        phoneNumber: formatE164Number(phoneNumber) || phoneNumber,
        userId: aircallConfig.userId,
        numberId: aircallConfig.numberId,
        startTime: new Date(),
        status: 'failed',
        error: error.message || 'Unbekannter Fehler'
      };
      setCallHistory(prev => [failedCall, ...prev]);
    } finally {
      // Immer den Ladestatus zurücksetzen, egal ob Erfolg oder Fehler
      setLoading(false);
    }
  };
  
  /**
   * Formatiere eine Telefonnummer ins E.164-Format
   * E.164 ist das international standardisierte Format für Telefonnummern:
   * - beginnt immer mit +
   * - gefolgt von Ländervorwahl (Deutschland 49)
   * - dann die Rufnummer ohne führende 0
   * - keine Klammern, Bindestriche oder Leerzeichen
   * 
   * Beispiele:
   * - +49123456789 (deutsches Festnetz)
   * - +491701234567 (deutsche Mobilnummer)
   */
  const formatE164Number = (number) => {
    if (!number) return null;
    
    // Entferne alle Leerzeichen, Klammern, Bindestriche, etc.
    const digitsOnly = number.replace(/\s+/g, '');
    
    // Prüfe ob die Nummer bereits korrekt mit + beginnt
    if (digitsOnly.startsWith('+')) {
      // Entferne alle Nicht-Ziffern außer dem führenden +
      let cleaned = '+' + digitsOnly.substring(1).replace(/\D/g, '');
      
      // Validiere E.164 Format: + gefolgt von 7-15 Ziffern
      const e164Regex = /^\+[1-9]\d{6,14}$/;
      return e164Regex.test(cleaned) ? cleaned : null;
    }
    
    // Behandle Nummern ohne +
    let cleaned = digitsOnly.replace(/\D/g, '');
    
    // Deutsche Nummern: Mit 0 beginnend -> durch +49 ersetzen
    if (cleaned.startsWith('0')) {
      cleaned = '49' + cleaned.substring(1);
    } 
    // Wenn keine 0, aber vermutlich deutsche Nummer, dann 49 voranstellen
    else if (!cleaned.startsWith('49') && cleaned.length <= 11) {
      cleaned = '49' + cleaned;
    }
    
    // Füge + hinzu
    cleaned = '+' + cleaned;
    
    // Finale Validierung für E.164 Format
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    if (e164Regex.test(cleaned)) {
      console.log(`✅ Nummer ${number} erfolgreich zu E.164 Format konvertiert: ${cleaned}`);
      return cleaned;
    } else {
      console.warn(`❌ Konnte Nummer ${number} nicht ins E.164 Format konvertieren`);
      return null;
    }
  };
  
  /**
   * Formatiere Sekunden in das Format HH:MM:SS
   */
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00:00';
    
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
   * Formatiere Datum zu lokalem Datum und Uhrzeit
   */
  const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString();
  };
  
  /**
   * Event-Handler für Änderungen an der Telefonnummer
   */
  const handlePhoneNumberChange = (e) => {
    setPhoneNumber(e.target.value);
  };
  
  /**
   * Event-Handler für Änderungen an der Aircall-Konfiguration
   */
  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setAircallConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  /**
   * Updates the call duration when a call is active
   */
  useEffect(() => {
    let interval;
    if (callStatus === 'ringing' || callStatus === 'connected') {
      interval = setInterval(() => {
        const currentDuration = Math.floor((new Date() - callStartTime) / 1000);
        setCallDuration(currentDuration);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus, callStartTime]);
  
  /**
   * Simuliere einen abgeschlossenen Anruf nach einer bestimmten Zeit
   */
  useEffect(() => {
    let timeout;
    
    if (callStatus === 'ringing') {
      // Nach 5 Sekunden auf 'connected' setzen
      timeout = setTimeout(() => {
        setCallStatus('connected');
        
        // Nach weiteren 10 Sekunden auf 'completed' setzen
        setTimeout(() => {
          setCallStatus('completed');
          
          // Call History aktualisieren
          setCallHistory(prev => prev.map(call => {
            if (call.id === prev[0].id) {
              return { ...call, status: 'completed', duration: Math.floor((new Date() - call.startTime) / 1000) };
            }
            return call;
          }));
        }, 10000);
      }, 5000);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [callStatus]);
  
  return (
    <div className="h-full w-full bg-[#f5f5f7] overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 sm:px-6 md:px-8 py-4 md:py-5 border-b border-gray-100 shadow-sm sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-light text-gray-800">Einfacher Dialer</h1>
            <p className="text-xs md:text-sm text-gray-500 font-light">Direkte Anrufe über Aircall API</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto p-4 md:p-6 space-y-6">
        {/* Erfolgsmeldung */}
        {showSuccessMessage && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm flex items-start">
            <CheckCircleIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>Anruf erfolgreich gestartet!</span>
          </div>
        )}
        
        {/* Fehlermeldung */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-start">
            <ExclamationCircleIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Hauptbereich */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Linke Spalte: Anruf-Eingabe */}
          <div className="md:col-span-2">
            {/* SipGate Authentication Status */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-base font-medium text-gray-700">SipGate Authentication</h2>
                <a 
                  href="/settings" 
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
                  Settings
                </a>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {sipgateAuthStatus.authenticated ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        <span>Authenticated with SipGate</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <LockClosedIcon className="w-5 h-5 mr-2" />
                        <span>Not authenticated with SipGate</span>
                      </div>
                    )}
                  </div>
                  
                  {!sipgateAuthStatus.authenticated && (
                    <button
                      onClick={() => document.getElementById('sipgate-oauth-dialog').style.display = 'block'}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Authenticate
                    </button>
                  )}
                </div>
                
                {sipgateAuthStatus.authenticated && (
                  <div className="mt-3 text-sm text-gray-600">
                    {sipgateAuthStatus.deviceId ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Device ID:</span>
                            <span>{sipgateAuthStatus.deviceId}</span>
                          </div>
                          <button
                            onClick={() => document.getElementById('sipgate-oauth-dialog').style.display = 'block'}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                          >
                            Edit
                          </button>
                        </div>
                        {sipgateAuthStatus.callerId && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="font-medium">Caller ID:</span>
                            <span>{sipgateAuthStatus.callerId}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="text-amber-600">
                          Device ID not set. Please set your device ID to make calls.
                        </div>
                        <button
                          onClick={() => document.getElementById('sipgate-oauth-dialog').style.display = 'block'}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Set Device ID
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* SipGate OAuth Dialog */}
            <div id="sipgate-oauth-dialog" className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center hidden">
              <div className="bg-white rounded-lg shadow-xl p-4 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">SipGate Authentication</h3>
                  <button 
                    onClick={() => document.getElementById('sipgate-oauth-dialog').style.display = 'none'}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <SipgateOAuth onStatusChange={(status) => {
                  handleSipgateAuthStatusChange(status);
                  if (status.authenticated) {
                    setTimeout(() => {
                      document.getElementById('sipgate-oauth-dialog').style.display = 'none';
                    }, 1000);
                  }
                }} />
              </div>
            </div>
            
            {/* Provider-Auswahl */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-base font-medium text-gray-700">Telefonie Provider</h2>
                <a 
                  href="/settings" 
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
                  Einstellungen
                </a>
              </div>
              <div className="p-4">
                <div className="flex space-x-4 mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="provider"
                      value="sipgate"
                      checked={telefonieSettings.provider === 'sipgate'}
                      onChange={(e) => setTelefonieSettings(prev => ({...prev, provider: e.target.value}))}
                      className="h-4 w-4 text-blue-900 focus:ring-blue-900 border-gray-300"
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
                      className="h-4 w-4 text-blue-900 focus:ring-blue-900 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">AirCall</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Active tabs for different calling methods */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="border-b border-gray-100">
              <nav className="-mb-px flex">
                <button 
                  className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    telefonieSettings.provider === 'sipgate' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setTelefonieSettings(prev => ({...prev, provider: 'sipgate'}))}
                >
                  SipGate Dialer
                </button>
                <button 
                  className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                    telefonieSettings.provider === 'aircall' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setTelefonieSettings(prev => ({...prev, provider: 'aircall'}))}
                >
                  Aircall Dialer
                </button>
              </nav>
            </div>
            
            <div className="p-6">
              {telefonieSettings.provider === 'aircall' ? (
                /* Aircall Dialer */
                <form onSubmit={makeDirectCall} className="space-y-4">
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm text-gray-600 mb-1">
                      Telefonnummer
                    </label>
                    <input
                      type="text"
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      placeholder="+49 123 456789"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                      disabled={loading || callStatus === 'ringing' || callStatus === 'connected'}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Format: +49... (oder beginne mit 0 für deutsche Nummern)
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="aircallUserId" className="block text-sm text-gray-600 mb-1">
                        Aircall User ID
                      </label>
                      <input
                        type="text"
                        id="aircallUserId"
                        name="userId"
                        value={aircallConfig.userId}
                        onChange={handleConfigChange}
                        placeholder="Aircall User ID"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                        disabled={loading || callStatus === 'ringing' || callStatus === 'connected'}
                      />
                    </div>
                    <div>
                      <label htmlFor="numberId" className="block text-sm text-gray-600 mb-1">
                        Aircall Number ID
                      </label>
                      <input
                        type="text"
                        id="numberId"
                        name="numberId"
                        value={aircallConfig.numberId}
                        onChange={handleConfigChange}
                        placeholder="Aircall Number ID"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                        disabled={loading || callStatus === 'ringing' || callStatus === 'connected'}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading || callStatus === 'ringing' || callStatus === 'connected' || !phoneNumber}
                      className={`px-5 py-3 rounded-lg flex items-center ${
                        loading || callStatus === 'ringing' || callStatus === 'connected' || !phoneNumber
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {loading ? (
                        <>
                          <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                          Wird verarbeitet...
                        </>
                      ) : callStatus === 'ringing' ? (
                        <>
                          <PhoneIcon className="w-5 h-5 mr-2 animate-pulse" />
                          Anruf wird gestartet...
                        </>
                      ) : callStatus === 'connected' ? (
                        <>
                          <PhoneIcon className="w-5 h-5 mr-2" />
                          Gespräch läuft...
                        </>
                      ) : (
                        <>
                          <PhoneIcon className="w-5 h-5 mr-2" />
                          Anrufen
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* SipGate Dialer */
                sipgateAuthStatus.authenticated ? (
                  // Show dialer when authenticated
                  <SipgateDialer 
                    onCallInitiated={(callData) => {
                      console.log('SipGate call initiated:', callData);
                      
                      // Add the call to the history
                      setCallHistory(prev => [{
                        id: callData.callId || `sipgate-${Date.now()}`,
                        phoneNumber: callData.phoneNumber,
                        userId: 'sipgate',
                        numberId: 'sipgate',
                        startTime: new Date(),
                        status: 'started',
                        provider: 'sipgate'
                      }, ...prev]);
                      
                      // Simulate call status updates
                      setCallStatus('ringing');
                      setCallStartTime(new Date());
                      
                      // After 3 seconds, change to 'connected'
                      setTimeout(() => {
                        setCallStatus('connected');
                        
                        // After another 10 seconds, change to 'completed'
                        setTimeout(() => {
                          setCallStatus('completed');
                          setCallHistory(prev => prev.map((call, index) => 
                            index === 0 ? { ...call, status: 'completed', duration: 13 } : call
                          ));
                        }, 10000);
                      }, 3000);
                    }}
                  />
                ) : (
                  // Authentication required message
                  <div className="text-center py-8">
                    <LockClosedIcon className="h-12 w-12 text-blue-100 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">SipGate Authentication Required</h3>
                    <p className="text-gray-500 mb-4">
                      You need to authenticate with SipGate before making calls
                    </p>
                    <button
                      onClick={() => document.getElementById('sipgate-oauth-dialog').style.display = 'block'}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Authenticate with SipGate
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
            
            {/* Anruf-Historie */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-base font-medium text-gray-700">Letzte Anrufe</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefonnummer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zeit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dauer
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {callHistory.length > 0 ? (
                      callHistory.map((call) => (
                        <tr key={call.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{call.phoneNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              call.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              call.status === 'started' ? 'bg-blue-100 text-blue-800' :
                              call.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {call.status === 'completed' ? 'Abgeschlossen' : 
                               call.status === 'started' ? 'Gestartet' :
                               call.status === 'failed' ? 'Fehlgeschlagen' : call.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatDateTime(call.startTime)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {call.duration ? formatDuration(call.duration) : '-'}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                          Keine Anrufhistorie vorhanden
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Rechte Spalte: Anruf-Status */}
          <div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-base font-medium text-gray-700">Aktueller Anruf</h2>
              </div>
              
              <div className="p-6">
                {callStatus ? (
                  <div className="space-y-6">
                    {/* Statussymbol */}
                    <div className="flex justify-center">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                        callStatus === 'ringing' ? 'bg-yellow-50 animate-pulse' : 
                        callStatus === 'connected' ? 'bg-green-50 animate-pulse' :
                        callStatus === 'completed' ? 'bg-blue-50' :
                        'bg-red-50'
                      }`}>
                        <PhoneIcon className={`w-10 h-10 ${
                          callStatus === 'ringing' ? 'text-yellow-500' : 
                          callStatus === 'connected' ? 'text-green-500' :
                          callStatus === 'completed' ? 'text-blue-500' :
                          'text-red-500'
                        }`} />
                      </div>
                    </div>
                    
                    {/* Statustext */}
                    <div className="text-center">
                      <p className="font-medium text-lg text-gray-800">
                        {callStatus === 'ringing' ? 'Verbindung wird hergestellt...' : 
                         callStatus === 'connected' ? 'Gespräch läuft' :
                         callStatus === 'completed' ? 'Anruf abgeschlossen' :
                         'Anruf fehlgeschlagen'}
                      </p>
                      
                      {(callStatus === 'ringing' || callStatus === 'connected') && (
                        <p className="text-sm text-gray-500 mt-1">
                          {callStatus === 'ringing' ? 
                            'Warte auf Antwort...' : 
                            'Der Anruf wurde angenommen'}
                        </p>
                      )}
                    </div>
                    
                    {/* Letzter Anruf-Details */}
                    {callHistory.length > 0 && (
                      <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Anruf-Details</h3>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Telefonnummer:</span>
                            <span className="text-sm font-medium">{callHistory[0].phoneNumber}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Startzeit:</span>
                            <span className="text-sm">{formatDateTime(callHistory[0].startTime)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Dauer:</span>
                            <span className="text-sm font-mono">
                              {callStatus === 'completed' ? 
                                formatDuration(callHistory[0].duration || 0) : 
                                formatDuration(callDuration)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PhoneIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Kein aktiver Anruf</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Geben Sie eine Nummer ein und starten Sie einen Anruf
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Hinweis zur Verwendung */}
            <div className="bg-blue-50 rounded-xl p-4 mt-6">
              <h3 className="text-sm font-medium text-blue-700 mb-2">Hinweis</h3>
              <p className="text-xs text-blue-600">
                {telefonieSettings.provider === 'aircall' ? (
                  <>
                    Diese Anruffunktion verwendet die Aircall API, um direkte Anrufe zu tätigen.
                    Die Anrufe werden über die hinterlegte Aircall-Nummer durchgeführt und an Ihren
                    Aircall-Account weitergeleitet.
                  </>
                ) : (
                  <>
                    Diese Anruffunktion verwendet die SipGate API, um direkte Anrufe zu tätigen.
                    SipGate ruft zuerst Sie an und verbindet dann mit der angegebenen Nummer.
                  </>
                )}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Sie können den Telefonie-Provider in den Einstellungen oder über die Auswahl oben ändern.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPowerDialerPage;