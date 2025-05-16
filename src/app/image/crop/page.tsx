'use client';

import ImageCropper from '@/components/image/ImageCropper';
import { useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import PageViewTracker from '@/components/PageViewTracker';

export default function ImageCropperPage() {
  const { t } = useTranslation('common');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <PageViewTracker />
      <ImageCropper />
    </div>
  );
} 