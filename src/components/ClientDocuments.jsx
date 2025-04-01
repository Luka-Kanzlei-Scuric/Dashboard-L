import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  XMarkIcon, 
  ArrowDownTrayIcon,
  DocumentMagnifyingGlassIcon, 
  TrashIcon,
  ExclamationCircleIcon,
  PaperClipIcon,
  CheckIcon,
  Square2StackIcon,
  ArrowPathIcon
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
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  
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
    setSelectedDocuments([]);
    setSelectMode(false);
    
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
      
      // Korrigiere URLs für die Dokumente, indem der API-Basispfad ohne /api vorangestellt wird
      const documentsWithFixedUrls = (data.documents || []).map(doc => ({
        ...doc,
        url: `${apiBaseUrl.replace(/\/api$/, '')}${doc.url}` // Absolute URL mit korrigiertem Basispfad
      }));
      
      setDocuments(documentsWithFixedUrls);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle select mode
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedDocuments([]);
  };
  
  // Toggle document selection
  const toggleDocumentSelection = (documentId) => {
    if (selectedDocuments.includes(documentId)) {
      setSelectedDocuments(selectedDocuments.filter(id => id !== documentId));
    } else {
      setSelectedDocuments([...selectedDocuments, documentId]);
    }
  };
  
  // Select all documents
  const selectAllDocuments = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map(doc => doc.id));
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
      
      // Remove from selected documents if it was selected
      setSelectedDocuments(selectedDocuments.filter(id => id !== documentId));
      
      // Close preview if this document is being previewed
      if (activePreview === documentId) {
        setActivePreview(null);
      }
      
      // Erfolgsmeldung anzeigen
      alert('Dokument erfolgreich gelöscht');
      
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(`Fehler beim Löschen des Dokuments: ${error.message}`);
    }
  };
  
  // Delete multiple documents
  const handleDeleteSelectedDocuments = async () => {
    if (selectedDocuments.length === 0) {
      return;
    }
    
    if (!confirm(`Möchten Sie ${selectedDocuments.length} Dokumente wirklich löschen?`)) {
      return;
    }
    
    try {
      // Get API base URL from environment or use default
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://dashboard-l-backend.onrender.com/api';
      
      // Array to collect failed deletions
      const failedDeletions = [];
      
      // Delete each selected document
      for (const documentId of selectedDocuments) {
        try {
          // Send delete request
          const response = await fetch(`${apiBaseUrl}/clients/${client._id}/documents/${documentId}`, {
            method: 'DELETE'
          });
          
          // Check response
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Fehler beim Löschen des Dokuments');
          }
        } catch (error) {
          console.error(`Error deleting document ${documentId}:`, error);
          failedDeletions.push(documentId);
        }
      }
      
      // Remove deleted documents from state
      const remainingDocIds = new Set(failedDeletions);
      setDocuments(documents.filter(doc => remainingDocIds.has(doc.id) || !selectedDocuments.includes(doc.id)));
      
      // Reset selections
      setSelectedDocuments([]);
      
      // Show success/failure message
      if (failedDeletions.length === 0) {
        alert('Alle ausgewählten Dokumente wurden erfolgreich gelöscht');
      } else {
        alert(`${selectedDocuments.length - failedDeletions.length} Dokumente wurden gelöscht. ${failedDeletions.length} Dokumente konnten nicht gelöscht werden.`);
      }
      
    } catch (error) {
      console.error('Error in bulk document deletion:', error);
      alert(`Fehler beim Löschen der Dokumente: ${error.message}`);
    }
  };
  
  // Get document icon based on mimetype
  const getDocumentIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) {
      return (
        <div className="rounded-full bg-purple-50 p-2 shadow-sm border border-purple-100">
          <DocumentMagnifyingGlassIcon className="h-4 w-4 text-purple-600" />
        </div>
      );
    } else if (mimetype === 'application/pdf') {
      return (
        <div className="rounded-full bg-red-50 p-2 shadow-sm border border-red-100">
          <DocumentTextIcon className="h-4 w-4 text-red-600" />
        </div>
      );
    } else {
      return (
        <div className="rounded-full bg-blue-50 p-2 shadow-sm border border-blue-100">
          <PaperClipIcon className="h-4 w-4 text-blue-600" />
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
        <div className="relative">
          <img 
            src={document.url} 
            alt={document.originalFilename}
            className="max-w-full max-h-96 object-contain rounded-xl shadow-sm border border-gray-100" 
          />
          <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-full shadow-sm px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-100">
            <span className="flex items-center">
              <DocumentMagnifyingGlassIcon className="h-3.5 w-3.5 mr-1 text-purple-600" />
              Bild-Vorschau
            </span>
          </div>
        </div>
      );
    } else if (document.mimetype === 'application/pdf') {
      return (
        <div className="relative">
          <iframe 
            src={`${document.url}#view=FitH`}
            className="w-full h-96 border-0 rounded-xl shadow-sm" 
            title={document.originalFilename}
          />
          <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-full shadow-sm px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-100">
            <span className="flex items-center">
              <DocumentTextIcon className="h-3.5 w-3.5 mr-1 text-red-600" />
              PDF-Dokument
            </span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
            <ExclamationCircleIcon className="h-8 w-8 text-blue-500" />
          </div>
          <p className="text-gray-600 font-medium">Vorschau nicht verfügbar</p>
          <p className="text-gray-500 text-sm mb-6">Das Format dieses Dokuments unterstützt keine Vorschau.</p>
          <a 
            href={document.url} 
            download 
            className="px-4 py-2 bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded-full shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Dokument herunterladen
          </a>
        </div>
      );
    }
  };
  
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Dokumente werden geladen</p>
        <p className="text-gray-500 text-sm">Bitte warten Sie einen Moment...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-red-100">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <ExclamationCircleIcon className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Fehler beim Laden</h3>
        <p className="text-red-600 mb-4">{error || 'Fehler beim Laden der Dokumente'}</p>
        <button 
          onClick={fetchDocuments}
          className="px-6 py-2 bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded-full shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 focus:ring-2 focus:ring-blue-300 flex items-center mx-auto"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Erneut versuchen
        </button>
      </div>
    );
  }
  
  if (documents.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
          <DocumentTextIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Dokumente vorhanden</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Für diesen Mandanten wurden noch keine Dokumente hochgeladen.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
          Dokumente ({documents.length})
        </h3>
        
        {allowDelete && documents.length > 0 && (
          <div className="flex space-x-2 items-center">
            {selectMode && (
              <div className="mr-1 text-sm text-gray-500">
                {selectedDocuments.length} ausgewählt
              </div>
            )}
            
            {selectMode && selectedDocuments.length > 0 && (
              <button
                onClick={handleDeleteSelectedDocuments}
                className="group relative px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all duration-200 flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-1.5" />
                Löschen
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-800">
                  {selectedDocuments.length}
                </span>
              </button>
            )}
            
            {selectMode && (
              <button
                onClick={selectAllDocuments}
                className="px-4 py-2 text-sm font-medium rounded-full bg-gray-50 text-gray-600 border border-gray-200 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200 flex items-center"
              >
                {selectedDocuments.length === documents.length ? (
                  <>
                    <XMarkIcon className="h-4 w-4 mr-1.5" />
                    Auswahl aufheben
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-1.5" />
                    Alle
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={toggleSelectMode}
              className={`px-4 py-2 text-sm font-medium rounded-full shadow-sm transition-all duration-200 flex items-center ${
                selectMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-300'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200'
              }`}
            >
              <Square2StackIcon className="h-4 w-4 mr-1.5" />
              {selectMode ? 'Fertig' : 'Auswählen'}
            </button>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {documents.map(document => (
            <li key={document.id} className={`p-4 transition-all duration-200 ${
              selectMode 
                ? selectedDocuments.includes(document.id)
                  ? 'bg-blue-50/30'
                  : 'hover:bg-gray-50/80' 
                : ''
            }`}>
              <div className="flex items-start">
                {selectMode ? (
                  <button
                    onClick={() => toggleDocumentSelection(document.id)}
                    className="flex-shrink-0 mr-3 mt-1"
                    aria-label={selectedDocuments.includes(document.id) ? "Deselect document" : "Select document"}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                      selectedDocuments.includes(document.id)
                        ? 'bg-blue-600 border-0 text-white shadow-md scale-110'
                        : 'border border-gray-300 bg-white'
                    }`}>
                      {selectedDocuments.includes(document.id) && (
                        <CheckIcon className="h-3 w-3 animate-scaleIn" />
                      )}
                    </div>
                  </button>
                ) : (
                  getDocumentIcon(document.mimetype)
                )}
                
                <div className={`${selectMode ? 'ml-2' : 'ml-3'} flex-grow`}>
                  <div className="flex justify-between">
                    <h4 className="text-sm font-medium text-gray-900 truncate max-w-sm">
                      {document.originalFilename}
                    </h4>
                    
                    <div className="flex space-x-2">
                      {!selectMode && (
                        <>
                          <button 
                            onClick={() => togglePreview(document.id)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium flex items-center hover:bg-blue-100 transition-colors shadow-sm border border-blue-100"
                          >
                            {activePreview === document.id ? (
                              <>
                                <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                                Schließen
                              </>
                            ) : (
                              <>
                                <DocumentMagnifyingGlassIcon className="h-3.5 w-3.5 mr-1" />
                                Vorschau
                              </>
                            )}
                          </button>
                          
                          <a 
                            href={document.url} 
                            download 
                            className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium flex items-center hover:bg-green-100 transition-colors shadow-sm border border-green-100"
                          >
                            <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                            Download
                          </a>
                          
                          {allowDelete && (
                            <button 
                              onClick={() => handleDeleteDocument(document.id)}
                              className="px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium flex items-center hover:bg-red-100 transition-colors shadow-sm border border-red-100"
                            >
                              <TrashIcon className="h-3.5 w-3.5 mr-1" />
                              Löschen
                            </button>
                          )}
                        </>
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
              
              {/* Document Preview - only show when not in select mode */}
              {!selectMode && activePreview === document.id && (
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