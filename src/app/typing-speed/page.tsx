import type { Metadata } from 'next'

import TypingSpeed from '@/components/TypingSpeed'
export const metadata: Metadata = {
    title: 'Kiểm tra tốc độ gõ | Công Cụ Kiểm Tra Tốc Độ Gõ',
    description: 'Kiểm tra tốc độ gõ phím chi tiết với bản đồ tương tác',
    keywords: 'kiểm tra tốc độ gõ, tốc độ gõ, kiểm tra tốc độ gõ, tốc độ gõ, kiểm tra tốc độ gõ, tốc độ gõ',
    openGraph: {
      title: 'Kiểm tra tốc độ gõ | Công Cụ Kiểm Tra Tốc Độ Gõ',
      description: 'Kiểm tra tốc độ gõ phím chi tiết với bản đồ tương tác',
      type: 'website',
    }
  }
export default function WeatherPage() {
  return (
    <div className="py-8">
      <TypingSpeed />
    </div>
  )
} 