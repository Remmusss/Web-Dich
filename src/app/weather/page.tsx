import type { Metadata } from 'next'

import Weather from '@/components/Weather'
export const metadata: Metadata = {
    title: 'Dự báo thời tiết | Công Cụ Dự Báo Thời Tiết',
    description: 'Dự báo thời tiết chi tiết với bản đồ tương tác',
    keywords: 'dự báo thời tiết, thời tiết, dự báo thời tiết, bản đồ thời tiết, thời tiết, dự báo thời tiết, bản đồ thời tiết',
    openGraph: {
      title: 'Dự báo thời tiết | Công Cụ Dự Báo Thời Tiết',
      description: 'Dự báo thời tiết chi tiết với bản đồ tương tác',
      type: 'website',
    }
  }
export default function WeatherPage() {
  return (
    <div className="py-8">
      <Weather />
    </div>
  )
} 