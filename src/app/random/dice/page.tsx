'use client'

import { useState, useEffect } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function RandomDicePage() {
  const [diceCount, setDiceCount] = useState<number>(1)
  const [diceSides, setDiceSides] = useState<number>(6)
  const [diceResults, setDiceResults] = useState<number[]>([])
  const [diceTotal, setDiceTotal] = useState<number | null>(null)
  const [isRolling, setIsRolling] = useState<boolean>(false)
  const [rollHistory, setRollHistory] = useState<{sides: number, results: number[], total: number}[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // Roll dice
  const rollDice = () => {
    setError(null)
    
    try {
      // First set rolling animation state
      setIsRolling(true)
      
      // Delay the actual result to show animation
      setTimeout(() => {
        const results: number[] = []
        let total = 0
        
        for (let i = 0; i < diceCount; i++) {
          const roll = Math.floor(Math.random() * diceSides) + 1
          results.push(roll)
          total += roll
        }
        
        setDiceResults(results)
        setDiceTotal(total)
        setIsRolling(false)
        
        // Add to history (max 5 entries)
        setRollHistory(prev => {
          const newHistory = [{sides: diceSides, results, total}, ...prev]
          return newHistory.slice(0, 5)
        })
      }, 600)
    } catch (error) {
      console.error('Error rolling dice:', error)
      setError('Có lỗi xảy ra khi gieo xúc xắc. Vui lòng thử lại.')
      setIsRolling(false)
    }
  }
  
  // Get dice face content based on sides and value
  const getDiceFace = (sides: number, value: number) => {
    // Standard 6-sided dice have specific patterns
    if (sides === 6) {
      switch (value) {
        case 1: return '⚀'
        case 2: return '⚁'
        case 3: return '⚂'
        case 4: return '⚃'
        case 5: return '⚄'
        case 6: return '⚅'
      }
    }
    
    // For other dice types, just return the number
    return value
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="p-8">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-800 mb-2">🎲 Dice Generator</h1>
                <p className="text-gray-600">
                  Mô phỏng gieo xúc xắc với số lượng và số mặt tùy chỉnh.
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      Số lượng xúc xắc
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={diceCount}
                      onChange={(e) => setDiceCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-2">
                      Số mặt mỗi xúc xắc
                    </label>
                    <select
                      value={diceSides}
                      onChange={(e) => setDiceSides(parseInt(e.target.value))}
                      className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                      <option value={4}>D4 (4 mặt)</option>
                      <option value={6}>D6 (6 mặt)</option>
                      <option value={8}>D8 (8 mặt)</option>
                      <option value={10}>D10 (10 mặt)</option>
                      <option value={12}>D12 (12 mặt)</option>
                      <option value={20}>D20 (20 mặt)</option>
                      <option value={100}>D100 (100 mặt)</option>
                    </select>
                  </div>
                </div>
                
                <div className="text-sm text-blue-600">
                  <p className="mb-1">Công thức xúc xắc: {diceCount}d{diceSides}</p>
                  <p>Phạm vi kết quả: {diceCount} - {diceCount * diceSides}</p>
                </div>
                
                <button
                  onClick={rollDice}
                  disabled={isRolling}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
                  <span className="font-medium">{isRolling ? 'Đang gieo...' : 'Gieo xúc xắc'}</span>
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {(diceResults.length > 0 || isRolling) && (
                <div className="mt-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-200 text-center">
                    <p className="text-sm text-blue-600 mb-3">Kết quả</p>
                    <div className="flex flex-wrap gap-3 mb-4">
                      {isRolling ? (
                        // Show loading dice
                        Array(diceCount).fill(0).map((_, index) => (
                          <div key={index} className="w-16 h-16 flex items-center justify-center bg-white border-2 border-blue-200 rounded-xl shadow-sm animate-pulse">
                            <span className="text-2xl opacity-30">?</span>
                          </div>
                        ))
                      ) : (
                        // Show actual dice results
                        diceResults.map((result, index) => (
                          <div key={index} className="w-16 h-16 flex items-center justify-center bg-white border-2 border-blue-200 rounded-xl shadow-sm">
                            <span className="text-2xl font-bold">{getDiceFace(diceSides, result)}</span>
                          </div>
                        ))
                      )}
                    </div>
                    {diceCount > 1 && diceTotal !== null && !isRolling && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="text-sm text-blue-600">Tổng</p>
                        <p className="text-2xl font-bold text-blue-800">{diceTotal}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {rollHistory.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-blue-800">📜 Lịch sử gieo xúc xắc</p>
                    <button 
                      onClick={() => setRollHistory([])}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Xóa lịch sử
                    </button>
                  </div>
                  <div className="space-y-2">
                    {rollHistory.map((roll, index) => (
                      <div key={index} className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200 text-sm">
                        <div className="flex justify-between mb-2">
                          <span className="text-blue-600">{roll.results.length}d{roll.sides}:</span>
                          <span className="font-medium text-blue-800">{roll.total}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {roll.results.map((result, i) => (
                            <span key={i} className="inline-block px-2 py-1 bg-white border-2 border-blue-200 rounded-lg text-xs text-blue-800">
                              {result}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-blue-600 bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                <p className="font-medium text-blue-800 mb-2">Xúc xắc phổ biến:</p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <li><strong>D4</strong>: Tetrahedron - 4 mặt</li>
                  <li><strong>D6</strong>: Cube - 6 mặt (phổ biến nhất)</li>
                  <li><strong>D8</strong>: Octahedron - 8 mặt</li>
                  <li><strong>D10</strong>: Pentagonal trapezohedron - 10 mặt</li>
                  <li><strong>D12</strong>: Dodecahedron - 12 mặt</li>
                  <li><strong>D20</strong>: Icosahedron - 20 mặt</li>
                  <li><strong>D100/D%</strong>: Percentile - 100 mặt</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 