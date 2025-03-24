import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

/**
 * An enhanced progress tracking component with premium Apple-inspired design
 * 
 * @param {Object} props Component props
 * @param {Number} props.currentPhase The current phase number (1-based)
 * @param {Array} props.phases Array of phase objects with name and description
 * @param {Function} props.onPhaseClick Optional callback when a phase is clicked
 * @param {Function} props.onViewInstructions Optional callback to view detailed instructions
 * @param {Boolean} props.compact Whether to display in compact mode
 */
const ProgressTracker = ({ currentPhase, phases, onPhaseClick, onViewInstructions, compact = false }) => {
  // If in compact mode, render a minimal version for display next to client name
  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        {phases.map((phase, index) => {
          const phaseNumber = index + 1;
          const isCompleted = phaseNumber < currentPhase;
          const isCurrent = phaseNumber === currentPhase;
          
          return (
            <div 
              key={index} 
              className={`w-2 h-2 rounded-full transition-all ${
                isCompleted 
                  ? 'bg-green-500' 
                  : isCurrent 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300'
              }`}
              title={`${phase.name} ${isCompleted ? '(abgeschlossen)' : isCurrent ? '(aktuell)' : '(ausstehend)'}`}
            />
          );
        })}
        <span className="text-xs text-gray-500 ml-1">Phase {currentPhase}/{phases.length}</span>
      </div>
    );
  }

  // Regular full display for the dedicated process tab
  return (
    <div className="w-full overflow-hidden">
      {/* Progress phases with refined design */}
      <div className="relative flex items-center justify-between mb-6">
        {/* Background track with clean minimal design */}
        <div className="absolute left-0 right-0 h-1 bg-gray-100 rounded-full top-1/2 transform -translate-y-1/2 z-0"></div>
        
        {/* Completed track with solid color */}
        <div 
          className="absolute left-0 h-1 bg-blue-500 rounded-full top-1/2 transform -translate-y-1/2 z-0 transition-all duration-700 ease-out"
          style={{ 
            width: `${Math.max(0, (currentPhase - 1) / (phases.length - 1) * 100)}%`,
          }}
        ></div>
        
        {/* Phase indicators with simplified design */}
        {phases.map((phase, index) => {
          const phaseNumber = index + 1;
          const isCompleted = phaseNumber < currentPhase;
          const isCurrent = phaseNumber === currentPhase;
          const isNext = phaseNumber === currentPhase + 1;
          
          return (
            <div key={index} className="z-10 flex flex-col items-center">
              <button 
                onClick={() => onPhaseClick && onPhaseClick(phaseNumber)}
                className={`relative rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-green-500 text-white w-7 h-7' 
                    : isCurrent
                      ? 'bg-blue-500 text-white w-7 h-7 ring-2 ring-blue-100' 
                      : 'bg-white border border-gray-300 text-gray-500 w-6 h-6'
                } ${!isCompleted && !isCurrent && !isNext && !onPhaseClick ? 'cursor-default' : 'cursor-pointer'}`}
                disabled={!onPhaseClick && !isNext}
                title={phase.name}
              >
                {isCompleted ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{phaseNumber}</span>
                )}
                
                {/* Simple pulse animation for current phase */}
                {isCurrent && (
                  <span className="absolute w-10 h-10 rounded-full bg-blue-100 opacity-50 animate-pulse"></span>
                )}
              </button>
              
              {/* Phase label with clean typography */}
              <span className={`mt-2 text-xs font-medium whitespace-nowrap text-center ${
                isCompleted ? 'text-green-700' : 
                isCurrent ? 'text-blue-700' : 
                'text-gray-500'
              }`}>
                {phase.name}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Current phase description with cleaner design */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 transition-all duration-300 animate-fadeIn">
        <div className="flex">
          <div className="flex-shrink-0 mr-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
              {currentPhase}
            </div>
          </div>
          <div className="flex-grow">
            <h4 className="text-gray-900 font-medium text-sm mb-0.5">{phases[currentPhase - 1]?.name}</h4>
            <p className="text-gray-600 text-xs">{phases[currentPhase - 1]?.description}</p>
            
            {/* View detailed instructions button */}
            {onViewInstructions && (
              <button 
                onClick={onViewInstructions}
                className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Details anzeigen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;