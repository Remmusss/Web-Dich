'use client'

import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function RandomCardPage() {
  const [cardResult, setCardResult] = useState<{suit: string, value: string} | null>(null)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [cardHistory, setCardHistory] = useState<{suit: string, value: string, timestamp: string}[]>([])
  const [deckType, setDeckType] = useState<'standard' | 'joker'>('standard')
  
  // Card data
  const suits = ['♠', '♥', '♦', '♣']
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const jokers = ['🃏', '🃏']
  
  // Generate a random card
  const generateCard = () => {
    setIsGenerating(true)
    
    setTimeout(() => {
      let result: {suit: string, value: string}
      
      if (deckType === 'joker' && Math.random() < 0.1) {
        // 10% chance to get a joker
        result = {
          suit: jokers[Math.floor(Math.random() * jokers.length)],
          value: 'Joker'
        }
      } else {
        result = {
          suit: suits[Math.floor(Math.random() * suits.length)],
          value: values[Math.floor(Math.random() * values.length)]
        }
      }
      
      setCardResult(result)
      setIsGenerating(false)
      
      // Add to history (max 24 entries)
      const timestamp = new Date().toLocaleTimeString()
      setCardHistory(prev => {
        const updatedHistory = [{...result, timestamp}, ...prev]
        return updatedHistory.slice(0, 24)
      })
    }, 500)
  }
  
  // Reset history
  const resetHistory = () => {
    setCardHistory([])
    setCardResult(null)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">🃏 Random Card</h1>
                <p className="text-gray-600">
                  Tạo lá bài ngẫu nhiên từ bộ bài tiêu chuẩn hoặc bộ bài có joker.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Loại bộ bài</label>
                  <select
                    value={deckType}
                    onChange={(e) => setDeckType(e.target.value as 'standard' | 'joker')}
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                  >
                    <option value="standard">Bộ bài tiêu chuẩn</option>
                    <option value="joker">Bộ bài có joker</option>
                  </select>
                </div>
                
                <button
                  onClick={generateCard}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span className="font-medium">{isGenerating ? 'Đang tạo...' : 'Tạo lá bài ngẫu nhiên'}</span>
                </button>
              </div>

              {(cardResult !== null || isGenerating) && (
                <div className="mt-8">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200 text-center transform transition-all hover:scale-[1.02]">
                    <div className="flex flex-col items-center justify-center">
                      <span className={`text-7xl mb-3 ${
                        cardResult?.suit === '♥' || cardResult?.suit === '♦' ? 'text-red-500' : 'text-gray-800'
                      }`}>
                        {isGenerating ? '?' : cardResult?.suit}
                      </span>
                      <p className="text-3xl font-bold text-gray-800">
                        {isGenerating ? '...' : cardResult?.value}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {cardHistory.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-800">📜 Lịch sử rút bài</p>
                    <button 
                      onClick={resetHistory}
                      className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Xóa lịch sử
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
                    <div className="flex flex-wrap gap-3 items-center">
                      {cardHistory.map((item, index) => (
                        <div 
                          key={index} 
                          className="relative group"
                          title={`Tạo lúc ${item.timestamp}`}
                        >
                          <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
                            <span className={`text-xl ${
                              item.suit === '♥' || item.suit === '♦' ? 'text-red-500' : 'text-gray-800'
                            }`}>
                              {item.suit}
                            </span>
                            <span className="font-medium text-gray-800">{item.value}</span>
                          </div>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {item.timestamp}
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