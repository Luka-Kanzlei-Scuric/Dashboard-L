import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  DocumentTextIcon, 
  ArrowPathIcon, 
  PaperClipIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const DocumentUploadPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setIsVerifying(true);
        
        // Importiere die API-Konfiguration, um die aktuelle Backend-URL zu verwenden
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://dashboard-l-backend.onrender.com/api';
        const response = await axios.get(`${apiBaseUrl}/verify-token`, { 
          params: { token },
          timeout: 8000,
        });
        
        if (response.data.success) {
          setClient({
            id: response.data.clientId,
            name: response.data.clientName,
            purpose: response.data.purpose
          });
        } else {
          setTokenError('Ungültiger Link. Bitte fordern Sie einen neuen Link an.');
        }
      } catch (error) {
        console.error('Fehler bei Token-Verifizierung:', error);
        if (error.response?.status === 401) {
          setTokenError('Dieser Link ist abgelaufen oder ungültig.');
        } else {
          setTokenError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      alert('Bitte wählen Sie mindestens eine Datei aus.');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Hier würde der tatsächliche Upload an den Server stattfinden
      // Für diese Demo simulieren wir den Upload-Prozess
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUploadSuccess(true);
      setFiles([]);
      
      // Nach 5 Sekunden Erfolgsmeldung ausblenden
      setTimeout(() => {
        setUploadSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      alert('Fehler beim Hochladen der Dateien. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm p-8 animate-fadeIn">
          <div className="flex flex-col items-center">
            <ArrowPathIcon className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <h1 className="text-xl font-medium text-gray-900 mb-2">Wird verifiziert...</h1>
            <p className="text-gray-500">Bitte warten Sie, während wir Ihren Link überprüfen.</p>
          </div>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm p-8 animate-fadeIn">
          <div className="flex flex-col items-center">
            <ExclamationCircleIcon className="h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-xl font-medium text-gray-900 mb-2">Ungültiger Link</h1>
            <p className="text-gray-500 mb-6">{tokenError}</p>
            <button 
              onClick={() => window.location.href = 'https://scuric-rechtsanwaelte.de/kontakt'}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kontakt aufnehmen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm p-8 animate-fadeIn">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-gray-900 mb-2">Dokumente hochladen</h1>
          <p className="text-gray-500">Hallo {client?.name}, laden Sie bitte Ihre Gläubigerschreiben hoch.</p>
        </div>
        
        {uploadSuccess ? (
          <div className="bg-green-50 border border-green-100 rounded-xl p-6 mb-6 animate-fadeIn">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <h2 className="text-lg font-medium text-green-800">Erfolgreich hochgeladen!</h2>
                <p className="text-green-700">Vielen Dank. Wir haben Ihre Dokumente erhalten und werden diese bearbeiten.</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="fileUpload"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <label 
                htmlFor="fileUpload" 
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mb-3" />
                <span className="text-gray-900 font-medium mb-1">Dateien auswählen</span>
                <span className="text-sm text-gray-500">oder per Drag & Drop</span>
                <span className="text-xs text-gray-400 mt-2">PDF, Word, JPG, PNG (max. 10MB)</span>
              </label>
            </div>
            
            {files.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Ausgewählte Dateien ({files.length})</h3>
                <ul className="divide-y divide-gray-200">
                  {files.map((file, index) => (
                    <li key={index} className="py-2 flex items-center">
                      <PaperClipIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 truncate">{file.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{Math.round(file.size / 1024)} KB</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isUploading || files.length === 0}
                className={`px-5 py-2.5 rounded-lg text-white shadow-sm transition-all duration-300 ${
                  isUploading || files.length === 0
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'
                }`}
              >
                {isUploading ? (
                  <span className="flex items-center">
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Wird hochgeladen...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <PaperClipIcon className="h-4 w-4 mr-2" />
                    Dokumente hochladen
                  </span>
                )}
              </button>
            </div>
          </form>
        )}
        
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Scuric Rechtsanwälte GmbH. Alle Rechte vorbehalten.</p>
          <p className="mt-1">Bei Fragen wenden Sie sich bitte an <a href="mailto:kontakt@scuric-rechtsanwaelte.de" className="text-blue-500 hover:text-blue-700">kontakt@scuric-rechtsanwaelte.de</a></p>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadPage;