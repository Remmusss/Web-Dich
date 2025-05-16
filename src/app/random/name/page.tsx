'use client'

import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { aiService } from '@/lib/ai-service'

interface NameResult {
    name: string
    country: string
    meaning: string
    gender: string
}

export default function RandomNamePage() {
    const [nameResult, setNameResult] = useState<NameResult | null>(null)
    const [isGenerating, setIsGenerating] = useState<boolean>(false)
    const [nameHistory, setNameHistory] = useState<NameResult[]>([])
    const [nameLength, setNameLength] = useState<'1' | '2' | '3'>('2')
    const [gender, setGender] = useState<'male' | 'female' | 'any'>('any')
    const [selectedCountry, setSelectedCountry] = useState<string>('all')
    const [error, setError] = useState<string | null>(null)
    const [lastName, setLastName] = useState<string>('')
    const [nameType, setNameType] = useState<'human' | 'dog' | 'cat'>('human')
    const [generatedNames, setGeneratedNames] = useState<string[]>([])

    const countries = [
        { value: 'all', label: '🌍 Tất cả quốc gia' },
        { value: 'vietnam', label: '🇻🇳 Việt Nam' },
        { value: 'japan', label: '🇯🇵 Nhật Bản' },
        { value: 'korea', label: '🇰🇷 Hàn Quốc' },
        { value: 'china', label: '🇨🇳 Trung Quốc' },
        { value: 'usa', label: '🇺🇸 Mỹ' },
        { value: 'france', label: '🇫🇷 Pháp' },
        { value: 'germany', label: '🇩🇪 Đức' },
        { value: 'russia', label: '🇷🇺 Nga' },
        { value: 'india', label: '🇮🇳 Ấn Độ' },
    ]

    // Generate a random name using AI
    const generateName = async () => {
        setIsGenerating(true)
        setError(null)

        try {
            const countryFilter = selectedCountry !== 'all' ? ` của ${countries.find(c => c.value === selectedCountry)?.label}` : ''
            const genderFilter = gender !== 'any' ? ` cho ${gender === 'male' ? 'nam' : 'nữ'}` : ''
            const lastNameFilter = lastName ? ` với họ "${lastName}"` : ''

            let nameTypeText = ''
            switch (nameType) {
                case 'human':
                    nameTypeText = 'người'
                    break
                case 'dog':
                    nameTypeText = 'chó'
                    break
                case 'cat':
                    nameTypeText = 'mèo'
                    break
            }

            const prompt = `Bạn là một chuyên gia đặt tên. Hãy tạo một tên có độ dài ${nameLength} chữ dành cho ${genderFilter} tên thuộc quốc gia ${countryFilter}${lastNameFilter} cho con ${nameTypeText}.

Use this JSON schema:
{
  "name": "tên đầy đủ (bao gồm cả họ nếu được cung cấp)",
  "country": "quốc gia",
  "meaning": "ý nghĩa của tên",
  "gender": "giới tính"
}

2. Các yêu cầu khác:
- Tên phải có đúng ${nameLength} chữ (không tính họ)
- Tên phải phù hợp với văn hóa của quốc gia được chọn
- Ý nghĩa tên phải tích cực và phù hợp
- Nếu có họ, hãy kết hợp họ với tên một cách tự nhiên
- Tên phải phù hợp với loại đối tượng là con (${nameTypeText})
- KHÔNG thêm bất kỳ text nào khác ngoài JSON
- KHÔNG thêm comments hay giải thích
- KHÔNG thêm dấu backtick hay markdown
- KHÔNG chọn các tên đã có trong danh sách sau: ${generatedNames.join(', ')}`

            const result = await aiService.processWithAI(prompt)

            try {
                // Clean the response to ensure it's valid JSON
                const cleanResult = result.replace(/```json\n?|\n?```/g, '').trim()
                const nameData = JSON.parse(cleanResult) as NameResult

                // Validate required fields
                if (!nameData.name || !nameData.country || !nameData.meaning || !nameData.gender) {
                    throw new Error('Thiếu thông tin bắt buộc')
                }

                setNameResult(nameData)

                // Add to history (max 10 entries)
                setNameHistory(prev => {
                    const updatedHistory = [nameData, ...prev]
                    return updatedHistory.slice(0, 10)
                })

                // Add to generated names list
                setGeneratedNames(prev => [...prev, nameData.name])

            } catch (parseError) {
                console.error('JSON parse error:', parseError)
                setError('Không thể xử lý kết quả từ AI. Vui lòng thử lại.')
            }
        } catch (error) {
            console.error('Error generating name:', error)
            setError('Có lỗi xảy ra khi tạo tên. Vui lòng thử lại.')
        } finally {
            setIsGenerating(false)
        }
    }

    // Reset history
    const resetHistory = () => {
        setNameHistory([])
        setNameResult(null)
        setError(null)
        setLastName('')
        setGeneratedNames([])
    }

    return (
        <div className="min-h-screen  to-indigo-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
                    <div className="p-8">
                        <div className="space-y-8">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-blue-800 mb-2">👤 Name Generator</h1>
                                <p className="text-gray-600">
                                    Tạo tên ngẫu nhiên cho người, thú cưng hoặc mục đích sáng tạo khác.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-blue-800 mb-2">Loại tên</label>
                                        <select
                                            value={nameType}
                                            onChange={(e) => setNameType(e.target.value as 'human' | 'dog' | 'cat')}
                                            className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                                        >
                                            <option value="human">👤 Người</option>
                                            <option value="dog">🐕 Chó</option>
                                            <option value="cat">🐱 Mèo</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-blue-800 mb-2">Họ (tùy chọn)</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Nhập họ của bạn"
                                            className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-blue-800 mb-2">Số chữ</label>
                                        <select
                                            value={nameLength}
                                            onChange={(e) => setNameLength(e.target.value as '1' | '2' | '3')}
                                            className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                                        >
                                            <option value="1">1 chữ</option>
                                            <option value="2">2 chữ</option>
                                            <option value="3">3 chữ</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-blue-800 mb-2">Giới tính</label>
                                        <select
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'any')}
                                            className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                                        >
                                            <option value="any">Bất kỳ</option>
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-blue-800 mb-2">Quốc gia</label>
                                        <select
                                            value={selectedCountry}
                                            onChange={(e) => setSelectedCountry(e.target.value)}
                                            className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                                        >
                                            {countries.map(country => (
                                                <option key={country.value} value={country.value}>
                                                    {country.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={generateName}
                                    disabled={isGenerating}
                                    className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                                >
                                    <ArrowPathIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                                    <span className="font-medium">{isGenerating ? 'Đang tạo tên...' : 'Tạo tên ngẫu nhiên'}</span>
                                </button>
                            </div>

                            {error && (
                                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            {(nameResult !== null || isGenerating) && (
                                <div className="mt-8">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-200 text-center transform transition-all hover:scale-[1.02]">
                                        <p className="text-sm text-blue-600 mb-3">Tên được chọn</p>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-3xl font-bold text-blue-800">
                                                    {isGenerating ? '...' : nameResult?.name}
                                                </p>
                                                <p className="text-sm text-blue-600">
                                                    {isGenerating ? '' : nameResult?.country}
                                                </p>
                                            </div>

                                            {!isGenerating && nameResult && (
                                                <div className="text-left space-y-3">
                                                    <div>
                                                        <p className="text-sm font-medium text-blue-800">Quốc gia</p>
                                                        <p className="text-gray-600">{nameResult.country}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-blue-800">Giới tính</p>
                                                        <p className="text-gray-600">{nameResult.gender}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-blue-800">Ý nghĩa</p>
                                                        <p className="text-gray-600">{nameResult.meaning}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {nameHistory.length > 0 && (
                                <div className="mt-8">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-medium text-blue-800">📜 Lịch sử tên đã tạo</p>
                                        <button
                                            onClick={resetHistory}
                                            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            Xóa lịch sử
                                        </button>
                                    </div>

                                    <div className="bg-blue-50 rounded-xl border-2 border-blue-200 overflow-hidden">
                                        <div className="divide-y divide-blue-200">
                                            {nameHistory.map((item, index) => (
                                                <div key={index} className="p-4 text-sm hover:bg-blue-100 transition-colors">
                                                    <p className="font-medium text-blue-800">{item.name}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-blue-600">{item.country}</span>
                                                        <span className="text-xs text-blue-500">{item.gender}</span>
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