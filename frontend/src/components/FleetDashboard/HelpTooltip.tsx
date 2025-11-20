import React, { useState, useRef, useEffect } from 'react';
import { FaQuestionCircle, FaTimes } from 'react-icons/fa';

interface HelpTooltipProps {
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  children?: React.ReactNode;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  position = 'top',
  className = '',
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-800',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-800',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-800'
  };

  return (
    <div className={`relative inline-block ${className}`} ref={tooltipRef}>
      {children ? (
        <div onClick={() => setIsVisible(!isVisible)} className="cursor-help">
          {children}
        </div>
      ) : (
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-gray-400 hover:text-primary-600 transition-colors"
          aria-label="Help"
        >
          <FaQuestionCircle className="w-4 h-4" />
        </button>
      )}

      {isVisible && (
        <div
          className={`absolute z-50 w-64 bg-gray-800 text-white text-sm rounded-lg shadow-xl p-4 ${positionClasses[position]}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {typeof content === 'string' ? (
                <p className="text-white">{content}</p>
              ) : (
                content
              )}
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-white flex-shrink-0"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
};

