'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ClockIcon, ChartBarIcon, ArrowPathIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Tab } from '@headlessui/react'
import { aiService } from '@/lib/ai-service'
// Định nghĩa loại dữ liệu cho kết quả kiểm tra gõ phím
interface TypingResult {
  id: string
  date: string
  wpm: number // Words Per Minute
  accuracy: number // Tỷ lệ chính xác (%)
  duration: number // Thời gian kiểm tra (giây)
  words: number // Số từ đã gõ
  errors: number // Số lỗi
  language: string // Ngôn ngữ đã sử dụng
}

// Danh sách ngôn ngữ có thể chọn
const languages = [
  { id: 'vi', name: 'Tiếng Việt' },
  { id: 'en', name: 'Tiếng Anh' }
]

// Tạo prompt tuỳ chỉnh cho từng ngôn ngữ
const getLanguagePrompt = (language: string, duration: number) => {
    let wordCount = 0;
    switch (duration) {
        case 30:
            wordCount = 50
            break;
        case 60:
            wordCount = 100
            break;
        case 120:
            wordCount = 200
            break;
    }
  switch (language) {
    case 'en':
      return `Create a paragraph for a typing speed test in English with a random topic. The text should be ${wordCount} words long, suitable for a ${duration}-second test. Only return the paragraph text, nothing else.`
    case 'vi':
    default:
      return `Tạo một văn bản ngắn gọn chỉ phần chữ và dễ hiểu bằng tiếng Việt với chủ đề ngẫu nhiên, phục vụ cho việc kiểm tra tốc độ gõ phím. Văn bản dài ${wordCount} từ, phù hợp cho bài kiểm tra kéo dài ${duration} giây. Chỉ trả về văn bản, không có gì khác. Văn bản không được tồn tại các dấu đặc biệt nhưu -, ", )`
  }
}

// Danh sách các văn bản mẫu để gõ
const sampleTexts = "Tạo một văn bản ngắn gọn và dễ hiểu, phục vụ cho việc kiểm tra tốc độ gõ phím, chỉ trả về văn bản, không có gì khác, văn bản phải ở dạng paragraph"

