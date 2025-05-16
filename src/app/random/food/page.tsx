'use client'

import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { aiService } from '@/lib/ai-service'

interface FoodResult {
  name: string
  country: string
  foodType: string
  origin: string
  price: string
  description: string
  ingredients?: string[]
  cookingTime?: string
  difficulty?: string
}

// List of previously generated food names to avoid duplicates
const previouslyGeneratedFoods = [

]

export default function RandomFoodPage() {
  const [foodResult, setFoodResult] = useState<FoodResult | null>(null)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [foodHistory, setFoodHistory] = useState<FoodResult[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedFoodType, setSelectedFoodType] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  const [generatedFoodNames, setGeneratedFoodNames] = useState<string[]>([])

  const countries = [
    { value: 'all', label: '🌍 Tất cả quốc gia' },
    { value: 'vietnam', label: '🇻🇳 Việt Nam' },
    { value: 'japan', label: '🇯🇵 Nhật Bản' },
    { value: 'korea', label: '🇰🇷 Hàn Quốc' },
    { value: 'china', label: '🇨🇳 Trung Quốc' },
    { value: 'thailand', label: '🇹🇭 Thái Lan' },
    { value: 'italy', label: '🇮🇹 Ý' },
    { value: 'france', label: '🇫🇷 Pháp' },
    { value: 'usa', label: '🇺🇸 Mỹ' },
    { value: 'mexico', label: '🇲🇽 Mexico' },
  ]

  const foodTypes = [
    { value: 'all', label: '🍽️ Tất cả loại' },
    { value: 'main', label: '🍚 Món chính' },
    { value: 'appetizer', label: '🥗 Khai vị' },
    { value: 'dessert', label: '🍰 Tráng miệng' },
    { value: 'drink', label: '🥤 Nước uống' },
    { value: 'snack', label: '🍿 Ăn vặt' },
  ]

  // Generate a random food using AI
  const generateFood = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const countryFilter = `${countries.find(c => c.value === selectedCountry)?.label}`
      const foodTypeFilter = `${foodTypes.find(t => t.value === selectedFoodType)?.label}`

      const prompt = `Bạn là một chuyên gia ẩm thực. Hãy gợi ý cho tôi một món ${foodTypeFilter} ngẫu nhiên của ${countryFilter} . 

Yêu cầu bắt buộc:
1. PHẢI trả về đúng định dạng JSON như sau:
{
  "name": "tên món ăn",
  "country": "quốc gia",
  "foodType": "loại món ăn",
  "origin": "nơi sản sinh ra món ăn",
  "price": "khoảng giá tiền",
  "description": "mô tả ngắn gọn về món ăn"
}

2. Các yêu cầu khác:
- Tên món phải bằng tiếng Việt
- Giá tiền phải ở định dạng "từ X đến Y VND"
- Mô tả ngắn gọn, dễ hiểu
- KHÔNG thêm bất kỳ text nào khác ngoài JSON
- KHÔNG thêm comments hay giải thích
- KHÔNG thêm dấu backtick hay markdown
- KHÔNG chọn các món đã có trong danh sách sau: ${generatedFoodNames.join(', ')}`

      const result = await aiService.processWithAI(prompt)
      console.log(prompt)
      try {
        // Clean the response to ensure it's valid JSON
        const cleanResult = result.replace(/```json\n?|\n?```/g, '').trim()
        const foodData = JSON.parse(cleanResult) as FoodResult

        // Validate required fields
        if (!foodData.name || !foodData.country || !foodData.foodType || !foodData.origin || !foodData.price || !foodData.description) {
          throw new Error('Thiếu thông tin bắt buộc')
        }

        setFoodResult(foodData)

        // Add to history (max 10 entries)
        setFoodHistory(prev => {
          const updatedHistory = [foodData, ...prev]
          return updatedHistory.slice(0, 10)
        })

        // Add to generated food names
        setGeneratedFoodNames(prev => [...prev, foodData.name])

      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        setError('Không thể xử lý kết quả từ AI. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('Error generating food:', error)
      setError('Có lỗi xảy ra khi tạo món ăn. Vui lòng thử lại.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Reset history
  const resetHistory = () => {
    setFoodHistory([])
    setFoodResult(null)
    setError(null)
    setGeneratedFoodNames([])
  }

  return (
    <div className="min-h-screen to-amber-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
          <div className="p-8">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-orange-800 mb-2">🍽️ Food Picker</h1>
                <p className="text-gray-600">
                  Không biết ăn gì? Để chúng tôi giúp bạn quyết định!
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-2">Chọn quốc gia</label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full rounded-xl border-2 border-orange-200 px-4 py-3 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all"
                    >
                      {countries.map(country => (
                        <option key={country.value} value={country.value}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-orange-800 mb-2">Chọn loại món</label>
                    <select
                      value={selectedFoodType}
                      onChange={(e) => setSelectedFoodType(e.target.value)}
                      className="w-full rounded-xl border-2 border-orange-200 px-4 py-3 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all"
                    >
                      {foodTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={generateFood}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span className="font-medium">{isGenerating ? 'Đang tìm món ngon...' : 'Tìm món ăn ngẫu nhiên'}</span>
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {(foodResult !== null || isGenerating) && (
                <div className="mt-8">
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-8 rounded-xl border-2 border-orange-200 text-center transform transition-all hover:scale-[1.02]">
                    <p className="text-sm text-orange-600 mb-3">Món ăn được chọn</p>
                    <div className="space-y-4">
                      <div>
                        <p className="text-3xl font-bold text-orange-800">
                          {isGenerating ? '...' : foodResult?.name}
                        </p>
                        <p className="text-sm text-orange-600">
                          {isGenerating ? '' : foodResult?.country}
                        </p>
                      </div>

                      {!isGenerating && foodResult && (
                        <div className="text-left space-y-3">
                          <div>
                            <p className="text-sm font-medium text-orange-800">Quốc gia</p>
                            <p className="text-gray-600">{foodResult.country}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-orange-800">Loại món</p>
                            <p className="text-gray-600">{foodResult.foodType}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-orange-800">Nguồn gốc</p>
                            <p className="text-gray-600">{foodResult.origin}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-orange-800">Giá</p>
                            <p className="text-gray-600">{foodResult.price}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-orange-800">Mô tả</p>
                            <p className="text-gray-600">{foodResult.description}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {foodHistory.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-orange-800">📜 Lịch sử món đã chọn</p>
                    <button
                      onClick={resetHistory}
                      className="text-xs text-orange-600 hover:text-orange-800 transition-colors"
                    >
                      Xóa lịch sử
                    </button>
                  </div>

                  <div className="bg-orange-50 rounded-xl border-2 border-orange-200 overflow-hidden">
                    <div className="divide-y divide-orange-200">
                      {foodHistory.map((item, index) => (
                        <div key={index} className="p-4 text-sm hover:bg-orange-100 transition-colors">
                          <p className="font-medium text-orange-800">{item.name}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-orange-600">{item.country}</span>
                            <span className="text-xs text-orange-500">{item.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 