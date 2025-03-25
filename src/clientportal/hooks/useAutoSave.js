import { useEffect, useRef } from 'react';

/**
 * Hook to automatically save data after it changes
 * 
 * @param {any} data The data to monitor for changes
 * @param {Function} saveFunction The function to call to save the data
 * @param {number} delay The delay in ms before saving (debounce)
 * @returns {void}
 */
export const useAutoSave = (data, saveFunction, delay = 2000) => {
  const saveTimeoutRef = useRef(null);
  const previousDataRef = useRef(JSON.stringify(data));

  useEffect(() => {
    // Compare current data with previous data
    const currentData = JSON.stringify(data);
    if (currentData !== previousDataRef.current) {
      // Data has changed, start/reset the timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveFunction();
        saveTimeoutRef.current = null;
      }, delay);
      
      previousDataRef.current = currentData;
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, saveFunction, delay]);
};