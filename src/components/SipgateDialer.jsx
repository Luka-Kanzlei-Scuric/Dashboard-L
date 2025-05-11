import React, { useState } from 'react';
import { 
  PhoneIcon, 
  ArrowPathIcon, 
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import dialerService from '../services/dialerService';

/**
 * SipgateDialer Component
 * 
 * A simple component to make outgoing calls using SipGate API.
 * This component provides a form to enter a phone number and initiate the call.
 */
const SipgateDialer = ({ onCallInitiated }) => {
  // State Management
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  /**
   * Handles the form submission to make a call
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      setError('Bitte geben Sie eine Telefonnummer ein');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Format phone number to E.164 if needed
      const formattedNumber = formatE164Number(phoneNumber);
      
      if (!formattedNumber) {
        setError('Ungültiges Telefonnummernformat. Bitte im Format +49... eingeben.');
        setLoading(false);
        return;
      }
      
      console.log(`Initiating call to ${formattedNumber}`);
      
      // Get temporary user ID to include in logs
      const tempUserId = localStorage.getItem('sipgate_temp_user_id');
      console.log(`Making call with tempUserId: ${tempUserId || 'none'}`);
      
      // Log device info from localStorage if available
      const deviceId = localStorage.getItem('sipgate_device_id');
      console.log(`Current device ID from localStorage: ${deviceId || 'none'}`);

      // Call the API to make a call
      const response = await dialerService.makeSipgateCall(formattedNumber, {
        // Include any additional options we have available
        deviceId: deviceId
      });
      
      console.log('SipGate call response:', response);
      
      if (response.success) {
        setSuccess(`Anruf erfolgreich initiiert an ${formattedNumber}`);
        setPhoneNumber(''); // Clear the input on success
        
        // Call the onCallInitiated callback if provided
        if (onCallInitiated && typeof onCallInitiated === 'function') {
          onCallInitiated({
            phoneNumber: formattedNumber,
            callId: response.callId,
            call: response.call
          });
        }
      } else {
        // More detailed error handling
        console.error('Failed to make call:', response);
        setError(response.message || 'Fehler beim Initiieren des Anrufs');
      }
    } catch (error) {
      console.error('Error making call:', error);
      setError('Fehler beim Initiieren des Anrufs: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Handles phone number input changes
   */
  const handlePhoneNumberChange = (e) => {
    setPhoneNumber(e.target.value);
    
    // Clear error and success when user starts typing again
    if (error) setError(null);
    if (success) setSuccess(null);
  };
  
  /**
   * Formats a phone number to E.164 format
   * E.164 format: +[country code][number without leading 0]
   * Example: +49123456789
   */
  const formatE164Number = (number) => {
    if (!number) return null;
    
    // Remove all spaces, parentheses, dashes, etc.
    const digitsOnly = number.replace(/\s+/g, '');
    
    // Check if already in E.164 format starting with +
    if (digitsOnly.startsWith('+')) {
      const cleaned = '+' + digitsOnly.substring(1).replace(/\D/g, '');
      
      // Validate E.164 format: + followed by 7-15 digits
      const e164Regex = /^\+[1-9]\d{6,14}$/;
      return e164Regex.test(cleaned) ? cleaned : null;
    }
    
    // Process numbers without +
    let cleaned = digitsOnly.replace(/\D/g, '');
    
    // For German numbers: if it starts with 0, replace with +49
    if (cleaned.startsWith('0')) {
      cleaned = '49' + cleaned.substring(1);
    } 
    // If no leading 0 but likely a German number, prepend 49
    else if (!cleaned.startsWith('49') && cleaned.length <= 11) {
      cleaned = '49' + cleaned;
    }
    
    // Add the + prefix
    cleaned = '+' + cleaned;
    
    // Final validation for E.164 format
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    return e164Regex.test(cleaned) ? cleaned : null;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <PhoneIcon className="h-4 w-4 mr-1.5 text-gray-500" />
          SipGate Dialer
        </h3>
      </div>
      
      <div className="p-4">
        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-green-50 text-green-600 p-3 rounded text-sm flex">
            <CheckCircleIcon className="h-5 w-5 mr-1.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded text-sm flex">
            <ExclamationCircleIcon className="h-5 w-5 mr-1.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block text-sm text-gray-600 mb-1">
              Telefonnummer
            </label>
            <input
              type="text"
              id="phoneNumber"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="+49 123 456789"
              className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Bitte im Format +49... eingeben oder die Umwandlung erfolgt automatisch
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !phoneNumber}
              className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                loading || !phoneNumber 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                  Verbinden...
                </>
              ) : (
                <>
                  <PhoneIcon className="h-4 w-4 mr-1.5" />
                  Anrufen
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex">
            <InformationCircleIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
            <p>
              Dieser Dialer verwendet die SipGate API, um Anrufe zu tätigen. 
              SipGate ruft zuerst Sie an und verbindet dann mit der angegebenen Nummer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SipgateDialer;