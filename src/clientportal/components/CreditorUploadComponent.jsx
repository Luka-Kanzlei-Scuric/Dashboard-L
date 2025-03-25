import React, { useState, useEffect, useRef } from 'react';
import { ArrowPathIcon, PaperClipIcon, CheckIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ChevronRightIcon } from '@heroicons/react/24/solid';

/**
 * A mobile-optimized creditor upload component with auto-save and swipe functionality
 * 
 * @param {Object} props Component props
 * @param {Function} props.onUploadComplete Callback when upload is complete
 * @param {Object} props.client Client data
 */
const CreditorUploadComponent = ({ onUploadComplete, client }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [autoSaving, setAutoSaving] = useState(false);
  const [swipePosition, setSwipePosition] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    // Auto-save effect whenever files change
    if (files.length > 0 && !isUploading) {
      const saveTimer = setTimeout(() => {
        handleUpload();
      }, 1500);
      
      return () => clearTimeout(saveTimer);
    }
  }, [files]);

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      setAutoSaving(true);
    }
  };
  
  // Handle manual upload trigger
  const handleUpload = async () => {
    if (files.length === 0 || isUploading) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Create FormData
      const formData = new FormData();
      files.forEach(file => {
        formData.append('creditorDocuments', file);
      });
      
      // Get API base URL from environment or use default
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://dashboard-l-backend.onrender.com/api';
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Make API call to upload documents
      const response = await fetch(`${apiBaseUrl}/clients/${client._id}/upload-creditor-documents`, {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      // Check response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Hochladen der Dateien');
      }
      
      // Parse successful response
      const data = await response.json();
      setUploadProgress(100);
      
      if (onUploadComplete) {
        onUploadComplete(data.documents);
      }
      
      // Clear files after successful upload
      setTimeout(() => {
        setFiles([]);
        setIsUploading(false);
        setUploadProgress(0);
        setAutoSaving(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      alert(`Fehler beim Hochladen: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
      setAutoSaving(false);
    }
  };
  
  // Touch handlers for swipe functionality
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };
  
  const handleTouchMove = (e) => {
    if (touchStart === null) return;
    
    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;
    
    // Limit swipe range
    if (diff > 0 && diff < 100) {
      setSwipePosition(-diff);
    }
  };
  
  const handleTouchEnd = () => {
    if (swipePosition < -50) {
      // Swipe action threshold reached
      handleUpload();
    }
    
    // Reset position
    setSwipePosition(0);
    setTouchStart(null);
  };
  
  // Handle removing a file
  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle click on upload area
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  
  return (
    <div className="px-4 py-5 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Gläubigerbriefe hochladen</h3>
      
      {/* File list */}
      {files.length > 0 && (
        <div className="mb-4 space-y-2">
          {files.map((file, index) => (
            <div 
              key={index}
              className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-200"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ transform: `translateX(${swipePosition}px)`, transition: touchStart ? 'none' : 'transform 0.3s ease' }}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#9c1a1b]/10 flex items-center justify-center mr-3">
                <DocumentIcon className="h-5 w-5 text-[#9c1a1b]" />
              </div>
              <div className="flex-grow min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm">{file.name}</p>
                <p className="text-gray-500 text-xs">{formatFileSize(file.size)}</p>
              </div>
              <button 
                className="ml-2 p-1 text-gray-400 hover:text-[#9c1a1b] rounded-full"
                onClick={() => handleRemoveFile(index)}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
          
          <div className="text-xs text-gray-500 flex items-center mt-1 ml-2">
            <span className="mr-1">⟵ Nach links wischen zum Hochladen</span>
            <ChevronRightIcon className="h-3 w-3" />
          </div>
          
          {autoSaving && !isUploading && (
            <div className="flex items-center text-xs text-blue-600 mt-1 ml-2">
              <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
              Auto-Speichern in Kürze...
            </div>
          )}
        </div>
      )}
      
      {/* Upload progress */}
      {isUploading && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Hochladen...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#9c1a1b] h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          {uploadProgress === 100 && (
            <div className="flex items-center justify-center mt-3 text-green-600 text-sm">
              <CheckIcon className="h-4 w-4 mr-1" />
              Erfolgreich hochgeladen!
            </div>
          )}
        </div>
      )}
      
      {/* Upload area */}
      {!isUploading && (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#9c1a1b]/50 transition-colors"
          onClick={handleUploadClick}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            multiple
          />
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#9c1a1b]/10 flex items-center justify-center mb-3">
              <PaperClipIcon className="h-6 w-6 text-[#9c1a1b]" />
            </div>
            <p className="text-gray-900 font-medium mb-1">Tippen zum Auswählen</p>
            <p className="text-gray-500 text-sm mb-1">Lade deine Gläubigerbriefe hoch</p>
            <p className="text-xs text-gray-400">PDF, Word, JPG (max. 10MB)</p>
          </div>
        </div>
      )}
      
      {/* Upload button - only shown when there are files and not currently uploading */}
      {files.length > 0 && !isUploading && (
        <button
          onClick={handleUpload}
          className="w-full mt-4 px-4 py-3 bg-[#9c1a1b] text-white rounded-lg font-medium"
        >
          {files.length} {files.length === 1 ? 'Datei' : 'Dateien'} jetzt hochladen
        </button>
      )}
    </div>
  );
};

export default CreditorUploadComponent;