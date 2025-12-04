# Translation System Documentation

## Overview

UrutiIQ uses a *dynamic, on-the-fly translation system* similar to Google Translate. Unlike traditional i18n systems that require hard-coded translation files, this system automatically translates text using translation APIs in real-time.

### Key Features

- ✅ *No Translation Files Required* - Translations happen automatically
- ✅ *20+ Supported Languages* - Out of the box support
- ✅ *Smart Caching* - Translations cached in localStorage for performance
- ✅ *Rate Limit Handling* - Automatic rate limit detection and management
- ✅ *Fallback Support* - Falls back to original text if translation fails
- ✅ *React Integration* - Easy-to-use hooks and components

---

## Architecture

### Core Components


┌─────────────────────────────────────────────────────────────┐
│                    Translation System                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │ TranslationService│      │   I18nContext    │           │
│  │  (Core Logic)     │◄─────┤  (React Context) │           │
│  └──────────────────┘      └──────────────────┘           │
│         │                            │                      │
│         │                            │                      │
│         ▼                            ▼                      │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │  MyMemory API     │      │  useTranslation  │           │
│  │  (Free API)      │      │     (Hook)        │           │
│  └──────────────────┘      └──────────────────┘           │
│         │                            │                      │
│         │                            │                      │
│         ▼                            ▼                      │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │  Google Translate │      │ TranslatedText   │           │
│  │  (Optional)       │      │   (Component)    │           │
│  └──────────────────┘      └──────────────────┘           │
│                                                               │
└─────────────────────────────────────────────────────────────┘


### File Structure


urutiq/apps/urutiq-frontend/src/
├── lib/i18n/
│   └── translation-service.ts    # Core translation service
├── contexts/
│   └── i18n-context.tsx          # React context provider
├── hooks/
│   └── useTranslation.ts          # Translation hooks
└── components/
    ├── translated-text.tsx        # Translation component
    └── language-switcher.tsx      # Language selector UI


---

## How It Works

### 1. *Translation Flow*


User Text → Check Cache → API Call (if needed) → Cache Result → Return Translation


1. *Text Input*: Component requests translation for text
2. *Cache Check*: System checks localStorage cache first
3. *API Call*: If not cached, calls MyMemory Translation API
4. *Cache Storage*: Valid translations stored in localStorage
5. *Return*: Returns translated text (or original if failed)

### 2. *Caching Strategy*

- *localStorage*: All translations cached in translation_cache
- *Component Cache*: React state cache for faster re-renders
- *Cache Key*: text.toLowerCase().trim()
- *Cache Limit*: 4MB max size (auto-clears if exceeded)

### 3. *Rate Limiting*

- *Detection*: Automatically detects API rate limits (429 errors)
- *Handling*: Stops API calls for 1 hour when rate limited
- *Storage*: Rate limit state persisted in localStorage
- *Recovery*: Automatically resumes after rate limit expires

---

## Usage Examples

### Method 1: Using the TranslatedText Component (Recommended)

tsx
import { TranslatedText } from '@/components/translated-text';

function MyComponent() {
  return (
    <div>
      <TranslatedText text="Create Account" />
      <TranslatedText text="Welcome to UrutiIQ" as="h1" className="text-2xl" />
      <TranslatedText text="Save Changes" as="button" />
    </div>
  );
}


*Props:*
- text (required): Text to translate
- fallback (optional): Fallback text if translation fails
- as (optional): HTML element type (default: 'span')
- className (optional): CSS classes

### Method 2: Using the useTranslation Hook

tsx
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { t, tSync, language, setLanguage } = useTranslation();
  const [translatedText, setTranslatedText] = useState('');

  useEffect(() => {
    // Async translation
    t("Create Account").then(translated => {
      setTranslatedText(translated);
    });
  }, [language]);

  return (
    <div>
      <button>{translatedText}</button>
      <button onClick={() => setLanguage('fr')}>Switch to French</button>
    </div>
  );
}


### Method 3: Synchronous Translation (Cached Only)

tsx
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { tSync } = useTranslation();

  // Returns cached translation or original text
  const buttonText = tSync("Save Changes");

  return <button>{buttonText}</button>;
}


### Method 4: Using useI18n Directly

tsx
import { useI18n } from '@/contexts/i18n-context';

function MyComponent() {
  const { t, language, setLanguage } = useI18n();

  const handleClick = async () => {
    const translated = await t("Account created successfully");
    alert(translated);
  };

  return (
    <div>
      <button onClick={handleClick}>Click me</button>
      <p>Current language: {language}</p>
    </div>
  );
}


### Method 5: Batch Translation

tsx
import { useTranslation } from '@/hooks/useTranslation';

