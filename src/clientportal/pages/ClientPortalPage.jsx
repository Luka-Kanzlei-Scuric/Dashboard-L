import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreditorUploadComponent from '../components/CreditorUploadComponent';
import ClientDataComponent from '../components/ClientDataComponent';
import ClientProgressTracker from '../components/ClientProgressTracker';
import ClientDocumentsViewer from '../components/ClientDocumentsViewer';
import ClientInvoicesViewer from '../components/ClientInvoicesViewer';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '../../config/api';

/**
 * Main client portal page that combines all components
 * Optimized for mobile-first experience
 */
const ClientPortalPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Check authentication on load
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('portal_auth_' + clientId) === 'true';
    if (!isAuthenticated) {
      // Redirect to auth page if not authenticated
      navigate(`/portal/${clientId}`);
    }
  }, [clientId, navigate]);
  
  // Sample progress phases
  const progressPhases = [
    { name: 'Anfrage', description: 'Ihre Anfrage wurde erfasst und bearbeitet.' },
    { name: 'Vertrag', description: 'Der Vertrag wurde unterzeichnet.' },
    { name: 'Dokumente', description: 'Wir sammeln alle relevanten Gläubigerbriefe.' },
    { name: 'Bearbeitung', description: 'Wir analysieren Ihre Situation und erstellen einen Plan.' },
    { name: 'Abschluss', description: 'Der Prozess wird abgeschlossen.' }
  ];
  
  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        // First get the client data
        const response = await api.get(`/clients/${clientId}`);
        const clientData = response.data;
        
        // Then get the form data from the special form endpoint
        if (clientData.clickupId) {
          try {
            const formResponse = await api.get(`/proxy/forms/${clientData.clickupId}`);
            if (formResponse.data) {
              // Create a complete client object with form data included
              clientData.formData = formResponse.data;
            }
          } catch (formErr) {
            console.error('Error fetching form data:', formErr);
            // Continue with partial data - don't fail the whole request
          }
        }
        
        setClient(clientData);
        setError(null);
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError('Fehler beim Laden Ihrer Daten. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };
    
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);
  
  // Handle upload complete
  const handleUploadComplete = (documents) => {
    console.log('Documents uploaded:', documents);
    // Refresh client data to show updated documents
    if (clientId) {
      const fetchClientData = async () => {
        try {
          // First get the client data
          const response = await api.get(`/clients/${clientId}`);
          const clientData = response.data;
          
          // Then get the form data from the special form endpoint
          if (clientData.clickupId) {
            try {
              const formResponse = await api.get(`/proxy/forms/${clientData.clickupId}`);
              if (formResponse.data) {
                // Create a complete client object with form data included
                clientData.formData = formResponse.data;
              }
            } catch (formErr) {
              console.error('Error fetching form data:', formErr);
              // Continue with partial data
            }
          }
          
          setClient(clientData);
        } catch (err) {
          console.error('Error refreshing client data:', err);
        }
      };
      fetchClientData();
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 flex flex-col items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 text-[#9c1a1b] animate-spin mb-4" />
        <p className="text-gray-600">Daten werden geladen...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg text-center">
          <h2 className="text-xl font-bold text-[#9c1a1b] mb-2">Fehler</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#9c1a1b] text-white rounded-lg"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="h-10 flex items-center justify-center">
            <img 
              src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" 
              alt="Logo T. Scuric" 
              className="h-auto w-auto max-h-full max-w-[100px] object-contain" 
            />
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-[#9c1a1b]">
              Kundenportal
            </h1>
            <button 
              onClick={() => {
                localStorage.removeItem('portal_auth_' + clientId);
                navigate(`/portal/${clientId}`);
              }}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded-full transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Progress tracker */}
        <ClientProgressTracker 
          currentPhase={client?.phase || 2} 
          phases={progressPhases} 
        />
        
        {/* Client data */}
        <ClientDataComponent client={client} />
        
        {/* Invoice viewer */}
        <ClientInvoicesViewer client={client} />
        
        {/* Previously uploaded documents viewer */}
        <ClientDocumentsViewer client={client} />
        
        {/* Creditor upload component */}
        <CreditorUploadComponent 
          client={client} 
          onUploadComplete={handleUploadComplete} 
        />
        
        {/* Rating prompt */}
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-start flex-1">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#9c1a1b]/10 flex items-center justify-center mr-3">
                <img 
                  src="https://www.provenexpert.com/favicon.ico" 
                  alt="ProvenExpert" 
                  className="h-6 w-6 object-contain" 
                />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Ihre Erfahrung zählt</h4>
                <p className="text-gray-600 text-xs mt-1">
                  Mit Ihrer Bewertung helfen Sie uns, unseren Service kontinuierlich zu verbessern.
                </p>
              </div>
            </div>
            <a 
              href="https://www.provenexpert.com/rechtsanwalt-thomas-scuric/9298/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full bg-[#9c1a1b] text-white text-xs font-medium hover:bg-[#8a1718] transition-colors ml-4 whitespace-nowrap"
            >
              Jetzt bewerten
            </a>
          </div>
        </div>
        
        {/* Footer note */}
        <div className="text-center text-xs text-gray-500 pt-4 pb-16">
          <div className="flex justify-center mb-3">
            <div className="h-8 flex items-center justify-center">
              <img 
                src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" 
                alt="Logo T. Scuric" 
                className="h-auto w-auto max-h-full max-w-[80px] object-contain opacity-70" 
              />
            </div>
          </div>
          <p>© 2025 T. Scuric Rechtsanwälte</p>
          <p className="mt-1">Bei Fragen nutzen Sie bitte die Support-Funktion</p>
        </div>
      </main>
    </div>
  );
};

export default ClientPortalPage;