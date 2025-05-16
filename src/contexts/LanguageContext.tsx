'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Available languages
export type LanguageCode = 'en' | 'vi';

// Interface for the language context
interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

// Default context value
const defaultContext: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
};

// Create context
const LanguageContext = createContext<LanguageContextType>(defaultContext);

// Translation resources
const translations: Record<LanguageCode, Record<string, any>> = {
  en: {},
  vi: {},
};

// Translation resources will be loaded dynamically
let enTranslations: Record<string, string> = {};
let viTranslations: Record<string, string> = {};

// Language provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize with browser language or default to 'en'
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        // Import translations dynamically
        const enModule = await import('@/constants/translations/en.json');
        const viModule = await import('@/constants/translations/vi.json');
        
        translations.en = enModule.default;
        translations.vi = viModule.default;
        
        // Check for saved language preference
        const savedLanguage = localStorage.getItem('language') as LanguageCode;
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
          setLanguage(savedLanguage);
        } else {
          // Try to detect browser language
          const browserLang = navigator.language.split('-')[0];
          setLanguage(browserLang === 'vi' ? 'vi' : 'en');
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load translations:', error);
        setIsLoaded(true);
      }
    };
    
    loadTranslations();
  }, []);

  // Update language and save to localStorage
  const handleSetLanguage = (lang: LanguageCode) => {
    setLanguage(lang);
    try {
      localStorage.setItem('language', lang);
      
      // Update html lang attribute
      document.documentElement.lang = lang;
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  // Translation function
  const t = (key: string, replacements?: Record<string, string>): string => {
    const parts = key.split('.');
    let current: any = translations[language];
    
    // Traverse the nested structure
    for (const part of parts) {
      current = current?.[part];
      if (current === undefined) break;
    }
    
    // Fallback to English or key if not found
    if (typeof current !== 'string') {
      let enFallback: any = translations.en;
      for (const part of parts) {
        enFallback = enFallback?.[part];
        if (enFallback === undefined) break;
      }
      current = typeof enFallback === 'string' ? enFallback : key;
    }
    
    // Replace variables if provided
    let result = String(current);
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    
    return result;
  };

  if (!isLoaded) {
    return <>{children}</>; // Render children without translations until loaded
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook for using language context
export const useLanguage = () => useContext(LanguageContext); 