import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClients } from '../context/ClientContext';
import axios from 'axios';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon, 
  PaperClipIcon, 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  CurrencyEuroIcon,
  CalendarIcon,
  ArrowPathIcon,
  DocumentIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import ClientPhaseManager from '../components/ClientPhaseManager';
import ProgressTracker from '../components/ProgressTracker';
import ClientDocuments from '../components/ClientDocuments';

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient, updateClient, deleteClient, sendInvoiceEmail, requestDocuments } = useClients();
  const [client, setClient] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(null);
  const [isEditingCaseNumber, setIsEditingCaseNumber] = useState(false);
  const [caseNumber, setCaseNumber] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [showEmailSuccess, setShowEmailSuccess] = useState(false);

  // Funktion zum Hochladen eines Dokuments
  const handleFileUpload = async (file) => {
    if (!file || !client || !client._id) return;
    
    setIsUploading(true);
    
    try {
      // Formular-Daten erstellen
      const formData = new FormData();
      formData.append('invoice', file);
      
      // API-Endpunkt für Datei-Upload
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://dashboard-l-backend.onrender.com/api';
      const response = await fetch(`${apiBaseUrl}/clients/${client._id}/upload-invoice`, {
        method: 'POST',
        body: formData
      });
      
      // Überprüfe Antwort
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Hochladen der Datei');
      }
      
      // Erfolgreich hochgeladen
      const data = await response.json();
      alert('Dokument erfolgreich hochgeladen');
      
      // Client-Daten aktualisieren, um das neue Dokument anzuzeigen
      loadClient();
    } catch (error) {
      console.error('Fehler beim Hochladen der Datei:', error);
      alert(`Fehler beim Hochladen: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handler für Dateiauswahl im Dokumenten-Tab
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileUpload(selectedFile);
    }
    // Setze den Dateiwert zurück, damit man die gleiche Datei erneut auswählen kann
    e.target.value = '';
  };
  
  // Handler für Anforderung von Dokumenten vom Mandanten
  // State-Variablen werden nur am Anfang der Komponente deklariert (emailSending, showEmailSuccess)
  
  const handleRequestDocuments = async () => {
    if (!client || !client._id) return;
    
    setEmailSending(true);
    
    try {
      // API-Endpunkt für Dokumentenanforderung
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://dashboard-l-backend.onrender.com/api';
      const response = await fetch(`${apiBaseUrl}/clients/${client._id}/request-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentType: 'Gläubigerschreiben'
        })
      });
      
      // Überprüfe Antwort
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Senden der E-Mail');
      }
      
      // Erfolgreich gesendet
      setShowEmailSuccess(true);
      
      // Nach 5 Sekunden Erfolgsmeldung ausblenden
      setTimeout(() => {
        setShowEmailSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Fehler beim Senden der E-Mail:', error);
      alert(`Fehler beim Senden der E-Mail: ${error.message}`);
    } finally {
      setEmailSending(false);
    }
  };

  // Funktion zum Abrufen der Formulardaten vom Backend via Proxy
  // Direkter API-Endpunkt für Tests mit MOCK-ID
  const TEST_CLIENT_ID = '869878qzv';
  
  // Leeres Array für Dokumente, falls keine vom Server kommen
  const emptyDocuments = [];
  
  // Speichern des letzten API-Aufrufzeitpunkts mit useRef statt useState 
  // um zu verhindern, dass der State-Update einen Re-render auslöst
  const lastApiCallTimeRef = useRef(0);
  
  const fetchFormData = async (clientId) => {
    try {
      // Ratenbegrenzung für API-Aufrufe - maximal 1 Aufruf alle 10 Sekunden
      const now = Date.now();
      const minTimeBetweenCalls = 10000; // 10 Sekunden
      const timeSinceLastCall = now - lastApiCallTimeRef.current;
      
      if (timeSinceLastCall < minTimeBetweenCalls) {
        console.log(`API rate limit: Waiting ${(minTimeBetweenCalls - timeSinceLastCall)/1000}s before next call`);
        await new Promise(resolve => setTimeout(resolve, minTimeBetweenCalls - timeSinceLastCall));
      }
      
      // Setze den Zeitpunkt des letzten API-Aufrufs mit useRef
      lastApiCallTimeRef.current = Date.now();
      
      setLoading(true);
      console.log(`Fetching form data for client ID: ${clientId}`);
      
      // DEBUG-MODUS: Wenn der Client-ID leer ist oder nicht gefunden werden kann,
      // verwenden wir die TEST_CLIENT_ID für Demonstrationszwecke
      if (!clientId || clientId === 'undefined' || clientId === 'null') {
        console.warn('Client ID is missing or invalid, using test client ID for debugging');
        clientId = TEST_CLIENT_ID;
      }

      // Direkte Anfrage an die Privatinsolvenz-API
      let response = null;
      let errorDetails = [];
      
      // NUR die Backend-Proxy Methode verwenden, um mehrfache API-Aufrufe zu vermeiden
      try {
        console.log('Fetching data via backend proxy...');
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://dashboard-l-backend.onrender.com/api';
        const proxyUrl = `${apiBaseUrl}/proxy/forms/${clientId}`;
        
        // Längeres Timeout, um Server mehr Zeit zur Verarbeitung zu geben
        response = await axios.get(proxyUrl, { 
          timeout: 30000, // Erhöht auf 30 Sekunden
          headers: { 'Accept': 'application/json' }
        });
        console.log('Backend proxy fetch successful');
      } catch (backendProxyError) {
        // Detailliertes Logging für bessere Fehlerdiagnose
        const errorInfo = {
          stage: 'Backend proxy',
          message: backendProxyError.message,
          status: backendProxyError.response?.status,
          data: backendProxyError.response?.data
        };
        errorDetails.push(errorInfo);
        console.error('Backend proxy failed:', errorInfo);
        
        // Bei Fehler werfen wir direkt einen Fehler statt weitere APIs zu probieren
        // Dies schont den Server vor zu vielen Anfragen
        const combinedError = new Error('Failed to fetch form data');
        combinedError.details = errorDetails;
        throw combinedError;
      }
      
      if (response && response.status === 200) {
        console.log('Form data received:', response.data);
        
        // Tiefes Debugging der API-Antwort
        console.log('Raw API response:', JSON.stringify(response.data, null, 2));
        
        // Erstelle eine saubere Kopie der Daten
        // Prüfen und verarbeiten verschiedener API-Antwortformate
        let rawData;
        
        // Fall 1: API-Antwort ist ein String
        if (typeof response.data === 'string') {
          try {
            console.log('API-Antwort ist ein String, versuche zu parsen...');
            rawData = JSON.parse(response.data);
          } catch (parseError) {
            console.error('Fehler beim Parsen des API-String:', parseError);
            
            // Versuche den String zu bereinigen und erneut zu parsen
            try {
              const cleanedString = response.data
                .replace(/\\"/g, '"')  // Ersetze \" durch "
                .replace(/"{/g, '{')   // Ersetze "{ durch {
                .replace(/}"/g, '}')   // Ersetze }" durch }
                .replace(/\\/g, '');   // Entferne alle übrigen Backslashes
              
              console.log('Versuche bereinigten String zu parsen...');
              rawData = JSON.parse(cleanedString);
            } catch (secondParseError) {
              console.error('Bereinigen des Strings fehlgeschlagen:', secondParseError);
              rawData = {}; // Leeres Objekt als Fallback
            }
          }
        } 
        // Fall 2: API-Antwort ist null oder undefined
        else if (response.data === null || response.data === undefined) {
          console.warn('API-Antwort ist null oder undefined, verwende leeres Objekt');
          rawData = {};
        }
        // Fall 3: API-Antwort ist ein normales Objekt
        else {
          rawData = response.data;
        }
        
        let normalizedData = JSON.parse(JSON.stringify(rawData));
        
        try {
          // ============================================================
          // SCHRITT 1: HONORAR-INFORMATIONEN VERARBEITEN
          // ============================================================
          
          // Zunächst Daten aus der preisKalkulation extrahieren
          if (normalizedData.preisKalkulation) {
            console.log('preisKalkulation gefunden in API-Antwort:', normalizedData.preisKalkulation);
            
            // Stelle sicher, dass preisKalkulation ein Objekt ist
            if (typeof normalizedData.preisKalkulation === 'string') {
              try {
                normalizedData.preisKalkulation = JSON.parse(normalizedData.preisKalkulation);
                console.log('preisKalkulation String wurde geparst:', normalizedData.preisKalkulation);
              } catch (e) {
                console.error('Fehler beim Parsen von preisKalkulation String:', e);
                // Fallback: leeres Objekt verwenden
                normalizedData.preisKalkulation = {};
              }
            }
            
            // A. Honorar/Gesamtpreis aus preisKalkulation
            if (normalizedData.preisKalkulation.gesamtPreis !== undefined) {
              const preisValue = parseFloat(String(normalizedData.preisKalkulation.gesamtPreis).replace(/[^\d.,]/g, '').replace(',', '.'));
              if (!isNaN(preisValue)) {
                normalizedData.honorar = preisValue;
                console.log(`Honorar aus preisKalkulation.gesamtPreis: ${normalizedData.honorar}`);
              }
            } else if (normalizedData.preisKalkulation.standardPrice !== undefined) {
              const preisValue = parseFloat(String(normalizedData.preisKalkulation.standardPrice).replace(/[^\d.,]/g, '').replace(',', '.'));
              if (!isNaN(preisValue)) {
                normalizedData.honorar = preisValue;
                console.log(`Honorar aus preisKalkulation.standardPrice: ${normalizedData.honorar}`);
              }
            } else if (normalizedData.preisKalkulation.manuellerPreisBetrag !== undefined) {
              const preisValue = parseFloat(String(normalizedData.preisKalkulation.manuellerPreisBetrag).replace(/[^\d.,]/g, '').replace(',', '.'));
              if (!isNaN(preisValue)) {
                normalizedData.honorar = preisValue;
                console.log(`Honorar aus preisKalkulation.manuellerPreisBetrag: ${normalizedData.honorar}`);
              }
            }
            
            // B. Ratenzahlung aus preisKalkulation
            if (normalizedData.preisKalkulation.ratenzahlung) {
              console.log('Ratenzahlung-Objekt gefunden:', normalizedData.preisKalkulation.ratenzahlung);
              
              // Stelle sicher, dass ratenzahlung ein Objekt ist
              if (typeof normalizedData.preisKalkulation.ratenzahlung === 'string') {
                try {
                  normalizedData.preisKalkulation.ratenzahlung = JSON.parse(normalizedData.preisKalkulation.ratenzahlung);
                  console.log('ratenzahlung String wurde geparst:', normalizedData.preisKalkulation.ratenzahlung);
                } catch (e) {
                  console.error('Fehler beim Parsen von ratenzahlung String:', e);
                  normalizedData.preisKalkulation.ratenzahlung = {};
                }
              } else if (!normalizedData.preisKalkulation.ratenzahlung) {
                normalizedData.preisKalkulation.ratenzahlung = {};
              }
              
              // Anzahl der Raten - versuche mehrere mögliche Feldnamen
              const monatFields = ['monate', 'monat', 'raten', 'anzahlRaten', 'anzahl'];
              let foundRaten = false;
              
              for (const field of monatFields) {
                if (normalizedData.preisKalkulation.ratenzahlung[field] !== undefined) {
                  const ratenValue = normalizedData.preisKalkulation.ratenzahlung[field];
                  try {
                    // Konvertiere zu Zahl, egal welcher Typ der Wert hat
                    const ratenNum = typeof ratenValue === 'number' ? 
                      ratenValue : 
                      parseInt(String(ratenValue).replace(/[^\d]/g, ''), 10);
                      
                    if (!isNaN(ratenNum) && ratenNum > 0) {
                      normalizedData.raten = ratenNum;
                      console.log(`Ratenanzahl aus preisKalkulation.ratenzahlung.${field}: ${normalizedData.raten}`);
                      foundRaten = true;
                      break;
                    }
                  } catch (e) {
                    console.error(`Fehler bei Konvertierung von ${field}:`, e);
                  }
                }
              }
              
              // Wenn keine Raten in ratenzahlung gefunden wurden, versuche im Root-Objekt
              if (!foundRaten && normalizedData.ratenzahlungMonate) {
                try {
                  const ratenNum = parseInt(String(normalizedData.ratenzahlungMonate).replace(/[^\d]/g, ''), 10);
                  if (!isNaN(ratenNum) && ratenNum > 0) {
                    normalizedData.raten = ratenNum;
                    console.log(`Ratenanzahl aus ratenzahlungMonate: ${normalizedData.raten}`);
                  }
                } catch (e) {
                  console.error('Fehler bei Konvertierung von ratenzahlungMonate:', e);
                }
              }
              
              // Monatliche Rate - versuche mehrere mögliche Feldnamen
              const rateFields = ['monatsRate', 'rate', 'monthlyRate', 'ratenhoehe', 'betrag'];
              let foundRate = false;
              
              for (const field of rateFields) {
                if (normalizedData.preisKalkulation.ratenzahlung[field] !== undefined) {
                  const rateValue = normalizedData.preisKalkulation.ratenzahlung[field];
                  try {
                    // Konvertiere zu Zahl, egal welcher Typ der Wert hat
                    const rateNum = typeof rateValue === 'number' ? 
                      rateValue : 
                      parseFloat(String(rateValue).replace(/[^\d.,]/g, '').replace(',', '.'));
                      
                    if (!isNaN(rateNum) && rateNum > 0) {
                      normalizedData.monatlicheRate = rateNum;
                      console.log(`Monatsrate aus preisKalkulation.ratenzahlung.${field}: ${normalizedData.monatlicheRate}`);
                      foundRate = true;
                      break;
                    }
                  } catch (e) {
                    console.error(`Fehler bei Konvertierung von Rate ${field}:`, e);
                  }
                }
              }
              
              // Alternativ: Berechne monatliche Rate aus Honorar und Raten
              if (!foundRate && normalizedData.honorar !== undefined && normalizedData.raten !== undefined) {
                if (normalizedData.raten > 0) {
                  normalizedData.monatlicheRate = normalizedData.honorar / normalizedData.raten;
                  console.log(`Monatsrate berechnet aus Honorar/Raten: ${normalizedData.monatlicheRate}`);
                }
              }
              
              // Falls wir monatsRate haben, aber keine Raten, und das Gesamthonorar bekannt ist,
              // können wir die Anzahl der Raten berechnen
              if (normalizedData.monatlicheRate !== undefined && 
                  normalizedData.raten === undefined && 
                  normalizedData.honorar !== undefined &&
                  normalizedData.monatlicheRate > 0) {
                normalizedData.raten = Math.round(normalizedData.honorar / normalizedData.monatlicheRate);
                console.log(`Ratenanzahl berechnet aus Honorar/Monatsrate: ${normalizedData.raten}`);
              }
            }
          }
          
          // Alternativquellen für Ratenanzahl
          if (normalizedData.raten === undefined) {
            if (normalizedData.ratenzahlungMonate) {
              normalizedData.raten = normalizedData.ratenzahlungMonate;
              console.log(`Ratenanzahl aus ratenzahlungMonate: ${normalizedData.raten}`);
            }
          }
          
          // Wenn wir immer noch keine Raten haben, versuchen wir die direkt aus dem String zu extrahieren
          if (normalizedData.raten === undefined && normalizedData.preisKalkulation) {
            // Suche nach monate in allen möglichen Feldern von preisKalkulation
            const findRaten = (obj) => {
              for (const key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                  const foundInNested = findRaten(obj[key]);
                  if (foundInNested !== undefined) return foundInNested;
                } else if (key.toLowerCase().includes('monat') && obj[key] !== undefined) {
                  return obj[key];
                }
              }
              return undefined;
            };
            
            const foundRaten = findRaten(normalizedData.preisKalkulation);
            if (foundRaten !== undefined) {
              normalizedData.raten = foundRaten;
              console.log(`Ratenanzahl rekursiv aus preisKalkulation gefunden: ${normalizedData.raten}`);
            }
          }
          
          // Validiere Honorardaten
          if (normalizedData.honorar !== undefined) {
            normalizedData.honorar = typeof normalizedData.honorar === 'number' 
              ? normalizedData.honorar 
              : parseFloat(String(normalizedData.honorar).replace(/[^\d.,]/g, '').replace(',', '.'));
            
            console.log(`Validiertes Honorar: ${normalizedData.honorar}`);
          }
          
          // Validiere Raten
          if (normalizedData.raten !== undefined) {
            normalizedData.raten = typeof normalizedData.raten === 'number'
              ? normalizedData.raten
              : parseInt(String(normalizedData.raten).replace(/[^\d.,]/g, ''), 10);
            
            console.log(`Validierte Ratenanzahl: ${normalizedData.raten}`);
          }
          
          // Validiere monatliche Rate
          if (normalizedData.monatlicheRate !== undefined) {
            normalizedData.monatlicheRate = typeof normalizedData.monatlicheRate === 'number'
              ? normalizedData.monatlicheRate
              : parseFloat(String(normalizedData.monatlicheRate).replace(/[^\d.,]/g, '').replace(',', '.'));
            
            console.log(`Validierte monatliche Rate: ${normalizedData.monatlicheRate}`);
          }
          
          // Berechne die monatliche Rate neu, wenn wir Honorar und Raten haben, aber keine monatliche Rate
          if (normalizedData.monatlicheRate === undefined && normalizedData.honorar !== undefined && normalizedData.raten !== undefined && normalizedData.raten > 0) {
            normalizedData.monatlicheRate = normalizedData.honorar / normalizedData.raten;
            console.log(`Monatliche Rate berechnet: ${normalizedData.monatlicheRate}`);
          }
          
          // ============================================================
          // SCHRITT 2: PERSONENDATEN VERARBEITEN
          // ============================================================
          
          // Name aus lead_name sicherstellen
          if (!normalizedData.name && normalizedData.leadName) {
            normalizedData.name = normalizedData.leadName;
            console.log(`Name aus leadName übernommen: ${normalizedData.name}`);
          }
          
          // ============================================================
          // SCHRITT 3: ALLE WEITEREN FELDER TYPSICHER UMWANDELN
          // ============================================================
          
          // ZAHLENFELDER
          const numberFields = [
            'nettoEinkommen', 'gesamtSchulden', 'glaeubiger', 'fahrzeugWert', 
            'fahrzeugKreditsumme', 'manuellerPreisBetrag', 'startgebuehr',
            'preisProGlaeubiger', 'standardPrice', 'pfandungsPrice', 'gesamtPreis',
            'monatsRate', 'monate', 'kinderAnzahl', 'ratenzahlungMonate', 'zusatzEinkommen'
          ];
          
          numberFields.forEach(field => {
            if (normalizedData[field] !== undefined && normalizedData[field] !== '') {
              try {
                // Konvertiere in Zahl falls nötig
                if (typeof normalizedData[field] !== 'number') {
                  if (normalizedData[field] === null || normalizedData[field] === undefined || normalizedData[field] === '') {
                    // Setze auf null wenn leer
                    normalizedData[field] = null;
                  } else {
                    const cleanString = String(normalizedData[field]).replace(/[^\d.,]/g, '');
                    const numValue = parseFloat(cleanString.replace(',', '.'));
                    if (!isNaN(numValue)) {
                      normalizedData[field] = numValue;
                      console.log(`Feld ${field} zu Zahl konvertiert: ${normalizedData[field]}`);
                    } else {
                      normalizedData[field] = null;
                      console.log(`Feld ${field} konnte nicht konvertiert werden, setze auf null`);
                    }
                  }
                }
              } catch (e) {
                console.error(`Fehler bei Konvertierung von ${field}:`, e);
              }
            }
          });
          
          // BOOLEAN-FELDER
          const booleanFields = [
            'aktuelePfaendung', 'bausparvertrag', 'befristet', 'fahrzeugFinanziert',
            'fahrzeugNotwendig', 'fahrzeugbriefBank', 'fahrzeuge', 'immobilieAusland',
            'immobilien', 'lebensversicherung', 'manuellerPreis', 'qualifiziert',
            'rentenversicherung', 'schenkungAndere', 'schenkungAngehoerige', 'selbststaendig',
            'sparbuch', 'unterhaltspflicht', 'vorherigeInsolvenz', 'warSelbststaendig',
            'weitereVermoegen', 'zustellungEmail', 'zustellungPost'
          ];
          
          booleanFields.forEach(field => {
            if (normalizedData[field] !== undefined) {
              if (typeof normalizedData[field] !== 'boolean') {
                if (typeof normalizedData[field] === 'string') {
                  normalizedData[field] = normalizedData[field].toLowerCase() === 'true';
                } else if (typeof normalizedData[field] === 'number') {
                  normalizedData[field] = normalizedData[field] !== 0;
                }
                console.log(`Feld ${field} zu Boolean konvertiert: ${normalizedData[field]}`);
              }
            }
          });
          
          // DATUM-FELDER
          const dateFields = ['geburtsdatum', 'insolvenzDatum', 'createdAt', 'updatedAt'];
          
          dateFields.forEach(field => {
            if (normalizedData[field] && normalizedData[field] !== '') {
              try {
                const date = new Date(normalizedData[field]);
                if (!isNaN(date.getTime())) {
                  // Behalte das originale Format
                  console.log(`Datum ${field} validiert: ${normalizedData[field]}`);
                }
              } catch (e) {
                console.error(`Fehler bei Validierung von Datum ${field}:`, e);
              }
            }
          });
          
          // ============================================================
          // SCHRITT 4: ADRESSINFORMATIONEN AUFBEREITEN
          // ============================================================
          
          // Adressinformationen zusammenführen für Anzeige
          if (normalizedData.strasse || normalizedData.hausnummer || normalizedData.plz || normalizedData.wohnort || normalizedData.ort) {
            const adressTeile = [];
            
            // Straße und Hausnummer
            if (normalizedData.strasse) {
              let streetPart = normalizedData.strasse.trim();
              if (normalizedData.hausnummer) {
                streetPart += ' ' + normalizedData.hausnummer.trim();
              }
              adressTeile.push(streetPart);
            }
            
            // PLZ und Ort
            const ortTeile = [];
            if (normalizedData.plz) ortTeile.push(normalizedData.plz.trim());
            // Wohnort oder Ort verwenden - beide Feldnamen werden in manchen Formularquellen genutzt
            if (normalizedData.wohnort) {
              ortTeile.push(normalizedData.wohnort.trim());
            } else if (normalizedData.ort) {
              ortTeile.push(normalizedData.ort.trim());
            }
            
            if (ortTeile.length > 0) {
              adressTeile.push(ortTeile.join(' '));
            }
            
            // Formatierte Adresse für Anzeige
            if (adressTeile.length > 0) {
              normalizedData.adresse = adressTeile.join(', ');
              console.log(`Formatierte Adresse: ${normalizedData.adresse}`);
            }
          }
          
          // ============================================================
          // SCHRITT 5: DEBUGGING DER VERARBEITETEN DATEN
          // ============================================================
          
          // Debug: Liste der Felder
          const processedFields = Object.keys(normalizedData);
          console.log(`Verarbeitete Felder (${processedFields.length}):`, processedFields);
          
          // Debug: Check für wichtigste Kernfelder
          const coreFields = ['honorar', 'raten', 'monatlicheRate', 'name', 'adresse', 'geburtsdatum'];
          coreFields.forEach(field => {
            console.log(`Kernfeld ${field}: ${normalizedData[field] !== undefined ? 'vorhanden' : 'FEHLT'}`);
          });
          
          // Tiefes Debugging für numerische Felder
          console.log('COMPLETE RAW FORM DATA:', normalizedData);
          
          // Überprüfe alle Zahlenfelder
          console.log('===== ZAHLENFELDER DEBUGGING =====');
          numberFields.forEach(field => {
            if (normalizedData[field] !== undefined) {
              console.log(`${field}: ${normalizedData[field]} (Typ: ${typeof normalizedData[field]})`);
            }
          });
          
          // Überprüfe Ratenzahlung spezifisch
          console.log('===== RATENZAHLUNG DEBUGGING =====');
          console.log(`raten: ${normalizedData.raten} (Typ: ${typeof normalizedData.raten})`);
          console.log(`monatlicheRate: ${normalizedData.monatlicheRate} (Typ: ${typeof normalizedData.monatlicheRate})`);
          if (normalizedData.preisKalkulation?.ratenzahlung) {
            console.log('Ratenzahlung-Objekt:', normalizedData.preisKalkulation.ratenzahlung);
          }
          
        } catch (processingError) {
          console.error('Fehler bei Datenverarbeitung:', processingError);
          // Im Fehlerfall versuchen wir trotzdem, die Rohdaten zu verwenden
        }
        
        // Setze den State und gib die verarbeiteten Daten zurück
        setFormData(normalizedData);
        return normalizedData;
      } else {
        throw new Error(`API-Fehler: ${response ? response.status : 'Keine Antwort'}`);
      }
    } catch (err) {
      console.error('Error fetching form data:', err);
      
      // Mock-Daten für Fallback, falls die API nicht erreichbar ist
      const mockFormData = {
        name: "Max Mustermann",
        honorar: 1111,
        raten: 2,
        ratenStart: "01.01.2025",
        adresse: "Musterstraße 123, 10115 Berlin",
        einwilligung: "Ja",
        vorfall: "Privatinsolvenz beantragt am 01.02.2025",
        schadensumme: "8.500 €",
        versicherung: "AllSecure AG",
        policeNummer: "VS-123456789",
        nettoeinkommen: "2.400 €"
      };
      
      console.log('Using mock form data as fallback');
      setFormData(mockFormData);
      return mockFormData;
    } finally {
      setLoading(false);
    }
  };

  // Funktion zum Speichern der Aktenzeichennummer
  const handleSaveCaseNumber = async () => {
    try {
      if (!client || !client._id) return;
      
      // Speichern der Änderungen in der Datenbank
      const updatedClient = await updateClient(client._id, {
        caseNumber: caseNumber
      });
      
      // Aktualisiere den Client im lokalen Zustand
      setClient(prevClient => ({
        ...prevClient,
        caseNumber: caseNumber
      }));
      
      // Zeige Erfolgsmeldung
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Beende den Bearbeitungsmodus
      setIsEditingCaseNumber(false);
      
      console.log('Aktenzeichennummer aktualisiert:', updatedClient);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Aktenzeichennummer:', error);
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  // Funktion zum Löschen eines Mandanten
  const handleDeleteClient = async () => {
    if (!client || !client._id) return;

    try {
      setIsDeleting(true);

      // Bestätigungsdialog wurde schon angezeigt, 
      // jetzt den Mandanten wirklich löschen
      await deleteClient(client._id);
      
      // Zur Übersicht zurückkehren
      navigate('/', { 
        state: { 
          notification: {
            type: 'success',
            message: `Mandant ${client.name} wurde erfolgreich gelöscht.`
          }
        }
      });
    } catch (error) {
      console.error('Fehler beim Löschen des Mandanten:', error);
      setIsDeleting(false);
      alert('Fehler beim Löschen: ' + error.message);
    }
  };

  // State zum Speichern des letzten Daten-Updates und Aktualisierungsintervalls
  const [lastDataUpdate, setLastDataUpdate] = useState(null);
  const [dataRefreshInterval, setDataRefreshInterval] = useState(300000); // 5 Minuten in Millisekunden
  const [refreshTimerId, setRefreshTimerId] = useState(null);
  
  // Cache für API-Antworten, um API-Aufrufe zu reduzieren
  // Verwende useRef statt useState für den Cache, um zu verhindern, dass Cache-Updates Rerenders auslösen
  const formDataCacheRef = useRef({});
  // Zeit zwischen API-Aufrufen erhöhen - mindestens 5 Minuten zwischen vollständigen Aktualisierungen
  const MIN_API_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 Minuten
  
  // Verwende React.useCallback und minimale Abhängigkeiten um Effekte zu stabilisieren
  // Flag, um zu verfolgen, ob ein Ladevorgang läuft (nicht Teil des State)
  const isLoadingRef = useRef(false);
  
  const loadClient = React.useCallback(async () => {
    // Prüfen, ob ein Client bereits geladen wird, um Mehrfachanfragen zu vermeiden
    if (isLoadingRef.current) {
      console.log('Client wird bereits geladen, Anfrage übersprungen');
      return;
    }
    
    try {
      console.log('Beginne Client zu laden mit ID:', id);
      isLoadingRef.current = true; // Setze Flag vor dem Loading-State
      setLoading(true);
      
      // Erst den Client aus dem Context laden
      const clientData = await getClient(id);
      
      // Aktenzeichennummer in den Zustand setzen
      setCaseNumber(clientData?.caseNumber || '');
      
      // Prüfen, ob wir die API wirklich aufrufen müssen oder gecachte Daten verwenden können
      const apiId = clientData.clickupId || clientData.taskId || id;
      const cachedData = formDataCacheRef.current[apiId];
      const now = Date.now();
      const lastCacheTime = cachedData?.timestamp || 0;
      const timeSinceLastCache = now - lastCacheTime;
      
      let formDataResponse;
      let freshData = false;
      
      // Nur frische Daten laden, wenn:
      // 1. Kein Cache vorhanden ist oder
      // 2. Cache älter als 5 Minuten ist oder
      // 3. Eine manuelle Aktualisierung angefordert wurde
      const forceRefresh = lastDataUpdate ? 
        (now - lastDataUpdate.getTime() < 2000) : false;
        
      if (!cachedData || timeSinceLastCache > MIN_API_REFRESH_INTERVAL || forceRefresh) {
        try {
          console.log(`Cache ist ${!cachedData ? 'nicht vorhanden' : 'zu alt'}, lade frische Formulardaten`);
          formDataResponse = await fetchFormData(apiId);
          freshData = true;
          
          // Aktualisiere den Cache mit useRef (löst keinen Rerender aus)
          formDataCacheRef.current = {
            ...formDataCacheRef.current,
            [apiId]: {
              data: formDataResponse,
              timestamp: now
            }
          };
        } catch (formError) {
          console.error('Error loading fresh form data:', formError);
          
          // Fallback auf gecachte Daten, falls vorhanden
          if (cachedData) {
            console.log('Using cached data as fallback');
            formDataResponse = cachedData.data;
          }
        }
      } else {
        // Verwende gecachte Daten
        console.log(`Verwende gecachte Daten (${Math.round(timeSinceLastCache/1000)}s alt)`);
        formDataResponse = cachedData.data;
      }
      
      // Wenn wir keine Daten haben (weder frisch noch gecacht), Client ohne Formulardaten anzeigen
      if (!formDataResponse) {
        console.warn('No form data available, using client data only');
        setClient({
          ...clientData,
          id: id,
          documents: clientData.documents || emptyDocuments,
          honorar: clientData.honorar || 1111,
          raten: clientData.raten || 2,
          ratenStart: clientData.ratenStart || "01.01.2025",
          address: clientData.address || "Keine Adresse vorhanden"
        });
        
        setLoading(false);
        isLoadingRef.current = false; // Flag zurücksetzen 
        return;
      }
      
      // Client-Objekt mit den Formulardaten anreichern
      const enrichedClient = {
        ...clientData,
        id: id,
        formData: formDataResponse,
        documents: clientData.documents || emptyDocuments,
        honorar: formDataResponse?.honorar || clientData.honorar || 1111,
        raten: formDataResponse?.raten || clientData.raten || 2,
        ratenStart: formDataResponse?.ratenStart || clientData.ratenStart || "01.01.2025",
        address: formDataResponse?.adresse || clientData.address || "Keine Adresse vorhanden"
      };
        
      // Monatliche Rate direkt aus den API-Daten übernehmen
      if (formDataResponse?.preisKalkulation?.ratenzahlung?.monatsRate) {
        enrichedClient.monatlicheRate = formDataResponse.preisKalkulation.ratenzahlung.monatsRate;
        console.log(`Monatliche Rate direkt aus API übernommen: ${enrichedClient.monatlicheRate}`);
      } else if (formDataResponse?.monatlicheRate) {
        enrichedClient.monatlicheRate = formDataResponse.monatlicheRate;
        console.log(`Monatliche Rate aus formDataResponse.monatlicheRate: ${enrichedClient.monatlicheRate}`);
      } else {
        enrichedClient.monatlicheRate = clientData.monatlicheRate;
        console.log(`Bestehende monatliche Rate beibehalten: ${enrichedClient.monatlicheRate}`);
      }
      
      // Stelle sicher, dass die API-Daten vollständig im formData verfügbar sind
      enrichedClient.formData = formDataResponse;
      
      if (formDataResponse?.preisKalkulation) {
        enrichedClient.preisKalkulation = formDataResponse.preisKalkulation;
      }
      
      // Nur bei frischen Daten Debug-Infos ausgeben
      if (freshData) {
        console.log('Honorardaten nach Anreicherung:', {
          honorarFormData: formDataResponse?.honorar,
          honorarClientData: clientData.honorar,
          finalHonorar: enrichedClient.honorar
        });
      }
      
      setClient(enrichedClient);
      
      // Nur bei frischen Daten Datenbank aktualisieren
      if (freshData) {
        try {
          const updateData = {};
          
          if (formDataResponse?.honorar) {
            updateData.honorar = formDataResponse.honorar;
          }
          
          if (formDataResponse?.raten) {
            updateData.raten = formDataResponse.raten;
          }
          
          if (formDataResponse?.ratenStart) {
            updateData.ratenStart = formDataResponse.ratenStart;
          }
          
          if (enrichedClient.monatlicheRate) {
            updateData.monatlicheRate = enrichedClient.monatlicheRate;
          }
          
          // Nur aktualisieren, wenn es Änderungen gibt
          if (Object.keys(updateData).length > 0) {
            console.log('Updating client data in database with form data:', updateData);
            await updateClient(clientData._id, updateData);
          }
        } catch (updateError) {
          console.error('Failed to persist form data to database:', updateError);
        }
      }
    } catch (err) {
      console.error('Error loading client details:', err);
      setError(err.message || 'Fehler beim Laden der Mandantendetails');
    } finally {
      setLoading(false);
      // Immer das Flag zurücksetzen, auch im Fehlerfall
      isLoadingRef.current = false;
      console.log('Client loading completed, loading flags reset');
    }
  }, [id, getClient]); // Minimale Abhängigkeiten - wir machen das Update über useEffect 

  // Dies ist der Haupt-Update-Effekt, der nur auf ID-Änderungen reagiert
  useEffect(() => {
    loadClient();
  }, [id, loadClient]);
  
  // Separater Effekt nur für lastDataUpdate - verhindert Überlappung mit normalen Updates
  useEffect(() => {
    // Nur ausführen, wenn lastDataUpdate gesetzt und kein anderes Update läuft
    if (lastDataUpdate && !isLoadingRef.current) {
      console.log(`Manuelles Update angefordert: ${lastDataUpdate.toISOString()}`);
      loadClient();
    }
  }, [lastDataUpdate, loadClient]);
  
  // Debug-State für die Entwicklung
  const [debugMode, setDebugMode] = useState(false);
  
  // Verwende useRef für den Timer, um direkte State-Updates zu vermeiden
  const timerRef = useRef(null);
  
  // Manuelles Update auslösen
  const triggerManualUpdate = () => {
    console.log('Manuelles Update ausgelöst');
    // Diese Variable wird explizit verwendet, um ein neues Datum zu erstellen und dann zu setzen,
    // um sicherzustellen, dass es sich um einen neuen Referenzwert handelt
    const newDate = new Date();
    setLastDataUpdate(newDate);
  };
  
  // Effekt für periodische Aktualisierung - stark vereinfacht
  useEffect(() => {
    // Nur einen Timer starten, wenn wir ein aktives Intervall haben und Client bereits geladen ist
    if (dataRefreshInterval > 0 && client && !isLoadingRef.current) {
      console.log(`Timer für nächstes Update in ${dataRefreshInterval/1000} Sekunden gesetzt`);
      
      // Alten Timer löschen falls vorhanden
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Neuen Timer setzen - mindestens 60 Sekunden erzwingen
      const effectiveInterval = Math.max(dataRefreshInterval, 60000);
      
      timerRef.current = setTimeout(() => {
        // Sicherheitscheck direkt vor dem Auslösen des Updates
        if (!isLoadingRef.current) {
          console.log(`Automatisches Update nach ${effectiveInterval/1000}s`);
          triggerManualUpdate();
        } else {
          console.log('Auto-Update übersprungen: Bereits ein Update im Gange');
        }
      }, effectiveInterval);
    }
    
    // Cleanup beim Unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [dataRefreshInterval, client]);
  
  // Separater Effect für lastDataUpdate, um unnötige Re-renders zu verhindern
  useEffect(() => {
    console.log(`lastDataUpdate geändert: ${lastDataUpdate}`);
    // Dieser Effect wird nur ausgelöst, wenn lastDataUpdate sich ändert
    // und kümmert sich ausschließlich um das Laden der Client-Daten
  }, [lastDataUpdate]);
  
  // Debug-Hilfsfunktion: Ein testweise Abruf der Testdaten
  const forceTestDataFetch = async () => {
    try {
      setLoading(true);
      const testData = await fetchFormData(TEST_CLIENT_ID);
      console.log('Test data fetch successful:', testData);
      alert(`Testdaten für ID ${TEST_CLIENT_ID} erfolgreich abgerufen. Überprüfe die Konsole für Details.`);
    } catch (error) {
      console.error('Error fetching test data:', error);
      alert('Fehler beim Abrufen der Testdaten. Siehe Konsole für Details.');
    } finally {
      setLoading(false);
    }
  };

  // Verwende die bereits am Anfang der Komponente definierten State-Variablen
  // (emailSending, showEmailSuccess)
  
  const handleUpload = async (file) => {
    setIsUploading(true);
    
    try {
      // Simuliere Upload-Prozess für die Rechnung
      // Hier würde normalerweise ein echter Upload an einen Dateiserver stattfinden
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Hier würde normalerweise die URL oder der Pfad der hochgeladenen Datei zurückgegeben werden
      const uploadedFilePath = `/uploads/${file.name}`;
      
      setIsUploading(false);
      
      // Zeige Email-Senden-Option an
      return uploadedFilePath;
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      setIsUploading(false);
      alert("Fehler beim Hochladen der Datei: " + error.message);
    }
  };
  
  const handleSendInvoiceEmail = async (filePath, fileName) => {
    if (!client || !client._id) return;
    
    try {
      setEmailSending(true);
      
      // Bereite Rechnungsdaten für Email vor
      const invoiceData = {
        invoiceNumber: client.caseNumber || `INV-${new Date().getTime().toString().substr(-6)}`,
        date: new Date().toLocaleDateString('de-DE'),
        amount: client.honorar || 1111,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'), // 14 Tage ab heute
        filePath: filePath,
        fileName: fileName
      };
      
      // Sende Email mit Rechnung an den Mandanten
      await sendInvoiceEmail(client._id, invoiceData);
      
      setEmailSending(false);
      setShowEmailSuccess(true);
      
      // Blende Erfolgsmeldung nach 5 Sekunden aus
      setTimeout(() => {
        setShowEmailSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Fehler beim Senden der Email:', error);
      setEmailSending(false);
      alert("Fehler beim Senden der Email: " + error.message);
    }
  };
  
  // Die Funktion handleRequestDocuments ist bereits am Anfang der Komponente definiert
  // und wird im Dokumente-Tab verwendet (Zeile ~1540)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600 font-light">Mandantendaten werden geladen...</p>
          <p className="text-sm text-gray-400 mt-2">ID: {id}</p>
          <p className="text-xs text-gray-400 mt-1">Daten werden geladen, bitte warten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-screen-lg mx-auto my-8 px-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-700">
          <p className="font-medium text-lg mb-2">Fehler beim Laden</p>
          <p className="text-red-600">{error}</p>
          <button 
            className="mt-6 px-5 py-2.5 bg-white border border-red-200 rounded-md text-red-700 shadow-sm hover:bg-red-50 transition-colors"
            onClick={() => navigate('/')}
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-screen-lg mx-auto my-8 px-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-blue-700">
          <p className="font-medium text-lg mb-2">Mandant nicht gefunden</p>
          <button 
            className="mt-6 px-5 py-2.5 bg-white border border-blue-200 rounded-md text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
            onClick={() => navigate('/')}
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto pb-20 px-4 animate-fadeIn">
      {/* Header mit Zurück-Button und Mandanten-Name */}
      <div className="flex flex-col mb-8 pt-6">
        <div className="flex items-center mb-2">
          <button 
            onClick={() => navigate('/')}
            className="mr-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-300"
            aria-label="Zurück zur Übersicht"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-medium text-gray-900">{client.name}</h1>
          <span className={`ml-4 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            client.status === 'Aktiv' 
              ? 'bg-green-100 text-green-800' 
              : client.status === 'Wartend' 
              ? 'bg-amber-100 text-amber-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {client.status}
          </span>
          
          {/* Kompakte Prozessverfolgung neben dem Namen */}
          <div className="ml-4 pl-4 border-l border-gray-200">
            {client.currentPhase && (
              <ProgressTracker 
                currentPhase={client.currentPhase} 
                phases={[
                  { name: 'Erstberatung' },
                  { name: 'Rechnung & Anfrage' },
                  { name: 'Dokumente & Zahlung' },
                  { name: 'Abschluss' }
                ]}
                compact={true}
              />
            )}
          </div>
        </div>
        
        {/* Mandanten-ID hervorgehoben anzeigen */}
        <div className="flex items-center ml-12">
          <span className="text-sm text-gray-500">ID:</span>
          <span className="ml-2 text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded select-all">
            {client.clickupId || id}
          </span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(client.clickupId || id);
              alert('ID in die Zwischenablage kopiert!');
            }}
            className="ml-2 text-gray-500 hover:text-gray-700"
            aria-label="ID kopieren"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-4">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {['overview', 'process', 'documents', 'formdata'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                {tab === 'overview' && 'Übersicht'}
                {tab === 'process' && 'Prozessablauf'}
                {tab === 'documents' && 'Dokumente'}
                {tab === 'formdata' && 'Angaben des Mandanten'}
              </button>
            ))}
          </nav>
          
          {/* Letztes Update und Aktualisierungsintervall mit Dropdown */}
          <div className="mt-2 md:mt-0 text-sm text-gray-500 flex items-center">
            <ArrowPathIcon className="h-4 w-4 mr-1 text-gray-400" />
            <span>
              {lastDataUpdate 
                ? `Daten aktualisiert: ${lastDataUpdate.toLocaleTimeString()}`
                : 'Warte auf Daten...'}
            </span>
            <div className="relative ml-3">
              <select
                value={dataRefreshInterval}
                onChange={(e) => setDataRefreshInterval(Number(e.target.value))}
                className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md py-1 pl-2 pr-6 appearance-none cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <option value="60000">Auto-Update: 1 Min.</option>
                <option value="300000">Auto-Update: 5 Min.</option>
                <option value="600000">Auto-Update: 10 Min.</option>
                <option value="1800000">Auto-Update: 30 Min.</option>
                <option value="3600000">Auto-Update: 60 Min.</option>
                <option value="0">Kein Auto-Update</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Debug-Button für Entwicklung - kann für Produktion auskommentiert werden */}
            {debugMode && (
              <button
                onClick={forceTestDataFetch}
                className="ml-4 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded hover:bg-amber-200 transition-colors"
              >
                Test-Daten laden
              </button>
            )}
            
            {/* Debug-Modus Toggle */}
            <button 
              onClick={() => setDebugMode(!debugMode)} 
              className="ml-3 p-1 text-xs text-gray-400 hover:text-gray-600"
              title="Debug-Modus umschalten"
            >
              {debugMode ? '🔍' : '⚙️'}
            </button>
          </div>
        </div>
      </div>

      {/* Übersicht-Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Infobox Honorar */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Honorarinformationen</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-gray-500 text-sm">Gesamtpreis</p>
                    <p className="text-xl font-medium text-gray-900 flex items-center">
                      <CurrencyEuroIcon className="h-5 w-5 text-gray-400 mr-2" />
                      {client.honorar} €
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-sm">Laufzeit</p>
                    <p className="text-xl font-medium text-gray-900">{client.raten} Monate</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-sm">Monatliche Rate</p>
                    <p className="text-xl font-medium text-gray-900 flex items-center">
                      <CurrencyEuroIcon className="h-5 w-5 text-gray-400 mr-2" />
                      {(() => {
                        // Direkt die Daten aus der API-Antwort verwenden ohne Berechnung
                        // Dies ist die monatsRate aus dem preisKalkulation.ratenzahlung Objekt
                        if (client.formData?.preisKalkulation?.ratenzahlung?.monatsRate) {
                          const rate = client.formData.preisKalkulation.ratenzahlung.monatsRate;
                          return typeof rate === 'number' ? 
                            rate.toFixed(2) : 
                            parseFloat(String(rate)).toFixed(2);
                        }
                        
                        // Falls die monatsRate nicht direkt verfügbar ist, nutze die gespeicherte monatlicheRate
                        if (client.monatlicheRate) {
                          return typeof client.monatlicheRate === 'number' ? 
                            client.monatlicheRate.toFixed(2) : 
                            client.monatlicheRate;
                        }
                        
                        // Fallback zum Standardwert
                        return (1111/2).toFixed(2);
                      })()} €
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Upload-Button und Email-Erfolgsmeldung */}
              <div className="flex flex-col items-end">
                <div className="relative">
                  <input
                    type="file"
                    id="fileUpload"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button 
                    className={`px-5 py-2.5 rounded-lg text-white shadow-sm transition-all duration-300 ${
                      isUploading || emailSending
                        ? 'bg-gray-400 cursor-wait' 
                        : 'bg-gray-900 hover:bg-gray-800 hover:shadow-md'
                    }`}
                    disabled={isUploading || emailSending}
                  >
                    {isUploading ? (
                      <span className="flex items-center">
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Wird hochgeladen...
                      </span>
                    ) : emailSending ? (
                      <span className="flex items-center">
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        Email wird gesendet...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <PaperClipIcon className="h-4 w-4 mr-2" />
                        Rechnung hochladen
                      </span>
                    )}
                  </button>
                </div>
                
                {/* Erfolgsmeldung nach dem Email-Versand */}
                {showEmailSuccess && (
                  <div className="mt-3 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm animate-fadeIn">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Email erfolgreich gesendet
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kontaktinformationen */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Kontaktinformationen</h2>
            <div className="space-y-5">
              <div className="flex items-start">
                <UserIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-gray-900">{client.name}</p>
                </div>
              </div>
              <div className="flex items-start">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">E-Mail</p>
                  <a href={`mailto:${client.email}`} className="text-gray-900 hover:text-blue-600 transition-colors">
                    {client.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start">
                <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Telefon</p>
                  <a href={`tel:${client.phone}`} className="text-gray-900 hover:text-blue-600 transition-colors">
                    {client.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Aktenzeichen</p>
                  <p className="text-gray-900">{client.caseNumber}</p>
                </div>
              </div>
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">Adresse</p>
                  <p className="text-gray-900">
                    {(() => {
                      // Wenn formData vorhanden ist, versuche eine vollständigere Adresse zusammenzustellen
                      if (client.formData?.strasse) {
                        const adressTeile = [];
                        
                        // Straße und Hausnummer
                        let strasseHausnummer = client.formData.strasse;
                        if (client.formData.hausnummer) {
                          strasseHausnummer += ' ' + client.formData.hausnummer;
                        }
                        adressTeile.push(strasseHausnummer);
                        
                        // PLZ und Ort 
                        const ortTeile = [];
                        if (client.formData.plz) ortTeile.push(client.formData.plz);
                        if (client.formData.ort || client.formData.wohnort) {
                          ortTeile.push(client.formData.ort || client.formData.wohnort);
                        }
                        
                        if (ortTeile.length > 0) {
                          adressTeile.push(ortTeile.join(' '));
                        }
                        
                        return adressTeile.join(', ');
                      } else {
                        // Fallback auf die vorhandene Adresse
                        return client.address;
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info-Box für Prozessbeschreibung */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Prozessmanagement</h2>
                <p className="text-gray-600 mb-2">
                  Status: <span className="font-medium">{client.currentPhase ? `Phase ${client.currentPhase}/4` : "Noch nicht gestartet"}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Der Mandant befindet sich aktuell im Prozessschritt 
                  <span className="font-medium"> {
                    client.currentPhase === 1 ? "Erstberatung" :
                    client.currentPhase === 2 ? "Rechnung & Anfrage" :
                    client.currentPhase === 3 ? "Dokumente & Zahlung" :
                    client.currentPhase === 4 ? "Abschluss" : "Unbekannt"
                  }</span>.
                </p>
              </div>
              
              <button 
                onClick={() => setActiveTab('process')}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors duration-200 flex items-center"
              >
                Zum Prozessmanagement
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* ClickUp Information */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">ClickUp Referenz</h2>
            <div className="flex items-center">
              <svg className="h-5 w-5 text-purple-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.52 14.634l3.47 3.47c.33.33.77.513 1.234.513.463 0 .904-.183 1.234-.514l5.563-5.563c.33-.33.513-.77.513-1.234 0-.464-.183-.904-.514-1.234l-1.439-1.44c-.33-.33-.77-.513-1.233-.513-.464 0-.904.183-1.234.514l-2.89 2.89-1.16-1.159c-.33-.33-.77-.513-1.233-.513-.464 0-.904.183-1.234.513L6.52 12.165c-.33.33-.513.77-.513 1.234 0 .464.183.904.513 1.234z"/>
              </svg>
              <div>
                <p className="text-sm text-gray-500">ClickUp Task ID</p>
                <a 
                  href={`https://app.clickup.com/t/${client.clickupId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-800 transition-colors font-medium"
                >
                  {client.clickupId}
                </a>
              </div>
            </div>
            
            {/* Löschen-Button unter ClickUp Referenz */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Mandant löschen
              </button>
            </div>
            
            {/* Löschen-Bestätigungsdialog */}
            {showDeleteConfirm && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-600 mb-3">
                  Möchten Sie diesen Mandanten wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteClient}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {isDeleting ? "Wird gelöscht..." : "Ja, löschen"}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prozessablauf-Tab */}
      {activeTab === 'process' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-medium text-gray-900 mb-6">Prozessablauf für {client.name}</h2>
            
            <ClientPhaseManager 
              client={client}
              onPhaseChange={(newPhase) => {
                // Update client in state with new phase
                setClient(prevClient => ({
                  ...prevClient,
                  currentPhase: newPhase,
                  ...(newPhase === 2 && { emailSent: true }),
                  ...(newPhase === 3 && { status: 'Aktiv' })
                }));
              }}
            />
          </div>
        </div>
      )}
      
      {/* Dokumente-Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-gray-900">Dokumente</h2>
            
            {/* Button-Gruppe für Dokumente-Tab */}
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
              {/* Dokument hochladen Button */}
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  id="documentUpload"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button 
                  className={`w-full md:w-auto px-5 py-2.5 rounded-lg text-white shadow-sm transition-all duration-300 ${
                    isUploading || emailSending
                      ? 'bg-gray-400 cursor-wait' 
                      : 'bg-gray-900 hover:bg-gray-800 hover:shadow-md'
                  }`}
                  disabled={isUploading || emailSending}
                >
                  {isUploading ? (
                    <span className="flex items-center">
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Wird hochgeladen...
                    </span>
                  ) : emailSending ? (
                    <span className="flex items-center">
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Email wird gesendet...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <DocumentIcon className="h-4 w-4 mr-2" />
                      Dokument hochladen
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Erfolgsmeldung */}
            {showEmailSuccess && (
              <div className="mt-3 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm animate-fadeIn">
                <div className="flex items-center">
                  <svg className="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Email erfolgreich gesendet
                </div>
              </div>
            )}
          </div>

          {/* Dokumente-Komponente */}
          <ClientDocuments client={client} allowDelete={true} />
        </div>
      )}

      {/* Angaben des Mandanten Tab */}
      {activeTab === 'formdata' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-gray-900">Angaben des Mandanten</h2>
            
            {/* Link zum Formular */}
            <a 
              href={`https://formular-mitarbeiter.vercel.app/form/${client.clickupId || id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition-all duration-300 inline-flex items-center"
            >
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Formular öffnen
            </a>
          </div>
          
          {formData ? (
            <div className="space-y-8 animate-fadeIn">
              {/* Persönliche Daten */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-500 mr-2" />
                  Persönliche Daten
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-gray-900 font-medium">
                      {client.formData?.leadName || client.formData?.name || client.name || '-'}
                    </p>
                  </div>
                  {client.formData?.geburtsdatum && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Geburtsdatum</p>
                      <p className="text-gray-900 font-medium">{client.formData.geburtsdatum}</p>
                    </div>
                  )}
                  {client.formData?.beruf && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Beruf</p>
                      <p className="text-gray-900 font-medium">{client.formData.beruf}</p>
                    </div>
                  )}
                  {client.formData?.familienstand && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Familienstand</p>
                      <p className="text-gray-900 font-medium">{client.formData.familienstand}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Kontaktinformationen */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500 mr-2" />
                  Kontaktinformationen
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Formatierte Zusammenfassung der Adresse */}
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="text-gray-900 font-medium">
                      {(() => {
                        // Wenn die strukturierten Adressfelder vorhanden sind, verwenden wir diese
                        if (client.formData?.strasse || client.formData?.hausnummer || client.formData?.plz || client.formData?.ort || client.formData?.wohnort) {
                          const adressTeile = [];
                          if (client.formData?.strasse) adressTeile.push(client.formData.strasse);
                          if (client.formData?.hausnummer) adressTeile.push(client.formData.hausnummer);
                          
                          const ortTeile = [];
                          if (client.formData?.plz) ortTeile.push(client.formData.plz);
                          
                          // Wohnort oder Ort verwenden - je nachdem was vorhanden ist
                          if (client.formData?.ort) {
                            ortTeile.push(client.formData.ort);
                          } else if (client.formData?.wohnort) {
                            ortTeile.push(client.formData.wohnort);
                          }
                          
                          const adressZeile1 = adressTeile.join(' ');
                          const adressZeile2 = ortTeile.join(' ');
                          
                          return <>
                            {adressZeile1}<br />
                            {adressZeile2}
                          </>;
                        } else {
                          // Ansonsten verwenden wir das generische Adressfeld
                          return client.formData?.adresse || client.address || '-';
                        }
                      })()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">E-Mail</p>
                    <a href={`mailto:${client.formData?.email || client.email}`} className="text-gray-900 hover:text-blue-600 transition-colors font-medium">
                      {client.formData?.email || client.email || '-'}
                    </a>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Telefon</p>
                    <a href={`tel:${client.formData?.telefon || client.phone}`} className="text-gray-900 hover:text-blue-600 transition-colors font-medium">
                      {client.formData?.telefon || client.phone || '-'}
                    </a>
                  </div>

                  {/* Bearbeitbare Aktenzeichennummer */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">Aktenzeichen</p>
                      <button 
                        onClick={() => setIsEditingCaseNumber(true)} 
                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        bearbeiten
                      </button>
                    </div>
                    {isEditingCaseNumber ? (
                      <div className="flex mt-1">
                        <input
                          type="text"
                          value={caseNumber}
                          onChange={(e) => setCaseNumber(e.target.value)}
                          className="flex-grow rounded-l-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-3 py-2 text-sm text-gray-900"
                          placeholder="AZ-XXXX"
                        />
                        <button
                          onClick={handleSaveCaseNumber}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-r-md text-sm"
                        >
                          Speichern
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-900 font-medium">{client.caseNumber || '-'}</p>
                    )}
                    {saveSuccess && (
                      <p className="text-green-600 text-xs mt-1">Aktenzeichennummer erfolgreich aktualisiert</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Honorarinformationen */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <CurrencyEuroIcon className="h-5 w-5 text-gray-500 mr-2" />
                  Honorarinformationen
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Gesamtpreis</p>
                    <p className="text-gray-900 font-medium flex items-center">
                      <CurrencyEuroIcon className="h-4 w-4 text-gray-400 mr-1" />
                      {client.honorar || 1111} €
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Anzahl Raten</p>
                    <p className="text-gray-900 font-medium">
                      {client.raten || 2} Monate
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Monatliche Rate</p>
                    <p className="text-gray-900 font-medium flex items-center">
                      <CurrencyEuroIcon className="h-4 w-4 text-gray-400 mr-1" />
                      {(() => {
                        // Direkt die Daten aus der API-Antwort verwenden ohne Berechnung
                        // Dies ist die monatsRate aus dem preisKalkulation.ratenzahlung Objekt
                        if (client.formData?.preisKalkulation?.ratenzahlung?.monatsRate) {
                          const rate = client.formData.preisKalkulation.ratenzahlung.monatsRate;
                          return typeof rate === 'number' ? 
                            rate.toFixed(2) : 
                            parseFloat(String(rate)).toFixed(2);
                        }
                        
                        // Falls die monatsRate nicht direkt verfügbar ist, nutze die gespeicherte monatlicheRate
                        if (client.monatlicheRate) {
                          return typeof client.monatlicheRate === 'number' ? 
                            client.monatlicheRate.toFixed(2) : 
                            client.monatlicheRate;
                        }
                        
                        // Fallback zum Standardwert
                        return (1111/2).toFixed(2);
                      })()} €
                    </p>
                  </div>
                  
                  {/* Startdatum der Bearbeitung */}
                  {(client.formData?.bearbeitungStart && client.formData?.bearbeitungMonat) && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Startdatum</p>
                      <p className="text-gray-900 font-medium flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {(() => {
                          // Formatiere das Datum aus Tag und Monat
                          const tag = client.formData.bearbeitungStart;
                          const monat = client.formData.bearbeitungMonat;
                          const jahr = new Date().getFullYear();
                          return `${tag}.${monat}.${jahr}`;
                        })()}
                      </p>
                    </div>
                  )}
                  
                  {/* Datum der ersten Abrechnung */}
                  {(client.formData?.abrechnungStart && client.formData?.abrechnungMonat) && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Erste Abrechnung</p>
                      <p className="text-gray-900 font-medium flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {(() => {
                          // Formatiere das Datum aus Tag und Monat
                          const tag = client.formData.abrechnungStart;
                          const monat = client.formData.abrechnungMonat;
                          const jahr = new Date().getFullYear();
                          return `${tag}.${monat}.${jahr}`;
                        })()}
                      </p>
                    </div>
                  )}

                  {client.formData?.nettoeinkommen && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Nettoeinkommen</p>
                      <p className="text-gray-900 font-medium">
                        {client.formData.nettoeinkommen}
                      </p>
                    </div>
                  )}
                  
                  {/* Abrechnungsart */}
                  {client.formData?.preisKalkulation?.berechnungsart && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Berechnungsart</p>
                      <p className="text-gray-900 font-medium">
                        {(() => {
                          const berechnungsart = client.formData.preisKalkulation.berechnungsart;
                          if (berechnungsart === 'nach Gläubiger') return 'Nach Gläubigeranzahl';
                          if (berechnungsart === 'standard') return 'Standardpreis';
                          if (berechnungsart === 'manuell') return 'Manueller Preis';
                          return berechnungsart;
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Adressinformationen - Speziell formatiert */}
              {(client.formData?.strasse || client.formData?.hausnummer || client.formData?.plz || client.formData?.ort || client.formData?.wohnort) && (
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Adressinformationen
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {client.formData?.strasse && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Straße</p>
                        <p className="text-gray-900 font-medium">{client.formData.strasse}</p>
                      </div>
                    )}
                    {client.formData?.hausnummer && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Hausnummer</p>
                        <p className="text-gray-900 font-medium">{client.formData.hausnummer}</p>
                      </div>
                    )}
                    {client.formData?.plz && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">PLZ</p>
                        <p className="text-gray-900 font-medium">{client.formData.plz}</p>
                      </div>
                    )}
                    {/* Wohnort oder Ort anzeigen */}
                    {(client.formData?.ort || client.formData?.wohnort) && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Ort</p>
                        <p className="text-gray-900 font-medium">{client.formData.ort || client.formData.wohnort}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Kostenaufstellung - Wenn vorhanden */}
              {client.formData?.kostenaufstellung && (
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                    <CurrencyEuroIcon className="h-5 w-5 text-gray-500 mr-2" />
                    Kostenaufstellung
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {client.formData.kostenaufstellung.standardberechnung && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Standardberechnung</p>
                        <p className="text-gray-900 font-medium">{client.formData.kostenaufstellung.standardberechnung}</p>
                      </div>
                    )}
                    {client.formData.kostenaufstellung.standardpreis && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Standardpreis</p>
                        <p className="text-gray-900 font-medium">{client.formData.kostenaufstellung.standardpreis}</p>
                      </div>
                    )}
                    {client.formData.kostenaufstellung.gesamtpreis && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Gesamtpreis</p>
                        <p className="text-gray-900 font-medium">{client.formData.kostenaufstellung.gesamtpreis}</p>
                      </div>
                    )}
                    {client.formData.kostenaufstellung.berechnung && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Berechnungsmethode</p>
                        <p className="text-gray-900 font-medium">{client.formData.kostenaufstellung.berechnung}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Beschäftigung und Beruf */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Beschäftigung und Beruf
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {client.formData?.beschaeftigungsArt && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Beschäftigungsart</p>
                      <p className="text-gray-900 font-medium">{client.formData.beschaeftigungsArt}</p>
                    </div>
                  )}
                  {client.formData?.derzeitigeTaetigkeit && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Derzeitige Tätigkeit</p>
                      <p className="text-gray-900 font-medium">{client.formData.derzeitigeTaetigkeit}</p>
                    </div>
                  )}
                  {client.formData?.erlernterBeruf && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Erlernter Beruf</p>
                      <p className="text-gray-900 font-medium">{client.formData.erlernterBeruf}</p>
                    </div>
                  )}
                  {client.formData?.selbststaendig !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Selbstständig</p>
                      <p className="text-gray-900 font-medium">{client.formData.selbststaendig ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.warSelbststaendig !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">War selbstständig</p>
                      <p className="text-gray-900 font-medium">{client.formData.warSelbststaendig ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.befristet !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Befristeter Arbeitsvertrag</p>
                      <p className="text-gray-900 font-medium">{client.formData.befristet ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Finanzielle Situation */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <CurrencyEuroIcon className="h-5 w-5 text-gray-500 mr-2" />
                  Finanzielle Situation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {client.formData?.nettoEinkommen && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Nettoeinkommen</p>
                      <p className="text-gray-900 font-medium">{client.formData.nettoEinkommen} €</p>
                    </div>
                  )}
                  {client.formData?.gesamtSchulden && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Gesamtschulden</p>
                      <p className="text-gray-900 font-medium">{client.formData.gesamtSchulden} €</p>
                    </div>
                  )}
                  {client.formData?.glaeubiger && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Anzahl Gläubiger</p>
                      <p className="text-gray-900 font-medium">{client.formData.glaeubiger}</p>
                    </div>
                  )}
                  {client.formData?.aktuelePfaendung !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Aktuelle Pfändung</p>
                      <p className="text-gray-900 font-medium">{client.formData.aktuelePfaendung ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.pfaendungDetails && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Details zur Pfändung</p>
                      <p className="text-gray-900 font-medium">{client.formData.pfaendungDetails}</p>
                    </div>
                  )}
                  {/* Kinder und Unterhalt */}
                  {client.formData?.kinderAnzahl && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Anzahl Kinder</p>
                      <p className="text-gray-900 font-medium">{client.formData.kinderAnzahl}</p>
                    </div>
                  )}
                  {client.formData?.unterhaltspflicht !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Unterhaltspflicht</p>
                      <p className="text-gray-900 font-medium">{client.formData.unterhaltspflicht ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.unterhaltArt && client.formData.unterhaltspflicht && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Art des Unterhalts</p>
                      <p className="text-gray-900 font-medium">
                        {client.formData.unterhaltArt === 'barunterhalt' ? 'Barunterhalt' : 
                         client.formData.unterhaltArt === 'naturalunterhalt' ? 'Naturalunterhalt' :
                         client.formData.unterhaltArt}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Vermögenswerte */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Vermögenswerte
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fahrzeuge */}
                  {client.formData?.fahrzeuge !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Fahrzeuge</p>
                      <p className="text-gray-900 font-medium">{client.formData.fahrzeuge ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.fahrzeugWert && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Fahrzeug-Wert</p>
                      <p className="text-gray-900 font-medium">{client.formData.fahrzeugWert} €</p>
                    </div>
                  )}
                  {client.formData?.fahrzeugNotwendig !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Fahrzeug notwendig</p>
                      <p className="text-gray-900 font-medium">{client.formData.fahrzeugNotwendig ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.fahrzeugFinanziert !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Fahrzeug finanziert</p>
                      <p className="text-gray-900 font-medium">{client.formData.fahrzeugFinanziert ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  
                  {/* Immobilien */}
                  {client.formData?.immobilien !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Immobilien</p>
                      <p className="text-gray-900 font-medium">{client.formData.immobilien ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.immobilienDetails && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Immobilien-Details</p>
                      <p className="text-gray-900 font-medium">{client.formData.immobilienDetails}</p>
                    </div>
                  )}
                  
                  {/* Versicherungen */}
                  {client.formData?.lebensversicherung !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Lebensversicherung</p>
                      <p className="text-gray-900 font-medium">{client.formData.lebensversicherung ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.lebensversicherungWert && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Lebensversicherung Wert</p>
                      <p className="text-gray-900 font-medium">{client.formData.lebensversicherungWert}</p>
                    </div>
                  )}
                  {client.formData?.rentenversicherung !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Rentenversicherung</p>
                      <p className="text-gray-900 font-medium">{client.formData.rentenversicherung ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.rentenversicherungWert && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Rentenversicherung Details</p>
                      <p className="text-gray-900 font-medium">{client.formData.rentenversicherungWert}</p>
                    </div>
                  )}
                  
                  {/* Weitere Vermögenswerte */}
                  {client.formData?.weitereVermoegen !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Weitere Vermögenswerte</p>
                      <p className="text-gray-900 font-medium">{client.formData.weitereVermoegen ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.weitereVermoegenDetails && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Details zu weiteren Vermögenswerten</p>
                      <p className="text-gray-900 font-medium">{client.formData.weitereVermoegenDetails}</p>
                    </div>
                  )}
                  {client.formData?.sparbuch !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Sparbuch</p>
                      <p className="text-gray-900 font-medium">{client.formData.sparbuch ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.bausparvertrag !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Bausparvertrag</p>
                      <p className="text-gray-900 font-medium">{client.formData.bausparvertrag ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Weitere Angaben */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                  Weitere Angaben
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {client.formData?.vorherigeInsolvenz !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Vorherige Insolvenz</p>
                      <p className="text-gray-900 font-medium">{client.formData.vorherigeInsolvenz ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.insolvenzDatum && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Insolvenz-Datum</p>
                      <p className="text-gray-900 font-medium">{client.formData.insolvenzDatum}</p>
                    </div>
                  )}
                  {client.formData?.zustellungEmail !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Zustellung per E-Mail</p>
                      <p className="text-gray-900 font-medium">{client.formData.zustellungEmail ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.zustellungPost !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Zustellung per Post</p>
                      <p className="text-gray-900 font-medium">{client.formData.zustellungPost ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.notizen && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-sm text-gray-500">Notizen</p>
                      <p className="text-gray-900 font-medium">{client.formData.notizen}</p>
                    </div>
                  )}
                  
                  {/* Preiskalkulation Details */}
                  {client.formData?.preisKalkulation?.berechnungsart && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Berechnungsart</p>
                      <p className="text-gray-900 font-medium">{client.formData.preisKalkulation.berechnungsart}</p>
                    </div>
                  )}
                  {client.formData?.manuellerPreis !== undefined && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Manueller Preis</p>
                      <p className="text-gray-900 font-medium">{client.formData.manuellerPreis ? 'Ja' : 'Nein'}</p>
                    </div>
                  )}
                  {client.formData?.manuellerPreisBetrag && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Manueller Preisbetrag</p>
                      <p className="text-gray-900 font-medium">{client.formData.manuellerPreisBetrag} €</p>
                    </div>
                  )}
                  {client.formData?.manuellerPreisNotiz && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Manueller Preis Notiz</p>
                      <p className="text-gray-900 font-medium">{client.formData.manuellerPreisNotiz}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Leere Felder - Am Ende gruppiert */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Nicht ausgefüllte Felder
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(client.formData || {})
                    .filter(([key, value]) => {
                      // Felder, die wir immer ausschließen wollen (interne Felder, IDs, etc.)
                      const excludedKeys = [
                        'kostenaufstellung', 'ratenzahlung', '_id', '__v', 'taskId', 'preisKalkulation',
                        'createdAt', 'updatedAt', 'adresse', 'id'
                      ];
                      
                      // Prüfe, ob der Schlüssel in der Ausschlussliste ist
                      if (excludedKeys.includes(key)) {
                        return false;
                      }
                      
                      // Prüfe, ob der Wert leer ist
                      const isEmpty = 
                        value === null || 
                        value === undefined || 
                        value === '' || 
                        (typeof value === 'object' && Object.keys(value).length === 0);
                      
                      return isEmpty;
                    })
                    .map(([key, _]) => {
                      // Funktion zur Formatierung der Feldnamen für benutzerfreundliche Anzeige
                      const formatFieldName = (key) => {
                        // Ersetze camelCase durch Leerzeichen
                        let formatted = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        
                        // Spezialfälle für bessere Lesbarkeit
                        const replacements = {
                          'Aktuelle Pfaendung': 'Aktuelle Pfändung',
                          'Immobilie Ausland': 'Immobilie im Ausland',
                          'War Selbststaendig': 'War selbstständig',
                          'Selbststaendig': 'Selbstständig',
                          'Weitere Vermoegen': 'Weitere Vermögenswerte',
                          'Fahrzeug Brief Bank': 'Fahrzeugbrief bei Bank',
                          'Plz': 'PLZ'
                        };
                        
                        Object.entries(replacements).forEach(([search, replace]) => {
                          formatted = formatted.replace(search, replace);
                        });
                        
                        return formatted;
                      };
                      
                      return (
                        <div key={key} className="space-y-1">
                          <p className="text-sm text-gray-500">
                            {formatFieldName(key)}
                          </p>
                          <p className="text-gray-400 italic text-sm">
                            Nicht ausgefüllt
                          </p>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-blue-700">
              <p className="font-medium text-lg mb-2">Angaben des Mandanten konnten nicht geladen werden</p>
              <p className="mb-4">Die Daten für diesen Mandanten konnten nicht vom Server abgerufen werden. Bitte versuchen Sie es später erneut.</p>
              <button 
                className="mt-2 px-5 py-2.5 bg-white border border-blue-200 rounded-md text-blue-700 shadow-sm hover:bg-blue-50 transition-colors flex items-center"
                onClick={triggerManualUpdate}
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Erneut versuchen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientDetailPage;