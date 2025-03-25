import React, { useState, useRef, useEffect } from 'react';
import { ArrowPathIcon, PaperClipIcon, CheckIcon, DocumentIcon, XMarkIcon, InformationCircleIcon, ArrowRightIcon, StarIcon } from '@heroicons/react/24/outline';

/**
 * A mobile-optimized creditor upload component with manual upload functionality
 * 
 * @param {Object} props Component props
 * @param {Function} props.onUploadComplete Callback when upload is complete
 * @param {Object} props.client Client data
 */
const CreditorUploadComponent = ({ onUploadComplete, client }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const uploadButtonRef = useRef(null);
  
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
      
      // Show success state and rating prompt
      setTimeout(() => {
        setShowSuccess(true);
        setIsUploading(false);
        
        // Show rating request after a delay
        setTimeout(() => {
          setShowRating(true);
        }, 2000);
      }, 1500);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      alert(`Fehler beim Hochladen: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Handle removing a file
  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle click on upload area
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  
  // Handle touch events for swipe
  const handleTouchStart = (e) => {
    if (!files.length || isUploading || showSuccess) return;
    setSwipeStartX(e.touches[0].clientX);
  };
  
  const handleTouchMove = (e) => {
    if (!files.length || isUploading || swipeStartX === 0 || showSuccess) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - swipeStartX;
    
    // Only allow right swipe with a maximum offset
    if (diff > 0) {
      const maxOffset = 150; // Maximum swipe distance
      let newOffset = diff;
      
      if (newOffset > maxOffset) {
        newOffset = maxOffset;
      }
      
      setSwipeOffset(newOffset);
      
      // If swiped past threshold, start submission process
      if (newOffset >= maxOffset && !isSubmitting) {
        setIsSubmitting(true);
        handleUpload();
      }
    }
  };
  
  const handleTouchEnd = () => {
    if (!files.length || isUploading || showSuccess) return;
    
    // Reset if not fully swiped
    if (!isSubmitting) {
      setSwipeOffset(0);
    }
    setSwipeStartX(0);
  };
  
  // Reset everything when needed
  const resetComponent = () => {
    setFiles([]);
    setShowSuccess(false);
    setShowRating(false);
    setSwipeOffset(0);
    setIsSubmitting(false);
    setUploadProgress(0);
  };
  
  // Open rating page
  const openRatingPage = () => {
    window.open('https://www.provenexpert.com/rechtsanwalt-thomas-scuric/9298/', '_blank');
    resetComponent();
  };
  
  return (
    <div className="px-4 py-5 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Gläubigerbriefe hochladen</h3>
      
      {/* Information box */}
      <div className="bg-blue-50 rounded-lg border border-blue-100 p-3 mb-4">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              Sie können mehrere Gläubigerbriefe hinzufügen. Wischen Sie nach rechts, 
              um Ihre Dateien hochzuladen, oder fügen Sie weitere Dokumente hinzu.
            </p>
          </div>
        </div>
      </div>
      
      {/* File list */}
      {files.length > 0 && (
        <div className="mb-4 space-y-2">
          {files.map((file, index) => (
            <div 
              key={index}
              className="flex items-center p-3 rounded-lg bg-gray-50 border border-gray-200"
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
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#9c1a1b]/50 transition-colors mb-4"
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
      
      {/* Success and rating state */}
      {showSuccess && (
        <div className="mt-4">
          <div className="rounded-lg bg-green-50 border border-green-100 p-4 mb-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <CheckIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-green-800 text-sm">Vielen Dank!</h4>
                <p className="text-green-700 text-xs mt-1">
                  Ihre Dokumente wurden erfolgreich hochgeladen und werden nun bearbeitet.
                </p>
              </div>
            </div>
          </div>
          
          {/* Rating request */}
          {showRating && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-4 transform transition-all duration-700 ease-out">
              <div className="flex items-center justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#9c1a1b]/10 flex items-center justify-center mr-3">
                    <StarIcon className="h-5 w-5 text-[#9c1a1b]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Zufrieden mit unserem Service?</h4>
                    <p className="text-gray-600 text-xs mt-1">
                      Unterstützen Sie uns mit einer Bewertung.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={openRatingPage}
                  className="px-3 py-1.5 rounded-full bg-[#9c1a1b] text-white text-xs font-medium hover:bg-[#8a1718] transition-colors"
                >
                  Bewerten
                </button>
              </div>
            </div>
          )}
          
          <button
            onClick={resetComponent}
            className="w-full px-3 py-2.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Weitere Dokumente hochladen
          </button>
        </div>
      )}
      
      {/* Upload area and buttons - shown when not in success state */}
      {!showSuccess && (
        <>
          {/* Swipeable upload button for mobile - shown when files are selected and not uploading */}
          {files.length > 0 && !isUploading && (
            <div 
              className="relative w-full h-12 rounded-lg bg-gray-100 mb-4 overflow-hidden touch-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              ref={uploadButtonRef}
            >
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm font-medium">
                Nach rechts swipen zum Hochladen
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </div>
              
              <div 
                className="absolute inset-y-0 left-0 bg-[#9c1a1b] flex items-center px-4 rounded-lg text-white font-medium transition-transform"
                style={{ 
                  transform: `translateX(${swipeOffset - 100}%)`,
                  width: `calc(100% + ${swipeOffset}px)`
                }}
              >
                <div className="flex items-center ml-auto mr-auto">
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Dateien hochladen
                </div>
              </div>
            </div>
          )}
          
          {/* Add files button */}
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className={`w-full px-3 py-2.5 rounded-lg border ${isUploading ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} text-sm font-medium transition-colors mb-2`}
          >
            Dateien hinzufügen
          </button>
          
          {/* File count indicator */}
          {files.length > 0 && !isUploading && (
            <div className="text-center text-xs text-gray-500 mt-3">
              {files.length} {files.length === 1 ? 'Datei' : 'Dateien'} ausgewählt
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CreditorUploadComponent;