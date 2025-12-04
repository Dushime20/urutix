// LanguageSwitcher Component - Language selector UI with icon dropdown
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { translationService } from '@/lib/i18n/translation-service';
import { Globe, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'default' | 'light';
}

export function LanguageSwitcher({ className, variant = 'default' }: LanguageSwitcherProps) {
  const { language, setLanguage, isTranslating } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const languages = translationService.getSupportedLanguages();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setIsOpen(false);
  };

  const iconColor = variant === 'light' 
    ? 'text-white' 
    : 'text-gray-700';

  const buttonClassName = variant === 'light'
    ? `p-2 rounded-lg hover:bg-white/10 transition-colors ${iconColor} ${isTranslating ? 'opacity-50' : ''} focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[40px] min-h-[40px] flex items-center justify-center`
    : `p-2 rounded-lg hover:bg-gray-100 transition-colors ${iconColor} ${isTranslating ? 'opacity-50' : ''} focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[40px] min-h-[40px] flex items-center justify-center`;

  return (
    <div className={`relative inline-block ${className || ''}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !isTranslating && setIsOpen(!isOpen)}
        disabled={isTranslating}
        className={buttonClassName}
        title="Select Language"
        aria-label="Select Language"
      >
        <Globe 
          className="h-5 w-5 flex-shrink-0" 
          strokeWidth={2.5} 
          fill="none"
          style={{ display: 'block' }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 max-h-80 overflow-auto">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
            Select Language
          </div>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center justify-between ${
                language === lang.code ? 'bg-gray-50 font-medium' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{lang.nativeName}</span>
                <span className="text-xs text-gray-500">({lang.name})</span>
              </div>
              {language === lang.code && (
                <Check className="h-4 w-4 text-primary-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

