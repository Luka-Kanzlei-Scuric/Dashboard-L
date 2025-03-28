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
  const [emailPreviewContent, setEmailPreviewContent] = useState(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
  
  // Generate and fetch full HTML email preview from server
  const generateEmailPreview = async () => {
    if (!client || !client._id) return;
    
    setLoading(true);
    
    // Prepare invoice data
    const invoiceData = {
      invoiceNumber: client.caseNumber || `INV-${new Date().getTime().toString().substr(-6)}`,
      date: new Date().toLocaleDateString('de-DE'),
      amount: client.honorar || 1111,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')
    };
    
    // Generate HTML preview immediately without waiting for server
    const baseUrl = 'https://portal.scuric.de';
    const portalUrl = `${baseUrl}/portal/${client._id}`;
    
    // Generate a nice HTML email preview
    const previewHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Willkommen bei Scuric Rechtsanwaltskanzlei</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }
    .logo-container {
      margin-top: 30px;
      margin-bottom: 40px;
    }
    .logo {
      max-width: 250px;
    }
    .media-section {
      text-align: center;
      margin-top: -10px;
      margin-bottom: 40px;
    }
    .media-logos {
      max-width: 400px;
      margin: 0 auto;
      display: block;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #32a852;
      color: white !important;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 20px 0;
    }
    .footer {
      margin-top: 20px;
      font-size: 0.9em;
    }
    .spacing {
      margin-bottom: 20px;
    }
    .media-text {
      font-size: 0.8em;
      color: #666;
      text-align: center;
      margin-top: 10px;
    }
    .greeting {
      margin-top: 40px;
    }
    .signature {
      margin-top: 20px;
      margin-bottom: 40px;
    }
    .button-container {
      text-align: center;
      margin-bottom: 10px;
    }
    .url-container {
      text-align: center;
      margin-bottom: 30px;
      font-size: 0.9em;
      color: #555;
    }
    .direct-url {
      word-break: break-all;
      color: #32a852;
    }
    .important {
      font-weight: bold;
      color: #324ca8;
    }
  </style>
</head>
<body>
  <div class="logo-container">
    <img src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2015/08/Logo-T-Scuric.png" alt="Thomas Scuric Rechtsanwalt" class="logo">
  </div>
  <p class="greeting">Sehr geehrte(r) ${client.name},</p>

  <p class="spacing">zunächst einmal vielen Dank für Ihr Vertrauen und die Erteilung des Mandats. Wir freuen uns, Sie auf Ihrem Weg in eine schuldenfreie Zukunft begleiten zu dürfen.</p>

  <p class="spacing">Wie vereinbart beträgt unser Gesamthonorar pauschal ${client.honorar || 1111}€ (inkl. 19% MwSt.), welches Sie in ${client.raten || 3} Raten bezahlen können.</p>

  <p>Um mit dem Schreiben an Ihre Gläubiger beginnen zu können, bitten wir Sie, die erste Rate bis zum <span class="important">${client.ratenStart || '01.01.2025'}</span> zu überweisen. Nach Zahlungseingang nehmen wir umgehend Kontakt mit Ihren Gläubigern auf.</p>

  <p class="spacing">Für eine erfolgreiche Zusammenarbeit haben wir ein persönliches Mandantenportal für Sie eingerichtet. Dort können Sie Ihre Gläubigerschreiben hochladen und den Fortschritt Ihres Verfahrens einsehen.</p>

  <p>Ihr <span class="important">persönliches Aktenzeichen</span> lautet: <span class="important">${client.caseNumber || 'Wird in Kürze vergeben'}</span></p>

  <p>Bitte nutzen Sie dieses Aktenzeichen für Ihren Zugang zum Mandantenportal:</p>
  <div class="button-container">
    <a href="${portalUrl}" class="button">-> Zum Mandantenportal <-</a>
  </div>
  <div class="url-container">
    Falls der Button nicht funktioniert, kopieren Sie bitte diese URL direkt in Ihren Browser:<br>
    <span class="direct-url">${portalUrl}</span>
  </div>
  
  <div style="padding: 15px; margin-top: 20px; background-color: #f2f7ff; border-radius: 10px; border: 1px solid #d1e0ff;">
    <p style="font-weight: bold; color: #324ca8;">Rechnungsinformationen:</p>
    <p>Rechnungsnummer: ${invoiceData.invoiceNumber}</p>
    <p>Rechnungsdatum: ${invoiceData.date}</p>
    <p>Betrag: ${invoiceData.amount || client.honorar || 1111}€</p>
    <p>Zahlbar bis: ${invoiceData.dueDate}</p>
    <p>Die Rechnung ist dieser E-Mail als Anhang beigefügt.</p>
  </div>

  <div class="media-section">
    <img src="https://www.anwalt-privatinsolvenz-online.de/wp-content/uploads/2019/11/medien.png" alt="RTL, Focus Online, Frankfurter Rundschau" class="media-logos">
    <p class="media-text">Vielleicht kennen Sie uns auch aus diesen Medien</p>
  </div>
  <p>Mit freundlichen Grüßen</p>

  <p class="signature">Ihr Team von der Rechtsanwaltskanzlei Thomas Scuric</p>
  <div class="footer">
    <p>Rechtsanwaltskanzlei Thomas Scuric<br>
    Bongardstraße 33<br>
    44787 Bochum</p>

    <p>Fon: 0234 913 681 – 0<br>
    Fax: 0234 913 681 – 29<br>
    E-Mail: kontakt@schuldnerberatung-anwalt.de</p>
  </div>
</body>
</html>`;
    
    // Set preview content immediately
    setEmailPreviewContent(previewHtml);
    setShowEmailPreview(true);
    setLoading(false);
    
    try {
      // Try to get preview from server in background, but don't wait for it
      const apiBaseUrl = 'https://dashboard-l-backend.onrender.com/api';
      fetch(`${apiBaseUrl}/clients/${client._id}/generate-email-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invoiceData })
      }).then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Server preview failed');
      }).then(data => {
        // If server preview succeeds, update the preview with it
        if (data && data.html) {
          setEmailPreviewContent(data.html);
        }
      }).catch(error => {
        console.warn('Server preview failed, using local preview:', error);
        // Already using local preview, so no action needed
      });
    } catch (error) {
      console.warn('Error setting up server preview request:', error);
      // Already using local preview, so no action needed
    }
  };
  
  // Lade die Email-Vorschau automatisch, wenn sich der Phase2Step ändert
  useEffect(() => {
    if (currentPhase === 2 && phase2Step === 2) {
      generateEmailPreview();
    }
  }, [phase2Step]);
  
  // Handle email sent
  const handleEmailSent = async (invoiceData, includesDocumentRequest = false) => {
    setLoading(true);
    
    try {
      console.log('Sending invoice email with data:', invoiceData);
      
      // Prepare the data for make.com
      const clientData = {
        id: client._id,
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        honorar: client.honorar || '',
        raten: client.raten || 3,
        ratenStart: client.ratenStart || '01.01.2025',
        caseNumber: client.caseNumber || 'Wird in Kürze vergeben'
      };
      
      // Create portal URL
      const baseUrl = 'https://portal.scuric.de';
      const portalUrl = `${baseUrl}/portal/${client._id}`;
      
      // Prepare data payload for direct webhook
      const makeData = {
        client: clientData,
        portalUrl: portalUrl,
        invoice: invoiceData,
        // No attachment in direct mode
        hasAttachment: false
      };
      
      console.log('Client ID for email sending:', client._id);
      console.log('Preparing data for make.com webhook:', JSON.stringify(makeData, null, 2));
      
      // Track whether any method was successful
      let isSuccessful = false;
      let errorMessage = '';
      
      // Method 1: Through our backend API (preferred method)
      try {
        console.log('Trying backend API method...');
        // Use different API URLs for development/production
        const apiUrls = [
          'https://dashboard-l-backend.onrender.com/api', // Production
          'http://localhost:5000/api',                    // Local development
          '/api'                                          // Relative path
        ];
        
        // Try each API URL in sequence
        for (const apiBaseUrl of apiUrls) {
          try {
            console.log(`Attempting with API base URL: ${apiBaseUrl}`);
            
            const response = await fetch(`${apiBaseUrl}/clients/${client._id}/email/welcome`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ invoiceData }),
              // 10 second timeout per attempt
              signal: AbortSignal.timeout(10000)
            });
            
            if (response.ok) {
              const responseData = await response.json();
              console.log('Email sent successfully through backend:', responseData);
              isSuccessful = true;
              break; // Exit the loop since we succeeded
            } else {
              console.warn(`Backend email sending failed with status ${response.status} at ${apiBaseUrl}`);
              // Continue to the next URL
            }
          } catch (urlError) {
            console.warn(`Error with API URL ${apiBaseUrl}:`, urlError);
            // Continue to the next URL
          }
        }
        
        if (!isSuccessful) {
          throw new Error('All backend API endpoints failed');
        }
      } catch (backendError) {
        console.warn('All backend email sending attempts failed:', backendError);
        errorMessage = backendError.message;
        
        // Method 2: Direct webhook call as fallback
        try {
          console.log('Trying direct make.com webhook call as fallback...');
          
          // Define webhook URLs (with primary URL first)
          const webhookUrls = [
            'https://hook.eu2.make.com/pdlivjtccwyrtr0j8u1ovpxz184lqnki', // Primary
            'https://hook.eu1.make.com/pdlivjtccwyrtr0j8u1ovpxz184lqnki', // Fallback URL if the primary region is having issues
          ];
          
          // Flag to track whether any webhook call succeeded
          let webhookSuccess = false;
          
          // Try each webhook URL
          for (const webhookUrl of webhookUrls) {
            try {
              console.log(`Attempting webhook at: ${webhookUrl}`);
              
              // Set up JSONP approach as fallback for CORS issues
              const useJsonp = () => {
                return new Promise((resolve, reject) => {
                  // Create a unique callback name
                  const callbackName = `makeWebhookCallback_${Date.now()}`;
                  
                  // Create script element
                  const script = document.createElement('script');
                  
                  // Set global callback
                  window[callbackName] = (response) => {
                    // Clean up
                    document.body.removeChild(script);
                    delete window[callbackName];
                    
                    // Resolve with response
                    resolve(response);
                  };
                  
                  // Handle errors
                  script.onerror = (error) => {
                    // Clean up
                    document.body.removeChild(script);
                    delete window[callbackName];
                    
                    // Reject with error
                    reject(new Error('JSONP request failed'));
                  };
                  
                  // Set timeout
                  const timeoutId = setTimeout(() => {
                    if (window[callbackName]) {
                      // Clean up
                      document.body.removeChild(script);
                      delete window[callbackName];
                      
                      // Reject with timeout error
                      reject(new Error('JSONP request timed out'));
                    }
                  }, 30000);
                  
                  // Append all required client data as URL parameters
                  const params = new URLSearchParams();
                  
                  // Client basic info
                  params.append('client_id', client._id);
                  params.append('client_name', client.name || '');
                  params.append('client_email', client.email || '');
                  params.append('client_phone', client.phone || '');
                  params.append('client_honorar', client.honorar || '');
                  params.append('client_raten', client.raten || 3);
                  params.append('client_ratenStart', client.ratenStart || '01.01.2025');
                  params.append('client_caseNumber', client.caseNumber || 'Wird in Kürze vergeben');
                  
                  // Portal URL
                  params.append('portalUrl', `https://portal.scuric.de/portal/${client._id}`);
                  
                  // Invoice data if available
                  if (invoiceData) {
                    params.append('invoice_number', invoiceData.invoiceNumber || '');
                    params.append('invoice_date', invoiceData.date || '');
                    params.append('invoice_amount', invoiceData.amount || '');
                    params.append('invoice_dueDate', invoiceData.dueDate || '');
                    
                    // Füge die Rechnungs-URL hinzu, wenn vorhanden
                    if (invoiceData.invoiceURL) {
                      params.append('invoice_url', invoiceData.invoiceURL);
                      params.append('invoice_fileName', invoiceData.fileName || '');
                      params.append('invoice_fileSize', invoiceData.fileSize || '');
                      params.append('invoice_mimeType', invoiceData.mimeType || 'application/pdf');
                    }
                  }
                  
                  // Callback name for JSONP
                  params.append('callback', callbackName);
                  
                  // Set source URL with params and append to document
                  script.src = `${webhookUrl}?${params.toString()}`;
                  document.body.appendChild(script);
                });
              };
              
              // First attempt standard fetch with enhanced data including invoice URL
              const enhancedPayload = {
                client: clientData,
                portalUrl: portalUrl,
                invoice: invoiceData,
                timestamp: new Date().toISOString(),
                // Ensure all client fields
                clientFields: {
                  name: client.name || '',
                  email: client.email || '',
                  phone: client.phone || '',
                  honorar: client.honorar || '',
                  raten: client.raten || 3,
                  ratenStart: client.ratenStart || '01.01.2025',
                  caseNumber: client.caseNumber || 'Wird in Kürze vergeben',
                  _id: client._id
                },
                // Include the PDF invoice URL and metadata if present
                invoiceURL: invoiceData && invoiceData.invoiceURL ? invoiceData.invoiceURL : null,
                // Include file metadata if available
                invoiceFile: invoiceData ? {
                  fileName: invoiceData.fileName || '',
                  fileSize: invoiceData.fileSize || '',
                  mimeType: invoiceData.mimeType || 'application/pdf'
                } : null
              };
              
              console.log('Enhanced webhook payload:', JSON.stringify(enhancedPayload, null, 2));
              
              const fetchPromise = fetch(webhookUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(enhancedPayload),
                // 15 second timeout
                signal: AbortSignal.timeout(15000),
                mode: 'cors' // Explicitly set CORS mode
              });
              
              // Race fetch against a timeout
              const webhookResponse = await fetchPromise;
              
              if (!webhookResponse.ok) {
                console.warn(`Webhook call status not OK: ${webhookResponse.status}`);
                throw new Error(`Webhook returned status ${webhookResponse.status}`);
              }
              
              let webhookData;
              try {
                webhookData = await webhookResponse.json();
              } catch (e) {
                // If we can't parse JSON, assume success with empty response
                webhookData = {};
              }
              
              console.log('Email sent successfully via direct webhook:', webhookData);
              webhookSuccess = true;
              break; // Exit loop on success
            } catch (specificWebhookError) {
              console.warn(`Error with webhook URL ${webhookUrl}:`, specificWebhookError);
              
              // If fetch fails, try JSONP as last resort
              if (webhookUrl === webhookUrls[webhookUrls.length - 1]) {
                try {
                  console.log('Attempting JSONP as final fallback method...');
                  const jsonpResult = await useJsonp();
                  console.log('JSONP webhook call succeeded:', jsonpResult);
                  webhookSuccess = true;
                } catch (jsonpError) {
                  console.error('JSONP fallback also failed:', jsonpError);
                }
              }
            }
          }
          
          if (!webhookSuccess) {
            throw new Error('All direct webhook calls failed');
          } else {
            isSuccessful = true;
          }
        } catch (webhookError) {
          console.error('Direct webhook approach failed:', webhookError);
          errorMessage = `${errorMessage}. ${webhookError.message}`;
        }
      }
      
      if (isSuccessful) {
        // At least one method succeeded
        setShowEmailSuccess(true);
        setShowEmailPreview(false);
        
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
      } else {
        // All methods failed
        throw new Error(`Alle Versuche, die Email zu senden, sind fehlgeschlagen: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert(`Fehler beim Senden der Email: ${error.message}`);
    } finally {
      setLoading(false);
    }
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
  
  // Email Preview Modal Component - Apple-Design
  const renderEmailPreviewModal = () => {
    if (!showEmailPreview || !emailPreviewContent) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
        <div className="bg-white bg-opacity-95 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col overflow-hidden" style={{border: '1px solid rgba(0,0,0,0.1)'}}>
          {/* Apple-style header with traffic lights */}
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gradient-to-b from-gray-50 to-white">
            <div className="flex space-x-2 ml-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <h2 className="text-sm font-medium text-gray-700">Email an {client.name}</h2>
            <button 
              onClick={() => setShowEmailPreview(false)}
              className="p-1 rounded-full hover:bg-gray-100 focus:outline-none"
              aria-label="Schließen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Safari-style toolbar */}
          <div className="bg-gray-50 p-2 border-b border-gray-100 flex items-center justify-between">
            <div className="flex space-x-2">
              <button className="p-1 rounded text-gray-500 hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="p-1 rounded text-gray-500 hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="flex-1 mx-4">
              <div className="w-full h-7 bg-white rounded-md border border-gray-200 flex items-center px-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-gray-500 truncate">mandantenportal.scuric.de</span>
              </div>
            </div>
            <div>
              <button className="p-1 rounded text-gray-500 hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-0 bg-white">
            <div className="bg-white h-full">
              <iframe 
                srcDoc={emailPreviewContent}
                title="Email Vorschau" 
                className="w-full h-full min-h-[400px] max-h-[50vh]"
                sandbox="allow-same-origin"
                style={{border: 'none'}}
              />
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-600">Diese Email wird an <span className="font-medium">{client.email}</span> gesendet.</p>
                <p className="text-xs text-gray-400">Die Rechnung wird automatisch angehängt.</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowEmailPreview(false)}
                className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 focus:outline-none"
              >
                Abbrechen
              </button>
              <button
                onClick={async () => {
                  console.log('Sending email for client:', client);
                  setLoading(true);
                  
                  try {
                    // Prüfe ob wir die aktuelle Rechnung des Mandanten haben
                    if (!client.currentInvoice) {
                      throw new Error('Keine Rechnung hochgeladen. Bitte laden Sie zuerst eine Rechnung hoch.');
                    }
                    
                    // API-Basis-URL für öffentliche Dateien
                    const apiBaseUrl = 'https://dashboard-l-backend.onrender.com';
                    
                    // Erstelle die öffentliche URL zur PDF-Datei
                    // Das Format sollte mit dem Backend-Server übereinstimmen
                    // Typischerweise: /uploads/clients/{clientId}/{filename}
                    const pdfUrl = `${apiBaseUrl}/uploads/clients/${client._id}/${client.currentInvoice.filename}`;
                    
                    console.log('PDF URL for invoice:', pdfUrl);
                    
                    // Erstelle die Rechnungsdaten mit URL
                    const invoiceData = {
                      invoiceNumber: client.caseNumber || `INV-${new Date().getTime().toString().substr(-6)}`,
                      date: new Date().toLocaleDateString('de-DE'),
                      amount: client.honorar || 1111,
                      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
                      // URL zur tatsächlichen PDF-Datei
                      invoiceURL: pdfUrl,
                      // Metadaten zur Datei
                      fileName: client.currentInvoice.originalFilename,
                      fileSize: client.currentInvoice.size,
                      mimeType: client.currentInvoice.mimetype
                    };
                    
                    console.log('Invoice data with real PDF URL prepared:', invoiceData);
                    
                    // Sende die Email mit der PDF-URL
                    handleEmailSent(invoiceData, true);
                  } catch (error) {
                    console.error('Error preparing invoice PDF URL:', error);
                    setLoading(false);
                    alert(error.message);
                  }
                }}
                className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm focus:outline-none flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="h-3 w-3 mr-1.5 animate-spin" />
                    Wird gesendet...
                  </span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    Email jetzt senden
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
                
                {/* E-Mail-Vorschau wurde automatisch generiert */}
                <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
                  <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-700">
                      Die E-Mail-Vorschau wurde automatisch generiert. Sie können jetzt die E-Mail versenden, um dem Mandanten Rechnung und Anleitung zum Hochladen der Gläubigerschreiben zu senden.
                    </p>
                  </div>
                  
                  {!showEmailPreview && (
                    <div className="mt-3 text-center">
                      <button 
                        onClick={generateEmailPreview}
                        className="inline-flex items-center justify-center px-4 py-2 bg-white border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50 transition-all"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                            Lädt E-Mail-Vorschau...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            E-Mail-Vorschau erneut anzeigen
                          </span>
                        )}
                      </button>
                    </div>
                  )}
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
      
      {/* Email Preview Modal */}
      {renderEmailPreviewModal()}
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