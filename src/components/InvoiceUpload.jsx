import React, { useState } from 'react';
import { 
  PaperClipIcon, 
  ArrowPathIcon, 
  EnvelopeIcon, 
  CheckCircleIcon,
  DocumentTextIcon,
  XMarkIcon,
  InformationCircleIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

/**
 * Enhanced component for handling invoice uploads and sending emails to clients
 * Premium Apple-inspired design with clean visuals
 * 
 * @param {Object} props Component props
 * @param {Object} props.client The client object
 * @param {Function} props.onUploadComplete Callback when upload is complete
 * @param {Function} props.onEmailSent Callback when email is sent
 * @param {Function} props.onRequestDocuments Callback to request documents
 */
const InvoiceUpload = ({ client, onUploadComplete, onEmailSent, onRequestDocuments }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [uploadedFilePath, setUploadedFilePath] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-upload when file is selected
      handleUpload(file);
    }
  };
  
  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      handleUpload(file);
    }
  };
  
  // Upload the invoice
  const handleUpload = async (file) => {
    setIsUploading(true);
    
    try {
      // Simulate upload progress
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Assume we get back a file path
      const filePath = `/uploads/${file.name}`;
      setUploadedFilePath(filePath);
      setUploadComplete(true);
      
      if (onUploadComplete) {
        onUploadComplete(filePath, file.name);
      }
      
      // Show preview option instead of automatically sending
      setShowPreview(true);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Fehler beim Hochladen der Datei. Bitte versuchen Sie es erneut.');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Send the invoice via email
  const handleSendEmail = async () => {
    if (!selectedFile || !uploadedFilePath) return;
    
    setEmailSending(true);
    setShowPreview(false);
    
    try {
      // Generate invoice number based on client case number or timestamp
      const invoiceNumber = client.caseNumber || `INV-${new Date().getTime().toString().slice(-6)}`;
      
      // Prepare invoice data for email
      const invoiceData = {
        invoiceNumber,
        date: new Date().toLocaleDateString('de-DE'),
        amount: client.honorar || 1111,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'), // 14 days from now
        filePath: uploadedFilePath,
        fileName: selectedFile.name
      };
      
      // In a real implementation, this would send the email with the invoice
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setEmailSent(true);
      
      if (onEmailSent) {
        onEmailSent(invoiceData);
      }
      
      // Keep success state longer for better UX
      setTimeout(() => {
        setSelectedFile(null);
        setUploadComplete(false);
        setEmailSent(false);
        setUploadedFilePath(null);
        setShowPreview(false);
      }, 7000);
      
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Fehler beim Senden der E-Mail. Bitte versuchen Sie es erneut.');
    } finally {
      setEmailSending(false);
    }
  };
  
  // Request creditor documents from the client
  const handleRequestDocuments = () => {
    try {
      if (onRequestDocuments) {
        onRequestDocuments();
      }
    } catch (error) {
      console.error('Error requesting documents:', error);
      alert('Fehler beim Anfordern der Dokumente. Bitte versuchen Sie es erneut.');
    }
  };
  
  // Reset the component state
  const handleReset = () => {
    setSelectedFile(null);
    setUploadComplete(false);
    setEmailSent(false);
    setUploadedFilePath(null);
    setShowPreview(false);
  };
  
  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  return (
    <div className="animate-fadeIn">
      {/* Upload container with premium Apple-style design */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
          Rechnung senden
        </h3>
        
        {emailSent ? (
          <div className="flex flex-col items-center justify-center py-8 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="text-xl font-medium text-gray-900 mb-2">E-Mail erfolgreich gesendet!</h4>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Die Rechnung wurde an {client.name} ({client.email}) gesendet. Der Mandant wurde aufgefordert, die erste Zahlung zu leisten.
            </p>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm"
            >
              Neue Rechnung hochladen
            </button>
          </div>
        ) : showPreview ? (
          <div className="animate-fadeIn">
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 p-2 mr-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <DocumentIcon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-grow">
                  <h4 className="text-gray-900 font-medium mb-1">{selectedFile.name}</h4>
                  <p className="text-sm text-gray-500 mb-2">
                    {formatFileSize(selectedFile.size)} • {new Date().toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 rounded-full">Rechnung</span>
                    <span className="px-2 py-1 bg-gray-100 rounded-full">PDF-Dokument</span>
                    <span className="px-2 py-1 bg-gray-100 rounded-full">{client.caseNumber || 'Ohne Aktenzeichen'}</span>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Entfernen"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">E-Mail-Vorschau</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Die folgende E-Mail wird an den Mandanten gesendet:
                  </p>
                  <div className="bg-white rounded-lg border border-blue-200 p-3 text-xs text-gray-700">
                    <p><strong>An:</strong> {client.name} &lt;{client.email}&gt;</p>
                    <p><strong>Betreff:</strong> Ihre Rechnung ({client.caseNumber || 'INV-' + new Date().getTime().toString().slice(-6)})</p>
                    <p className="mt-2">Sehr geehrte(r) {client.name},</p>
                    <p className="mt-1">anbei erhalten Sie Ihre Rechnung für unsere Rechtsdienstleistungen.</p>
                    <p className="mt-1">Bitte beginnen Sie mit Ihren monatlichen Zahlungen. Laden Sie außerdem Ihre Gläubigerbriefe hoch, um fortzufahren.</p>
                    <p className="mt-1">Mit freundlichen Grüßen,<br/>Ihr Team von Scuric Rechtsanwälte</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              
              <button
                onClick={handleSendEmail}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                E-Mail jetzt senden
              </button>
            </div>
          </div>
        ) : uploadComplete ? (
          <div className="animate-fadeIn">
            <div className="mb-6 bg-blue-50 rounded-xl p-5 flex items-start border border-blue-100">
              <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full mr-4">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-grow">
                <h4 className="text-blue-800 font-medium mb-1">
                  {selectedFile.name}
                </h4>
                <p className="text-sm text-blue-700">
                  {formatFileSize(selectedFile.size)} • {new Date().toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
                title="Entfernen"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="flex items-center text-gray-700 bg-gray-50 px-4 py-2 rounded-full">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span>Datei erfolgreich hochgeladen!</span>
              </div>
              
              <div className="pt-4">
                {emailSending ? (
                  <button 
                    disabled
                    className="px-5 py-2.5 bg-gray-400 text-white rounded-lg shadow flex items-center"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    E-Mail wird gesendet...
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPreview(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow flex items-center"
                  >
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    E-Mail senden
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-300 transition-colors relative bg-white"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="invoiceUpload"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                accept=".pdf,.doc,.docx"
              />
              
              <div className="flex flex-col items-center justify-center py-4">
                {isUploading ? (
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                    <ArrowPathIcon className="h-8 w-8 text-blue-400 animate-spin" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                    <PaperClipIcon className="h-8 w-8 text-blue-500" />
                  </div>
                )}
                
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {isUploading ? 'Wird hochgeladen...' : 'Rechnung hochladen'}
                </h4>
                <p className="text-gray-600 mb-1">
                  {isUploading ? 
                    'Bitte warten Sie, während die Datei hochgeladen wird...' : 
                    'Ziehen Sie die Datei hierher oder klicken Sie zum Auswählen'
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Unterstützte Formate: PDF, DOC, DOCX (max. 10MB)
                </p>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Rechnungsdaten</h5>
                <p className="text-xs text-gray-500">
                  Gesamtbetrag: <span className="font-medium">{client.honorar || 1111} €</span> • 
                  Raten: <span className="font-medium">{client.raten || 2} x {client.monatlicheRate?.toFixed(2) || (1111/2).toFixed(2)} €</span>
                </p>
              </div>
              
              <button
                onClick={handleRequestDocuments}
                className="px-5 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                disabled={isUploading}
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Gläubigerbriefe anfordern
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceUpload;