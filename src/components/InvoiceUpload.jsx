import React, { useState } from 'react';
import { 
  PaperClipIcon, 
  ArrowPathIcon, 
  EnvelopeIcon, 
  CheckCircleIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

/**
 * Component for handling invoice uploads and sending emails to clients
 * Apple-inspired design with clean visuals
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
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-upload when file is selected
      handleUpload(file);
    }
  };
  
  // Upload the invoice
  const handleUpload = async (file) => {
    setIsUploading(true);
    
    try {
      // Simulate upload process - in a real implementation, this would send the file to a server
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Assume we get back a file path
      const filePath = `/uploads/${file.name}`;
      setUploadedFilePath(filePath);
      setUploadComplete(true);
      
      if (onUploadComplete) {
        onUploadComplete(filePath, file.name);
      }
      
      // Automatically trigger email sending
      handleSendEmail(filePath, file.name);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Fehler beim Hochladen der Datei. Bitte versuchen Sie es erneut.');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Send the invoice via email
  const handleSendEmail = async (filePath, fileName) => {
    setEmailSending(true);
    
    try {
      // Generate invoice number based on client case number or timestamp
      const invoiceNumber = client.caseNumber || `INV-${new Date().getTime().toString().slice(-6)}`;
      
      // Prepare invoice data for email
      const invoiceData = {
        invoiceNumber,
        date: new Date().toLocaleDateString('de-DE'),
        amount: client.honorar || 1111,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'), // 14 days from now
        filePath,
        fileName
      };
      
      // In a real implementation, this would send the email with the invoice
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setEmailSent(true);
      
      if (onEmailSent) {
        onEmailSent(invoiceData);
      }
      
      // Reset after 5 seconds to allow for another upload if needed
      setTimeout(() => {
        setSelectedFile(null);
        setUploadComplete(false);
        setEmailSent(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Fehler beim Senden der E-Mail. Bitte versuchen Sie es erneut.');
    } finally {
      setEmailSending(false);
    }
  };
  
  // Request creditor documents from the client
  const handleRequestDocuments = async () => {
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
  };
  
  return (
    <div className="space-y-6">
      {/* Upload container */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2" />
          Rechnung verwalten
        </h3>
        
        {emailSent ? (
          <div className="flex flex-col items-center justify-center py-6 animate-fadeIn">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="text-xl font-medium text-gray-900 mb-2">E-Mail gesendet!</h4>
            <p className="text-gray-500 text-center mb-6">
              Die Rechnung wurde erfolgreich an {client.name} gesendet.
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Neue Rechnung hochladen
            </button>
          </div>
        ) : uploadComplete ? (
          <div className="animate-fadeIn">
            <div className="mb-6 bg-gray-50 rounded-xl p-4 flex items-start">
              <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg mr-4">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-grow">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {selectedFile.name}
                </h4>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(0)} KB • {new Date().toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Entfernen"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-gray-700 text-center">
                Rechnung wurde hochgeladen. Email wird gesendet...
              </p>
              
              <div className="flex items-center justify-center">
                {emailSending ? (
                  <div className="flex items-center text-gray-500">
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    <span>Email wird gesendet...</span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-600">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    <span>Rechnung hochgeladen</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="relative">
              <input
                type="file"
                id="invoiceUpload"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.doc,.docx"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
                <div className="flex flex-col items-center justify-center">
                  {isUploading ? (
                    <ArrowPathIcon className="h-10 w-10 text-gray-400 animate-spin mb-4" />
                  ) : (
                    <PaperClipIcon className="h-10 w-10 text-gray-400 mb-4" />
                  )}
                  
                  <p className="text-gray-900 font-medium mb-1">
                    {isUploading ? 'Wird hochgeladen...' : 'Rechnung hochladen'}
                  </p>
                  <p className="text-sm text-gray-500">Datei hier ablegen oder klicken zum Auswählen</p>
                  <p className="text-xs text-gray-400 mt-2">PDF, DOC, DOCX (max. 10MB)</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleRequestDocuments}
                className="px-5 py-2.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all inline-flex items-center"
                disabled={isUploading}
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Gläubigerschreiben anfordern
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceUpload;