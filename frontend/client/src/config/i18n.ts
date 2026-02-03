// i18n Configuration
import { ENV_CONFIG } from './env';

export const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
export type Language = typeof SUPPORTED_LANGUAGES[number];

// Resolve initial language from env, then from localStorage, default to 'en'
function resolveInitialLanguage(): Language {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('appLanguage') as Language | null;
    if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
      return stored;
    }
  }
  return (ENV_CONFIG.APP_LANGUAGE || 'en') as Language;
}

export const DEFAULT_LANGUAGE: Language = resolveInitialLanguage();

let currentLanguage: Language = DEFAULT_LANGUAGE;

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
  "cards.forecast.title": "Daily Health",
  "cards.forecast.description": "Budget vs actual",
  "cards.reports.title": "Inventory Checkup",
  "cards.reports.description": "Create custom reports",
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
  "cards.backorder.title": "Salud de Backorder",
  "cards.backorder.description": "Verificar riesgo de ingresos",
  "cards.sales.title": "Salud de Ventas",
  "cards.sales.description": "Rendimiento MTD",
  "cards.forecast.title": "Salud Diaria",
  "cards.forecast.description": "Presupuesto vs real",
  "cards.reports.title": "Revisión de Inventario",
  "cards.reports.description": "Crear informes personalizados",
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
  const currentLang = lang || currentLanguage;
  return translations[currentLang]?.[key] || translations['en']?.[key] || key;
}

// Get / set current language (stateful, persisted in localStorage)
export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export function setCurrentLanguage(lang: Language) {
  if (!(SUPPORTED_LANGUAGES as readonly string[]).includes(lang)) return;
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('appLanguage', lang);
  }
}

// Backwards-compatible React-style hook used across the app
export function useTranslation() {
  const lang = getCurrentLanguage();
  return {
    t: (key: string) => t(key, lang),
    language: lang,
    setLanguage: setCurrentLanguage,
  };
}

