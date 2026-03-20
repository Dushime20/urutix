// I18n Context - React context for translation
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { translationService } from '@/lib/i18n/translation-service';
import type { LanguageCode } from '@/lib/i18n/translation-service';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (text: string, targetLang?: LanguageCode) => Promise<string>;
  tSync: (text: string, targetLang?: LanguageCode) => string;
  translateBatch: (texts: string[], targetLang?: LanguageCode) => Promise<string[]>;
  isTranslating: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: LanguageCode;
  googleTranslateApiKey?: string;
}

export function I18nProvider({ 
  children, 
  defaultLanguage = 'en',
  googleTranslateApiKey 
}: I18nProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    // Load from localStorage or use default
    const stored = localStorage.getItem('translation_language');
    return (stored as LanguageCode) || defaultLanguage;
  });
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    // Initialize translation service
    translationService.init(language, googleTranslateApiKey);
    
    // Listen for language changes from other sources
    const handleLanguageChange = (e: CustomEvent) => {
      if (e.detail?.language && e.detail.language !== language) {
        setLanguageState(e.detail.language);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, [language, googleTranslateApiKey]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    translationService.setLanguage(lang);
    setLanguageState(lang);
  }, []);

  const t = useCallback(async (text: string, targetLang?: LanguageCode): Promise<string> => {
    if (!text || !text.trim()) {
      return text;
    }
    
    setIsTranslating(true);
    try {
      const result = await translationService.translate(text, targetLang || language);
      return result;
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  const tSync = useCallback((text: string, targetLang?: LanguageCode): string => {
    return translationService.translateSync(text, targetLang || language);
  }, [language]);

  const translateBatch = useCallback(async (texts: string[], targetLang?: LanguageCode): Promise<string[]> => {
    setIsTranslating(true);
    try {
      const results = await translationService.translateBatch(texts, targetLang || language);
      return results;
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    tSync,
    translateBatch,
    isTranslating,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

