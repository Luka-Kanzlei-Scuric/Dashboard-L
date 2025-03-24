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
 */
const ProgressTracker = ({ currentPhase, phases, onPhaseClick, onViewInstructions }) => {
  return (
    <div className="w-full overflow-hidden">
      {/* Progress phases with enhanced design */}
      <div className="relative flex items-center justify-between mb-6">
        {/* Background track with frosted glass effect */}
        <div className="absolute left-0 right-0 h-1.5 bg-gray-100 rounded-full backdrop-blur-sm top-1/2 transform -translate-y-1/2 z-0"></div>
        
        {/* Completed track with gradient effect */}
        <div 
          className="absolute left-0 h-1.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full top-1/2 transform -translate-y-1/2 z-0 transition-all duration-700 ease-out"
          style={{ 
            width: `${Math.max(0, (currentPhase - 1) / (phases.length - 1) * 100)}%`,
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)' 
          }}
        ></div>
        
        {/* Phase indicators */}
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
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-transparent text-white w-8 h-8 shadow-md' 
                    : isCurrent
                      ? 'bg-white border-blue-500 text-blue-600 w-8 h-8 ring-4 ring-blue-50 shadow-lg' 
                      : isNext
                        ? 'bg-white border-blue-200 text-blue-400 w-7 h-7 hover:border-blue-300 hover:text-blue-500 cursor-pointer'
                        : 'bg-white border-gray-200 text-gray-400 w-6 h-6'
                } border-2 ${!isCompleted && !isCurrent && !isNext && !onPhaseClick ? 'cursor-default' : 'cursor-pointer'}`}
                disabled={!onPhaseClick && !isNext}
                title={phase.name}
              >
                {isCompleted ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{phaseNumber}</span>
                )}
                
                {/* Enhanced pulse animation for current phase */}
                {isCurrent && (
                  <>
                    <span className="absolute w-full h-full rounded-full bg-blue-400 opacity-20 animate-ping"></span>
                    <span className="absolute w-12 h-12 rounded-full bg-blue-100 opacity-10 animate-pulse"></span>
                  </>
                )}
                
                {/* Subtle glow for next available phase */}
                {isNext && (
                  <span className="absolute w-10 h-10 rounded-full bg-blue-50 opacity-70"></span>
                )}
              </button>
              
              {/* Phase label with enhanced typography */}
              <span className={`mt-3 text-sm font-medium whitespace-nowrap text-center ${
                isCompleted ? 'text-blue-700' : 
                isCurrent ? 'text-gray-900' : 
                isNext ? 'text-gray-700' : 'text-gray-400'
              }`}>
                {phase.name}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Current phase description and action hint */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 transition-all duration-300 animate-fadeIn">
        <div className="flex">
          <div className="flex-shrink-0 mr-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
              {currentPhase}
            </div>
          </div>
          <div className="flex-grow">
            <h4 className="text-blue-800 font-medium mb-1">{phases[currentPhase - 1]?.name}</h4>
            <p className="text-blue-700 text-sm">{phases[currentPhase - 1]?.description}</p>
            
            {/* View detailed instructions button */}
            {onViewInstructions && (
              <button 
                onClick={onViewInstructions}
                className="mt-2 text-xs text-blue-600 font-medium hover:underline flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Detaillierte Anweisungen anzeigen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;