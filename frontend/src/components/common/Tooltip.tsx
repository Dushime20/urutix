import { useState, useEffect, ReactNode } from 'react';
import { X, Lightbulb, Info } from 'lucide-react';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click';
  showArrow?: boolean;
  delay?: number;
  maxWidth?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  trigger = 'hover',
  showArrow = true,
  delay = 200,
  maxWidth = '16rem'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (trigger === 'hover') {
      const id = setTimeout(() => setIsVisible(true), delay);
      setTimeoutId(id);
    } else {
      setIsVisible(!isVisible);
    }
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900'
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={trigger === 'hover' ? showTooltip : undefined}
        onMouseLeave={trigger === 'hover' ? hideTooltip : undefined}
        onClick={trigger === 'click' ? showTooltip : undefined}
      >
        {children}
      </div>

      {isVisible && (
        <div
          className={`absolute z-[200] ${positionClasses[position]} animate-in fade-in duration-200`}
          style={{ maxWidth }}
        >
          <div className="bg-gray-900 text-white ui-caption rounded-lg px-3 py-2 shadow-lg">
            {content}
            {showArrow && (
              <div
                className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Feature Highlight Component
interface FeatureHighlightProps {
  title: string;
  description: string;
  target: string; // CSS selector
  onComplete: () => void;
  onSkip: () => void;
}

export const FeatureHighlight: React.FC<FeatureHighlightProps> = ({
  title,
  description,
  target,
  onComplete,
  onSkip
}) => {
  const [element, setElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.querySelector(target) as HTMLElement;
    if (el) {
      setElement(el);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.position = 'relative';
      el.style.zIndex = '101';
    }
  }, [target]);

  if (!element) return null;

  const rect = element.getBoundingClientRect();

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[100]" onClick={onSkip} />

      {/* Highlight box around element */}
      <div
        className="fixed z-[101] pointer-events-none"
        style={{
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
          borderRadius: '8px'
        }}
      />

      {/* Info card */}
      <div
        className="fixed z-[102] bg-white rounded-xl shadow-xl p-4 max-w-sm"
        style={{
          top: rect.bottom + 16,
          left: Math.max(16, Math.min(rect.left, window.innerWidth - 400))
        }}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="ui-card-title text-gray-900">{title}</h3>
            <p className="ui-body-small mt-1">{description}</p>
          </div>
          <button onClick={onSkip} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg ui-button hover:bg-gray-50"
          >
            Skip
          </button>
          <button
            onClick={onComplete}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg ui-button hover:bg-blue-700"
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );
};

// Info Badge Component
interface InfoBadgeProps {
  tooltip: string;
  type?: 'info' | 'tip' | 'warning';
  size?: 'sm' | 'md';
}

export const InfoBadge: React.FC<InfoBadgeProps> = ({ tooltip, type = 'info', size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const colorClasses = {
    info: 'text-blue-600 bg-blue-100',
    tip: 'text-green-600 bg-green-100',
    warning: 'text-amber-600 bg-amber-100'
  };

  return (
    <Tooltip content={tooltip} position="top">
      <div className={`inline-flex items-center justify-center ${sizeClasses} ${colorClasses[type]} rounded-full cursor-help`}>
        <Info className="w-2.5 h-2.5" />
      </div>
    </Tooltip>
  );
};

export default Tooltip;

