'use client'

import { useState } from 'react'
import { BeakerIcon, ClockIcon, UsersIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { aiService } from '@/lib/ai-service'
import ReactMarkdown from 'react-markdown'

interface Recipe {
    name: string
    description: string
    ingredients: string[]
    steps: string[]
    cookingTime: string
    servings: string
    difficulty: string
    tips: string[]
    nutritionInfo: {
        calories: string
        protein: string
        carbs: string
        fat: string
    }
    healthScore?: {
        score: number
        details: string[]
    }
}

export default function RecipeGenerator() {
    const [dishName, setDishName] = useState<string>('')
    const [recipe, setRecipe] = useState<Recipe | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [recipeHistory, setRecipeHistory] = useState<{recipe: Recipe, timestamp: string}[]>([])

    const calculateHealthScore = (nutritionInfo: Recipe['nutritionInfo'], servings: string): Recipe['healthScore'] => {
        // Chuyển đổi các giá trị dinh dưỡng thành số
        const calories = parseInt(nutritionInfo.calories.replace(/[^0-9]/g, ''))
        const protein = parseInt(nutritionInfo.protein.replace(/[^0-9]/g, ''))
        const carbs = parseInt(nutritionInfo.carbs.replace(/[^0-9]/g, ''))
        const fat = parseInt(nutritionInfo.fat.replace(/[^0-9]/g, ''))
        const servingsNum = parseInt(servings.replace(/[^0-9]/g, '')) || 1

        const details: string[] = []
        let score = 70 // Điểm cơ bản

        // Tính toán calories trên mỗi phần ăn
        const caloriesPerServing = calories / servingsNum
        if (caloriesPerServing <= 500) {
            score += 10
            details.push('✓ Lượng calories phù hợp cho một bữa ăn')
        } else if (caloriesPerServing > 800) {
            score -= 10
            details.push('⚠️ Lượng calories cao cho một bữa ăn')
        }

        // Đánh giá tỷ lệ protein
        const proteinCalories = protein * 4
        const proteinRatio = (proteinCalories / calories) * 100
        if (proteinRatio >= 20) {
            score += 10
            details.push('✓ Giàu protein, tốt cho cơ bắp')
        } else if (proteinRatio < 10) {
            score -= 5
            details.push('⚠️ Lượng protein thấp')
        }

        // Đánh giá tỷ lệ carbs
        const carbsCalories = carbs * 4
        const carbsRatio = (carbsCalories / calories) * 100
        if (carbsRatio >= 45 && carbsRatio <= 65) {
            score += 5
            details.push('✓ Tỷ lệ carbs cân đối')
        } else if (carbsRatio > 65) {
            score -= 5
            details.push('⚠️ Lượng carbs cao')
        }

        // Đánh giá tỷ lệ chất béo
        const fatCalories = fat * 9
        const fatRatio = (fatCalories / calories) * 100
        if (fatRatio <= 30) {
            score += 5
            details.push('✓ Lượng chất béo hợp lý')
        } else if (fatRatio > 35) {
            score -= 10
            details.push('⚠️ Lượng chất béo cao')
        }

        // Giới hạn điểm từ 0-100
        score = Math.max(0, Math.min(100, score))

        return {
            score,
            details
        }
    }

    const generateRecipe = async () => {
        if (!dishName.trim()) {
            setError('Vui lòng nhập tên món ăn')
            return
        }

        setIsLoading(true)
        setError('')
        setRecipe(null)

        try {
            const prompt = `Bạn là một đầu bếp chuyên nghiệp. Hãy tạo công thức nấu món "${dishName}" với các thông tin sau:

Yêu cầu trả về JSON với cấu trúc sau:
{
    "name": "Tên món ăn",
    "description": "Mô tả ngắn gọn về món ăn",
    "ingredients": [
        "Danh sách nguyên liệu với số lượng cụ thể"
    ],
    "steps": [
        "Các bước nấu chi tiết. Sử dụng Markdown để định dạng. Ví dụ: **Bước 1: Sơ chế**: Rửa sạch các nguyên liệu..."
    ],
    "cookingTime": "Thời gian nấu (ví dụ: 30 phút)",
    "servings": "Số người ăn",
    "difficulty": "Độ khó (Dễ/Trung bình/Khó)",
    "tips": [
        "Các mẹo nấu ăn hữu ích. Có thể sử dụng **in đậm** hoặc *in nghiêng* để nhấn mạnh"
    ],
    "nutritionInfo": {
        "calories": "Số calo cho một phần ăn",
        "protein": "Lượng protein",
        "carbs": "Lượng carbs",
        "fat": "Lượng chất béo"
    }
}

Yêu cầu:
1. Công thức phải chi tiết và dễ làm theo
2. Liệt kê đầy đủ nguyên liệu với số lượng cụ thể
3. Các bước nấu phải rõ ràng và dễ hiểu
4. Thêm các mẹo nấu ăn hữu ích
5. Thông tin dinh dưỡng phải chính xác
6. Sử dụng ngôn ngữ tiếng Việt
7. Đảm bảo công thức khả thi và thực tế
8. Sử dụng Markdown để định dạng:
   - **in đậm** cho tiêu đề các bước
   - *in nghiêng* cho các lưu ý quan trọng
   - Có thể dùng > để tạo blockquote cho mẹo đặc biệt`

            const response = await aiService.processWithAI(prompt)
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/)
                if (!jsonMatch) {
                    throw new Error('Không tìm thấy công thức trong phản hồi')
                }
                const recipeData = JSON.parse(jsonMatch[0])
                
                // Tính điểm healthy
                const healthScore = calculateHealthScore(recipeData.nutritionInfo, recipeData.servings)
                const newRecipe = { ...recipeData, healthScore }
                setRecipe(newRecipe)

                // Add to history
                const timestamp = new Date().toLocaleTimeString()
                setRecipeHistory(prev => {
                    const updatedHistory = [{recipe: newRecipe, timestamp}, ...prev]
                    return updatedHistory.slice(0, 24)
                })
            } catch (error) {
                console.error('Error parsing AI response:', error)
                throw new Error('Không thể phân tích công thức từ AI')
            }
        } catch (error) {
            console.error('Error generating recipe:', error)
            setError('Không thể tạo công thức. Vui lòng thử lại sau.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            generateRecipe()
        }
    }

    const getHealthScoreColor = (score: number) => {
        if (score >= 80) return 'bg-green-100 text-green-700'
        if (score >= 60) return 'bg-green-50 text-green-600'
        if (score >= 40) return 'bg-yellow-50 text-yellow-600'
        if (score >= 20) return 'bg-orange-50 text-orange-600'
        return 'bg-red-50 text-red-600'
    }

    const resetHistory = () => {
        setRecipeHistory([])
        setRecipe(null)
    }

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        <div className="space-y-8">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">🍳 Random Recipe</h1>
                                <p className="text-gray-600">
                                    Tạo công thức nấu ăn ngẫu nhiên với hướng dẫn chi tiết.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-800 mb-2">Tên món ăn</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={dishName}
                                            onChange={(e) => setDishName(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Nhập tên món ăn bạn muốn nấu"
                                            className="flex-1 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                                        />
                                        <button
                                            onClick={generateRecipe}
                                            disabled={!dishName.trim() || isLoading}
                                            className="flex items-center justify-center gap-3 py-2 px-6 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                                        >
                                            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                                            <span className="font-medium">{isLoading ? 'Đang tạo...' : 'Tạo công thức'}</span>
                                        </button>
                                    </div>
                                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                                </div>

                                {(recipe !== null || isLoading) && (
                                    <div className="mt-8">
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200">
                                            {isLoading ? (
                                                <div className="text-center text-gray-600">Đang tạo công thức...</div>
                                            ) : recipe && (
                                                <div className="space-y-6">
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{recipe.name}</h2>
                                                        <p className="text-gray-600">{recipe.description}</p>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="flex items-center gap-2 bg-white p-3 rounded-lg border-2 border-gray-200">
                                                            <ClockIcon className="w-5 h-5 text-gray-600" />
                                                            <div>
                                                                <p className="text-sm text-gray-600">Thời gian nấu</p>
                                                                <p className="font-medium text-gray-800">{recipe.cookingTime}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-white p-3 rounded-lg border-2 border-gray-200">
                                                            <UsersIcon className="w-5 h-5 text-gray-600" />
                                                            <div>
                                                                <p className="text-sm text-gray-600">Khẩu phần</p>
                                                                <p className="font-medium text-gray-800">{recipe.servings}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-white p-3 rounded-lg border-2 border-gray-200">
                                                            <BeakerIcon className="w-5 h-5 text-gray-600" />
                                                            <div>
                                                                <p className="text-sm text-gray-600">Độ khó</p>
                                                                <p className="font-medium text-gray-800">{recipe.difficulty}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-gray-800 mb-3">Nguyên liệu</h3>
                                                            <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                                                                <ul className="space-y-2">
                                                                    {recipe.ingredients.map((ingredient, index) => (
                                                                        <li key={index} className="flex items-start gap-2">
                                                                            <span className="text-gray-600">•</span>
                                                                            <span className="text-gray-800">{ingredient}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h3 className="text-lg font-bold text-gray-800 mb-3">Thông tin dinh dưỡng</h3>
                                                            <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-sm text-gray-600">Calories</p>
                                                                        <p className="font-medium text-gray-800">{recipe.nutritionInfo.calories}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm text-gray-600">Protein</p>
                                                                        <p className="font-medium text-gray-800">{recipe.nutritionInfo.protein}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm text-gray-600">Carbs</p>
                                                                        <p className="font-medium text-gray-800">{recipe.nutritionInfo.carbs}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm text-gray-600">Chất béo</p>
                                                                        <p className="font-medium text-gray-800">{recipe.nutritionInfo.fat}</p>
                                                                    </div>
                                                                </div>

                                                                {recipe.healthScore && (
                                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <h4 className="font-medium text-gray-800">Đánh giá dinh dưỡng</h4>
                                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthScoreColor(recipe.healthScore.score)}`}>
                                                                                {recipe.healthScore.score}/100
                                                                            </span>
                                                                        </div>
                                                                        <ul className="space-y-1">
                                                                            {recipe.healthScore.details.map((detail, index) => (
                                                                                <li key={index} className="text-sm text-gray-600">{detail}</li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800 mb-3">Các bước thực hiện</h3>
                                                        <div className="bg-white rounded-lg border-2 border-gray-200 p-4 space-y-4">
                                                            {recipe.steps.map((step, index) => (
                                                                <div key={index} className="prose max-w-none">
                                                                    <ReactMarkdown>{step}</ReactMarkdown>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-800 mb-3">Mẹo nấu ăn</h3>
                                                        <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                                                            <ul className="space-y-2">
                                                                {recipe.tips.map((tip, index) => (
                                                                    <li key={index} className="flex items-start gap-2">
                                                                        <span className="text-gray-600">•</span>
                                                                        <div className="prose max-w-none">
                                                                            <ReactMarkdown>{tip}</ReactMarkdown>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {recipeHistory.length > 0 && (
                                    <div className="mt-8">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-sm font-medium text-gray-800">📜 Lịch sử công thức</p>
                                            <button 
                                                onClick={resetHistory}
                                                className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
                                            >
                                                Xóa lịch sử
                                            </button>
                                        </div>
                                        
                                        <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
                                            <div className="space-y-3">
                                                {recipeHistory.map((item, index) => (
                                                    <div 
                                                        key={index} 
                                                        className="relative group"
                                                        title={`Tạo lúc ${item.timestamp}`}
                                                    >
                                                        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
                                                            <div>
                                                                <span className="font-medium text-gray-800">{item.recipe.name}</span>
                                                                <span className="text-sm text-gray-600 ml-2">({item.recipe.difficulty})</span>
                                                            </div>
                                                            <span className="text-xs text-gray-500">{item.timestamp}</span>
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
        </div>
    )
} 