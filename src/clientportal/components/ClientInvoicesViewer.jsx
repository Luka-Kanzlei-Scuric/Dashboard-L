import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  DocumentMagnifyingGlassIcon, 
  ExclamationCircleIcon,
  PaperClipIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyEuroIcon
} from '@heroicons/react/24/outline';

/**
 * Component to display client invoices in the portal
 * 
 * @param {Object} props Component props
 * @param {Object} props.client The client object
 */
const ClientInvoicesViewer = ({ client }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePreview, setActivePreview] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true); // Start expanded
  
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Load documents on component mount and when client changes
  useEffect(() => {
    if (client && client._id) {
      fetchInvoices();
    }
  }, [client]);
  
  // Fetch invoices from API
  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get API base URL from environment or use default
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://dashboard-l-backend.onrender.com/api';
      
      // Fetch documents for client
      const response = await fetch(`${apiBaseUrl}/clients/${client._id}/documents`);
      
      // Check response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Laden der Rechnungen');
      }
      
      // Parse response
      const data = await response.json();
      
      // Fix URLs for documents by prepending API base path without /api
      const invoicesWithFixedUrls = (data.documents || [])
        .filter(doc => doc.documentType === 'invoice') // Only show invoices
        .map(doc => ({
          ...doc,
          url: `${apiBaseUrl.replace(/\/api$/, '')}${doc.url}` // Absolute URL with fixed base path
        }));
      
      setInvoices(invoicesWithFixedUrls);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Get document icon based on mimetype
  const getDocumentIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) {
      return (
        <div className="rounded-full bg-purple-100 p-2">
          <DocumentMagnifyingGlassIcon className="h-4 w-4 text-purple-700" />
        </div>
      );
    } else if (mimetype === 'application/pdf') {
      return (
        <div className="rounded-full bg-red-100 p-2">
          <DocumentTextIcon className="h-4 w-4 text-red-700" />
        </div>
      );
    } else {
      return (
        <div className="rounded-full bg-blue-100 p-2">
          <PaperClipIcon className="h-4 w-4 text-blue-700" />
        </div>
      );
    }
  };
  
  // Toggle document preview
  const togglePreview = (documentId) => {
    if (activePreview === documentId) {
      setActivePreview(null);
    } else {
      setActivePreview(documentId);
    }
  };
  
  // Get preview component for document
  const getPreviewComponent = (document) => {
    if (document.mimetype.startsWith('image/')) {
      return (
        <img 
          src={document.url} 
          alt={document.originalFilename}
          className="max-w-full max-h-96 object-contain rounded-lg shadow-sm" 
        />
      );
    } else if (document.mimetype === 'application/pdf') {
      return (
        <iframe 
          src={`${document.url}#view=FitH`}
          className="w-full h-96 border-0 rounded-lg shadow-sm" 
          title={document.originalFilename}
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
          <ExclamationCircleIcon className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">Vorschau nicht verfügbar.</p>
          <a 
            href={document.url} 
            download 
            className="mt-4 px-4 py-2 bg-[#9c1a1b] text-white rounded-lg hover:bg-[#8a1718] transition-colors flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Herunterladen
          </a>
        </div>
      );
    }
  };
  
  // Toggle section expansion
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };
  
  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#9c1a1b] border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-gray-600">Rechnungen werden geladen...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <ExclamationCircleIcon className="h-8 w-8 mx-auto mb-2" />
        <p>{error || 'Fehler beim Laden der Rechnungen'}</p>
        <button 
          onClick={fetchInvoices}
          className="mt-2 px-4 py-2 bg-[#9c1a1b] text-white rounded-lg hover:bg-[#8a1718] transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }
  
  // When no invoices are available yet, show an informative message
  if (invoices.length === 0) {
    return (
      <div className="px-4 py-5 bg-white rounded-lg shadow-sm border border-gray-200 space-y-4">
        <div className="flex items-center">
          <CurrencyEuroIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">
            Ihre Rechnung
          </h3>
        </div>
        
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg text-center">
          <div className="rounded-full bg-blue-100 p-3 mb-3">
            <DocumentTextIcon className="h-6 w-6 text-blue-700" />
          </div>
          <p className="text-gray-700 font-medium">Keine Rechnungen vorhanden</p>
          <p className="text-gray-500 text-sm mt-1">
            Sobald eine Rechnung für Sie bereitsteht, wird sie hier angezeigt.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 py-5 bg-white rounded-lg shadow-sm border border-gray-200 space-y-4">
      {/* Header with toggle */}
      <button 
        className="w-full flex items-center justify-between"
        onClick={toggleExpansion}
      >
        <div className="flex items-center">
          <CurrencyEuroIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">
            Ihre Rechnung
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>
      
      {/* Invoices list */}
      {isExpanded && (
        <div className="border rounded-xl overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {invoices.map(invoice => (
              <li key={invoice.id} className="p-4">
                <div className="flex items-start">
                  {getDocumentIcon(invoice.mimetype)}
                  
                  <div className="ml-3 flex-grow min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <h4 className="text-sm font-medium text-gray-900 truncate max-w-[220px] sm:max-w-sm">
                        {invoice.originalFilename}
                      </h4>
                      
                      <div className="flex mt-2 sm:mt-0 space-x-4">
                        <button 
                          onClick={() => togglePreview(invoice.id)}
                          className="text-[#9c1a1b] hover:text-[#8a1718] text-xs flex items-center"
                        >
                          {activePreview === invoice.id ? 'Schließen' : 'Vorschau'}
                        </button>
                        
                        <a 
                          href={invoice.url} 
                          download 
                          className="text-[#9c1a1b] hover:text-[#8a1718] text-xs flex items-center"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          <span className="block">Download</span>
                        </a>
                      </div>
                    </div>
                    
                    <div className="mt-1 text-xs text-gray-500 flex justify-between">
                      <div>
                        <span className="px-2 py-1 bg-gray-100 rounded-full">Rechnung</span>
                        <span className="ml-2">{formatFileSize(invoice.size)}</span>
                      </div>
                      <span>
                        {new Date(invoice.uploadDate).toLocaleDateString('de-DE', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Invoice Preview */}
                {activePreview === invoice.id && (
                  <div className="mt-4 animate-fadeIn">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {getPreviewComponent(invoice)}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClientInvoicesViewer;