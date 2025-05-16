'use client';

import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowUpTrayIcon, ArrowDownTrayIcon, XMarkIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function ImageBackgroundRemover() {
  const { t } = useLanguage();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setProcessedImage(null);

    if (!file.type.includes('image')) {
      setError(t('image_remover.error_not_image'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t('image_remover.error_too_large'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeBackground = async () => {
    if (!originalImage) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Call the API endpoint to remove background
      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: originalImage })
      });
      
      if (!response.ok) {
        throw new Error('Failed to process image');
      }
      
      const data = await response.json();
      if (data.success && data.resultImage) {
        setProcessedImage(data.resultImage);
      } else {
        throw new Error(data.error || 'Failed to process image');
      }
    } catch (err) {
      setError(t('image_remover.error_processing'));
      console.error('Error removing background:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'no-background.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">{t('image_remover.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t('image_remover.description')}
        </p>
      </div>

      {/* File Upload Area */}
      <div className="mb-8">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          ref={fileInputRef}
        />

        {!originalImage ? (
          <div 
            onClick={triggerFileInput}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <PhotoIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="mb-2 text-lg font-medium">{t('image_remover.upload_prompt')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('image_remover.upload_hint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Original Image */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">{t('image_remover.original')}</h3>
                <button 
                  onClick={resetAll} 
                  className="text-red-500 hover:text-red-700 p-1"
                  aria-label={t('common.delete')}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-square relative bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                <img 
                  src={originalImage} 
                  alt={t('image_remover.original')} 
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>

            {/* Processed Image or Processing State */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">{t('image_remover.result')}</h3>
              <div className="aspect-square relative bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                {isProcessing ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
                    <p>{t('image_remover.processing')}</p>
                  </div>
                ) : processedImage ? (
                  <img 
                    src={processedImage} 
                    alt={t('image_remover.result')} 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p>{t('image_remover.click_remove')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg flex items-start">
            <XMarkIcon className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {originalImage && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={removeBackground}
            disabled={isProcessing || !originalImage}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isProcessing ? t('image_remover.processing') : t('image_remover.remove_background')}
          </button>

          {processedImage && (
            <button
              onClick={downloadImage}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              {t('image_remover.download')}
            </button>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-12 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">{t('image_remover.how_it_works')}</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
          <li>{t('image_remover.step_1')}</li>
          <li>{t('image_remover.step_2')}</li>
          <li>{t('image_remover.step_3')}</li>
        </ol>
      </div>
    </div>
  );
} 