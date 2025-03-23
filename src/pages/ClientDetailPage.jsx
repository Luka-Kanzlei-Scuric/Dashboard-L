import React, { useState, useEffect } from 'react';
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

  // Mock-Daten für die Dokumentenliste (da diese nicht über die API kommen)
  const mockDocuments = [
    { id: 1, name: "Gläubigerschreiben.pdf", type: "pdf", date: "15.03.2025" },
    { id: 2, name: "Vertrag.docx", type: "docx", date: "10.03.2025" },
    { id: 3, name: "Vollmacht.pdf", type: "pdf", date: "05.03.2025" }
  ];

  // Funktion zum Abrufen der Formulardaten vom Backend via Proxy
  const fetchFormData = async (clientId) => {
    try {
      setLoading(true);
      console.log(`Fetching form data for client ID: ${clientId}`);

      // Versuche verschiedene Proxy-Strategien in einer bestimmten Reihenfolge
      let response = null;
      let error = null;
      
      // 1. Option: Unser eigener Backend-Proxy (bevorzugt für Produktion)
      try {
        console.log('Trying backend proxy endpoint...');
        // Importiere die API-Konfiguration, um die aktuelle Backend-URL zu verwenden
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://dashboard-l-backend.onrender.com/api';
        const proxyUrl = `${apiBaseUrl}/proxy/forms/${clientId}`;
        
        response = await axios.get(proxyUrl, { 
          timeout: 8000,
          headers: { 'Accept': 'application/json' }
        });
        console.log('Backend proxy successful');
      } catch (proxyError) {
        console.error('Backend proxy failed:', proxyError.message);
        error = proxyError;
        
        // 2. Option: Öffentlicher CORS-Proxy (Fallback für Entwicklung)
        try {
          console.log('Trying public CORS proxy...');
          const corsProxyUrl = 'https://corsproxy.io/?';
          const targetUrl = `https://privatinsolvenz-backend.onrender.com/api/forms/${clientId}`;
          const encodedUrl = encodeURIComponent(targetUrl);
          const publicProxyUrl = `${corsProxyUrl}${encodedUrl}`;
          
          response = await axios.get(publicProxyUrl, {
            timeout: 8000,
            headers: {
              'Accept': 'application/json',
              'x-requested-with': 'XMLHttpRequest'
            }
          });
          console.log('Public CORS proxy successful');
        } catch (corsProxyError) {
          console.error('Public CORS proxy failed:', corsProxyError.message);
          // Direkte Anfrage an API als letzte Option
          try {
            console.log('Trying direct API request as last resort...');
            response = await axios.get(`https://privatinsolvenz-backend.onrender.com/api/forms/${clientId}`, {
              timeout: 5000,
              headers: { 'Accept': 'application/json' }
            });
            console.log('Direct API request successful');
          } catch (directError) {
            console.error('All proxy attempts failed:', directError.message);
            throw directError; // Werfe den letzten Fehler
          }
        }
      }
      
      if (response && response.status === 200) {
        console.log('Form data received:', response.data);
        
        // Protokolliere die erhaltenen Felder für Debugging
        const fields = Object.keys(response.data);
        console.log('Form data fields received:', fields);
        
        // Prüfe auf honorar vs. honorarpreis und normalisiere die Daten
        let normalizedData = { ...response.data };
        
        console.log('Form data response raw fields:', Object.keys(response.data));
        
        // Extrahiere Honorardaten aus verschiedenen möglichen Feldern
        // Neue Priorität: preisKalkulation > gesamtpreis > honorarpreis > standardpreis > honorar > fallback
        
        // Prüfe auf die neue API-Struktur mit preisKalkulation
        if (normalizedData.preisKalkulation) {
          console.log('Found preisKalkulation in form data', JSON.stringify(normalizedData.preisKalkulation, null, 2));
          
          // 1. Honorarpreis extrahieren aus preisKalkulation.gesamtPreis
          if (normalizedData.preisKalkulation.gesamtPreis !== undefined) {
            console.log(`Using preisKalkulation.gesamtPreis (${normalizedData.preisKalkulation.gesamtPreis}) as honorar`);
            normalizedData.honorar = normalizedData.preisKalkulation.gesamtPreis;
          } else if (normalizedData.preisKalkulation.standardPrice !== undefined) {
            console.log(`Using preisKalkulation.standardPrice (${normalizedData.preisKalkulation.standardPrice}) as honorar`);
            normalizedData.honorar = normalizedData.preisKalkulation.standardPrice;
          }
          
          // 2. Raten extrahieren aus preisKalkulation.ratenzahlung.monate
          if (normalizedData.preisKalkulation.ratenzahlung && normalizedData.preisKalkulation.ratenzahlung.monate !== undefined) {
            console.log(`Using preisKalkulation.ratenzahlung.monate (${normalizedData.preisKalkulation.ratenzahlung.monate}) as raten`);
            normalizedData.raten = normalizedData.preisKalkulation.ratenzahlung.monate;
          } else if (normalizedData.ratenzahlungMonate) {
            console.log(`Using ratenzahlungMonate (${normalizedData.ratenzahlungMonate}) as raten`);
            normalizedData.raten = normalizedData.ratenzahlungMonate;
          }
          
          // 3. Monatliche Rate extrahieren aus preisKalkulation.ratenzahlung.monatsRate
          if (normalizedData.preisKalkulation.ratenzahlung && normalizedData.preisKalkulation.ratenzahlung.monatsRate !== undefined) {
            console.log(`Found monatsRate: ${normalizedData.preisKalkulation.ratenzahlung.monatsRate}`);
            normalizedData.monatlicheRate = normalizedData.preisKalkulation.ratenzahlung.monatsRate;
          }
        } else {
          // Fallback auf ältere API-Struktur
          // 1. Honorarpreis extrahieren
          if (normalizedData.gesamtpreis !== undefined) {
            console.log(`Using gesamtpreis (${normalizedData.gesamtpreis}) as honorar`);
            normalizedData.honorar = normalizedData.gesamtpreis;
          } else if (normalizedData.honorarpreis !== undefined) {
            console.log(`Using honorarpreis (${normalizedData.honorarpreis}) as honorar`);
            normalizedData.honorar = normalizedData.honorarpreis;
          } else if (normalizedData.standardpreis !== undefined) {
            console.log(`Using standardpreis (${normalizedData.standardpreis}) as honorar`);
            normalizedData.honorar = normalizedData.standardpreis;
          }
          
          // 2. Raten extrahieren
          if (normalizedData.ratenzahlung && normalizedData.ratenzahlung.laufzeit) {
            console.log(`Using ratenzahlung.laufzeit (${normalizedData.ratenzahlung.laufzeit}) as raten`);
            normalizedData.raten = normalizedData.ratenzahlung.laufzeit;
          } else if (normalizedData.laufzeit !== undefined) {
            console.log(`Using laufzeit (${normalizedData.laufzeit}) as raten`);
            normalizedData.raten = normalizedData.laufzeit;
          }
          
          // 3. Monatliche Rate extrahieren
          if (normalizedData.ratenzahlung && normalizedData.ratenzahlung.monatlicheRate) {
            console.log(`Found monatlicheRate: ${normalizedData.ratenzahlung.monatlicheRate}`);
            normalizedData.monatlicheRate = normalizedData.ratenzahlung.monatlicheRate;
          }
        }
        
        // Stelle sicher, dass honorar als Zahl vorliegt
        if (normalizedData.honorar !== undefined) {
          // Wenn es ein String mit Währungssymbol ist, konvertiere es
          if (typeof normalizedData.honorar === 'string') {
            normalizedData.honorar = parseInt(normalizedData.honorar.replace(/[^\d.,]/g, ''), 10);
            console.log(`Converted string honorar to number: ${normalizedData.honorar}`);
          }
        }
        
        // Stelle sicher, dass raten als Zahl vorliegt
        if (normalizedData.raten !== undefined) {
          if (typeof normalizedData.raten === 'string') {
            // Extrahiere nur Zahlen, z.B. "2 Monate" → 2
            normalizedData.raten = parseInt(normalizedData.raten.replace(/[^\d]/g, ''), 10);
            console.log(`Converted string raten to number: ${normalizedData.raten}`);
          }
        }
        
        // Wenn wir kostenaufstellung haben, versuche die Werte direkt daraus zu nehmen
        if (normalizedData.kostenaufstellung) {
          console.log('Found kostenaufstellung in form data', JSON.stringify(normalizedData.kostenaufstellung, null, 2));
          
          // Versuche das Gesamtpreis-Feld zu finden und zu verwenden
          if (normalizedData.kostenaufstellung.gesamtpreis) {
            try {
              // Extrahiere nur Zahlen aus dem String
              const gesamtpreis = normalizedData.kostenaufstellung.gesamtpreis.toString().replace(/[^\d.,]/g, '');
              // Ersetze Komma durch Punkt für die Konvertierung
              const numericValue = gesamtpreis.replace(',', '.');
              // Konvertiere in eine Zahl
              normalizedData.honorar = parseFloat(numericValue);
              console.log(`Using kostenaufstellung.gesamtpreis: ${normalizedData.honorar}`);
            } catch (e) {
              console.error('Error parsing gesamtpreis:', e);
            }
          }
        }
        
        // Mit Debug-Logging durch den kompletten Datensatz gehen
        console.log('COMPLETE RAW FORM DATA:', JSON.stringify(normalizedData, null, 2));
        
        // Spezialfall für Ratenzahlung mit komplexeren Objekten
        if (normalizedData.ratenzahlung) {
          console.log('RATENZAHLUNG DETAILS:', JSON.stringify(normalizedData.ratenzahlung, null, 2));
          
          if (typeof normalizedData.ratenzahlung === 'object') {
            // Versuche monatliche Rate zu finden
            if (normalizedData.ratenzahlung.monatlicheRate) {
              try {
                const rateString = normalizedData.ratenzahlung.monatlicheRate.toString().replace(/[^\d.,]/g, '');
                normalizedData.monatlicheRate = parseFloat(rateString.replace(',', '.'));
                console.log(`Extracted monatlicheRate: ${normalizedData.monatlicheRate}`);
              } catch (e) {
                console.error('Error parsing monatlicheRate:', e);
              }
            }
            
            // Versuche Laufzeit zu finden
            if (normalizedData.ratenzahlung.laufzeit) {
              try {
                // Entferne alles außer Zahlen
                const laufzeitString = normalizedData.ratenzahlung.laufzeit.toString().replace(/[^\d]/g, '');
                normalizedData.raten = parseInt(laufzeitString, 10);
                console.log(`Extracted laufzeit: ${normalizedData.raten}`);
              } catch (e) {
                console.error('Error parsing laufzeit:', e);
              }
            }
          }
        }
        
        console.log('Normalized form data:', normalizedData);
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

  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true);
        
        // Erst den Client aus dem Context laden
        const clientData = await getClient(id);
        
        // Aktenzeichennummer in den Zustand setzen
        setCaseNumber(clientData?.caseNumber || '');
        
        // Dann die Formulardaten vom angegebenen API-Endpunkt abrufen
        try {
          const formDataResponse = await fetchFormData(clientData.clickupId || id);
          
          // Client-Objekt mit den Formulardaten anreichern
          const enrichedClient = {
            ...clientData,
            id: id,
            formData: formDataResponse,
            documents: mockDocuments, // Nutze Mock-Dokumente für die Demoansicht
            // Standard-Werte für fehlende Felder
            honorar: formDataResponse?.honorar || clientData.honorar || 1111,
            raten: formDataResponse?.raten || clientData.raten || 2,
            ratenStart: formDataResponse?.ratenStart || clientData.ratenStart || "01.01.2025",
            address: formDataResponse?.adresse || clientData.address || "Keine Adresse vorhanden"
          };
          
          // Log für Debugging der Honorardaten
          console.log('Honorardaten nach Anreicherung:', {
            honorarFormData: formDataResponse?.honorar,
            honorarClientData: clientData.honorar,
            finalHonorar: enrichedClient.honorar
          });
          
          setClient(enrichedClient);
          
          // Aktualisiere auch die Daten in der Datenbank, damit die Honorardaten persistiert werden
          if (formDataResponse?.honorar || formDataResponse?.raten || formDataResponse?.ratenStart) {
            try {
              const updateData = {};
              
              if (formDataResponse.honorar) {
                updateData.honorar = formDataResponse.honorar;
              }
              
              if (formDataResponse.raten) {
                updateData.raten = formDataResponse.raten;
              }
              
              if (formDataResponse.ratenStart) {
                updateData.ratenStart = formDataResponse.ratenStart;
              }
              
              if (Object.keys(updateData).length > 0) {
                console.log('Updating client data in database with form data:', updateData);
                await updateClient(clientData._id, updateData);
              }
            } catch (updateError) {
              console.error('Failed to persist form data to database:', updateError);
            }
          }
        } catch (formError) {
          console.error('Error loading form data:', formError);
          
          // Wenn Formulardaten nicht geladen werden können, trotzdem den Client anzeigen
          // Verwende dabei die in der Datenbank gespeicherten Werte, falls vorhanden
          setClient({
            ...clientData,
            id: id,
            documents: mockDocuments,
            honorar: clientData.honorar || 1111,
            raten: clientData.raten || 2,
            ratenStart: clientData.ratenStart || "01.01.2025"
          });
        }
      } catch (err) {
        console.error('Error loading client details:', err);
        setError(err.message || 'Fehler beim Laden der Mandantendetails');
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [id, getClient]);

  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  
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

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const filePath = await handleUpload(file);
      
      // Automatisch die Email nach dem Upload anbieten
      if (filePath && client) {
        handleSendInvoiceEmail(filePath, file.name);
      }
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
  
  // Funktion zum Anfordern von Gläubigerschreiben
  const handleRequestDocuments = async () => {
    if (!client || !client._id) return;
    
    try {
      setEmailSending(true);
      
      // Sende Email mit Anforderung für Gläubigerschreiben
      await requestDocuments(client._id, "Gläubigerschreiben");
      
      setEmailSending(false);
      setShowEmailSuccess(true);
      
      // Blende Erfolgsmeldung nach 5 Sekunden aus
      setTimeout(() => {
        setShowEmailSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Fehler beim Anfordern von Dokumenten:', error);
      setEmailSending(false);
      alert("Fehler beim Anfordern von Dokumenten: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600 font-light">Mandantendaten werden geladen...</p>
          <p className="text-sm text-gray-400 mt-2">ID: {id}</p>
          <p className="text-xs text-gray-400 mt-1">Daten werden frisch vom Server geladen</p>
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
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {['overview', 'documents', 'formdata'].map((tab) => (
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
              {tab === 'documents' && 'Dokumente'}
              {tab === 'formdata' && 'Angaben des Mandanten'}
            </button>
          ))}
        </nav>
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
                      {client.formData?.monatlicheRate || 
                       (client.honorar && client.raten ? 
                        (client.honorar / client.raten).toFixed(2) : 
                        (1111/2).toFixed(2))
                      } €
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
                  <p className="text-gray-900">{client.address}</p>
                </div>
              </div>
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
                      <PaperClipIcon className="h-4 w-4 mr-2" />
                      Dokument hochladen
                    </span>
                  )}
                </button>
              </div>
              
              {/* Gläubigerschreiben anfordern Button */}
              <button 
                onClick={handleRequestDocuments}
                className={`w-full md:w-auto px-5 py-2.5 rounded-lg shadow-sm transition-all duration-300 ${
                  emailSending
                    ? 'bg-gray-400 text-white cursor-wait' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:shadow-md'
                }`}
                disabled={emailSending}
              >
                {emailSending ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Email wird gesendet...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    Gläubigerschreiben anfordern
                  </span>
                )}
              </button>
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

          {/* Dokumente-Liste */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {client.documents.map((doc) => (
                <li key={doc.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <div className="px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-lg mr-4">
                        {doc.type === 'pdf' ? (
                          <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.75 2.75V9c0 .414.336.75.75.75h6.25m-15 3.75v10.5c0 .414.336.75.75.75h16.5c.414 0 .75-.336.75-.75v-15c0-.414-.336-.75-.75-.75H12.75c-.414 0-.75.336-.75.75v9c0 .414-.336.75-.75.75H5.75c-.414 0-.75-.336-.75-.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : doc.type === 'docx' ? (
                          <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.75 2.75V9c0 .414.336.75.75.75h6.25m-15 3.75v10.5c0 .414.336.75.75.75h16.5c.414 0 .75-.336.75-.75v-15c0-.414-.336-.75-.75-.75H12.75c-.414 0-.75.336-.75.75v9c0 .414-.336.75-.75.75H5.75c-.414 0-.75-.336-.75-.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <DocumentIcon className="h-6 w-6 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{doc.name}</p>
                        <p className="text-gray-500 text-sm">{doc.date}</p>
                      </div>
                    </div>
                    <div>
                      <button className="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
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
                      {client.formData?.name || client.name || '-'}
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
                        if (client.formData?.strasse || client.formData?.hausnummer || client.formData?.plz || client.formData?.ort) {
                          const adressTeile = [];
                          if (client.formData?.strasse) adressTeile.push(client.formData.strasse);
                          if (client.formData?.hausnummer) adressTeile.push(client.formData.hausnummer);
                          
                          const ortTeile = [];
                          if (client.formData?.plz) ortTeile.push(client.formData.plz);
                          if (client.formData?.ort) ortTeile.push(client.formData.ort);
                          
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
                      {client.formData?.monatlicheRate || 
                       (client.honorar && client.raten ? 
                        (client.honorar / client.raten).toFixed(2) : 
                        (1111/2).toFixed(2))
                      } €
                    </p>
                  </div>
                  {client.formData?.nettoeinkommen && (
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Nettoeinkommen</p>
                      <p className="text-gray-900 font-medium">
                        {client.formData.nettoeinkommen}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Adressinformationen - Speziell formatiert */}
              {(client.formData?.strasse || client.formData?.hausnummer || client.formData?.plz || client.formData?.ort) && (
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
                    {client.formData?.ort && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Ort</p>
                        <p className="text-gray-900 font-medium">{client.formData.ort}</p>
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

              {/* Weitere Angaben - Alle restlichen Felder */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                  Weitere Angaben
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(client.formData || {})
                    .filter(([key, value]) => {
                      // Filter out specific categories
                      const excludedKeys = [
                        'name', 'email', 'telefon', 'adresse', 'geburtsdatum', 'beruf', 'familienstand',
                        'honorar', 'raten', 'ratenStart', 'nettoeinkommen', 'strasse', 'hausnummer', 'plz', 'ort',
                        'kostenaufstellung', 'ratenzahlung'
                      ];
                      
                      // Filter out empty values
                      if (value === null || value === undefined || value === '') {
                        return false;
                      }
                      
                      // Filter out objects (they are displayed in their own sections)
                      if (typeof value === 'object') {
                        return false;
                      }
                      
                      return key && !excludedKeys.includes(key);
                    })
                    .map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="text-sm text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        <p className="text-gray-900 font-medium">
                          {String(value || '-')}
                        </p>
                      </div>
                    ))
                  }
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
                      // Include only empty values or null
                      return (value === null || value === undefined || value === '') && 
                             key && ![
                               'kostenaufstellung', 'ratenzahlung'
                             ].includes(key);
                    })
                    .map(([key, _]) => (
                      <div key={key} className="space-y-1">
                        <p className="text-sm text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        <p className="text-gray-400 italic text-sm">
                          Nicht ausgefüllt
                        </p>
                      </div>
                    ))
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
                onClick={() => fetchFormData(client.clickupId || id).catch(err => console.error(err))}
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