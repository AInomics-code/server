# Multilingual Setup Guide

The application supports multiple languages based on environment variables.

## Supported Languages

- `en` - English (default)
- `es` - Spanish

## Configuration

To set the language, add one of the following environment variables to your `.env` file:

```bash
# Option 1: Using VITE_ prefix (recommended for Vite)
VITE_APP_LANGUAGE=es

# Option 2: Using NEXT_PUBLIC_ prefix (for compatibility)
NEXT_PUBLIC_APP_LANGUAGE=es
```

## How It Works

1. The language is read from environment variables at build time
2. The `useTranslation()` hook provides the `t()` function to translate keys
3. All UI text is automatically translated based on the configured language

## Adding New Translations

To add new translations, edit `client/src/config/i18n.ts` and add entries to both `enTranslations` and `esTranslations` objects:

```typescript
const enTranslations: Record<string, string> = {
  // ... existing translations
  "new.key": "English text",
};

const esTranslations: Record<string, string> = {
  // ... existing translations
  "new.key": "Texto en español",
};
```

## Using Translations in Components

```typescript
import { useTranslation } from '@/config/i18n';

function MyComponent() {
  const { t } = useTranslation();
  
  return <div>{t('chat.input.placeholder')}</div>;
}
```

## Translation Keys

Current translation keys:
- `app.name` - Application name
- `chat.input.placeholder` - Chat input placeholder
- `chat.input.placeholder.followup` - Follow-up question placeholder
- `chat.send` - Send button
- `chat.back` - Back button
- `chat.copy` - Copy button
- `chat.copied` - Copied confirmation
- `chat.download` - Download button
- `chat.sources` - Sources label
- `cards.title` - Daily Commercial Checks title
- `cards.backorder.title` - Backorder Health card title
- `cards.backorder.description` - Backorder Health card description
- `cards.sales.title` - Sales Health card title
- `cards.sales.description` - Sales Health card description
- `cards.forecast.title` - Forecast Tracking card title
- `cards.forecast.description` - Forecast Tracking card description
- `sidebar.home` - Home sidebar label
- `sidebar.llm` - LLM sidebar label
- `sidebar.playground` - Playground sidebar label
- `sidebar.data` - Data sidebar label
- `sidebar.help` - Help sidebar label
- `sidebar.settings` - Settings sidebar label
