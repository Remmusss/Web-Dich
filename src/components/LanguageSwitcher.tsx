'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ReactCountryFlag from "react-country-flag";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  const handleValueChange = (value: string) => {
    setLanguage(value as 'en' | 'vi');
  };

  return (
    <div className="relative">
      <Select value={language} onValueChange={handleValueChange}>
        <SelectTrigger className="w-[80px] rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-0 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out focus:ring-2 focus:ring-primary">
          <div className="flex items-center space-x-2">
            <ReactCountryFlag 
              countryCode={language === 'en' ? 'GB' : 'VN'} 
              svg 
              style={{
                width: '1.5em',
                height: '1.5em'
              }}
            />
            <span className="text-xs font-medium">
              {language === 'en' ? 'EN' : 'VI'}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">
            <div className="flex items-center space-x-2">
              <ReactCountryFlag 
                countryCode="GB" 
                svg 
                style={{
                  width: '1.5em',
                  height: '1.5em'
                }}
              />
              <span>{t('common.english')}</span>
            </div>
          </SelectItem>
          <SelectItem value="vi">
            <div className="flex items-center space-x-2">
              <ReactCountryFlag 
                countryCode="VN" 
                svg 
                style={{
                  width: '1.5em',
                  height: '1.5em'
                }}
              />
              <span>{t('common.vietnamese')}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}