'use client'

import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function RandomDatePage() {
  const [dateResult, setDateResult] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [dateHistory, setDateHistory] = useState<{date: string, timestamp: string}[]>([])
  const [dateType, setDateType] = useState<'past' | 'future' | 'any'>('any')
  const [dateRange, setDateRange] = useState<number>(30) // days
  const [date1, setDate1] = useState<string>('')
  const [date2, setDate2] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  
  // Generate a random date
  const generateDate = () => {
    setError(null)
    setIsGenerating(true)
    
    try {
      setTimeout(() => {
        const today = new Date()
        let result: Date
        
        if (date1 && date2) {
          const date1Obj = new Date(date1)
          const date2Obj = new Date(date2)
          
          // Automatically determine start and end dates
          const start = date1Obj < date2Obj ? date1Obj : date2Obj
          const end = date1Obj < date2Obj ? date2Obj : date1Obj
          
          const timeDiff = end.getTime() - start.getTime()
          const randomTime = Math.random() * timeDiff
          result = new Date(start.getTime() + randomTime)
        } else {
          if (dateType === 'past') {
            const pastDate = new Date(today)
            pastDate.setDate(today.getDate() - Math.floor(Math.random() * dateRange))
            result = pastDate
          } else if (dateType === 'future') {
            const futureDate = new Date(today)
            futureDate.setDate(today.getDate() + Math.floor(Math.random() * dateRange))
            result = futureDate
          } else {
            const randomDate = new Date(today)
            const randomDays = Math.floor(Math.random() * (dateRange * 2)) - dateRange
            randomDate.setDate(today.getDate() + randomDays)
            result = randomDate
          }
        }
        
        const formattedDate = result.toLocaleDateString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        
        setDateResult(formattedDate)
        setIsGenerating(false)
        
        // Add to history (max 10 entries)
        const timestamp = new Date().toLocaleTimeString()
        setDateHistory(prev => {
          const updatedHistory = [{date: formattedDate, timestamp}, ...prev]
          return updatedHistory.slice(0, 10)
        })
      }, 500)
    } catch (error) {
      console.error('Error generating date:', error)
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo ngày ngẫu nhiên')
      setIsGenerating(false)
    }
  }
  
  // Reset history
  const resetHistory = () => {
    setDateHistory([])
    setDateResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="p-8">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-800 mb-2">📅 Random Date</h1>
                <p className="text-gray-600">
                  Tạo ngày ngẫu nhiên cho lập kế hoạch hoặc sắp xếp lịch trình.
                </p>
              </div>

              <Tabs defaultValue="type" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="type">Loại ngày</TabsTrigger>
                  <TabsTrigger value="range">Khoảng thời gian</TabsTrigger>
                </TabsList>
                
                <TabsContent value="type" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-2">Loại ngày</label>
                      <select
                        value={dateType}
                        onChange={(e) => setDateType(e.target.value as 'past' | 'future' | 'any')}
                        className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                      >
                        <option value="any">Bất kỳ</option>
                        <option value="past">Quá khứ</option>
                        <option value="future">Tương lai</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-2">Khoảng thời gian (ngày)</label>
                      <input
                        type="number"
                        value={dateRange}
                        onChange={(e) => setDateRange(Number(e.target.value))}
                        min="1"
                        max="365"
                        className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="range" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-2">Ngày thứ nhất</label>
                      <input
                        type="date"
                        value={date1}
                        onChange={(e) => setDate1(e.target.value)}
                        className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-2">Ngày thứ hai</label>
                      <input
                        type="date"
                        value={date2}
                        onChange={(e) => setDate2(e.target.value)}
                        className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-6">
                <button
                  onClick={generateDate}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span className="font-medium">{isGenerating ? 'Đang tạo...' : 'Tạo ngày ngẫu nhiên'}</span>
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {(dateResult !== null || isGenerating) && (
                <div className="mt-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-200 text-center transform transition-all hover:scale-[1.02]">
                    <p className="text-sm text-blue-600 mb-3">Kết quả</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {isGenerating ? '...' : dateResult}
                    </p>
                  </div>
                </div>
              )}
              
              {dateHistory.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-blue-800">📜 Lịch sử tạo ngày</p>
                    <button 
                      onClick={resetHistory}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Xóa lịch sử
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl border-2 border-blue-200 overflow-hidden">
                    <div className="divide-y divide-blue-200">
                      {dateHistory.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-4 text-sm">
                          <span className="font-medium text-blue-800">{item.date}</span>
                          <span className="text-xs text-blue-600">{item.timestamp}</span>
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