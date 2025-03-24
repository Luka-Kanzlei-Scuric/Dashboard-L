import React, { useState, useEffect } from 'react';
import ProgressTracker from './ProgressTracker';
import InvoiceUpload from './InvoiceUpload';
import { useClients } from '../context/ClientContext';
import { 
  DocumentTextIcon, 
  EnvelopeIcon, 
  CheckCircleIcon, 
  CreditCardIcon,
  ArrowPathIcon,
  LightBulbIcon,
  CheckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

/**
 * Enhanced component to manage client phases from onboarding to completion
 * Includes progress tracking and phase-specific actions with Apple-inspired design
 * 
 * @param {Object} props Component props
 * @param {Object} props.client The client object
 * @param {Function} props.onPhaseChange Callback when client's phase changes
 */
const ClientPhaseManager = ({ client, onPhaseChange }) => {
  // Define the phases of client management with more detailed descriptions
  const phases = [
    { 
      name: 'Erstberatung', 
      description: 'Erstberatung wurde abgeschlossen. Der Mandant hat alle relevanten Informationen erhalten.',
      instructions: 'Die Erstberatung ist bereits erfolgt. Der Mandant wurde über den Ablauf informiert und hat alle wichtigen Informationen erhalten.',
      icon: CheckCircleIcon,
      alwaysCompleted: true
    },
    { 
      name: 'Rechnung & Anfrage', 
      description: 'Rechnung senden und Gläubigerschreiben vom Mandanten anfordern.',
      instructions: 'In dieser Phase müssen Sie eine Rechnung an den Mandanten senden und ihn bitten, alle relevanten Gläubigerschreiben hochzuladen. Verwenden Sie die Schaltflächen unten, um diese Schritte durchzuführen.',
      icon: DocumentTextIcon,
      actions: ['invoice', 'request-documents']
    },
    { 
      name: 'Dokumente & Zahlung', 
      description: 'Der Mandant muss alle Dokumente hochladen und die erste Zahlung leisten.',
      instructions: 'In dieser Phase warten wir auf den Mandanten. Er muss alle angeforderten Gläubigerschreiben hochladen und die erste Ratenzahlung vornehmen. Sie können diese Phase manuell als abgeschlossen markieren, sobald beides erfolgt ist.',
      icon: CreditCardIcon,
      waitForClient: true
    },
    { 
      name: 'Abschluss', 
      description: 'Die Insolvenzberatung wird abgeschlossen und finalisiert.',
      instructions: 'Alle notwendigen Schritte wurden erfolgreich abgeschlossen. Der Mandant ist nun aktiv im Prozess und wird weiter betreut.',
      icon: CheckIcon,
      final: true
    }
  ];
  
  // State variables
  const [currentPhase, setCurrentPhase] = useState(1);
  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAllPhases, setShowAllPhases] = useState(false);
  const [selectedUploadType, setSelectedUploadType] = useState(null);
  
  const { updateClient, markDocumentsUploaded, markPaymentReceived } = useClients();
  
  // Initialize based on client data
  useEffect(() => {
    if (client) {
      // Check client.currentPhase first (from database)
      if (client.currentPhase) {
        setCurrentPhase(client.currentPhase);
      } else if (client.status === 'Aktiv' && client.emailSent) {
        setCurrentPhase(3); // Documents uploaded & payment started
      } else if (client.emailSent) {
        setCurrentPhase(2); // Email sent phase
      } else {
        setCurrentPhase(1); // Initial phase
      }
    }
  }, [client]);
  
  // Handle client moving to next phase
  const handleNextPhase = async () => {
    if (currentPhase < phases.length) {
      const newPhase = currentPhase + 1;
      
      // Update client in database with new phase information
      try {
        if (client && client._id) {
          await updateClient(client._id, { 
            currentPhase: newPhase,
            // Update other fields depending on the phase
            ...(newPhase === 2 && { emailSent: true }),
            ...(newPhase === 3 && { status: 'Aktiv' })
          });
          
          // Only update the UI state after database update is successful
          setCurrentPhase(newPhase);
          
          if (onPhaseChange) {
            onPhaseChange(newPhase);
          }
        }
      } catch (error) {
        console.error('Error updating client phase:', error);
      }
    }
  };
  
  // Handle phase click with improved validation
  const handlePhaseClick = (phaseNumber) => {
    // Only allow changing to already completed phases or the next phase
    if ((phaseNumber <= currentPhase + 1) && (phaseNumber !== currentPhase)) {
      // Prevent accidental phase skipping - can only go one at a time forward
      const targetPhase = phaseNumber > currentPhase ? currentPhase + 1 : phaseNumber;
      
      // Update client in database if needed
      if (client && client._id) {
        updateClient(client._id, { currentPhase: targetPhase })
          .then(() => {
            // Update local state only after server confirmation
            setCurrentPhase(targetPhase);
            
            // Update upload type when moving to phase 2
            if (targetPhase === 2 && !selectedUploadType) {
              setSelectedUploadType('invoice');
            }
            
            // Callback to parent component
            if (onPhaseChange) {
              onPhaseChange(targetPhase);
            }
          })
          .catch(error => {
            console.error('Error updating client phase:', error);
          });
      }
    }
  };
  
  // Handle upload completion
  const handleUploadComplete = (filePath, fileName) => {
    console.log(`File uploaded: ${fileName} at ${filePath}`);
    // In a real implementation, you would save this information to the client's record
  };
  
  // Handle email sent
  const handleEmailSent = (invoiceData) => {
    setShowEmailSuccess(true);
    
    // Move to the next phase after email is sent if we're in phase 1
    if (currentPhase === 1) {
      handleNextPhase();
    }
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowEmailSuccess(false);
    }, 5000);
  };
  
  // Handle document request
  const handleRequestDocuments = async () => {
    try {
      // In a real implementation, this would call the API to send a document request email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowEmailSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowEmailSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error requesting documents:', error);
    }
  };
  
  // Handle viewing detailed instructions
  const handleViewInstructions = () => {
    setShowInstructions(!showInstructions);
  };
  
  // Handle toggle for showing all phases
  const handleToggleAllPhases = () => {
    setShowAllPhases(!showAllPhases);
  };
  
  // Handle selecting upload type
  const handleSelectUploadType = (type) => {
    setSelectedUploadType(type);
  };
  
  // Mark documents as uploaded
  const handleMarkDocumentsUploaded = async () => {
    if (client && client._id) {
      try {
        await markDocumentsUploaded(client._id);
        // Update UI - no need to change phase yet until payment is also received
        setShowEmailSuccess(true);
        setTimeout(() => setShowEmailSuccess(false), 5000);
      } catch (error) {
        console.error('Error marking documents as uploaded:', error);
      }
    }
  };
  
  // Mark payment as received
  const handleMarkPaymentReceived = async () => {
    if (client && client._id) {
      try {
        await markPaymentReceived(client._id);
        // Move to next phase if documents are also uploaded
        if (client.documentsUploaded || showAllPhases) {
          handleNextPhase();
        } else {
          setShowEmailSuccess(true);
          setTimeout(() => setShowEmailSuccess(false), 5000);
        }
      } catch (error) {
        console.error('Error marking payment as received:', error);
      }
    }
  };
  
  // Get the appropriate content for the current phase
  const getPhaseContent = () => {
    switch(currentPhase) {
      case 2:
        return (
          <div className="space-y-6">
            {/* Phase 2 Navigation Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px space-x-6">
                <button
                  onClick={() => handleSelectUploadType('invoice')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    selectedUploadType === 'invoice' || !selectedUploadType
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Rechnung senden
                </button>
                <button
                  onClick={() => handleSelectUploadType('documents')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    selectedUploadType === 'documents'
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Gläubigerbriefe anfordern
                </button>
              </nav>
            </div>
            
            {/* Tab Content */}
            {selectedUploadType === 'invoice' || !selectedUploadType ? (
              <InvoiceUpload 
                client={client}
                onUploadComplete={handleUploadComplete}
                onEmailSent={handleEmailSent}
                onRequestDocuments={() => handleSelectUploadType('documents')}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 animate-fadeIn">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500 mr-2" />
                  Gläubigerbriefe anfordern
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Senden Sie eine E-Mail an den Mandanten mit der Bitte, alle relevanten Gläubigerbriefe hochzuladen.
                  Dies ist wichtig für den weiteren Verlauf der Bearbeitung.
                </p>
                
                <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
                  <div className="flex">
                    <LightBulbIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      Der Mandant erhält einen sicheren Link, über den er die Dokumente hochladen kann.
                      Die hochgeladenen Dokumente werden Ihnen dann automatisch zur Verfügung stehen.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleRequestDocuments}
                  className="w-full px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <EnvelopeIcon className="h-5 w-5 mr-2" />
                  Gläubigerbriefe jetzt anfordern
                </button>
              </div>
            )}
          </div>
        );
        
      case 3:
        return (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 animate-fadeIn">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
              Dokumente & Zahlungen
            </h3>
            
            <p className="text-gray-600 mb-6">
              In dieser Phase müssen vom Mandanten alle angeforderten Dokumente hochgeladen und die erste Ratenzahlung geleistet werden.
            </p>
            
            <div className="bg-gray-50 rounded-xl p-5 mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Fortschritt des Mandanten</h4>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full ${client?.documentsUploaded ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center mr-3`}>
                    {client?.documentsUploaded ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">1</span>
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className={`font-medium ${client?.documentsUploaded ? 'text-green-700' : 'text-gray-700'}`}>
                      Dokumente hochgeladen
                    </p>
                    <p className="text-xs text-gray-500">
                      {client?.documentsUploaded 
                        ? 'Alle erforderlichen Dokumente wurden hochgeladen' 
                        : 'Der Mandant muss die angeforderten Gläubigerbriefe hochladen'}
                    </p>
                  </div>
                  <button
                    onClick={handleMarkDocumentsUploaded}
                    className={`ml-2 px-3 py-1 text-xs rounded-md ${
                      client?.documentsUploaded 
                        ? 'bg-green-100 text-green-700 cursor-default' 
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                    disabled={client?.documentsUploaded}
                  >
                    {client?.documentsUploaded ? 'Erledigt' : 'Als erledigt markieren'}
                  </button>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full ${client?.firstPaymentReceived ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'} flex items-center justify-center mr-3`}>
                    {client?.firstPaymentReceived ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">2</span>
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className={`font-medium ${client?.firstPaymentReceived ? 'text-green-700' : 'text-gray-700'}`}>
                      Erste Zahlung erhalten
                    </p>
                    <p className="text-xs text-gray-500">
                      {client?.firstPaymentReceived 
                        ? 'Die erste Ratenzahlung ist eingegangen' 
                        : `Die erste Rate (${client?.monatlicheRate?.toFixed(2) || '0.00'} €) muss eingehen`}
                    </p>
                  </div>
                  <button
                    onClick={handleMarkPaymentReceived}
                    className={`ml-2 px-3 py-1 text-xs rounded-md ${
                      client?.firstPaymentReceived 
                        ? 'bg-green-100 text-green-700 cursor-default' 
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                    disabled={client?.firstPaymentReceived}
                  >
                    {client?.firstPaymentReceived ? 'Erledigt' : 'Als erledigt markieren'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Wenn beide Punkte erledigt sind, kann zur nächsten Phase übergegangen werden.
              </p>
              
              <button
                onClick={handleNextPhase}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  (client?.documentsUploaded && client?.firstPaymentReceived) || showAllPhases
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!(client?.documentsUploaded && client?.firstPaymentReceived) && !showAllPhases}
              >
                Zur nächsten Phase
              </button>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 animate-fadeIn">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Prozess abgeschlossen</h3>
            <p className="text-gray-600 text-center mb-6">
              Alle erforderlichen Schritte wurden erfolgreich abgeschlossen. Der Mandant ist nun aktiv im System
              und wird weiter betreut.
            </p>
            
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Der Mandant wird nun im regulären Workflow weiter betreut. Status-Updates werden automatisch
                  in den regelmäßigen Berichten erscheinen.
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Phase progress tracker */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Prozessverfolgung</h3>
          
          {/* Toggle for development/debugging */}
          <div className="flex items-center">
            <button
              onClick={handleToggleAllPhases}
              className="text-xs flex items-center text-gray-500 hover:text-gray-700"
            >
              <span className={`w-8 h-4 rounded-full mr-2 flex items-center ${showAllPhases ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                <span className="w-3 h-3 rounded-full bg-white mx-0.5"></span>
              </span>
              {showAllPhases ? "Entwicklermodus" : "Standard-Ansicht"}
            </button>
          </div>
        </div>
        
        <ProgressTracker 
          currentPhase={currentPhase} 
          phases={phases}
          onPhaseClick={handlePhaseClick}
          onViewInstructions={handleViewInstructions}
        />
        
        {/* Detailed instructions */}
        {showInstructions && (
          <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200 animate-fadeIn">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <div className="bg-blue-100 p-1 rounded-full">
                  <InformationCircleIcon className="h-5 w-5 text-blue-700" />
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Detaillierte Anweisungen für Phase {currentPhase}</h4>
                <p className="mt-1 text-sm text-gray-600">{phases[currentPhase - 1]?.instructions}</p>
              </div>
              <button
                onClick={handleViewInstructions}
                className="flex-shrink-0 ml-auto bg-white p-1 rounded-full text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Schließen</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Success notification */}
      {showEmailSuccess && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 animate-fadeIn flex items-center">
          <div className="rounded-full bg-green-100 p-2 mr-4">
            <CheckIcon className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-green-800 font-medium">E-Mail erfolgreich gesendet</p>
            <p className="text-green-600 text-sm">Der Mandant wurde benachrichtigt.</p>
          </div>
        </div>
      )}
      
      {/* Phase-specific content */}
      {getPhaseContent()}
    </div>
  );
};

// Helper components
const InformationCircleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XMarkIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default ClientPhaseManager;