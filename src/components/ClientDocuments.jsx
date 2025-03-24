import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  XMarkIcon, 
  ArrowDownTrayIcon,
  DocumentMagnifyingGlassIcon, 
  TrashIcon,
  ExclamationCircleIcon,
  PaperClipIcon
} from '@heroicons/react/24/outline';

/**
 * Component to display and manage documents for a client
 * 
 * @param {Object} props Component props
 * @param {Object} props.client The client object
 * @param {Boolean} props.allowDelete Whether to allow document deletion
 */
const ClientDocuments = ({ client, allowDelete = true }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePreview, setActivePreview] = useState(null);
  
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Format document type for display
  const formatDocumentType = (type) => {
    switch (type) {
      case 'invoice':
        return 'Rechnung';
      case 'creditorLetter':
        return 'Gläubigerschreiben';
      default:
        return 'Dokument';
    }
  };
  
  // Load documents on component mount and when client changes
  useEffect(() => {
    if (client && client._id) {
      fetchDocuments();
    }
  }, [client]);
  
  // Fetch documents from API
  const fetchDocuments = async () => {
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
        throw new Error(errorData.message || 'Fehler beim Laden der Dokumente');
      }
      
      // Parse response
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a document
  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Möchten Sie dieses Dokument wirklich löschen?')) {
      return;
    }
    
    try {
      // Get API base URL from environment or use default
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://dashboard-l-backend.onrender.com/api';
      
      // Send delete request
      const response = await fetch(`${apiBaseUrl}/clients/${client._id}/documents/${documentId}`, {
        method: 'DELETE'
      });
      
      // Check response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Löschen des Dokuments');
      }
      
      // Remove document from state
      setDocuments(documents.filter(doc => doc.id !== documentId));
      
      // Close preview if this document is being previewed
      if (activePreview === documentId) {
        setActivePreview(null);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(`Fehler beim Löschen des Dokuments: ${error.message}`);
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
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Herunterladen
          </a>
        </div>
      );
    }
  };
  
  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-gray-600">Dokumente werden geladen...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <ExclamationCircleIcon className="h-8 w-8 mx-auto mb-2" />
        <p>{error || 'Fehler beim Laden der Dokumente'}</p>
        <button 
          onClick={fetchDocuments}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }
  
  if (documents.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-xl">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Dokumente vorhanden</h3>
        <p className="text-gray-600">
          Für diesen Mandanten wurden noch keine Dokumente hochgeladen.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
        Dokumente ({documents.length})
      </h3>
      
      <div className="bg-white rounded-xl shadow-sm">
        <ul className="divide-y divide-gray-200">
          {documents.map(document => (
            <li key={document.id} className="p-4">
              <div className="flex items-start">
                {getDocumentIcon(document.mimetype)}
                
                <div className="ml-3 flex-grow">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate max-w-sm">
                      {document.originalFilename}
                    </h4>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => togglePreview(document.id)}
                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                      >
                        {activePreview === document.id ? 'Vorschau schließen' : 'Vorschau'}
                      </button>
                      
                      <a 
                        href={document.url} 
                        download 
                        className="text-green-600 hover:text-green-800 text-xs flex items-center"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </a>
                      
                      {allowDelete && (
                        <button 
                          onClick={() => handleDeleteDocument(document.id)}
                          className="text-red-600 hover:text-red-800 text-xs flex items-center"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Löschen
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-1 text-xs text-gray-500 flex justify-between">
                    <div>
                      <span className="px-2 py-1 bg-gray-100 rounded-full">{formatDocumentType(document.documentType)}</span>
                      <span className="ml-2">{formatFileSize(document.size)}</span>
                    </div>
                    <span>
                      {new Date(document.uploadDate).toLocaleDateString('de-DE', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Document Preview */}
              {activePreview === document.id && (
                <div className="mt-4 animate-fadeIn">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {getPreviewComponent(document)}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ClientDocuments;