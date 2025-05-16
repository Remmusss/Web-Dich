'use client'

import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast, useToast } from "@/hooks/use-toast"

export default function RandomColorPage() {
  const [randomColors, setRandomColors] = useState<string[]>([])
  const [colorHistory, setColorHistory] = useState<string[]>([])
  const [numberOfColors, setNumberOfColors] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)

  const generateRandomColor = () => {
    setError(null)
    
    try {
      const newColors = Array.from({ length: numberOfColors }, () => {
        const randomHex = Math.floor(Math.random() * 16777215).toString(16)
        return `#${randomHex.padStart(6, '0')}`
      })

      setRandomColors(newColors)

      setColorHistory(prev => {
        const updatedHistory = [...newColors, ...prev]
        return updatedHistory.slice(0, 20) // lưu tối đa 20 màu lịch sử
      })
    } catch (error) {
      console.error('Error generating colors:', error)
      setError('Có lỗi xảy ra khi tạo màu. Vui lòng thử lại.')
    }
  }

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text)
      toast({
        title: "Đã sao chép màu",
        description: "Màu đã được sao chép vào clipboard",
        duration: 2000,
      })
    } catch (error) {
      console.error('Failed to copy:', error)
      toast({
        title: "Lỗi",
        description: "Không thể sao chép màu",
        variant: "destructive",
        duration: 2000,
      })
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="p-8">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-800 mb-2">🎨 Color Generator</h1>
                <p className="text-gray-600">
                  Tạo mã màu HEX ngẫu nhiên cho thiết kế, website hoặc ứng dụng.
                </p>
              </div>

              <div className="space-y-6">
                <Select value={String(numberOfColors)} onValueChange={(value) => setNumberOfColors(Number(value))}>
                  <SelectTrigger className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all">
                    <SelectValue placeholder="Chọn số lượng màu" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 10, 20].map((num) => (
                      <SelectItem key={num} value={String(num)}>
                        {num} màu
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <button
                  onClick={generateRandomColor}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  <span className="font-medium">Tạo màu ngẫu nhiên</span>
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Các màu mới tạo */}
              {randomColors.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-blue-800">Màu được chọn</p>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
                    {randomColors.map((color, index) => (
                      <div
                        key={index}
                        className="group relative w-full aspect-square rounded-xl cursor-pointer border-2 border-blue-200 hover:border-blue-300 transition-all"
                        style={{ backgroundColor: color }}
                        onClick={() => copyToClipboard(color)}
                      >
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                          <p className="text-xs text-white font-semibold">{color}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lịch sử màu */}
              {colorHistory.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-blue-800">📜 Lịch sử màu</p>
                    <button 
                      onClick={() => setColorHistory([])}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Xóa lịch sử
                    </button>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {colorHistory.map((color, index) => (
                      <div
                        key={index}
                        className="group relative w-full aspect-square rounded-xl cursor-pointer border-2 border-blue-200 hover:border-blue-300 transition-all"
                        style={{ backgroundColor: color }}
                        onClick={() => copyToClipboard(color)}
                      >
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                          <p className="text-xs text-white font-semibold">{color}</p>
                        </div>
                      </div>
                    ))}
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
