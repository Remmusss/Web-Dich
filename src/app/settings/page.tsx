'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/card';
import { CheckIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('common.settings')}</h1>
      
      <div className="grid gap-6">
        {/* Language Settings */}
        <Card className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t('common.language')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setLanguage('en')}
              className={`p-4 rounded-lg border ${
                language === 'en' 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              } transition-all flex flex-col items-center gap-2 relative`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-600">EN</span>
              </div>
              <span className="font-medium">{t('common.english')}</span>
              {language === 'en' && (
                <CheckIcon className="w-5 h-5 text-primary absolute top-3 right-3" />
              )}
            </button>
            
            <button
              onClick={() => setLanguage('vi')}
              className={`p-4 rounded-lg border ${
                language === 'vi' 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              } transition-all flex flex-col items-center gap-2 relative`}
            >
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-lg font-semibold text-red-600">VI</span>
              </div>
              <span className="font-medium">{t('common.vietnamese')}</span>
              {language === 'vi' && (
                <CheckIcon className="w-5 h-5 text-primary absolute top-3 right-3" />
              )}
            </button>
          </div>
        </Card>
        
        {/* Theme Settings */}
        <Card className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t('common.theme')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-lg border ${
                theme === 'light' 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              } transition-all flex flex-col items-center gap-2 relative`}
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <SunIcon className="w-6 h-6 text-amber-600" />
              </div>
              <span className="font-medium">{t('common.light')}</span>
              {theme === 'light' && (
                <CheckIcon className="w-5 h-5 text-primary absolute top-3 right-3" />
              )}
            </button>
            
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-lg border ${
                theme === 'dark' 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              } transition-all flex flex-col items-center gap-2 relative`}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <MoonIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="font-medium">{t('common.dark')}</span>
              {theme === 'dark' && (
                <CheckIcon className="w-5 h-5 text-primary absolute top-3 right-3" />
              )}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
} 