function MyComponent() {
  const { translateBatch } = useTranslation();
  const [translated, setTranslated] = useState<string[]>([]);

  useEffect(() => {
    translateBatch([
      "Create Account",
      "Save Changes",
      "Delete Item"
    ]).then(setTranslated);
  }, []);

  return (
    <div>
      {translated.map((text, i) => <button key={i}>{text}</button>)}
    </div>
  );
}


---

## Language Switcher

### Basic Usage

tsx
import { LanguageSwitcher } from '@/components/language-switcher';

function Header() {
  return (
    <header>
      <LanguageSwitcher />
    </header>
  );
}


The LanguageSwitcher component:
- Shows current language
- Provides dropdown to select language
- Automatically triggers re-translation of all components
- Shows loading state during translation

---

## Configuration

### Setup in App.tsx

tsx
import { I18nProvider } from '@/contexts/i18n-context';

function App() {
  return (
    <I18nProvider 
      defaultLanguage="en"
      googleTranslateApiKey={process.env.GOOGLE_TRANSLATE_API_KEY} // Optional
    >
      {/* Your app components */}
    </I18nProvider>
  );
}


### Environment Variables

env
# Optional: Google Translate API Key (for higher rate limits)
GOOGLE_TRANSLATE_API_KEY=your-api-key-here


### Initialize Translation Service

tsx
import { translationService } from '@/lib/i18n/translation-service';

// Initialize with default language
translationService.init('en');

// Or with Google Translate API key
translationService.init('en', process.env.GOOGLE_TRANSLATE_API_KEY);


---

## Supported Languages

The system supports *20+ languages* out of the box:

| Code | Language | Native Name |
|------|----------|-------------|
| en | English | English |
| fr | French | Français |
| sw | Kiswahili | Kiswahili |
| es | Spanish | Español |
| pt | Portuguese | Português |
| ar | Arabic | العربية |
| zh | Chinese | 中文 |
| hi | Hindi | हिन्दी |
| de | German | Deutsch |
| it | Italian | Italiano |
| ja | Japanese | 日本語 |
| ko | Korean | 한국어 |
| ru | Russian | Русский |
| tr | Turkish | Türkçe |
| vi | Vietnamese | Tiếng Việt |
| nl | Dutch | Nederlands |
| pl | Polish | Polski |
| th | Thai | ไทย |
| uk | Ukrainian | Українська |

---

## API Details

### Translation Service API

#### translationService.translate(text, targetLang?)

Translates text to target language.

typescript
const translated = await translationService.translate("Hello", "fr");
// Returns: "Bonjour"


#### translationService.translateBatch(texts, targetLang?)

Translates multiple texts at once.

typescript
const translated = await translationService.translateBatch(
  ["Hello", "World"], 
  "fr"
);
// Returns: ["Bonjour", "Monde"]


#### translationService.setLanguage(language)

Sets the current language.

typescript
translationService.setLanguage('fr');


#### translationService.getLanguage()

Gets the current language.

typescript
const lang = translationService.getLanguage(); // "fr"


#### translationService.clearCache()

Clears all cached translations.

typescript
translationService.clearCache();


#### translationService.getRateLimitStatus()

Checks if translation API is rate limited.

typescript
const status = translationService.getRateLimitStatus();
// Returns: { isLimited: boolean, minutesRemaining: number }


---

## Caching System

### How Caching Works

1. *First Translation*: Text translated via API, result cached
2. *Subsequent Requests*: Returns cached translation instantly
3. *Cache Storage*: Stored in localStorage as translation_cache
4. *Cache Key*: Lowercase, trimmed text
5. *Cache Format*: { "text": { "lang": "translation" } }

### Cache Management

typescript
// Clear all cache
translationService.clearCache();

// Clear cache for specific language
translationService.clearLanguageCache('fr');

// Clean cache (removes warnings)
translationService.cleanCache();


### Cache Structure

json
{
  "hello world": {
    "fr": "Bonjour le monde",
    "es": "Hola mundo",
    "sw": "Hujambo dunia"
  },
  "save changes": {
    "fr": "Enregistrer les modifications",
    "es": "Guardar cambios"
  }
}


---

## Rate Limiting

### How Rate Limiting Works

1. *Detection*: System detects 429 (Too Many Requests) responses
2. *Auto-Stop*: Stops making API calls for 1 hour
3. *Fallback*: Returns original text when rate limited
4. *Recovery*: Automatically resumes after rate limit expires
5. *Storage*: Rate limit state persisted in localStorage

### Rate Limit Status

typescript
const { isLimited, minutesRemaining } = translationService.getRateLimitStatus();

if (isLimited) {
  console.log(`Rate limited. ${minutesRemaining} minutes remaining.`);
}


