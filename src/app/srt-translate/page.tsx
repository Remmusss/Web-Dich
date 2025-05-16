import type { Metadata } from 'next'
import SRTTranslation from '@/components/SRTTranslation';

export const metadata: Metadata = {
    title: 'Hỗ Trợ Dịch SRT - AI Tool',
    description: 'Công cụ dịch file phụ đề SRT thông minh sử dụng AI. Hỗ trợ dịch nhanh chóng và chính xác các file phụ đề từ nhiều ngôn ngữ khác nhau.',
    keywords: 'dịch srt, phụ đề, subtitle, dịch phụ đề, ai dịch, srt translator, subtitle translation',
    openGraph: {
        title: 'Hỗ Trợ Dịch SRT - AI Tool',
        description: 'Công cụ dịch file phụ đề SRT thông minh sử dụng AI. Hỗ trợ dịch nhanh chóng và chính xác các file phụ đề từ nhiều ngôn ngữ khác nhau.',
        type: 'website',
        images: [
            {
                url: '/og-srt-translate.png',
                width: 1200,
                height: 630,
                alt: 'SRT Translation Tool'
            }
        ]
    },
}

export default function SRTTranslatePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <SRTTranslation />
    </main>
  );
} 