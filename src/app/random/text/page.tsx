'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowPathIcon, 
  TrashIcon, 
  ArrowsUpDownIcon, 
  ArrowUpIcon, 
  ArrowDownIcon 
} from '@heroicons/react/24/outline'

export default function RandomTextPage() {
  const [textList, setTextList] = useState<string>('')
  const [textItems, setTextItems] = useState<string[]>([])
  const [randomText, setRandomText] = useState<string | null>(null)
  const [removeSelectedItem, setRemoveSelectedItem] = useState<boolean>(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  const [error, setError] = useState<string | null>(null)

  // Update textItems whenever textList changes
  useEffect(() => {
    const items = textList
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0)
    setTextItems(items)
  }, [textList])

  // Select a random item from the text list
  const generateRandomText = () => {
    setError(null)
    
    try {
      if (textItems.length === 0) {
        setError('Vui lòng nhập danh sách của bạn')
        return
      }
      
      const randomIndex = Math.floor(Math.random() * textItems.length)
      setRandomText(textItems[randomIndex])
      setSelectedIndex(randomIndex)
      
      // Remove the selected item if option is enabled
      if (removeSelectedItem) {
        removeItem(randomIndex)
      }
    } catch (error) {
      console.error('Error generating text:', error)
      setError('Có lỗi xảy ra khi chọn ngẫu nhiên. Vui lòng thử lại.')
    }
  }
  
  // Remove an item from the list
  const removeItem = (index: number) => {
    if (index < 0 || index >= textItems.length) return
    
    const updatedItems = [...textItems]
    updatedItems.splice(index, 1)
    
    // Convert back to string for textarea
    setTextList(updatedItems.join('\n'))
  }
  
  // Remove the currently selected item
  const removeCurrentItem = () => {
    if (selectedIndex >= 0) {
      removeItem(selectedIndex)
      setSelectedIndex(-1)
    }
  }
  
  // Shuffle the items in the list
  const shuffleItems = () => {
    if (textItems.length <= 1) return
    
    const shuffled = [...textItems]
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    setTextList(shuffled.join('\n'))
  }
  
  // Sort items alphabetically (A->Z)
  const sortItemsAscending = () => {
    if (textItems.length <= 1) return
    
    const sorted = [...textItems].sort((a, b) => a.localeCompare(b, 'vi'))
    setTextList(sorted.join('\n'))
  }
  
  // Sort items in reverse alphabetical order (Z->A)
  const sortItemsDescending = () => {
    if (textItems.length <= 1) return
    
    const sorted = [...textItems].sort((a, b) => b.localeCompare(a, 'vi'))
    setTextList(sorted.join('\n'))
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="p-8">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-800 mb-2">📝 Text Generator</h1>
                <p className="text-gray-600">
                  Chọn ngẫu nhiên một mục từ danh sách của bạn.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-blue-800">
                      Danh sách (mỗi dòng là một mục)
                    </label>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={shuffleItems}
                        disabled={textItems.length <= 1}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:text-blue-800 hover:bg-blue-100 disabled:opacity-50 disabled:pointer-events-none transition-all"
                        title="Xáo trộn danh sách"
                      >
                        <ArrowsUpDownIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={sortItemsAscending}
                        disabled={textItems.length <= 1}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:text-blue-800 hover:bg-blue-100 disabled:opacity-50 disabled:pointer-events-none transition-all"
                        title="Sắp xếp A-Z"
                      >
                        <ArrowUpIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={sortItemsDescending}
                        disabled={textItems.length <= 1}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:text-blue-800 hover:bg-blue-100 disabled:opacity-50 disabled:pointer-events-none transition-all"
                        title="Sắp xếp Z-A"
                      >
                        <ArrowDownIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={textList}
                    onChange={(e) => setTextList(e.target.value)}
                    placeholder="Nhập danh sách của bạn ở đây, mỗi dòng một mục"
                    rows={6}
                    className="w-full rounded-xl border-2 border-blue-200 px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-600">
                    {textItems.length > 0 ? (
                      <p>Có {textItems.length} mục trong danh sách</p>
                    ) : (
                      <p>Vui lòng nhập danh sách của bạn</p>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={removeSelectedItem}
                        onChange={(e) => setRemoveSelectedItem(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-blue-300"
                      />
                      <span className="ml-2 text-sm text-blue-600">Xóa sau khi chọn</span>
                    </label>
                  </div>
                </div>
                
                <button
                  onClick={generateRandomText}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                  disabled={textItems.length === 0}
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  <span className="font-medium">Chọn ngẫu nhiên</span>
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {randomText !== null && !error && (
                <div className="mt-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-200 text-center transform transition-all hover:scale-[1.02]">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-blue-600 mb-3">Kết quả</p>
                        <p className="text-2xl font-medium text-blue-800 break-words">{randomText}</p>
                      </div>
                      
                      {!removeSelectedItem && selectedIndex >= 0 && (
                        <button
                          onClick={removeCurrentItem}
                          className="p-2 text-blue-600 hover:text-red-500 transition-colors"
                          title="Xóa mục này khỏi danh sách"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
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