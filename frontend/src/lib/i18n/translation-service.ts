// Translation Service - Core translation logic
export type LanguageCode = string;

type CacheEntry = Record<LanguageCode, string>;
type TranslationCache = Record<string, CacheEntry>;

interface RateLimitStatus {
  isLimited: boolean;
  minutesRemaining: number;
}

class TranslationService {
  private currentLanguage: LanguageCode = 'en';
  private googleTranslateApiKey: string | null = null;
  private rateLimitUntil: number | null = null;
  private componentCache: Map<string, string> = new Map();

  // Supported languages
  private readonly supportedLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'sw', name: 'Kiswahili', nativeName: 'Kiswahili' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  ];

  init(language: LanguageCode = 'en', googleApiKey?: string) {
    this.currentLanguage = language;
    if (googleApiKey) {
      this.googleTranslateApiKey = googleApiKey;
    }
    this.loadRateLimitStatus();
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  setLanguage(language: LanguageCode) {
    this.currentLanguage = language;
    localStorage.setItem('translation_language', language);
    this.componentCache.clear();
    
    // Dispatch event for language change
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language } 
    }));
  }

  getLanguage(): LanguageCode {
    return this.currentLanguage;
  }

  configureGoogleTranslate(apiKey: string) {
    this.googleTranslateApiKey = apiKey;
  }

  private getCacheKey(text: string): string {
    return text.toLowerCase().trim();
  }

  private getCache(): TranslationCache {
    try {
      const cached = localStorage.getItem('translation_cache');
      if (!cached) return {};
      return JSON.parse(cached) as TranslationCache;
    } catch {
      return {};
    }
  }

  private setCache(cache: TranslationCache) {
    try {
      const cacheString = JSON.stringify(cache);
      // Check if cache exceeds 4MB (approximate)
      if (new Blob([cacheString]).size > 4 * 1024 * 1024) {
        // Clear cache if too large
        this.clearCache();
        return;
      }
      localStorage.setItem('translation_cache', cacheString);
    } catch (error) {
      console.warn('Failed to save translation cache:', error);
    }
  }

  private getCachedTranslation(text: string, targetLang: LanguageCode): string | null {
    const cache = this.getCache();
    const key = this.getCacheKey(text);
    return cache[key]?.[targetLang] || null;
  }

  private setCachedTranslation(text: string, targetLang: LanguageCode, translation: string) {
    const cache = this.getCache();
    const key = this.getCacheKey(text);
    if (!cache[key]) {
      cache[key] = {};
    }
    cache[key][targetLang] = translation;
    this.setCache(cache);
  }

  private async translateWithMyMemory(text: string, targetLang: LanguageCode): Promise<string> {
    const sourceLang = 'en';
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    
    try {
      console.log(`[i18n] MyMemory Request: ${targetLang} -> "${text.substring(0, 30)}..."`);
      const response = await fetch(url);
      
      if (response.status === 429) {
        console.warn('[i18n] MyMemory Rate Limited (429). Setting 60-min cooldown.');
        this.setRateLimit(60);
        return text;
      }

      if (!response.ok) {
        console.error(`[i18n] MyMemory HTTP Error: ${response.status} ${response.statusText}`);
        return text;
      }

      const data = await response.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const result = data.responseData.translatedText;
        if (result === text) {
            console.log('[i18n] MyMemory returned identical text (possibly untranslatable or source=target)');
        }
        return result;
      }
      
      console.warn('[i18n] MyMemory Unexpected Response:', data);
      return text;
    } catch (error) {
      console.error('[i18n] MyMemory Fetch Error:', error);
      return text;
    }
  }

  private async translateWithGoogle(text: string, targetLang: LanguageCode): Promise<string> {
    if (!this.googleTranslateApiKey || this.googleTranslateApiKey === 'undefined' || this.googleTranslateApiKey.length < 5) {
      return this.translateWithMyMemory(text, targetLang);
    }

    try {
      console.log(`[i18n] Google Translate Request: ${targetLang} -> "${text.substring(0, 30)}..."`);
      const url = `https://translation.googleapis.com/language/translate/v2?key=${this.googleTranslateApiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: targetLang,
          format: 'text',
        }),
      });

      if (response.status === 429) {
        console.warn('[i18n] Google Translate Rate Limited.');
        this.setRateLimit(60);
        return text;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[i18n] Google Translate API Error:', response.status, errorData);
        return this.translateWithMyMemory(text, targetLang);
      }

      const data = await response.json();
      if (data.data?.translations?.[0]?.translatedText) {
        return data.data.translations[0].translatedText;
      }

      console.warn('[i18n] Google Translate Unexpected Response Structure:', data);
      return this.translateWithMyMemory(text, targetLang);
    } catch (error) {
      console.error('[i18n] Google Translate Fetch Error:', error);
      return this.translateWithMyMemory(text, targetLang);
    }
  }

  private setRateLimit(minutes: number) {
    const until = Date.now() + minutes * 60 * 1000;
    this.rateLimitUntil = until;
    localStorage.setItem('translation_rate_limit', until.toString());
  }

  private loadRateLimitStatus() {
    const stored = localStorage.getItem('translation_rate_limit');
    if (stored) {
      const until = parseInt(stored, 10);
      if (until > Date.now()) {
        this.rateLimitUntil = until;
      } else {
        this.rateLimitUntil = null;
        localStorage.removeItem('translation_rate_limit');
      }
    }
  }

  getRateLimitStatus(): RateLimitStatus {
    this.loadRateLimitStatus();
    if (!this.rateLimitUntil || this.rateLimitUntil <= Date.now()) {
      return { isLimited: false, minutesRemaining: 0 };
    }
    const minutesRemaining = Math.ceil((this.rateLimitUntil - Date.now()) / 60000);
    return { isLimited: true, minutesRemaining };
  }

  clearRateLimit() {
    this.rateLimitUntil = null;
    localStorage.removeItem('translation_rate_limit');
  }

  async translate(text: string, targetLang?: LanguageCode): Promise<string> {
    if (!text || !text.trim()) {
      return text;
    }

    const lang = targetLang || this.currentLanguage;
    
    // Return original if same language
    if (lang === 'en') {
      return text;
    }

    // Check cache
    const cached = this.getCachedTranslation(text, lang);
    if (cached) {
      return cached;
    }

    // Check rate limit
    const rateLimitStatus = this.getRateLimitStatus();
    if (rateLimitStatus.isLimited) {
      console.warn(`Translation rate limited. Minutes remaining: ${rateLimitStatus.minutesRemaining}`);
      return text;
    }

    console.log(`[i18n] Translating: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}" to ${lang}`);

    // Translate
    let translation = text;
    try {
      translation = this.googleTranslateApiKey
        ? await this.translateWithGoogle(text, lang)
        : await this.translateWithMyMemory(text, lang);
    } catch (error) {
      console.error('[i18n] Translation failed:', error);
      return text;
    }

    // Cache if translation succeeded and is actually a translation
    if (translation && translation !== text) {
      this.setCachedTranslation(text, lang, translation);
      console.log(`[i18n] Success: "${text.substring(0, 15)}..." -> "${translation.substring(0, 15)}..."`);
    }

    return translation;
  }

  async translateBatch(texts: string[], targetLang?: LanguageCode): Promise<string[]> {
    const lang = targetLang || this.currentLanguage;
    if (lang === 'en') {
      return texts;
    }

    const results = await Promise.all(texts.map(text => this.translate(text, lang)));
    return results;
  }

  translateSync(text: string, targetLang?: LanguageCode): string {
    const lang = targetLang || this.currentLanguage;
    if (lang === 'en') {
      return text;
    }

    const cached = this.getCachedTranslation(text, lang);
    return cached || text;
  }

  clearCache() {
    localStorage.removeItem('translation_cache');
    this.componentCache.clear();
  }

  clearLanguageCache(language: LanguageCode) {
    const cache = this.getCache();
    Object.keys(cache).forEach(key => {
      if (cache[key][language]) {
        delete cache[key][language];
      }
    });
    this.setCache(cache);
  }

  cleanCache() {
    const cache = this.getCache();
    const cleaned: TranslationCache = {};
    Object.keys(cache).forEach(key => {
      const entry = cache[key];
      const cleanedEntry: CacheEntry = {};
      Object.keys(entry).forEach(lang => {
        if (entry[lang] && !entry[lang].includes('MYMEMORY WARNING')) {
          cleanedEntry[lang] = entry[lang];
        }
      });
      if (Object.keys(cleanedEntry).length > 0) {
        cleaned[key] = cleanedEntry;
      }
    });
    this.setCache(cleaned);
  }
}

// Export singleton instance
export const translationService = new TranslationService();

// Export types
export type { RateLimitStatus };

