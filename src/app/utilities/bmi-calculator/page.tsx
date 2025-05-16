import type { Metadata } from 'next'
import BMICalculator from '@/components/BMICalculator'

export const metadata: Metadata = {
  title: 'Tính Chỉ Số BMI | Công Cụ Sức Khỏe',
  description: 'Tính toán chỉ số BMI (Body Mass Index) và nhận thông tin chi tiết về tình trạng sức khỏe của bạn. Nhập chiều cao và cân nặng để bắt đầu.',
  keywords: 'tính BMI, chỉ số BMI, tính cân nặng, đánh giá sức khỏe, tính chỉ số khối cơ thể, BMI calculator, body mass index, health calculator',
  openGraph: {
    title: 'Tính Chỉ Số BMI | Công Cụ Sức Khỏe',
    description: 'Tính toán chỉ số BMI (Body Mass Index) và nhận thông tin chi tiết về tình trạng sức khỏe của bạn. Nhập chiều cao và cân nặng để bắt đầu.',
    type: 'website',
  }
}

export default function BMICalculatorPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Tính chỉ số BMI</h1>
                    <p className="text-gray-600">
                        Chỉ số BMI (Body Mass Index) là một công cụ đơn giản để đánh giá tình trạng cân nặng của cơ thể.
                        Nhập chiều cao và cân nặng của bạn để biết chỉ số BMI và các thông tin sức khỏe liên quan.
                    </p>
                </div>
                <BMICalculator />
            </div>
        </div>
    )
} 