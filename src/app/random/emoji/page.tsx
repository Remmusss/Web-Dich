'use client'

import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// Common emoji categories
const emojiCategories: Record<string, string[]> = {
  all: [], // Will be populated with all emojis
  faces: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️', '🕸️', '🦂', '🦟', '🦠', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🦔'],
  food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍷', '🥂', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢', '🧂'],
  objects: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '🪙', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🪝', '🧲', '🔫', '💣', '🪃', '🧨', '🪄', '⚔️', '🗡️', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🪥', '🧼', '🪒', '🧽', '🪣', '🧴', '🛎️', '🔑', '🗝️', '🪑', '🪞', '🪟', '🛋️', '🛏️', '🪤', '🪡', '🧸', '🪮', '🪢', '🧶', '🧵', '🪡', '🧥', '🥼', '🦺', '👚', '👕', '👖', '🩲', '🩳', '👔', '👗', '👙', '🩱', '👘', '🥻', '🩴', '🥿', '👠', '👡', '👢', '👞', '👟', '🥾', '🧦', '🧤', '🧣', '🎩', '🧢', '👒', '🎓', '⛑️', '🪖', '👑', '💎', '👑', '👝', '👛', '👜', '💼', '🎒', '🪧', '🧳', '👓', '🎥', '🥽', '🦯', '🧮']
}

// Populate all category with all emojis
Object.keys(emojiCategories).forEach(category => {
  if (category !== 'all') {
    emojiCategories.all.push(...emojiCategories[category as keyof typeof emojiCategories])
  }
})

// Category metadata
const categoryMetadata = {
  all: {
    name: 'Tất cả',
    description: 'Tất cả các emoji',
    preview: ['😀', '🐶', '🍎', '📱', '🎮', '🎵', '🎨', '🎭']
  },
  faces: {
    name: 'Khuôn mặt',
    description: 'Biểu tượng cảm xúc và khuôn mặt',
    preview: ['😀', '😊', '😂', '🥰', '😎', '🤔', '😴', '🤯']
  },
  animals: {
    name: 'Động vật',
    description: 'Các loài động vật và sinh vật',
    preview: ['🐶', '🐱', '🦊', '🐼', '🦁', '🐬', '🦄', '🦋']
  },
  food: {
    name: 'Đồ ăn',
    description: 'Thức ăn và đồ uống',
    preview: ['🍎', '🍕', '🍜', '🍣', '🍰', '☕', '🍺', '🍷']
  },
  objects: {
    name: 'Đồ vật',
    description: 'Các vật dụng và đồ vật',
    preview: ['📱', '💻', '⌚', '🎮', '📚', '🎵', '🎨', '🎭']
  }
}

export default function RandomEmojiPage() {
  const [emojiResult, setEmojiResult] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [emojiHistory, setEmojiHistory] = useState<{emoji: string, timestamp: string}[]>([])
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof emojiCategories>('all')
  const [error, setError] = useState<string | null>(null)
  
  // Generate a random emoji
  const generateEmoji = () => {
    setError(null)
    setIsGenerating(true)
    
    try {
      setTimeout(() => {
        const category = emojiCategories[selectedCategory]
        const randomIndex = Math.floor(Math.random() * category.length)
        const result = category[randomIndex]
        
        setEmojiResult(result)
        setIsGenerating(false)
        
        // Add to history (max 24 entries)
        const timestamp = new Date().toLocaleTimeString()
        setEmojiHistory(prev => {
          const updatedHistory = [{emoji: result, timestamp}, ...prev]
          return updatedHistory.slice(0, 24)
        })
      }, 500)
    } catch (error) {
      console.error('Error generating emoji:', error)
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo emoji ngẫu nhiên')
      setIsGenerating(false)
    }
  }
  
  // Reset history
  const resetHistory = () => {
    setEmojiHistory([])
    setEmojiResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="p-8">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-800 mb-2">😊 Random Emoji</h1>
                <p className="text-gray-600">
                  Tạo emoji ngẫu nhiên từ các danh mục khác nhau.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-3">Chọn danh mục emoji</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.keys(categoryMetadata) as Array<keyof typeof categoryMetadata>).map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedCategory === category
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-blue-100 hover:border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-blue-800 mb-1">{categoryMetadata[category].name}</h3>
                            <p className="text-sm text-blue-600 mb-2">{categoryMetadata[category].description}</p>
                            <div className="flex flex-wrap gap-1">
                              {categoryMetadata[category].preview.map((emoji, index) => (
                                <span key={index} className="text-xl">{emoji}</span>
                              ))}
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            selectedCategory === category
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-blue-200'
                          }`}>
                            {selectedCategory === category && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={generateEmoji}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span className="font-medium">{isGenerating ? 'Đang tạo...' : 'Tạo emoji ngẫu nhiên'}</span>
                </button>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {(emojiResult !== null || isGenerating) && (
                <div className="mt-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-200 text-center transform transition-all hover:scale-[1.02]">
                    <p className="text-6xl font-bold text-blue-800">
                      {isGenerating ? '...' : emojiResult}
                    </p>
                  </div>
                </div>
              )}
              
              {emojiHistory.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-blue-800">📜 Lịch sử tạo emoji</p>
                    <button 
                      onClick={resetHistory}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Xóa lịch sử
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-4">
                    <div className="flex flex-wrap gap-3 items-center">
                      {emojiHistory.map((item, index) => (
                        <div 
                          key={index} 
                          className="relative group"
                          title={`Tạo lúc ${item.timestamp}`}
                        >
                          <span className="text-2xl hover:scale-110 transition-transform cursor-default">
                            {item.emoji}
                          </span>
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