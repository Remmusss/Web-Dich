'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';

export default function LocalizedExample() {
  const { t, language } = useLanguage();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">{t('common.language')}: {language === 'en' ? t('common.english') : t('common.vietnamese')}</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('sidebar.tools')}</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>{t('sidebar.translate')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>{t('sidebar.dictionary')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>{t('sidebar.vocabulary')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span>{t('sidebar.quiz')}</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('auth.login')}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.email')}</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:border-gray-600"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth.password')}</label>
                <input 
                  type="password" 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary dark:bg-gray-700 dark:border-gray-600"
                  placeholder="********"
                />
              </div>
              <button className="w-full bg-primary text-white font-medium py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors">
                {t('auth.signIn')}
              </button>
              <div className="text-sm text-center">
                <a href="#" className="text-primary hover:underline">{t('auth.forgotPassword')}</a>
              </div>
              <div className="text-sm text-center">
                <span>{t('auth.noAccount')} </span>
                <a href="#" className="text-primary hover:underline">{t('auth.signUp')}</a>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 