export default function TypingSpeed() {
  // Tab đang chọn
  const [selectedTab, setSelectedTab] = useState(0)

  // State cho phần kiểm tra
  const [isTestActive, setIsTestActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60) // Mặc định 60 giây
  const [testDuration, setTestDuration] = useState(60) // Thời gian kiểm tra
  const [currentText, setCurrentText] = useState('')
  const [typedText, setTypedText] = useState('')
  const [errors, setErrors] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [results, setResults] = useState<TypingResult[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  
  // State cho language selection
  const [selectedLanguage, setSelectedLanguage] = useState('vi')
  
  // State cho tracking theo từng từ
  const [words, setWords] = useState<string[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [wordStates, setWordStates] = useState<('correct' | 'incorrect' | 'waiting')[]>([])
  const [completedWords, setCompletedWords] = useState(0)

  // State cho biểu đồ và thống kê
  const [averageWpm, setAverageWpm] = useState(0)
  const [highestWpm, setHighestWpm] = useState(0)
  const [averageAccuracy, setAverageAccuracy] = useState(0)
  const [testCount, setTestCount] = useState(0)

  // Tải kết quả từ localStorage khi khởi động
  useEffect(() => {
    const savedResults = localStorage.getItem('typingResults')
    if (savedResults) {
      const parsedResults: TypingResult[] = JSON.parse(savedResults)
      setResults(parsedResults)
      
      // Tính toán các chỉ số thống kê
      if (parsedResults.length > 0) {
        const totalWpm = parsedResults.reduce((sum, result) => sum + result.wpm, 0)
        const avgWpm = Math.round(totalWpm / parsedResults.length)
        
        const totalAccuracy = parsedResults.reduce((sum, result) => sum + result.accuracy, 0)
        const avgAccuracy = Math.round(totalAccuracy / parsedResults.length * 10) / 10
        
        const maxWpm = Math.max(...parsedResults.map(result => result.wpm))
        
        setAverageWpm(avgWpm)
        setHighestWpm(maxWpm)
        setAverageAccuracy(avgAccuracy)
        setTestCount(parsedResults.length)
      }
    }
  }, [])

  // Chọn văn bản mẫu ngẫu nhiên khi bắt đầu kiểm tra
  const getRandomText = async () => {
    const prompt = getLanguagePrompt(selectedLanguage, testDuration)
    const text = await aiService.processWithAI(prompt)
    return text
  }

  // Chuẩn bị danh sách các từ từ văn bản
  const prepareWords = (text: string) => {
    // Tách văn bản thành danh sách các từ
    return text.split(/\s+/).filter(word => word.length > 0);
  }

  // Chuẩn hóa chuỗi để so sánh (loại bỏ dấu cách thừa, xuống dòng, etc.)
  const normalizeText = (text: string) => {
    return text.trim().toLowerCase();
  }

  // Bắt đầu kiểm tra gõ phím
  const startTest = async () => {
    setIsLoading(true)
    try {
      const text = await getRandomText()
      setCurrentText(text)
      
      // Tách văn bản thành danh sách các từ
      const wordsList = prepareWords(text)
      setWords(wordsList)
      
      // Khởi tạo trạng thái cho từng từ
      setWordStates(Array(wordsList.length).fill('waiting'))
      
      setTypedText('')
      setErrors(0)
      setCurrentWordIndex(0)
      setCompletedWords(0)
      setTimeLeft(testDuration)
      setIsTestActive(true)
      setStartTime(Date.now())
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    } catch (error) {
      console.error('Error generating text:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Kết thúc kiểm tra
  const endTest = () => {
    if (!startTime) return

    const endTime = Date.now()
    const elapsedTimeInSeconds = (endTime - startTime) / 1000
    const elapsedMinutes = elapsedTimeInSeconds / 60
    
    // Tính số từ đã gõ đúng
    const totalWords = completedWords
    const wpm = Math.round(totalWords / elapsedMinutes)
    
    // Tính tỷ lệ chính xác
    const totalErrors = wordStates.filter((state, index) => 
      index < completedWords && state === 'incorrect'
    ).length
    
    const accuracy = completedWords > 0 
      ? Math.max(0, Math.round(((completedWords - totalErrors) / completedWords) * 100)) 
      : 100
    
    // Tạo kết quả mới
    const newResult: TypingResult = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      wpm,
      accuracy,
      duration: Math.round(elapsedTimeInSeconds),
      words: completedWords,
      errors: totalErrors,
      language: selectedLanguage
    }
    
    // Cập nhật danh sách kết quả
    const updatedResults = [newResult, ...results]
    setResults(updatedResults)
    
    // Cập nhật thống kê
    const totalWpm = updatedResults.reduce((sum, result) => sum + result.wpm, 0)
    const avgWpm = Math.round(totalWpm / updatedResults.length)
    
    const totalAccuracy = updatedResults.reduce((sum, result) => sum + result.accuracy, 0)
    const avgAccuracy = Math.round(totalAccuracy / updatedResults.length * 10) / 10
    
    const maxWpm = Math.max(...updatedResults.map(result => result.wpm))
    
    setAverageWpm(avgWpm)
    setHighestWpm(maxWpm)
    setAverageAccuracy(avgAccuracy)
    setTestCount(updatedResults.length)
    
    // Lưu vào localStorage
    localStorage.setItem('typingResults', JSON.stringify(updatedResults))
    
    // Reset trạng thái kiểm tra
    setIsTestActive(false)
    setStartTime(null)
  }

  // Theo dõi thời gian còn lại
  useEffect(() => {
    if (isTestActive && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (isTestActive && timeLeft === 0) {
      endTest()
    }
  }, [isTestActive, timeLeft])

  // Xử lý khi người dùng nhập văn bản
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTestActive) return
    
    const inputValue = e.target.value
    setTypedText(inputValue)
  }

  // Xử lý phím tắt
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isTestActive) return
    
    // Khi nhấn phím cách (space)
    if (e.key === ' ') {
      e.preventDefault() // Ngăn không cho thêm khoảng trắng vào ô input
      
      // Kiểm tra từ hiện tại
      const currentTypedWord = normalizeText(typedText.trim())
      const expectedWord = normalizeText(words[currentWordIndex])
      
      // Tạo bản sao của mảng trạng thái từ
      const newWordStates = [...wordStates]
      
      // Kiểm tra từ vừa gõ
      if (currentTypedWord === expectedWord) {
        // Từ đúng
        newWordStates[currentWordIndex] = 'correct'
      } else {
        // Từ sai
        newWordStates[currentWordIndex] = 'incorrect'
        setErrors(errors + 1)
      }
      
      // Cập nhật trạng thái
      setWordStates(newWordStates)
      setCurrentWordIndex(currentWordIndex + 1)
      setCompletedWords(completedWords + 1)
      
      // Reset ô input
      setTypedText('')
      
      // Kiểm tra nếu đã gõ hết tất cả các từ
      if (currentWordIndex + 1 >= words.length) {
        endTest()
      }
    }

    // Cho phép người dùng bỏ qua từ bằng phím Tab
    if (e.key === 'Tab') {
      e.preventDefault() // Ngăn focus chuyển sang phần tử khác
      
      // Đánh dấu từ hiện tại là sai
      const newWordStates = [...wordStates]
      newWordStates[currentWordIndex] = 'incorrect'
      
      // Cập nhật trạng thái
      setWordStates(newWordStates)
      setCurrentWordIndex(currentWordIndex + 1)
      setCompletedWords(completedWords + 1)
      setErrors(errors + 1)
      
      // Reset ô input
      setTypedText('')
      
      // Kiểm tra nếu đã gõ hết tất cả các từ
      if (currentWordIndex + 1 >= words.length) {
        endTest()
      }
    }
  }

  // Xóa lịch sử kiểm tra
  const clearHistory = () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả lịch sử kiểm tra?')) {
      setResults([])
      setAverageWpm(0)
      setHighestWpm(0)
      setAverageAccuracy(0)
      setTestCount(0)
      localStorage.removeItem('typingResults')
    }
  }

  // Thay đổi thời gian kiểm tra
  const changeTestDuration = (seconds: number) => {
    setTestDuration(seconds)
    setTimeLeft(seconds)
  }

  // Thay đổi ngôn ngữ kiểm tra
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(e.target.value)
  }

  // Hiển thị văn bản với các trạng thái khác nhau
  const renderText = () => {
    return (
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 font-mono text-2xl leading-relaxed">
        <div className="flex flex-wrap">
          {words.map((word, index) => {
            let className = '';
            let status = wordStates[index];
            
            switch (status) {
              case 'correct':
                className = 'text-green-600 font-medium';
                break;
              case 'incorrect':
                className = 'text-red-600 bg-red-100 font-medium';
                break;
              case 'waiting':
                className = 'text-gray-900 font-medium';
                break;
            }
            
            // Highlight từ hiện tại
            if (index === currentWordIndex) {
              className += ' bg-gray-200';
            }
            
            return (
              <React.Fragment key={index}>
                <span className={className}>
                  {word}
                </span>
                {/* Thêm khoảng trắng sau mỗi từ, trừ từ cuối cùng */}
                {index < words.length - 1 && <span className="mx-1"> </span>}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // Tính toán WPM hiện tại
  const calculateCurrentWpm = () => {
    if (!startTime || completedWords === 0) return 0;
    
    const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
    return Math.round(completedWords / elapsedMinutes);
  };

  return (
    <div className="mx-auto px-2 py-8 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Kiểm tra tốc độ gõ phím</h1>
          </div>
        </div>

        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-2 rounded-xl bg-gray-100 p-1 mb-6">
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center gap-2
                 ${
                  selected
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'
                }`
              }
            >
              <ClockIcon className="w-5 h-5" />
              <span>Kiểm tra</span>
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center gap-2
                 ${
                  selected
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-900'
                }`
              }
            >
              <ChartBarIcon className="w-5 h-5" />
              <span>Thống kê</span>
            </Tab>
          </Tab.List>

          <Tab.Panels>
            {/* Tab Kiểm tra */}
            <Tab.Panel>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium">Kiểm tra tốc độ gõ phím của bạn</h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => changeTestDuration(30)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        testDuration === 30 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      30s
                    </button>
                    <button
                      onClick={() => changeTestDuration(60)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        testDuration === 60 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      1m
                    </button>
                    <button
                      onClick={() => changeTestDuration(120)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        testDuration === 120 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      2m
                    </button>
                  </div>
                </div>

                {isTestActive ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="text-xl font-bold">{timeLeft}s</div>
                      <button
                        onClick={endTest}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <XMarkIcon className="w-4 h-4" />
                        <span>Kết thúc</span>
                      </button>
                    </div>

                    {/* Hiển thị văn bản có highlight */}
                    {renderText()}

                    <div className="relative">
                      <input
                        ref={inputRef}
                        value={typedText}
                        onChange={handleTyping}
                        onKeyDown={handleKeyDown}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-center font-mono text-2xl"
                        placeholder={words[currentWordIndex] || ''}
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                        lang={selectedLanguage}
                        inputMode="text"
                      />
                      <div className="absolute top-0 right-0 p-2 text-xs text-gray-500">
                        Nhấn SPACE để kiểm tra từ | Tab để bỏ qua
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Độ chính xác:</span>
                          <span className="ml-2 font-medium">
                            {completedWords > 0
                              ? Math.max(0, Math.round(((completedWords - errors) / completedWords) * 100))
                              : 100}%
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Lỗi:</span>
                          <span className="ml-2 font-medium">{errors}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Từ:</span>
                          <span className="ml-2 font-medium">{completedWords}/{words.length}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">WPM hiện tại:</span>
                        <span className="ml-2 font-medium">
                          {calculateCurrentWpm()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-12 space-y-4">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-full max-w-xs">
                        <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 text-left mb-1">
                          Chọn ngôn ngữ
                        </label>
                        <select
                          id="language-select"
                          value={selectedLanguage}
                          onChange={handleLanguageChange}
                          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
                        >
                          {languages.map(lang => (
                            <option key={lang.id} value={lang.id}>
                              {lang.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Kiểm tra xem bạn có thể gõ nhanh như thế nào trong {testDuration} giây!
                      <br />
                      Gõ mỗi từ và nhấn <strong>phím cách (Space)</strong> để kiểm tra và tiếp tục từ tiếp theo.
                    </p>
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center space-y-4 p-6">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-800"></div>
                        </div>
                        <p className="text-gray-700 font-medium text-lg">AI đang tạo đoạn văn...</p>
                        <p className="text-gray-500 text-sm">Đang chuẩn bị bài kiểm tra của bạn</p>
                      </div>
                    ) : (
                      <button
                        onClick={startTest}
                        className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <PlayIcon className="w-5 h-5" />
                        <span>Bắt đầu</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Kết quả mới nhất */}
              {results.length > 0 && !isTestActive && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Kết quả gần đây</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Tốc độ gõ</div>
                      <div className="text-2xl font-bold">{results[0].wpm} WPM</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Độ chính xác</div>
                      <div className="text-2xl font-bold">{results[0].accuracy}%</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Số từ đã gõ</div>
                      <div className="text-2xl font-bold">{results[0].words} / {words.length}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Thời gian</div>
                      <div className="text-2xl font-bold">{results[0].duration}s</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 mb-1">Ngôn ngữ</div>
                      <div className="text-2xl font-bold">
                        {languages.find(lang => lang.id === results[0].language)?.name || results[0].language}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Tab.Panel>

            {/* Tab Thống kê */}
            <Tab.Panel>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium">Thống kê của bạn</h2>
                  {results.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
                    >
                      Xóa lịch sử
                    </button>
                  )}
                </div>

                {results.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">WPM trung bình</div>
                        <div className="text-2xl font-bold">{averageWpm}</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">WPM cao nhất</div>
                        <div className="text-2xl font-bold">{highestWpm}</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Độ chính xác</div>
                        <div className="text-2xl font-bold">{averageAccuracy}%</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Số lần kiểm tra</div>
                        <div className="text-2xl font-bold">{testCount}</div>
                      </div>
                    </div>

                    <h3 className="text-md font-medium mb-3">Lịch sử kiểm tra</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border-b py-2 px-4 text-left text-sm font-medium text-gray-700">
                              Ngày
                            </th>
                            <th className="border-b py-2 px-4 text-left text-sm font-medium text-gray-700">
                              WPM
                            </th>
                            <th className="border-b py-2 px-4 text-left text-sm font-medium text-gray-700">
                              Chính xác
                            </th>
                            <th className="border-b py-2 px-4 text-left text-sm font-medium text-gray-700">
                              Thời gian
                            </th>
                            <th className="border-b py-2 px-4 text-left text-sm font-medium text-gray-700">
                              Số từ
                            </th>
                            <th className="border-b py-2 px-4 text-left text-sm font-medium text-gray-700">
                              Ngôn ngữ
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((result) => (
                            <tr key={result.id}>
                              <td className="border-b py-3 px-4 text-sm">{result.date}</td>
                              <td className="border-b py-3 px-4 text-sm font-medium">{result.wpm}</td>
                              <td className="border-b py-3 px-4 text-sm">{result.accuracy}%</td>
                              <td className="border-b py-3 px-4 text-sm">{result.duration}s</td>
                              <td className="border-b py-3 px-4 text-sm">{result.words || '-'}</td>
                              <td className="border-b py-3 px-4 text-sm">
                                {languages.find(lang => lang.id === result.language)?.name || result.language || 'Tiếng Việt'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-12">
                    <div className="mb-4">
                      <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto" />
                    </div>
                    <p className="text-gray-500">
                      Bạn chưa có kết quả kiểm tra nào. Hãy hoàn thành bài kiểm tra để xem thống kê.
                    </p>
                  </div>
                )}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )
}

// Icon play
function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
        clipRule="evenodd"
      />
    </svg>
  )
} 