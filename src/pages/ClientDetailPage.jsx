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
  DocumentIcon
} from '@heroicons/react/24/outline';

const ClientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClient } = useClients();
  const [client, setClient] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(null);

  // Mock-Daten für die Dokumentenliste (da diese nicht über die API kommen)
  const mockDocuments = [
    { id: 1, name: "Gläubigerschreiben.pdf", type: "pdf", date: "15.03.2025" },
    { id: 2, name: "Vertrag.docx", type: "docx", date: "10.03.2025" },
    { id: 3, name: "Vollmacht.pdf", type: "pdf", date: "05.03.2025" }
  ];

  // Funktion zum Abrufen der Formulardaten vom Backend
  const fetchFormData = async (clientId) => {
    try {
      setLoading(true);
      const response = await axios.get(`https://privatinsolvenz-backend.onrender.com/api/forms/${clientId}`);
      
      if (response.status === 200) {
        console.log('Form data received:', response.data);
        setFormData(response.data);
        return response.data;
      } else {
        throw new Error(`API-Fehler: ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching form data:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true);
        
        // Erst den Client aus dem Context laden
        const clientData = await getClient(id);
        
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
            honorar: formDataResponse?.honorar || 5000,
            raten: formDataResponse?.raten || 5,
            ratenStart: formDataResponse?.ratenStart || "01.01.2025",
            address: formDataResponse?.adresse || clientData.address || "Keine Adresse vorhanden"
          };
          
          setClient(enrichedClient);
        } catch (formError) {
          console.error('Error loading form data:', formError);
          
          // Wenn Formulardaten nicht geladen werden können, trotzdem den Client anzeigen
          setClient({
            ...clientData,
            id: id,
            documents: mockDocuments,
            honorar: 5000,
            raten: 5,
            ratenStart: "01.01.2025"
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

  const handleUpload = () => {
    setIsUploading(true);
    // Simuliere Upload-Prozess
    setTimeout(() => {
      setIsUploading(false);
      alert("Dokument erfolgreich hochgeladen und Gläubigerschreiben angefordert!");
    }, 1500);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpload();
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
              {tab === 'formdata' && 'Formulardaten'}
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
                    <p className="text-gray-500 text-sm">Honorarpreis</p>
                    <p className="text-xl font-medium text-gray-900 flex items-center">
                      <CurrencyEuroIcon className="h-5 w-5 text-gray-400 mr-2" />
                      {client.honorar} €
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-sm">Raten</p>
                    <p className="text-xl font-medium text-gray-900">{client.raten}x</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-500 text-sm">Erste Rate</p>
                    <p className="text-xl font-medium text-gray-900 flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      {client.ratenStart}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Upload-Button */}
              <div className="relative">
                <input
                  type="file"
                  id="fileUpload"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button 
                  className={`px-5 py-2.5 rounded-lg text-white shadow-sm transition-all duration-300 ${
                    isUploading 
                      ? 'bg-gray-400 cursor-wait' 
                      : 'bg-gray-900 hover:bg-gray-800 hover:shadow-md'
                  }`}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <span className="flex items-center">
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Wird hochgeladen...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <PaperClipIcon className="h-4 w-4 mr-2" />
                      Rechnung hochladen
                    </span>
                  )}
                </button>
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
          </div>
        </div>
      )}

      {/* Dokumente-Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-gray-900">Dokumente</h2>
            
            {/* Upload-Button für Dokumente-Tab */}
            <div className="relative">
              <input
                type="file"
                id="documentUpload"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button 
                className={`px-5 py-2.5 rounded-lg text-white shadow-sm transition-all duration-300 ${
                  isUploading 
                    ? 'bg-gray-400 cursor-wait' 
                    : 'bg-gray-900 hover:bg-gray-800 hover:shadow-md'
                }`}
                disabled={isUploading}
              >
                {isUploading ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Wird hochgeladen...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <PaperClipIcon className="h-4 w-4 mr-2" />
                    Dokument hochladen
                  </span>
                )}
              </button>
            </div>
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

      {/* Formulardaten-Tab */}
      {activeTab === 'formdata' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-gray-900">Formulardaten</h2>
            
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
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(client.formData || {}).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-sm text-gray-500 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </p>
                    <p className="text-gray-900 font-medium">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value || '-')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-blue-700">
              <p className="font-medium text-lg mb-2">Formulardaten konnten nicht geladen werden</p>
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