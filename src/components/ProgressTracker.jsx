import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

/**
 * A progress tracking component with Apple-inspired design
 * 
 * @param {Object} props Component props
 * @param {Number} props.currentPhase The current phase number (1-based)
 * @param {Array} props.phases Array of phase objects with name and description
 * @param {Function} props.onPhaseClick Optional callback when a phase is clicked
 */
const ProgressTracker = ({ currentPhase, phases, onPhaseClick }) => {
  return (
    <div className="w-full overflow-hidden">
      {/* Progress phases */}
      <div className="relative flex items-center justify-between mb-2">
        {/* Progress line */}
        <div className="absolute left-0 right-0 h-0.5 bg-gray-200 top-1/2 transform -translate-y-1/2 z-0"></div>
        
        {/* Completed line */}
        <div 
          className="absolute left-0 h-0.5 bg-blue-500 top-1/2 transform -translate-y-1/2 z-0 transition-all duration-500 ease-in-out"
          style={{ 
            width: `${Math.max(0, (currentPhase - 1) / (phases.length - 1) * 100)}%` 
          }}
        ></div>
        
        {/* Phase dots */}
        {phases.map((phase, index) => {
          const phaseNumber = index + 1;
          const isCompleted = phaseNumber < currentPhase;
          const isCurrent = phaseNumber === currentPhase;
          
          return (
            <div key={index} className="z-10 flex flex-col items-center">
              <button 
                onClick={() => onPhaseClick && onPhaseClick(phaseNumber)}
                className={`relative rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-blue-500 border-blue-500 text-white w-6 h-6 shadow-sm' 
                    : isCurrent
                      ? 'bg-white border-blue-500 text-blue-500 w-6 h-6 ring-4 ring-blue-100 shadow-md' 
                      : 'bg-white border-gray-300 text-gray-400 w-5 h-5'
                } border-2`}
                disabled={!onPhaseClick}
              >
                {isCompleted ? (
                  <CheckIcon className="h-3 w-3" />
                ) : (
                  <span className="text-xs font-medium">{phaseNumber}</span>
                )}
                
                {/* Pulse animation for current phase */}
                {isCurrent && (
                  <span className="absolute w-full h-full rounded-full bg-blue-500 opacity-20 animate-ping"></span>
                )}
              </button>
              
              {/* Phase label */}
              <span className={`mt-2 text-xs font-medium whitespace-nowrap ${
                isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {phase.name}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Current phase description */}
      <div className="mt-2 text-gray-500 text-sm">
        {phases[currentPhase - 1]?.description}
      </div>
    </div>
  );
};

export default ProgressTracker;