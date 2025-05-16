'use client';

import { useEffect, useState } from 'react';
import { LOCAL_AI_MODELS, OPENROUTER_MODELS } from '@/lib/api-config';
import { aiService } from '@/lib/ai-service';
import { CommandLineIcon, Bars3Icon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useSidebar } from '@/contexts/SidebarContext';
import { useTheme } from '@/contexts/ThemeContext';
import GoogleLoginButton from './GoogleLoginButton';
import LanguageSwitcher from './LanguageSwitcher';

export default function Menubar() {
  const [selectedModel, setSelectedModel] = useState(aiService.getModel());
  const [isModelSelectOpen, setIsModelSelectOpen] = useState(false);
  const { toggle } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    aiService.loadSavedModel();
    setSelectedModel(aiService.getModel());
  }, []);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    aiService.setModel(modelId);
    setIsModelSelectOpen(false);
  };

  // Combine all AI models
  const ALL_AI_MODELS = [
    ...LOCAL_AI_MODELS,
    { id: 'separator', name: '──────────', description: '' },
    ...OPENROUTER_MODELS,
  ];

  const currentModel = ALL_AI_MODELS.find((m) => m.id === selectedModel);

  return (
    <header className="relative h-16 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 sm:px-6 flex items-center justify-between z-40 transition-colors duration-300">
      <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
        <button
          onClick={toggle}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors md:hidden"
          aria-label="Toggle Sidebar"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        {/* Mobile Model Display */}
        <div className="flex items-center gap-2 flex-1 min-w-0 md:hidden">
          <CommandLineIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <button
            onClick={() => setIsModelSelectOpen(!isModelSelectOpen)}
            className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate flex-1 text-left"
          >
            {currentModel?.name || 'Select Model'}
          </button>
        </div>

        {/* Desktop Model Select */}
        <div className="hidden md:flex items-center gap-3 flex-1 min-w-0">
          <CommandLineIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <label htmlFor="ai-model" className="text-sm font-normal text-gray-600 dark:text-gray-300 whitespace-nowrap">
            AI Model
          </label>
          <select
            id="ai-model"
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="form-select w-60 text-sm bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 transition-colors"
          >
            {ALL_AI_MODELS.map((model) => (
              <option
                key={model.id}
                value={model.id}
                disabled={model.id === 'separator'}
                className={model.id === 'separator' ? 'text-gray-400 font-bold' : ''}
              >
                {model.name}
              </option>
            ))}
          </select>

          {selectedModel && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
              {currentModel?.description}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <SunIcon className="w-4 h-4" />
          ) : (
            <MoonIcon className="w-4 h-4" />
          )}
        </button>
        <GoogleLoginButton />
      </div>

      {/* Mobile Model Select Dropdown */}
      {isModelSelectOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 mx-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg md:hidden transition-colors">
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {ALL_AI_MODELS.map((model) => (
              model.id === 'separator' ? (
                <div key={model.id} className="px-3 py-1 text-xs text-gray-400 font-medium border-t border-gray-100 dark:border-gray-700">
                  {model.name}
                </div>
              ) : (
                <button
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  className={`w-full px-3 py-2 text-left text-sm ${
                    model.id === selectedModel
                      ? 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } transition-colors`}
                >
                  <div className="font-medium">{model.name}</div>
                  {model.description && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{model.description}</div>
                  )}
                </button>
              )
            ))}
          </div>
        </div>
      )}
    </header>
  );
} 