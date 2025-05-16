"use client"

import { useState } from 'react'
import { ArrowPathIcon, ClipboardIcon } from '@heroicons/react/24/outline'

export default function RandomPasswordPage() {
  const [password, setPassword] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [passwordHistory, setPasswordHistory] = useState<{password: string, timestamp: string}[]>([])
  const [length, setLength] = useState<number>(12)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  })
  const [copied, setCopied] = useState<boolean>(false)
  
  // Character sets
  const charSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  }
  
  // Generate a random password
  const generatePassword = () => {
    setIsGenerating(true)
    setCopied(false)
    
    setTimeout(() => {
      try {
        // Get selected character sets
        const selectedSets = Object.entries(options)
          .filter(([_, enabled]) => enabled)
          .map(([key]) => charSets[key as keyof typeof charSets])
        
        if (selectedSets.length === 0) {
          throw new Error('Vui lòng chọn ít nhất một loại ký tự')
        }
        
        // Generate password
        let result = ''
        const allChars = selectedSets.join('')
        
        // Ensure at least one character from each selected set
        selectedSets.forEach(set => {
          result += set[Math.floor(Math.random() * set.length)]
        })
        
        // Fill the rest randomly
        while (result.length < length) {
          result += allChars[Math.floor(Math.random() * allChars.length)]
        }
        
        // Shuffle the password
        result = result.split('').sort(() => Math.random() - 0.5).join('')
        
        setPassword(result)
        
        // Add to history (max 24 entries)
        const timestamp = new Date().toLocaleTimeString()
        setPasswordHistory(prev => {
          const updatedHistory = [{password: result, timestamp}, ...prev]
          return updatedHistory.slice(0, 24)
        })
      } catch (error) {
        console.error('Error generating password:', error)
        setPassword(null)
      } finally {
        setIsGenerating(false)
      }
    }, 500)
  }
  
  // Copy password to clipboard
  const copyToClipboard = async () => {
    if (password) {
      try {
        await navigator.clipboard.writeText(password)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }
  }
  
  // Reset history
  const resetHistory = () => {
    setPasswordHistory([])
    setPassword(null)
    setCopied(false)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">🔑 Random Password</h1>
                <p className="text-gray-600">
                  Tạo mật khẩu ngẫu nhiên mạnh và an toàn.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Độ dài mật khẩu</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="8"
                      max="32"
                      value={length}
                      onChange={(e) => setLength(Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-800 w-8 text-center">{length}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-3">Loại ký tự</label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(options).map(([key, value]) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setOptions(prev => ({...prev, [key]: e.target.checked}))}
                          className="w-4 h-4 text-gray-800 border-gray-300 rounded focus:ring-gray-500"
                        />
                        <span className="text-sm text-gray-800">
                          {key === 'uppercase' && 'Chữ hoa (A-Z)'}
                          {key === 'lowercase' && 'Chữ thường (a-z)'}
                          {key === 'numbers' && 'Số (0-9)'}
                          {key === 'symbols' && 'Ký tự đặc biệt (!@#$...)'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={generatePassword}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span className="font-medium">{isGenerating ? 'Đang tạo...' : 'Tạo mật khẩu ngẫu nhiên'}</span>
                </button>
              </div>

              {(password !== null || isGenerating) && (
                <div className="mt-8">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200 text-center transform transition-all hover:scale-[1.02]">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-2xl font-mono text-gray-800 mb-4 break-all">
                        {isGenerating ? '...' : password}
                      </p>
                      <button
                        onClick={copyToClipboard}
                        disabled={!password || copied}
                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors disabled:opacity-50"
                      >
                        <ClipboardIcon className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">
                          {copied ? 'Đã sao chép!' : 'Sao chép'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {passwordHistory.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-800">📜 Lịch sử mật khẩu</p>
                    <button 
                      onClick={resetHistory}
                      className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Xóa lịch sử
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
                    <div className="space-y-3">
                      {passwordHistory.map((item, index) => (
                        <div 
                          key={index} 
                          className="relative group"
                          title={`Tạo lúc ${item.timestamp}`}
                        >
                          <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
                            <span className="font-mono text-gray-800">{item.password}</span>
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
  )
}
