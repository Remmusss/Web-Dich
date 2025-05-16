'use client'

import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function RandomCoinPage() {
  const [coinResult, setCoinResult] = useState<string | null>(null)
  const [isFlipping, setIsFlipping] = useState<boolean>(false)
  const [flipHistory, setFlipHistory] = useState<{result: string, timestamp: string}[]>([])
  const [headsCount, setHeadsCount] = useState<number>(0)
  const [tailsCount, setTailsCount] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  
  // Flip a coin
  const flipCoin = () => {
    setError(null)
    
    try {
      // Set flipping animation state
      setIsFlipping(true)
      
      // Delay the actual result to show animation
      setTimeout(() => {
        const result = Math.random() < 0.5 ? 'Mặt sấp' : 'Mặt ngửa'
        setCoinResult(result)
        setIsFlipping(false)
        
        // Update statistics
        if (result === 'Mặt ngửa') {
          setHeadsCount(prev => prev + 1)
        } else {
          setTailsCount(prev => prev + 1)
        }
        
        // Add to history (max 10 entries)
        const timestamp = new Date().toLocaleTimeString()
        setFlipHistory(prev => {
          const updatedHistory = [{result, timestamp}, ...prev]
          return updatedHistory.slice(0, 10)
        })
      }, 700)
    } catch (error) {
      console.error('Error flipping coin:', error)
      setError('Có lỗi xảy ra khi tung đồng xu. Vui lòng thử lại.')
      setIsFlipping(false)
    }
  }
  
  // Reset statistics
  const resetStats = () => {
    setHeadsCount(0)
    setTailsCount(0)
    setFlipHistory([])
    setCoinResult(null)
    setError(null)
  }
  
  // Calculate percentages
  const totalFlips = headsCount + tailsCount
  const headsPercentage = totalFlips > 0 ? Math.round((headsCount / totalFlips) * 100) : 0
  const tailsPercentage = totalFlips > 0 ? Math.round((tailsCount / totalFlips) * 100) : 0

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="p-8">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-800 mb-2">🪙 Coin Flip</h1>
                <p className="text-gray-600">
                  Tung đồng xu ngẫu nhiên để giúp bạn đưa ra quyết định nhanh chóng.
                </p>
              </div>

              <div className="space-y-6">
                <button
                  onClick={flipCoin}
                  disabled={isFlipping}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isFlipping ? 'animate-spin' : ''}`} />
                  <span className="font-medium">{isFlipping ? 'Đang tung...' : 'Tung đồng xu'}</span>
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {(coinResult !== null || isFlipping) && (
                <div className="mt-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-200 text-center">
                    <p className="text-sm text-blue-600 mb-3">Kết quả</p>
                    <div className={`w-32 h-32 mx-auto bg-white rounded-full border-2 border-blue-200 shadow-sm flex items-center justify-center mb-4 ${isFlipping ? 'animate-[flip_0.7s_ease-in-out]' : ''}`}>
                      <span className="text-5xl">
                        {isFlipping ? '?' : coinResult === 'Mặt ngửa' ? '🪙' : '💫'}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-800">
                      {isFlipping ? '...' : coinResult}
                    </p>
                  </div>
                </div>
              )}
              
              {totalFlips > 0 && (
                <>
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-blue-800">📊 Thống kê tung xu</p>
                      <button 
                        onClick={resetStats}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Xóa lịch sử
                      </button>
                    </div>
                    
                    <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-sm text-blue-600 mb-1">Mặt ngửa</p>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl font-bold text-blue-800">{headsCount}</span>
                            <span className="text-sm text-blue-600">({headsPercentage}%)</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-blue-600 mb-1">Mặt sấp</p>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl font-bold text-blue-800">{tailsCount}</span>
                            <span className="text-sm text-blue-600">({tailsPercentage}%)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full h-3 bg-blue-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                          style={{ width: `${headsPercentage}%` }}
                        />
                      </div>
                      
                      <p className="text-sm text-center text-blue-600 mt-2">
                        Tổng số lần tung: {totalFlips}
                      </p>
                    </div>
                  </div>
                  
                  {flipHistory.length > 0 && (
                    <div className="mt-8">
                      <p className="text-sm font-medium text-blue-800 mb-3">📜 Lịch sử tung xu</p>
                      <div className="bg-blue-50 rounded-xl border-2 border-blue-200 overflow-hidden">
                        <div className="divide-y divide-blue-200">
                          {flipHistory.map((flip, index) => (
                            <div key={index} className="flex items-center justify-between p-4 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {flip.result === 'Mặt ngửa' ? '🪙' : '💫'}
                                </span>
                                <span className="font-medium text-blue-800">
                                  {flip.result}
                                </span>
                              </div>
                              <span className="text-xs text-blue-600">{flip.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <style jsx global>{`
                @keyframes flip {
                  0% { transform: rotateY(0); }
                  100% { transform: rotateY(720deg); }
                }
              `}</style>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 