### Manual Rate Limit Clear

typescript
// Clear rate limit (use with caution)
translationService.clearRateLimit();


---

## Best Practices

### ✅ DO

1. **Use TranslatedText component** for static text
2. **Use tSync for cached translations** in render methods
3. **Use t (async) for dynamic translations** in effects/handlers
4. *Provide fallback text* for important translations
5. *Cache translations* by using the same text strings

### ❌ DON'T

1. *Don't translate user-generated content* (already in user's language)
2. *Don't translate URLs or code* (keep as-is)
3. *Don't translate numbers or dates* (format them instead)
4. *Don't make unnecessary API calls* (use cached translations)
5. *Don't translate empty strings* (check first)

### Example: Good Practice

tsx
// ✅ Good: Using TranslatedText component
<TranslatedText text="Create Account" />

// ✅ Good: Using cached translation
const { tSync } = useTranslation();
<button>{tSync("Save Changes")}</button>

// ✅ Good: With fallback
<TranslatedText text="Delete" fallback="Remove" />


### Example: Bad Practice

tsx
// ❌ Bad: Translating user input
<TranslatedText text={userInput} /> // Don't translate user content

// ❌ Bad: Translating URLs
<TranslatedText text="https://example.com" /> // Keep URLs as-is

// ❌ Bad: Unnecessary async in render
const text = await t("Hello"); // Use tSync instead


---

## Troubleshooting

### Translations Not Working

1. *Check I18nProvider*: Ensure app is wrapped in I18nProvider
2. *Check Language*: Verify language is set correctly
3. *Check Cache*: Clear cache if translations seem stale
4. *Check Rate Limit*: Verify not rate limited
5. *Check Network*: Ensure API calls are not blocked

### Rate Limited

typescript
// Check rate limit status
const status = translationService.getRateLimitStatus();
if (status.isLimited) {
  console.log(`Rate limited for ${status.minutesRemaining} more minutes`);
}

// Clear rate limit (if needed)
translationService.clearRateLimit();


### Cache Issues

typescript
// Clear all cache
translationService.clearCache();

// Clear specific language cache
translationService.clearLanguageCache('fr');

// Clean cache (removes warnings)
translationService.cleanCache();


### Debug Mode

typescript
// Enable debug logging
localStorage.setItem('translation_debug', 'true');

// Check cache contents
const cache = localStorage.getItem('translation_cache');
console.log(JSON.parse(cache));


---

## Advanced Usage

### Custom Translation Service

typescript
import { TranslationService } from '@/lib/i18n/translation-service';

// Create custom instance
const customService = new TranslationService();
customService.init('en', 'your-api-key');

// Use Google Translate
customService.configureGoogleTranslate('your-google-api-key');


### Language Detection

typescript
// Auto-detect browser language
const browserLang = navigator.language.split('-')[0];
translationService.setLanguage(browserLang);


### Translation Events

typescript
// Listen for language changes
window.addEventListener('languageChanged', (e) => {
  console.log('Language changed to:', e.detail.language);
});


---

## Performance Considerations

1. *Cache First*: Always check cache before API calls
2. *Batch Translations*: Use translateBatch for multiple texts
3. *Use tSync*: Use synchronous translation for cached text
4. *Limit API Calls*: Avoid translating the same text multiple times
5. *Cache Size*: Monitor localStorage size (4MB limit)

---

## Migration from Static Translations

If you have existing static translation files:

1. *Replace translation keys* with actual English text
2. **Use TranslatedText component** instead of translation functions
3. *Remove translation files* (no longer needed)
4. *Test translations* in different languages

### Before (Static)

tsx
import { t } from '@/i18n/translations';
<button>{t('buttons.save')}</button>


### After (Dynamic)

tsx
import { TranslatedText } from '@/components/translated-text';
<button><TranslatedText text="Save" /></button>


---

## API Providers

### MyMemory Translation API (Default)

- *Free*: No API key required
- *Rate Limit*: ~100 requests/day (free tier)
- *Languages*: 100+ languages
- *URL*: https://api.mymemory.translated.net/get

### Google Translate API (Optional)

- *Paid*: Requires API key
- *Rate Limit*: Higher limits (depends on plan)
- *Languages*: 100+ languages
- *Setup*: Configure with API key

typescript
translationService.configureGoogleTranslate('your-api-key');


---

## Summary

The UrutiIQ translation system provides:

- ✅ *Zero-configuration* dynamic translations
- ✅ *20+ languages* supported out of the box
- ✅ *Smart caching* for performance
- ✅ *Rate limit handling* for reliability
- ✅ *Easy React integration* with hooks and components
- ✅ *No translation files* needed

Simply use <TranslatedText text="Your Text" /> and the system handles the rest!