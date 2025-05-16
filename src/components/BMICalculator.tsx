'use client'

import { useState } from 'react'
import { ScaleIcon, ArrowsUpDownIcon, BoltIcon, HeartIcon, InformationCircleIcon, CommandLineIcon, CalculatorIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import { aiService } from '@/lib/ai-service'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

interface BMIResult {
    bmi: number
    category: string
    healthyWeightRange: {
        min: number
        max: number
    }
    risks: string[]
    recommendations: string[]
    aiAdvice: string
    bodyAge: number
    predictedLifeExpectancy: number
    healthScore: number
}

const bmiCategories = [
    { range: [0, 18.5], category: 'Thiếu cân', color: 'text-blue-600' },
    { range: [18.5, 24.9], category: 'Bình thường', color: 'text-green-600' },
    { range: [25, 29.9], category: 'Thừa cân', color: 'text-yellow-600' },
    { range: [30, 34.9], category: 'Béo phì cấp độ I', color: 'text-orange-600' },
    { range: [35, 39.9], category: 'Béo phì cấp độ II', color: 'text-red-600' },
    { range: [40, Infinity], category: 'Béo phì cấp độ III', color: 'text-red-800' }
]

const healthRisks = {
    underweight: [
        'Suy dinh dưỡng',
        'Hệ miễn dịch yếu',
        'Loãng xương',
        'Thiếu máu'
    ],
    normal: [
        'Nguy cơ thấp',
        'Sức khỏe tốt',
        'Duy trì lối sống lành mạnh'
    ],
    overweight: [
        'Bệnh tim mạch',
        'Tiểu đường type 2',
        'Huyết áp cao',
        'Đột quỵ'
    ],
    obese: [
        'Bệnh tim mạch nặng',
        'Tiểu đường type 2',
        'Huyết áp cao',
        'Đột quỵ',
        'Một số bệnh ung thư',
        'Vấn đề về khớp'
    ]
}

const recommendations = {
    underweight: [
        'Ăn nhiều bữa nhỏ trong ngày',
        'Tăng cường thực phẩm giàu dinh dưỡng',
        'Tập thể dục nhẹ nhàng',
        'Ngủ đủ giấc'
    ],
    normal: [
        'Duy trì chế độ ăn cân bằng',
        'Tập thể dục thường xuyên',
        'Kiểm tra sức khỏe định kỳ',
        'Ngủ đủ giấc'
    ],
    overweight: [
        'Giảm lượng calo nạp vào',
        'Tăng cường vận động',
        'Ăn nhiều rau xanh',
        'Hạn chế đồ ngọt và chất béo'
    ],
    obese: [
        'Tham khảo ý kiến bác sĩ',
        'Theo dõi chế độ ăn nghiêm ngặt',
        'Tập thể dục thường xuyên',
        'Thay đổi lối sống'
    ]
}

export default function BMICalculator() {
    const [height, setHeight] = useState<string>('')
    const [weight, setWeight] = useState<string>('')
    const [age, setAge] = useState<string>('')
    const [gender, setGender] = useState<'male' | 'female'>('male')
    const [bmiResult, setBmiResult] = useState<BMIResult | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [workoutAdvice, setWorkoutAdvice] = useState<string>('')
    const [isLoadingWorkoutAdvice, setIsLoadingWorkoutAdvice] = useState<boolean>(false)

    const getHealthInfo = async (bmi: number, category: string, height: number, age?: number, gender?: string) => {
        setIsLoading(true)
        try {
            // Kiểm tra và điều chỉnh BMI nếu quá cao
            const adjustedBmi = Math.min(bmi, 100) // Giới hạn BMI tối đa là 100
            const adjustedCategory = adjustedBmi >= 100 ? 'Béo phì nghiêm trọng' : category

            const prompt = `Bạn là một chuyên gia dinh dưỡng và sức khỏe. Dựa trên chỉ số BMI ${adjustedBmi}, phân loại ${adjustedCategory}, chiều cao ${height}cm${age ? ` và tuổi ${age}` : ''}, giới tính ${gender === 'male' ? 'nam' : 'nữ'}, hãy đưa ra thông tin sức khỏe ngắn gọn và súc tích.

Yêu cầu trả về JSON với cấu trúc sau:
{
    "healthyWeightRange": {
        "min": số kg tối thiểu (chỉ trả về số),
        "max": số kg tối đa (chỉ trả về số)
    },
    "risks": [
        "một vài nguy cơ sức khỏe chính nếu có"
    ],
    "recommendations": [
        "một vài khuyến nghị quan trọng nhất nếu có"
    ],
    "aiAdvice": "Lời khuyên ngắn gọn về sức khỏe, sử dụng markdown để định dạng",
    "bodyAge": số tuổi cơ thể (chỉ trả về số),
    "predictedLifeExpectancy": số tuổi dự đoán có thể sống (chỉ trả về số),
    "healthScore": số điểm đánh giá sức khỏe từ 0-100 (chỉ trả về số)
}

Yêu cầu nội dung:
1. Cân nặng lý tưởng: chỉ trả về số kg, không kèm theo text
2. Nguy cơ sức khỏe ngắn gọn và quan trọng nhất
3. Khuyến nghị thực tế và khả thi
4. Lời khuyên AI ngắn gọn bao gồm:
   - Tình trạng sức khỏe
   - Chế độ ăn uống
   - Vận động
   - Lời khuyên quan trọng
5. Tuổi cơ thể dựa trên BMI và chiều cao${age ? ' (so sánh với tuổi thực tế)' : ''}
6. Dự đoán tuổi thọ dựa trên các chỉ số sức khỏe${age ? ' và tuổi thực tế' : ''}
7. Đánh giá điểm sức khỏe từ 0-100 dựa trên:
   - BMI (nếu BMI > 50, điểm sức khỏe phải < 30)
   - Cân nặng lý tưởng
   - Nguy cơ sức khỏe
   - Tuổi cơ thể${age ? ' và tuổi thực tế' : ''}
   - Tuổi thọ dự đoán (nếu BMI > 50, tuổi thọ dự đoán phải < 60)

Lưu ý quan trọng:
- Nếu BMI > 50: điểm sức khỏe phải < 30 và tuổi thọ dự đoán < 60 tuổi
- Nếu BMI > 70: điểm sức khỏe phải < 20 và tuổi thọ dự đoán < 50 tuổi
- Nếu BMI > 90: điểm sức khỏe phải < 10 và tuổi thọ dự đoán < 40 tuổi

Hãy viết ngắn gọn, dễ hiểu và sử dụng markdown để định dạng.`;

            const response = await aiService.processWithAI(prompt)
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/)
                if (!jsonMatch) {
                    throw new Error('Không tìm thấy JSON trong phản hồi')
                }
                const healthInfo = JSON.parse(jsonMatch[0])
                return healthInfo
            } catch (error) {
                console.error('Error parsing AI response:', error)
                throw new Error('Không thể phân tích phản hồi từ AI')
            }
        } catch (error) {
            console.error('Error getting health info:', error)
            throw new Error('Không thể tải thông tin sức khỏe')
        } finally {
            setIsLoading(false)
        }
    }

    const getWorkoutAdvice = async (bmi: number, category: string) => {
        setIsLoadingWorkoutAdvice(true);
        try {
            const prompt = `Tôi có chỉ số BMI ${bmi} và được phân loại là "${category}". 
Hãy đưa ra lời khuyên về việc tập luyện phù hợp với tình trạng sức khỏe của tôi. 
Bao gồm:
1. Các lợi ích của việc tập luyện với BMI của tôi
2. Loại bài tập nào phù hợp nhất
3. Tần suất tập luyện khuyến nghị
4. Những lưu ý đặc biệt khi tập luyện

Trả lời ngắn gọn, súc tích bằng định dạng markdown, khoảng 150-200 từ.`;

            const response = await aiService.processWithAI(prompt);
            setWorkoutAdvice(response);
        } catch (error) {
            console.error('Error getting workout advice:', error);
            setWorkoutAdvice('Không thể tải lời khuyên tập luyện. Vui lòng thử lại sau.');
        } finally {
            setIsLoadingWorkoutAdvice(false);
        }
    };

    const calculateBMI = async () => {
        if (!height || !weight) return

        const heightInMeters = Number(height) / 100
        const weightInKg = Number(weight)
        const ageInYears = age ? Number(age) : undefined
        
        if (!heightInMeters || !weightInKg) return null

        const bmi = weightInKg / (heightInMeters * heightInMeters)
        const category = bmiCategories.find(cat => 
            bmi >= cat.range[0] && bmi < cat.range[1]
        )?.category || 'Không xác định'

        // Hiển thị kết quả BMI cơ bản trước
        const basicResult = {
            bmi: Number(bmi.toFixed(1)),
            category,
            healthyWeightRange: {
                min: 0,
                max: 0
            },
            risks: ['Đang tải thông tin nguy cơ...'],
            recommendations: ['Đang tải khuyến nghị...'],
            aiAdvice: 'Đang tải lời khuyên từ AI...',
            bodyAge: 0,
            predictedLifeExpectancy: 0,
            healthScore: 0
        }
        setBmiResult(basicResult)

        // Get workout advice in parallel with health info
        getWorkoutAdvice(Number(bmi.toFixed(1)), category)

        // Sau đó tải thông tin chi tiết từ AI
        try {
            const healthInfo = await getHealthInfo(Number(bmi.toFixed(1)), category, Number(height), ageInYears, gender)
            setBmiResult({
                ...basicResult,
                ...healthInfo
            })
        } catch (error) {
            console.error('Error getting AI advice:', error)
            setBmiResult({
                ...basicResult,
                risks: ['Không thể tải thông tin nguy cơ'],
                recommendations: ['Không thể tải thông tin khuyến nghị'],
                aiAdvice: 'Xin lỗi, không thể tải lời khuyên từ AI. Vui lòng thử lại sau.'
            })
        }
    }

    const handleInputChange = (type: 'height' | 'weight' | 'age' | 'gender', value: string) => {
        if (type === 'height') {
            setHeight(value)
        } else if (type === 'weight') {
            setWeight(value)
        } else if (type === 'age') {
            setAge(value)
        } else if (type === 'gender') {
            setGender(value as 'male' | 'female')
        }
        setBmiResult(null)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            calculateBMI()
        }
    }

    const getHealthScoreColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-700'
        if (score >= 60) return 'bg-green-50 text-green-600'
        if (score >= 40) return 'bg-yellow-50 text-yellow-600'
        if (score >= 20) return 'bg-orange-50 text-orange-600'
        return 'bg-red-50 text-red-600'
    }

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="p-8 border-b border-gray-100">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">⚖️ BMI Calculator</h1>
                            <p className="text-gray-600">
                                Tính chỉ số BMI và nhận tư vấn sức khỏe từ AI.
                            </p>
                        </div>

                        {/* Input Form */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chiều cao (cm)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={height}
                                        onChange={(e) => handleInputChange('height', e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Nhập chiều cao"
                                        className="w-full p-3 pl-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                                    />
                                    <ScaleIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cân nặng (kg)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => handleInputChange('weight', e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Nhập cân nặng"
                                        className="w-full p-3 pl-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                                    />
                                    <ScaleIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tuổi (tùy chọn)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={age}
                                        onChange={(e) => handleInputChange('age', e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Nhập tuổi"
                                        className="w-full p-3 pl-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                                    />
                                    <BoltIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Giới tính
                                </label>
                                <div className="relative">
                                    <select
                                        value={gender}
                                        onChange={(e) => handleInputChange('gender', e.target.value)}
                                        className="w-full p-3 pl-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all appearance-none"
                                    >
                                        <option value="male">Nam</option>
                                        <option value="female">Nữ</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <ArrowsUpDownIcon className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center mt-6">
                            <button
                                onClick={calculateBMI}
                                disabled={!height || !weight || isLoading}
                                className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] disabled:hover:scale-100"
                            >
                                <CalculatorIcon className="w-5 h-5" />
                                Tính BMI
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    {bmiResult && (
                        <div className="p-8 space-y-8">
                            {/* BMI Score */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <BoltIcon className="w-6 h-6 text-gray-600" />
                                        <span className="text-lg font-medium text-gray-800">Kết quả BMI</span>
                                    </div>
                                    <div className={`${getHealthScoreColor(bmiResult.healthScore)} px-4 py-2 rounded-lg`}>
                                        <div className="text-xl font-bold">{bmiResult.healthScore}</div>
                                        <div className="text-xs">điểm sức khỏe</div>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <div className="text-4xl font-bold text-gray-800">{bmiResult.bmi}</div>
                                    <div className="text-lg font-medium text-gray-600">{bmiResult.category}</div>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                        <div className="text-sm text-gray-600">Tuổi cơ thể</div>
                                        <div className="text-lg font-medium text-gray-800">
                                            {bmiResult.bodyAge} tuổi
                                            {age && <span className="text-sm text-gray-500 ml-2">(Thực tế: {age})</span>}
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                                        <div className="text-sm text-gray-600">Tuổi thọ dự đoán</div>
                                        <div className="text-lg font-medium text-gray-800">{bmiResult.predictedLifeExpectancy} tuổi</div>
                                    </div>
                                </div>
                            </div>

                            {/* Health Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                                        <div className="flex items-center gap-3 mb-4">
                                            <HeartIcon className="w-5 h-5 text-gray-600" />
                                            <span className="text-lg font-medium text-gray-800">Cân nặng lý tưởng</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="text-sm text-gray-600">Tối thiểu</div>
                                                <div className="text-lg font-medium text-gray-800">{bmiResult.healthyWeightRange.min} kg</div>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="text-sm text-gray-600">Tối đa</div>
                                                <div className="text-lg font-medium text-gray-800">{bmiResult.healthyWeightRange.max} kg</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                                        <div className="flex items-center gap-3 mb-4">
                                            <InformationCircleIcon className="w-5 h-5 text-gray-600" />
                                            <span className="text-lg font-medium text-gray-800">Nguy cơ sức khỏe</span>
                                            {isLoading && (
                                                <div className="relative">
                                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <ul className="space-y-2">
                                            {bmiResult.risks.map((risk, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <span className="text-gray-600">•</span>
                                                    <span className="text-gray-800">{risk}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                                        <div className="flex items-center gap-3 mb-4">
                                            <InformationCircleIcon className="w-5 h-5 text-gray-600" />
                                            <span className="text-lg font-medium text-gray-800">Khuyến nghị</span>
                                            {isLoading && (
                                                <div className="relative">
                                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <ul className="space-y-2">
                                            {bmiResult.recommendations.map((rec, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <span className="text-gray-600">•</span>
                                                    <span className="text-gray-800">{rec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                                        <div className="flex items-center gap-3 mb-4">
                                            <CommandLineIcon className="w-5 h-5 text-gray-600" />
                                            <span className="text-lg font-medium text-gray-800">Tư vấn AI</span>
                                            {isLoading && (
                                                <div className="relative">
                                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="prose max-w-none">
                                            <ReactMarkdown>{bmiResult.aiAdvice}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Workout Advice */}
                            <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-600" />
                                    <span className="text-lg font-medium text-gray-800">Lời khuyên tập luyện</span>
                                    {isLoadingWorkoutAdvice && (
                                        <div className="relative">
                                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="prose max-w-none">
                                    {workoutAdvice ? (
                                        <ReactMarkdown>{workoutAdvice}</ReactMarkdown>
                                    ) : (
                                        <p className="text-gray-500 italic">Đang tải lời khuyên tập luyện...</p>
                                    )}
                                </div>
                            </div>

                            {/* Workout Scheduler Button */}
                            <div className="flex justify-center">
                                <Link
                                    href={`/workout-scheduler?bmi=${bmiResult.bmi}&category=${encodeURIComponent(bmiResult.category)}`}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-all transform hover:scale-[1.02]"
                                >
                                    <ClipboardDocumentCheckIcon className="w-5 h-5" />
                                    Lên lịch tập luyện phù hợp
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 