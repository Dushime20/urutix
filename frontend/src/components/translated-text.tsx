// TranslatedText Component - React component for translated text
import { useState, useEffect, ReactNode } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface TranslatedTextProps {
  text: string;
  fallback?: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children?: ReactNode;
}

export function TranslatedText({ 
  text, 
  fallback, 
  as: Component = 'span', 
  className,
  children 
}: TranslatedTextProps) {
  const { t, tSync, language } = useTranslation();
  const [translatedText, setTranslatedText] = useState<string>(() => {
    if (!text || !text.trim()) return text;
    return tSync(text);
  });

  useEffect(() => {
    if (!text || !text.trim()) {
      setTranslatedText(text);
      return;
    }

    // Use cached translation immediately
    const cached = tSync(text);
    setTranslatedText(cached);

    // Then fetch async translation if needed
    if (language !== 'en') {
      t(text).then(translated => {
        if (translated && translated !== text) {
          setTranslatedText(translated);
        } else if (fallback) {
          setTranslatedText(fallback);
        }
      }).catch(() => {
        if (fallback) {
          setTranslatedText(fallback);
        }
      });
    }
  }, [text, language, t, tSync, fallback]);

  return (
    <Component className={className}>
      {translatedText}
      {children}
    </Component>
  );
}

