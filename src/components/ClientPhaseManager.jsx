import React, { useState, useEffect } from 'react';
import ProgressTracker from './ProgressTracker';
import InvoiceUpload from './InvoiceUpload';
import { useClients } from '../context/ClientContext';

/**
 * Component to manage client phases from onboarding to completion
 * Includes progress tracking and phase-specific actions
 * 
 * @param {Object} props Component props
 * @param {Object} props.client The client object
 * @param {Function} props.onPhaseChange Callback when client's phase changes
 */
const ClientPhaseManager = ({ client, onPhaseChange }) => {
  // Define the phases of client management
  const phases = [
    { 
      name: 'Erstberatung', 
      description: 'Erstberatung abgeschlossen. Der Mandant hat alle relevanten Informationen erhalten.',
      alwaysCompleted: true
    },
    { 
      name: 'Rechnung & Gläubigerbriefe', 
      description: 'Senden Sie eine Rechnung an den Mandanten und fordern Sie die Gläubigerbriefe an.',
      actions: ['invoice', 'request-documents']
    },
    { 
      name: 'Dokumente & Zahlung', 
      description: 'Der Mandant muss alle Dokumente hochladen und die erste Zahlung leisten.',
      waitForClient: true
    },
    { 
      name: 'Abschluss', 
      description: 'Die Insolvenzberatung wird abgeschlossen und finalisiert.',
      final: true
    }
  ];
  
  // Current phase state (1-based index)
  const [currentPhase, setCurrentPhase] = useState(1);
  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
  
  const { updateClient } = useClients();
  
  // Initialize based on client data
  useEffect(() => {
    // Logic to determine the current phase based on client data
    // This is a simplified version - in a real app, you'd check various flags and timestamps
    if (client) {
      if (client.status === 'Aktiv' && client.emailSent) {
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
      setCurrentPhase(newPhase);
      
      // Update client in database with new phase information
      try {
        if (client && client._id) {
          await updateClient(client._id, { 
            currentPhase: newPhase,
            // Update other fields depending on the phase
            ...(newPhase === 2 && { emailSent: true }),
            ...(newPhase === 3 && { status: 'Aktiv' })
          });
          
          if (onPhaseChange) {
            onPhaseChange(newPhase);
          }
        }
      } catch (error) {
        console.error('Error updating client phase:', error);
      }
    }
  };
  
  // Handle manual phase change (for admin purposes)
  const handlePhaseClick = (phaseNumber) => {
    // Only allow changing to already completed phases or the next phase
    if (phaseNumber <= currentPhase + 1 && phaseNumber !== currentPhase) {
      setCurrentPhase(phaseNumber);
      
      // Update client in database if needed
      if (client && client._id) {
        updateClient(client._id, { currentPhase: phaseNumber })
          .then(() => {
            if (onPhaseChange) {
              onPhaseChange(phaseNumber);
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
    
    // Move to the next phase after email is sent
    handleNextPhase();
    
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
  
  return (
    <div className="space-y-6">
      {/* Phase progress tracker */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Prozessverfolgung</h3>
        <ProgressTracker 
          currentPhase={currentPhase} 
          phases={phases}
          onPhaseClick={handlePhaseClick}
        />
      </div>
      
      {/* Success notification */}
      {showEmailSuccess && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 animate-fadeIn flex items-center">
          <div className="rounded-full bg-green-100 p-2 mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-green-800 font-medium">E-Mail erfolgreich gesendet</p>
            <p className="text-green-600 text-sm">Der Mandant wurde benachrichtigt.</p>
          </div>
        </div>
      )}
      
      {/* Phase-specific actions */}
      {currentPhase === 2 && (
        <InvoiceUpload 
          client={client}
          onUploadComplete={handleUploadComplete}
          onEmailSent={handleEmailSent}
          onRequestDocuments={handleRequestDocuments}
        />
      )}
      
      {currentPhase === 3 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dokumente & Zahlungen</h3>
          <p className="text-gray-600 mb-6">
            Der Mandant muss alle angeforderten Dokumente hochladen und die erste Ratenzahlung leisten.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <span className="text-xs font-medium text-gray-700">1</span>
              </div>
              <span className="text-gray-700">Dokumente hochgeladen</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                <span className="text-xs font-medium text-gray-700">2</span>
              </div>
              <span className="text-gray-700">Erste Zahlung erhalten</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={handleNextPhase}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manuell als abgeschlossen markieren
            </button>
          </div>
        </div>
      )}
      
      {currentPhase === 4 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Abschluss</h3>
          <p className="text-gray-600">
            Alle Schritte wurden abgeschlossen. Der Mandant ist aktiv und im Prozess.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientPhaseManager;