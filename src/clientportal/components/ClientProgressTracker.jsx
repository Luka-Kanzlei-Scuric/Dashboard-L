import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

/**
 * A mobile-optimized progress tracking component
 * Simplified for client portal use
 * 
 * @param {Object} props Component props
 * @param {Number} props.currentPhase The current phase number (1-based)
 * @param {Array} props.phases Array of phase objects with name and description
 */
const ClientProgressTracker = ({ currentPhase, phases }) => {
  if (!phases || phases.length === 0) {
    return null;
  }
  
  // Default phases if not provided
  const defaultPhases = [
    { name: 'Anfang', description: 'Ihre Anfrage wurde erfasst' },
    { name: 'Dokumente', description: 'Gläubigerbriefe werden gesammelt' },
    { name: 'Prüfung', description: 'Ihre Unterlagen werden geprüft' },
    { name: 'Bearbeitung', description: 'Wir bearbeiten Ihren Fall' },
    { name: 'Abschluss', description: 'Der Prozess ist abgeschlossen' }
  ];
  
  const displayPhases = phases.length > 0 ? phases : defaultPhases;
  const phase = currentPhase || 1;
  
  return (
    <div className="px-4 py-5 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Ihr Fortschritt</h3>
      
      {/* Progress bar */}
      <div className="relative flex items-center justify-between mb-5">
        {/* Background track */}
        <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-full top-1/2 transform -translate-y-1/2 z-0"></div>
        
        {/* Completed track */}
        <div 
          className="absolute left-0 h-1 bg-[#9c1a1b] rounded-full top-1/2 transform -translate-y-1/2 z-0 transition-all duration-700 ease-out"
          style={{ 
            width: `${Math.max(0, (phase - 1) / (displayPhases.length - 1) * 100)}%`,
          }}
        ></div>
        
        {/* Phase indicators */}
        {displayPhases.map((p, index) => {
          const phaseNumber = index + 1;
          const isCompleted = phaseNumber < phase;
          const isCurrent = phaseNumber === phase;
          
          return (
            <div key={index} className="z-10 flex flex-col items-center">
              <div 
                className={`relative rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-[#9c1a1b] text-white w-7 h-7' 
                    : isCurrent
                      ? 'bg-[#9c1a1b] text-white w-7 h-7 ring-2 ring-[#9c1a1b]/20' 
                      : 'bg-white border border-gray-300 text-gray-500 w-6 h-6'
                }`}
              >
                {isCompleted ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{phaseNumber}</span>
                )}
                
                {/* Pulse animation for current phase */}
                {isCurrent && (
                  <span className="absolute w-10 h-10 rounded-full bg-[#9c1a1b]/10 opacity-60 animate-pulse"></span>
                )}
              </div>
              
              {/* Phase name - only show on mobile for current phase and completed phases */}
              {(isCompleted || isCurrent) && (
                <span className={`mt-2 text-[10px] font-medium text-center ${
                  isCompleted ? 'text-[#9c1a1b]/80' : 
                  isCurrent ? 'text-[#9c1a1b]' : 
                  'text-gray-500'
                }`}>
                  {p.name}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Current phase description */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0 mr-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#9c1a1b]/10 text-[#9c1a1b] text-sm font-medium">
              {phase}
            </div>
          </div>
          <div>
            <h4 className="text-gray-900 font-medium text-base mb-1">{displayPhases[phase - 1]?.name}</h4>
            <p className="text-gray-600 text-sm">{displayPhases[phase - 1]?.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProgressTracker;