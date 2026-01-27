// i18n Configuration
import { ENV_CONFIG } from './env';

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

// Get language from environment variable, default to 'en'
export const DEFAULT_LANGUAGE: Language = 
  (ENV_CONFIG.APP_LANGUAGE || 'en') as Language;

// Translation files
const enTranslations: Record<string, string> = {
  "app.name": "Aragon",
  "chat.input.placeholder": "Ask anything about your business...",
  "chat.input.placeholder.followup": "Ask a follow-up question...",
  "chat.send": "Send",
  "chat.back": "← Back",
  "chat.copy": "Copy",
  "chat.copied": "Copied",
  "chat.download": "Download",
  "chat.sources": "sources",
  "cards.title": "Daily Commercial Checks",
  "cards.backorder.title": "Backorder Health",
  "cards.backorder.description": "Check revenue risk",
  "cards.sales.title": "Sales Health",
  "cards.sales.description": "MTD performance",
  "cards.forecast.title": "Forecast Tracking",
  "cards.forecast.description": "Budget vs actual",
  "sidebar.home": "Home",
  "sidebar.llm": "LLM",
  "sidebar.playground": "Playground",
  "sidebar.data": "Data",
  "sidebar.help": "Help",
  "sidebar.settings": "Settings"
};

const esTranslations: Record<string, string> = {
  "app.name": "Aragon",
  "chat.input.placeholder": "Pregunta cualquier cosa sobre tu negocio...",
  "chat.input.placeholder.followup": "Haz una pregunta de seguimiento...",
  "chat.send": "Enviar",
  "chat.back": "← Atrás",
  "chat.copy": "Copiar",
  "chat.copied": "Copiado",
  "chat.download": "Descargar",
  "chat.sources": "fuentes",
  "cards.title": "Verificaciones Comerciales Diarias",
  "cards.backorder.title": "Salud de Pedidos Pendientes",
  "cards.backorder.description": "Verificar riesgo de ingresos",
  "cards.sales.title": "Salud de Ventas",
  "cards.sales.description": "Rendimiento MTD",
  "cards.forecast.title": "Seguimiento de Pronóstico",
  "cards.forecast.description": "Presupuesto vs real",
  "sidebar.home": "Inicio",
  "sidebar.llm": "LLM",
  "sidebar.playground": "Parque de Juegos",
  "sidebar.data": "Datos",
  "sidebar.help": "Ayuda",
  "sidebar.settings": "Configuración"
};

const translations: Record<Language, Record<string, string>> = {
  en: enTranslations,
  es: esTranslations,
};

// Translation function
export function t(key: string, lang?: Language): string {
  const currentLang = lang || DEFAULT_LANGUAGE;
  return translations[currentLang]?.[key] || translations['en']?.[key] || key;
}

// Get current language
export function getCurrentLanguage(): Language {
  return DEFAULT_LANGUAGE;
}

// Hook for React components
export function useTranslation() {
  const lang = getCurrentLanguage();
  return {
    t: (key: string) => t(key, lang),
    language: lang,
  };
}
