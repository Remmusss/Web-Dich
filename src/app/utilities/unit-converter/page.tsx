'use client'

import UnitConverter from '@/components/UnitConverter'

export default function UnitConverterPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Chuyển đổi đơn vị</h1>
                    <p className="text-gray-600">
                        Chuyển đổi đơn vị giữa các đơn vị khác nhau.
                        Nhập giá trị và chọn đơn vị từ và đến.
                    </p>
                </div>
                <UnitConverter />
            </div>
        </div>
    )
} 