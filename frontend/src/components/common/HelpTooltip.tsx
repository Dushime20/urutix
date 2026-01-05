import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpTooltipProps {
  content: string | React.ReactNode;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  videoUrl?: string;
  documentationUrl?: string;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  title,
  position = 'top',
  className = '',
  videoUrl,
  documentationUrl,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-indigo-600 transition-colors touch-manipulation min-w-[24px] min-h-[24px] flex items-center justify-center"
        aria-label="Help"
        type="button"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 w-64 sm:w-80 bg-gray-800 text-white rounded-lg shadow-xl p-4 ${positionClasses[position]}`}
        >
          {/* Arrow */}
          <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />

          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="pr-6">
            {title && (
              <h4 className="font-semibold text-white mb-2 text-sm">{title}</h4>
            )}
            <div className="text-sm text-gray-200 leading-relaxed">
              {typeof content === 'string' ? <p>{content}</p> : content}
            </div>

            {/* Links */}
            {(videoUrl || documentationUrl) && (
              <div className="mt-3 pt-3 border-t border-gray-700 flex flex-wrap gap-2">
                {videoUrl && (
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Watch Video
                  </a>
                )}
                {documentationUrl && (
                  <a
                    href={documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Read Docs
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;

