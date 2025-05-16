'use client'

import { useState } from 'react'
import { ArrowPathIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline'
import { aiService } from '@/lib/ai-service'
import { useToast } from '@/hooks/use-toast'

interface QuoteResult {
  text: string
  author: string
  category: string
  language: string
}

export default function RandomQuotePage() {
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [quoteHistory, setQuoteHistory] = useState<QuoteResult[]>([])
  const [category, setCategory] = useState<'random' | 'motivation' | 'success' | 'life' | 'love' | 'wisdom'>('random')
  const [language, setLanguage] = useState<'vietnamese' | 'english' | 'chinese' | 'all'>('vietnamese')
  const [error, setError] = useState<string | null>(null)
  const [generatedQuotes, setGeneratedQuotes] = useState<string[]>([])
  const { toast } = useToast()
  
  const categories = [
    { value: 'random', label: '🌍 Ngẫu nhiên' },
    { value: 'motivation', label: '💪 Động lực' },
    { value: 'success', label: '🏆 Thành công' },
    { value: 'life', label: '🌱 Cuộc sống' },
    { value: 'love', label: '❤️ Tình yêu' },
    { value: 'wisdom', label: '🧠 Trí tuệ' }
  ]

  const languages = [
    { value: 'vietnamese', label: '🇻🇳 Tiếng Việt' },
    { value: 'english', label: '🇬🇧 Tiếng Anh' },
    { value: 'chinese', label: '🇨🇳 Tiếng Trung' },
    { value: 'all', label: '🌍 Ngẫu nhiên' },
  ]
  
  // Generate a random quote using AI
  const generateQuote = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const categoryFilter = category !== 'random' ? ` thuộc chủ đề ${categories.find(c => c.value === category)?.label}` : ''
      let languageFilter = "bằng tiếng việt"
      switch (language) {
        case 'english':
          languageFilter = "bằng tiếng anh"
          break
        case 'chinese':
          languageFilter = "bằng tiếng trung"
          break
        case 'all':
          languageFilter = "bằng một ngôn ngữ ngẫu nhiên"
          break
      }
      const prompt = `Bạn là một chuyên gia về câu nói truyền cảm hứng. Hãy tạo một câu nói${categoryFilter}${languageFilter}.

Use this JSON schema:
{
  "text": "nội dung câu nói",
  "author": "tác giả",
  "category": "chủ đề",
  "language": "ngôn ngữ"
}

2. Các yêu cầu khác:
- Câu nói phải ngắn gọn, súc tích
- Nội dung phải truyền cảm hứng và có ý nghĩa
- Tác giả phải là người nổi tiếng hoặc có uy tín
- KHÔNG thêm bất kỳ text nào khác ngoài JSON
- KHÔNG thêm comments hay giải thích
- KHÔNG thêm dấu backtick hay markdown
- KHÔNG chọn các câu nói đã có trong danh sách sau: ${generatedQuotes.join(', ')}`
      console.log(prompt)
      const result = await aiService.processWithAI(prompt)
      
      try {
        // Clean the response to ensure it's valid JSON
        const cleanResult = result.replace(/```json\n?|\n?```/g, '').trim()
        const quoteData = JSON.parse(cleanResult) as QuoteResult
        
        // Validate required fields
        if (!quoteData.text || !quoteData.author || !quoteData.category || !quoteData.language) {
          throw new Error('Thiếu thông tin bắt buộc')
        }
        
        setQuoteResult(quoteData)
        
        // Add to history (max 10 entries)
        setQuoteHistory(prev => {
          const updatedHistory = [quoteData, ...prev]
          return updatedHistory.slice(0, 10)
        })

        // Add to generated quotes list
        setGeneratedQuotes(prev => [...prev, quoteData.text])
        
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        setError('Không thể xử lý kết quả từ AI. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('Error generating quote:', error)
      setError('Có lỗi xảy ra khi tạo câu nói. Vui lòng thử lại.')
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Reset history
  const resetHistory = () => {
    setQuoteHistory([])
    setQuoteResult(null)
    setError(null)
    setGeneratedQuotes([])
  }

  // Copy quote to clipboard
  const copyQuote = async (quote: QuoteResult) => {
    const textToCopy = `"${quote.text}"\n- ${quote.author}`
    
    try {
      await navigator.clipboard.writeText(textToCopy)
      toast({
        title: "Đã sao chép",
        description: "Câu nói đã được sao chép vào clipboard",
        duration: 2000,
      })
    } catch (err) {
      console.error('Failed to copy:', err)
      toast({
        title: "Lỗi",
        description: "Không thể sao chép câu nói",
        variant: "destructive",
        duration: 2000,
      })
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
          <div className="p-8">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-purple-800 mb-2">💭 Quote Generator</h1>
                <p className="text-gray-600">
                  Tạo câu nói ngẫu nhiên để truyền cảm hứng và động lực.
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-800 mb-2">Chủ đề</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as 'random' | 'motivation' | 'success' | 'life' | 'love' | 'wisdom')}
                      className="w-full rounded-xl border-2 border-purple-200 px-4 py-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-purple-800 mb-2">Ngôn ngữ</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'vietnamese' | 'english')}
                      className="w-full rounded-xl border-2 border-purple-200 px-4 py-3 text-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                    >
                      {languages.map(lang => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={generateQuote}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span className="font-medium">{isGenerating ? 'Đang tạo câu nói...' : 'Tạo câu nói ngẫu nhiên'}</span>
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {(quoteResult !== null || isGenerating) && (
                <div className="mt-8">
                  <div 
                    onClick={() => !isGenerating && quoteResult && copyQuote(quoteResult)}
                    className={`bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-xl border-2 border-purple-200 text-center ${!isGenerating && quoteResult ? 'cursor-pointer hover:border-purple-300' : ''}`}
                  >
                    <div className="space-y-4">
                      <div>
                        <p className="text-2xl font-medium text-purple-800 italic">
                          {isGenerating ? '...' : `"${quoteResult?.text}"`}
                        </p>
                        <p className="text-sm text-purple-600">
                          {isGenerating ? '' : `- ${quoteResult?.author}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {quoteHistory.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-purple-800">📜 Lịch sử câu nói</p>
                    <button 
                      onClick={resetHistory}
                      className="text-xs text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      Xóa lịch sử
                    </button>
                  </div>
                  
                  <div className="bg-purple-50 rounded-xl border-2 border-purple-200 overflow-hidden">
                    <div className="divide-y divide-purple-200">
                      {quoteHistory.map((item, index) => (
                        <div 
                          key={index} 
                          onClick={() => copyQuote(item)}
                          className="p-4 text-sm hover:bg-purple-100 transition-colors cursor-pointer"
                        >
                          <p className="font-medium text-purple-800 italic mb-2">"{item.text}"</p>
                          <div className="flex items-center justify-between">
                            <span className="text-purple-600">- {item.author}</span>
                            <span className="text-xs text-purple-500">{item.category}</span>
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