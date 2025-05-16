'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowPathIcon, 
  ListBulletIcon, 
  CalculatorIcon,
  TrashIcon,
  SwatchIcon,
  KeyIcon,
  CubeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

export default function RandomGenerator() {
  // States for number generation
  const [minNumber, setMinNumber] = useState<number>(1)
  const [maxNumber, setMaxNumber] = useState<number>(100)
  const [randomNumber, setRandomNumber] = useState<number | null>(null)
  
  // States for text selection
  const [textList, setTextList] = useState<string>('')
  const [textItems, setTextItems] = useState<string[]>([])
  const [randomText, setRandomText] = useState<string | null>(null)
  const [removeSelectedItem, setRemoveSelectedItem] = useState<boolean>(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)
  
  // States for random color generation
  const [randomColor, setRandomColor] = useState<string | null>(null)
  
  // States for password generation
  const [passwordLength, setPasswordLength] = useState<number>(12)
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true)
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true)
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true)
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true)
  const [randomPassword, setRandomPassword] = useState<string | null>(null)
  
  // States for dice roll
  const [diceCount, setDiceCount] = useState<number>(1)
  const [diceSides, setDiceSides] = useState<number>(6)
  const [diceResults, setDiceResults] = useState<number[]>([])
  const [diceTotal, setDiceTotal] = useState<number | null>(null)
  
  // States for coin flip
  const [coinResult, setCoinResult] = useState<string | null>(null)
  
  // Active tab: 'number', 'text', 'color', 'password', 'dice', or 'coin'
  const [activeTab, setActiveTab] = useState<'number' | 'text' | 'color' | 'password' | 'dice' | 'coin'>('number')

  // Update textItems whenever textList changes
  useEffect(() => {
    const items = textList
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0)
    setTextItems(items)
  }, [textList])

  // Generate a random number within the specified range
  const generateRandomNumber = () => {
    if (minNumber > maxNumber) {
      // Swap values if min is greater than max
      const temp = minNumber
      setMinNumber(maxNumber)
      setMaxNumber(temp)
    }
    
    const min = Math.ceil(minNumber)
    const max = Math.floor(maxNumber)
    const result = Math.floor(Math.random() * (max - min + 1)) + min
    setRandomNumber(result)
  }

  // Select a random item from the text list
  const generateRandomText = () => {
    if (textItems.length === 0) {
      setRandomText('Vui lòng nhập danh sách của bạn')
      return
    }
    
    const randomIndex = Math.floor(Math.random() * textItems.length)
    setRandomText(textItems[randomIndex])
    setSelectedIndex(randomIndex)
    
    // Remove the selected item if option is enabled
    if (removeSelectedItem) {
      removeItem(randomIndex)
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
  
  // Generate a random color
  const generateRandomColor = () => {
    const randomHex = Math.floor(Math.random() * 16777215).toString(16)
    const hexColor = `#${randomHex.padStart(6, '0')}`
    setRandomColor(hexColor)
  }
  
  // Generate a random password
  const generateRandomPassword = () => {
    if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
      setRandomPassword('Vui lòng chọn ít nhất một loại ký tự')
      return
    }
    
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
    const numberChars = '0123456789'
    const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    let allowedChars = ''
    if (includeUppercase) allowedChars += uppercaseChars
    if (includeLowercase) allowedChars += lowercaseChars
    if (includeNumbers) allowedChars += numberChars
    if (includeSymbols) allowedChars += symbolChars
    
    let password = ''
    for (let i = 0; i < passwordLength; i++) {
      const randomIndex = Math.floor(Math.random() * allowedChars.length)
      password += allowedChars[randomIndex]
    }
    
    setRandomPassword(password)
  }
  
  // Roll dice
  const rollDice = () => {
    const results: number[] = []
    let total = 0
    
    for (let i = 0; i < diceCount; i++) {
      const roll = Math.floor(Math.random() * diceSides) + 1
      results.push(roll)
      total += roll
    }
    
    setDiceResults(results)
    setDiceTotal(total)
  }
  
  // Flip a coin
  const flipCoin = () => {
    const result = Math.random() < 0.5 ? 'Mặt sấp' : 'Mặt ngửa'
    setCoinResult(result)
  }

  return (
    <div className="container mx-auto px-4 max-w-3xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex flex-wrap border-b border-gray-100">
          <button
            onClick={() => setActiveTab('number')}
            className={`flex-1 py-3 font-medium text-sm ${
              activeTab === 'number'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CalculatorIcon className="w-4 h-4" />
              <span>Số ngẫu nhiên</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 font-medium text-sm ${
              activeTab === 'text'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ListBulletIcon className="w-4 h-4" />
              <span>Văn bản</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('color')}
            className={`flex-1 py-3 font-medium text-sm ${
              activeTab === 'color'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <SwatchIcon className="w-4 h-4" />
              <span>Màu sắc</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-3 font-medium text-sm ${
              activeTab === 'password'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <KeyIcon className="w-4 h-4" />
              <span>Mật khẩu</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('dice')}
            className={`flex-1 py-3 font-medium text-sm ${
              activeTab === 'dice'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CubeIcon className="w-4 h-4" />
              <span>Xúc xắc</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('coin')}
            className={`flex-1 py-3 font-medium text-sm ${
              activeTab === 'coin'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CurrencyDollarIcon className="w-4 h-4" />
              <span>Đồng xu</span>
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'number' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá trị nhỏ nhất
                    </label>
                    <input
                      type="number"
                      value={minNumber}
                      onChange={(e) => setMinNumber(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá trị lớn nhất
                    </label>
                    <input
                      type="number"
                      value={maxNumber}
                      onChange={(e) => setMaxNumber(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>
                </div>
                
                <button
                  onClick={generateRandomNumber}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Tạo số ngẫu nhiên</span>
                </button>
              </div>

              {randomNumber !== null && (
                <div className="mt-6">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 text-center">
                    <p className="text-sm text-gray-500 mb-1">Kết quả</p>
                    <p className="text-3xl font-bold text-gray-900">{randomNumber}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'text' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Danh sách (mỗi dòng là một mục)
                  </label>
                  <textarea
                    value={textList}
                    onChange={(e) => setTextList(e.target.value)}
                    placeholder="Nhập danh sách của bạn ở đây, mỗi dòng một mục"
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
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
                        className="w-4 h-4 text-gray-900 rounded focus:ring-0"
                      />
                      <span className="ml-2 text-sm text-gray-600">Xóa sau khi chọn</span>
                    </label>
                  </div>
                </div>
                
                <button
                  onClick={generateRandomText}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  disabled={textItems.length === 0}
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Chọn ngẫu nhiên</span>
                </button>
              </div>

              {randomText !== null && (
                <div className="mt-6">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Kết quả</p>
                        <p className="text-xl font-medium text-gray-900 break-words">{randomText}</p>
                      </div>
                      
                      {!removeSelectedItem && selectedIndex >= 0 && (
                        <button
                          onClick={removeCurrentItem}
                          className="p-2 text-gray-500 hover:text-red-500 transition-colors"
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
          )}
          
          {activeTab === 'color' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <button
                  onClick={generateRandomColor}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Tạo màu ngẫu nhiên</span>
                </button>
              </div>

              {randomColor && (
                <div className="mt-6">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-500 mb-3">Kết quả</p>
                    <div className="flex flex-col items-center space-y-3">
                      <div 
                        className="w-full h-32 rounded-lg border border-gray-200" 
                        style={{ backgroundColor: randomColor }}
                      />
                      <p className="text-xl font-medium text-gray-900 uppercase">{randomColor}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'password' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Độ dài
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="4"
                      max="32"
                      value={passwordLength}
                      onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-sm font-medium text-gray-600 min-w-[32px]">
                      {passwordLength}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeUppercase}
                      onChange={(e) => setIncludeUppercase(e.target.checked)}
                      className="w-4 h-4 text-gray-900 rounded focus:ring-0"
                    />
                    <span className="ml-2 text-sm text-gray-600">Chữ hoa (A-Z)</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeLowercase}
                      onChange={(e) => setIncludeLowercase(e.target.checked)}
                      className="w-4 h-4 text-gray-900 rounded focus:ring-0"
                    />
                    <span className="ml-2 text-sm text-gray-600">Chữ thường (a-z)</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeNumbers}
                      onChange={(e) => setIncludeNumbers(e.target.checked)}
                      className="w-4 h-4 text-gray-900 rounded focus:ring-0"
                    />
                    <span className="ml-2 text-sm text-gray-600">Số (0-9)</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSymbols}
                      onChange={(e) => setIncludeSymbols(e.target.checked)}
                      className="w-4 h-4 text-gray-900 rounded focus:ring-0"
                    />
                    <span className="ml-2 text-sm text-gray-600">Ký tự đặc biệt</span>
                  </label>
                </div>
                
                <button
                  onClick={generateRandomPassword}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Tạo mật khẩu ngẫu nhiên</span>
                </button>
              </div>

              {randomPassword && (
                <div className="mt-6">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Kết quả</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xl font-medium text-gray-900 font-mono break-all">
                        {randomPassword}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(randomPassword);
                        }}
                        className="ml-2 px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'dice' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số lượng xúc xắc
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={diceCount}
                      onChange={(e) => setDiceCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số mặt mỗi xúc xắc
                    </label>
                    <select
                      value={diceSides}
                      onChange={(e) => setDiceSides(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    >
                      <option value={4}>4 mặt</option>
                      <option value={6}>6 mặt</option>
                      <option value={8}>8 mặt</option>
                      <option value={10}>10 mặt</option>
                      <option value={12}>12 mặt</option>
                      <option value={20}>20 mặt</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={rollDice}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Gieo xúc xắc</span>
                </button>
              </div>

              {diceResults.length > 0 && (
                <div className="mt-6">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-500 mb-3">Kết quả</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {diceResults.map((result, index) => (
                        <div key={index} className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm">
                          <span className="text-xl font-bold">{result}</span>
                        </div>
                      ))}
                    </div>
                    {diceCount > 1 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-500">Tổng</p>
                        <p className="text-2xl font-bold text-gray-900">{diceTotal}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'coin' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <button
                  onClick={flipCoin}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Tung đồng xu</span>
                </button>
              </div>

              {coinResult && (
                <div className="mt-6">
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 text-center">
                    <p className="text-sm text-gray-500 mb-1">Kết quả</p>
                    <div className="w-24 h-24 mx-auto bg-white rounded-full border border-gray-200 shadow-sm flex items-center justify-center my-4">
                      <span className="text-3xl">
                        {coinResult === 'Mặt ngửa' ? '🪙' : '🔄'}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{coinResult}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 