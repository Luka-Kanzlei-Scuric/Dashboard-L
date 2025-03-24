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
      description: 'Rechnung hochladen und gemeinsam mit Anfrage nach Gläubigerschreiben versenden.',
      instructions: 'In dieser Phase laden Sie zunächst eine Rechnung hoch und senden dann eine E-Mail, die sowohl die Rechnung enthält als auch die Aufforderung, Gläubigerschreiben einzureichen. Beide Anforderungen werden in einer E-Mail zusammengefasst.',
      icon: DocumentTextIcon,
      actions: ['invoice', 'combined-email']
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
  
  // State to track steps within Phase 2
  const [phase2Step, setPhase2Step] = useState(1); // 1: Upload invoice, 2: Send combined email

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
            
            // Reset phase 2 step when entering phase 2
            if (targetPhase === 2) {
              setPhase2Step(1);
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
    
    // Move to the next step in phase 2 after upload completion
    if (currentPhase === 2 && phase2Step === 1) {
      setPhase2Step(2);
      setSelectedUploadType('combined');
    }
  };
  
  // Handle email sent
  const handleEmailSent = (invoiceData, includesDocumentRequest = false) => {
    setShowEmailSuccess(true);
    
    // Move to the next phase after email is sent
    if (currentPhase === 1) {
      handleNextPhase();
    } else if (currentPhase === 2 && includesDocumentRequest) {
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
    
    // Reset phase2Step if going back to invoice 
    if (type === 'invoice' && currentPhase === 2) {
      setPhase2Step(1);
    } else if (type === 'combined' && currentPhase === 2) {
      setPhase2Step(2);
    } else if (type === 'request-again' && currentPhase === 3) {
      // Keep current phase but show document request UI
    }
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
            {/* Phase 2 Progress Steps - Apple-inspired Design */}
            <div className="mb-10 mt-2">
              {/* Step Indicators with smaller circles */}
              <div className="flex justify-between">
                <div className="flex flex-col items-center">
                  {/* Step 1 Circle with subtle shadow and clean design - smaller size */}
                  <div 
                    className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-all duration-300 ${
                      phase2Step > 1 
                        ? 'bg-blue-500 text-white ring-3 ring-blue-50' 
                        : phase2Step === 1 
                          ? 'bg-white border-2 border-blue-500 text-blue-500 ring-3 ring-blue-50' 
                          : 'bg-white border-2 border-gray-300 text-gray-500'
                    }`}
                  >
                    {phase2Step > 1 ? (
                      <CheckIcon className="h-4 w-4 transition-all" />
                    ) : (
                      <span className="text-sm font-medium">1</span>
                    )}
                  </div>
                  
                  {/* Step 1 Label - clean typography */}
                  <span className={`mt-3 text-sm font-medium transition-colors duration-300 ${
                    phase2Step >= 1 ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    Rechnung hochladen
                  </span>
                </div>
                
                {/* Step Connection Line - positioned in the middle between circles */}
                <div className="relative h-1 w-28 my-auto mx-3 rounded-full overflow-hidden bg-gray-200">
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-500 ease-in-out" 
                    style={{ width: phase2Step === 1 ? '0%' : phase2Step === 2 ? '100%' : '0%' }}
                  ></div>
                </div>
                
                <div className="flex flex-col items-center">
                  {/* Step 2 Circle with subtle shadow and clean design - smaller size */}
                  <div 
                    className={`flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-all duration-300 ${
                      phase2Step > 2 
                        ? 'bg-blue-500 text-white ring-3 ring-blue-50' 
                        : phase2Step === 2 
                          ? 'bg-white border-2 border-blue-500 text-blue-500 ring-3 ring-blue-50' 
                          : 'bg-white border-2 border-gray-300 text-gray-500'
                    }`}
                  >
                    <span className="text-sm font-medium">2</span>
                    
                    {/* Subtle pulse animation for current step - fixed size */}
                    {phase2Step === 2 && (
                      <span className="absolute w-8 h-8 rounded-full bg-blue-100 opacity-50 animate-pulse"></span>
                    )}
                  </div>
                  
                  {/* Step 2 Label - clean typography */}
                  <span className={`mt-3 text-sm font-medium transition-colors duration-300 ${
                    phase2Step >= 2 ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    E-Mail versenden
                  </span>
                </div>
              </div>
            </div>
            
            {/* Animation is handled by Tailwind's built-in animations */}
            
            {/* Step Content */}
            {phase2Step === 1 ? (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 animate-fadeIn">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
                  Schritt 1: Rechnung hochladen
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Laden Sie zunächst die Rechnung für den Mandanten hoch. Im nächsten Schritt können Sie dann 
                  die kombinierte E-Mail mit der Rechnung und der Anfrage nach Gläubigerschreiben versenden.
                </p>
                
                <InvoiceUpload 
                  client={client}
                  onUploadComplete={handleUploadComplete}
                  onlyUpload={true} // Zeigt nur den Upload-Teil an, nicht die E-Mail-Optionen
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 animate-fadeIn">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500 mr-2" />
                  Schritt 2: Kombinierte E-Mail senden
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Senden Sie eine E-Mail an den Mandanten, die sowohl die Rechnung enthält als auch die Aufforderung, 
                  alle relevanten Gläubigerschreiben hochzuladen.
                </p>
                
                <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
                  <div className="flex">
                    <LightBulbIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      Der Mandant erhält eine E-Mail mit der Rechnung im Anhang sowie einem Link zum Hochladen seiner Gläubigerschreiben.
                      Nach dem Versand wird automatisch zur nächsten Phase übergegangen.
                    </p>
                  </div>
                </div>
                
                {/* E-Mail-Vorschau */}
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">E-Mail-Vorschau:</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                    <p><strong>An:</strong> {client.name} &lt;{client.email}&gt;</p>
                    <p><strong>Betreff:</strong> Ihre Rechnung und Anforderung von Dokumenten</p>
                    <p className="mt-2">Sehr geehrte(r) {client.name},</p>
                    <p className="mt-2">anbei erhalten Sie Ihre Rechnung für unsere Rechtsdienstleistungen.</p>
                    <p className="mt-2">Bitte beginnen Sie mit Ihren monatlichen Zahlungen und laden Sie über den untenstehenden Link alle relevanten Gläubigerschreiben hoch, damit wir mit Ihrer Bearbeitung fortfahren können.</p>
                    <p className="mt-2">Mit freundlichen Grüßen,<br/>Ihr Team von Scuric Rechtsanwälte</p>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleSelectUploadType('invoice')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Zurück
                  </button>
                  
                  <button
                    onClick={() => handleEmailSent(null, true)}
                    className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    Kombinierte E-Mail jetzt senden
                  </button>
                </div>
              </div>
            )}
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6 animate-fadeIn">
            {/* Hauptteil: Phase 3 Status */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
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
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelectUploadType('request-again')}
                        className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                      >
                        Erneut anfordern
                      </button>
                      <button
                        onClick={handleMarkDocumentsUploaded}
                        className={`px-3 py-1 text-xs rounded-md ${
                          client?.documentsUploaded 
                            ? 'bg-green-100 text-green-700 cursor-default' 
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                        disabled={client?.documentsUploaded}
                      >
                        {client?.documentsUploaded ? 'Erledigt' : 'Als erledigt markieren'}
                      </button>
                    </div>
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
            
            {/* Zusätzlicher Bereich für "Erneut anfordern" wenn ausgewählt */}
            {selectedUploadType === 'request-again' && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 animate-fadeIn">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500 mr-2" />
                  Gläubigerbriefe erneut anfordern
                </h3>
                
                <p className="text-gray-600 mb-6">
                  Senden Sie eine Erinnerungs-E-Mail an den Mandanten, falls die angeforderten Gläubigerbriefe noch nicht hochgeladen wurden.
                </p>
                
                {/* E-Mail-Vorschau */}
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">E-Mail-Vorschau:</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                    <p><strong>An:</strong> {client.name} &lt;{client.email}&gt;</p>
                    <p><strong>Betreff:</strong> Erinnerung: Gläubigerbriefe hochladen</p>
                    <p className="mt-2">Sehr geehrte(r) {client.name},</p>
                    <p className="mt-2">wir möchten Sie daran erinnern, die angeforderten Gläubigerbriefe über den bereits zugesandten Link hochzuladen.</p>
                    <p className="mt-2">Diese Dokumente sind essenziell für den weiteren Verlauf Ihres Verfahrens. Sollten Sie Hilfe benötigen oder Fragen haben, zögern Sie bitte nicht, uns zu kontaktieren.</p>
                    <p className="mt-2">Mit freundlichen Grüßen,<br/>Ihr Team von Scuric Rechtsanwälte</p>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => setSelectedUploadType(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Abbrechen
                  </button>
                  
                  <button
                    onClick={handleRequestDocuments}
                    className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    Erinnerung jetzt senden
                  </button>
                </div>
              </div>
            )}
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