'use client'

import { useState, useEffect } from 'react'
import { aiService } from '@/lib/ai-service'
import { ArrowPathIcon, SparklesIcon, MoonIcon, SunIcon, HeartIcon, StarIcon, BoltIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'

interface FortuneCategory {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  prompt: string
  allowCustomQuestion: boolean
}

const FORTUNE_CATEGORIES: FortuneCategory[] = [
  {
    id: 'love',
    name: 'Tình yêu',
    description: 'Xem bói về tình yêu, hôn nhân và các mối quan hệ',
    icon: <HeartIcon className="h-6 w-6 text-pink-500" />,
    allowCustomQuestion: false,
    prompt: `Bạn là một nhà chiêm tinh học chuyên nghiệp. Hãy xem bói về tình yêu cho người dùng dựa trên thông tin sau:
    - Tên: {name}
    - Tuổi: {age}
    - Giới tính: {gender}
    {birthInfo}
    {jobInfo}
    {healthInfo}
    
    Hãy đưa ra dự đoán chi tiết về tình yêu, hôn nhân và các mối quan hệ trong tương lai gần (3-6 tháng tới). 
    Bao gồm: tình trạng hiện tại, những thay đổi sắp tới, lời khuyên để cải thiện tình hình.
    Sử dụng ngôn ngữ thân thiện, dễ hiểu và thêm một số yếu tố tâm linh như sao, vận may, thời điểm tốt/xấu.
    Định dạng kết quả bằng markdown để dễ đọc.`
  },
  {
    id: 'career',
    name: 'Sự nghiệp',
    description: 'Xem bói về công việc, sự nghiệp và tài chính',
    icon: <StarIcon className="h-6 w-6 text-yellow-500" />,
    allowCustomQuestion: false,
    prompt: `Bạn là một nhà chiêm tinh học chuyên nghiệp. Hãy xem bói về sự nghiệp cho người dùng dựa trên thông tin sau:
    - Tên: {name}
    - Tuổi: {age}
    - Giới tính: {gender}
    {birthInfo}
    {jobInfo}
    {healthInfo}
    
    Hãy đưa ra dự đoán chi tiết về sự nghiệp và tài chính trong tương lai gần (3-6 tháng tới).
    Bao gồm: cơ hội thăng tiến, thay đổi công việc, đầu tư, và các vấn đề tài chính.
    Sử dụng ngôn ngữ thân thiện, dễ hiểu và thêm một số yếu tố tâm linh như sao, vận may, thời điểm tốt/xấu.
    Định dạng kết quả bằng markdown để dễ đọc.`
  },
  {
    id: 'health',
    name: 'Sức khỏe',
    description: 'Xem bói về sức khỏe và tinh thần',
    icon: <BoltIcon className="h-6 w-6 text-green-500" />,
    allowCustomQuestion: false,
    prompt: `Bạn là một nhà chiêm tinh học chuyên nghiệp. Hãy xem bói về sức khỏe cho người dùng dựa trên thông tin sau:
    - Tên: {name}
    - Tuổi: {age}
    - Giới tính: {gender}
    {birthInfo}
    {jobInfo}
    {healthInfo}
    
    Hãy đưa ra dự đoán chi tiết về sức khỏe thể chất và tinh thần trong tương lai gần (3-6 tháng tới).
    Bao gồm: các vấn đề sức khỏe có thể gặp phải, cách phòng tránh, và lời khuyên để cải thiện sức khỏe.
    Sử dụng ngôn ngữ thân thiện, dễ hiểu và thêm một số yếu tố tâm linh như sao, vận may, thời điểm tốt/xấu.
    Định dạng kết quả bằng markdown để dễ đọc.`
  },
  {
    id: 'general',
    name: 'Tổng quát',
    description: 'Xem bói tổng quát về cuộc sống và tương lai',
    icon: <SparklesIcon className="h-6 w-6 text-purple-500" />,
    allowCustomQuestion: false,
    prompt: `Bạn là một nhà chiêm tinh học chuyên nghiệp. Hãy xem bói tổng quát cho người dùng dựa trên thông tin sau:
    - Tên: {name}
    - Tuổi: {age}
    - Giới tính: {gender}
    {birthInfo}
    {jobInfo}
    {healthInfo}
    
    Hãy đưa ra dự đoán chi tiết về cuộc sống và tương lai trong thời gian tới (3-6 tháng).
    Bao gồm: các sự kiện quan trọng, cơ hội, thách thức, và lời khuyên để vượt qua khó khăn.
    Sử dụng ngôn ngữ thân thiện, dễ hiểu và thêm một số yếu tố tâm linh như sao, vận may, thời điểm tốt/xấu.
    Định dạng kết quả bằng markdown để dễ đọc.`
  },
  {
    id: 'custom',
    name: 'Câu hỏi riêng',
    description: 'Đặt câu hỏi riêng để xem bói',
    icon: <QuestionMarkCircleIcon className="h-6 w-6 text-blue-500" />,
    allowCustomQuestion: true,
    prompt: `Bạn là một nhà chiêm tinh học chuyên nghiệp. Hãy xem bói cho người dùng dựa trên thông tin sau:
    - Tên: {name}
    - Tuổi: {age}
    - Giới tính: {gender}
    {birthInfo}
    {jobInfo}
    {healthInfo}
    - Câu hỏi cụ thể: {question}
    
    Hãy đưa ra dự đoán chi tiết dựa trên câu hỏi của người dùng.
    Sử dụng ngôn ngữ thân thiện, dễ hiểu và thêm một số yếu tố tâm linh như sao, vận may, thời điểm tốt/xấu.
    Định dạng kết quả bằng markdown để dễ đọc.`
  }
]

export function FortuneTelling() {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [currentJob, setCurrentJob] = useState('')
  const [healthStatus, setHealthStatus] = useState('')
  const [question, setQuestion] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('general')
  const [fortune, setFortune] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Kiểm tra chế độ tối từ localStorage
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode) {
      setDarkMode(savedDarkMode === 'true')
    } else {
      // Kiểm tra chế độ tối của hệ thống
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(prefersDark)
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !age || !gender) {
      setError('Vui lòng điền đầy đủ thông tin cơ bản')
      return
    }

    const category = FORTUNE_CATEGORIES.find(cat => cat.id === selectedCategory)
    if (!category) {
      setError('Danh mục không hợp lệ')
      return
    }

    if (category.allowCustomQuestion && !question) {
      setError('Vui lòng nhập câu hỏi của bạn')
      return
    }

    setLoading(true)
    setError(null)
    setFortune('')

    try {
      // Tạo chuỗi thông tin bổ sung
      const birthInfo = birthDate || birthTime || birthPlace
        ? `- Ngày sinh: ${birthDate || 'Không có'}\n    - Giờ sinh: ${birthTime || 'Không có'}\n    - Nơi sinh: ${birthPlace || 'Không có'}`
        : ''

      const jobInfo = currentJob ? `- Nghề nghiệp hiện tại: ${currentJob}` : ''
      const healthInfo = healthStatus ? `- Tình trạng sức khỏe: ${healthStatus}` : ''

      let prompt = category.prompt
        .replace('{name}', name)
        .replace('{age}', age)
        .replace('{gender}', gender)
        .replace('{birthInfo}', birthInfo)
        .replace('{jobInfo}', jobInfo)
        .replace('{healthInfo}', healthInfo)
        .replace('{question}', question)

      const result = await aiService.processWithAI(prompt)
      setFortune(result)
    } catch (err) {
      console.error('Lỗi khi xem bói:', err)
      setError('Đã xảy ra lỗi khi xem bói. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setAge('')
    setGender('')
    setBirthDate('')
    setBirthTime('')
    setBirthPlace('')
    setCurrentJob('')
    setHealthStatus('')
    setQuestion('')
    setSelectedCategory('general')
    setFortune('')
    setError(null)
  }

  const selectedCategoryData = FORTUNE_CATEGORIES.find(cat => cat.id === selectedCategory)

  return (
    <div className={`mx-auto px-2 py-8 mt-4 max-w-7xl`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SparklesIcon className="h-6 w-6 text-purple-500" />
          Xem Bói Tích Hợp AI
        </h1>
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-gray-700'}`}
          aria-label="Chuyển đổi chế độ tối/sáng"
        >
          {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>
      </div>

      <div className={`rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Nhập họ và tên của bạn"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tuổi
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Nhập tuổi của bạn"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Giới tính
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="Nam"
                    checked={gender === 'Nam'}
                    onChange={(e) => setGender(e.target.value)}
                    className="mr-2"
                  />
                  <span>Nam</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="Nữ"
                    checked={gender === 'Nữ'}
                    onChange={(e) => setGender(e.target.value)}
                    className="mr-2"
                  />
                  <span>Nữ</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Ngày sinh (tùy chọn)
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Giờ sinh (tùy chọn)
                </label>
                <input
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nơi sinh (tùy chọn)
                </label>
                <input
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Nhập nơi sinh"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Nghề nghiệp hiện tại (tùy chọn)
                </label>
                <input
                  type="text"
                  value={currentJob}
                  onChange={(e) => setCurrentJob(e.target.value)}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Nhập nghề nghiệp hiện tại của bạn"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tình trạng sức khỏe (tùy chọn)
                </label>
                <input
                  type="text"
                  value={healthStatus}
                  onChange={(e) => setHealthStatus(e.target.value)}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Mô tả tình trạng sức khỏe hiện tại"
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Danh mục xem bói
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {FORTUNE_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border ${
                      selectedCategory === category.id
                        ? darkMode
                          ? 'bg-purple-900 border-purple-500 text-white'
                          : 'bg-purple-100 border-purple-500 text-purple-700'
                        : darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-gray-50 border-gray-300 text-gray-700'
                    }`}
                  >
                    {category.icon}
                    <span className="text-xs mt-1">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedCategoryData?.allowCustomQuestion && (
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Câu hỏi của bạn
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="Nhập câu hỏi cụ thể của bạn (ví dụ: Tôi có nên chuyển công việc không?)"
                  rows={3}
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : darkMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                    Đang xem bói...
                  </span>
                ) : (
                  'Xem bói'
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className={`py-2 px-4 rounded-lg font-medium ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>

        {fortune && (
          <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-purple-500" />
                Kết quả xem bói
              </h2>
              <div className={`prose max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                <ReactMarkdown>{fortune}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 