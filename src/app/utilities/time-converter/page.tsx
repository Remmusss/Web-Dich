'use client'

import TimeZoneConverter from '@/components/TimeZoneConverter'

export default function TimeZoneConverterPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Chuyển đổi múi giờ</h1>
                    <p className="text-gray-600">
                        Chuyển đổi múi giờ giữa các thành phố trên thế giới.
                        Nhập tên thành phố và chọn múi giờ tương ứng.
                    </p>
                </div>
                <TimeZoneConverter />
            </div>
        </div>
    )
} 