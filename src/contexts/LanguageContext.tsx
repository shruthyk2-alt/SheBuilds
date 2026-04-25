'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { type Language, getSavedLanguage, saveLanguage, getTranslations, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import type en from '@/locales/en.json';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  translations: typeof en;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    setLanguageState(getSavedLanguage());
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    saveLanguage(lang);
  }, []);

  const translations = getTranslations(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
