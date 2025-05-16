'use client'

import { useState } from 'react'
import { ArrowPathIcon, ClipboardIcon } from '@heroicons/react/24/outline'
import { aiService } from '@/lib/ai-service'

interface Profile {
  fullName: string
  age: number
  gender: string
  location: string
  occupation: string
  education: string
  interests: string[]
  bio: string
  email: string
  phone: string
  socialMedia: {
    platform: string
    username: string
  }[]
}

// Danh sách quốc gia
const countries = [
  'Việt Nam',
  'Trung Quốc',
  'United States',
  'United Kingdom',
  'Japan',
  'South Korea',
  'China',
  'Singapore',
  'Australia',
  'Canada',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Russia',
  'Brazil',
  'India',
  'Thailand',
  'Malaysia',
  'Indonesia',
  'Philippines'
]

export default function RandomProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [profileHistory, setProfileHistory] = useState<{profile: Profile, timestamp: string}[]>([])
  const [copied, setCopied] = useState<boolean>(false)
  const [hint, setHint] = useState<string>('')
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  
  // Generate a random profile
  const generateProfile = async () => {
    setIsGenerating(true)
    setCopied(false)
    
    try {
      const prompt = `Tạo một profile người dùng giả mạo nhưng có vẻ thật. ${hint ? `Dựa trên gợi ý: "${hint}"` : ''} ${selectedCountry ? `Từ quốc gia: "${selectedCountry}"` : ''}

Yêu cầu:
- Trả về profile dưới dạng JSON thuần túy với các trường sau:
  - fullName: Tên đầy đủ (phù hợp với quốc gia được chọn)
  - age: Tuổi (18-65)
  - gender: Giới tính
  - location: Địa điểm (thành phố, quốc gia)
  - occupation: Nghề nghiệp
  - education: Học vấn
  - interests: Mảng các sở thích (3-5 mục)
  - bio: Tiểu sử ngắn (2-3 câu)
  - email: Email giả mạo
  - phone: Số điện thoại giả mạo
  - socialMedia: Mảng các tài khoản mạng xã hội (2-3 platform)
- Thông tin phải có vẻ thật và hợp lý
- CHỈ trả về JSON thuần túy, không có markdown hoặc text khác
- KHÔNG có giải thích hoặc văn bản thêm`;

      const result = await aiService.processWithAI(prompt)
      // Remove markdown and clean the response
      const cleanResult = result
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      const generatedProfile = JSON.parse(cleanResult) as Profile
      
      setProfile(generatedProfile)
      
      // Add to history (max 24 entries)
      const timestamp = new Date().toLocaleTimeString()
      setProfileHistory(prev => {
        const updatedHistory = [{profile: generatedProfile, timestamp}, ...prev]
        return updatedHistory.slice(0, 24)
      })
    } catch (error) {
      console.error('Error generating profile:', error)
      setProfile(null)
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Copy profile to clipboard
  const copyToClipboard = async () => {
    if (profile) {
      try {
        const profileText = JSON.stringify(profile, null, 2)
        await navigator.clipboard.writeText(profileText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }
  }
  
  // Reset history
  const resetHistory = () => {
    setProfileHistory([])
    setProfile(null)
    setCopied(false)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">👤 Random Profile</h1>
                <p className="text-gray-600">
                  Tạo profile người dùng giả mạo nhưng có vẻ thật.
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Gợi ý profile (tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="Nhập gợi ý (ví dụ: developer, artist, student)"
                      value={hint}
                      onChange={(e) => setHint(e.target.value)}
                      className="w-full rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Quốc gia (tùy chọn)</label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                    >
                      <option value="">Chọn quốc gia</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={generateProfile}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span className="font-medium">{isGenerating ? 'Đang tạo...' : 'Tạo profile'}</span>
                </button>

                {(profile !== null || isGenerating) && (
                  <div className="mt-8">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200">
                      {isGenerating ? (
                        <div className="text-center text-gray-600">Đang tạo profile...</div>
                      ) : profile && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">{profile.fullName}</h2>
                            <button
                              onClick={copyToClipboard}
                              disabled={copied}
                              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors disabled:opacity-50"
                            >
                              <ClipboardIcon className="w-5 h-5 text-gray-600" />
                              <span className="text-sm font-medium text-gray-800">
                                {copied ? 'Đã sao chép!' : 'Sao chép'}
                              </span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Tuổi</p>
                              <p className="font-medium text-gray-800">{profile.age}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Giới tính</p>
                              <p className="font-medium text-gray-800">{profile.gender}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Địa điểm</p>
                              <p className="font-medium text-gray-800">{profile.location}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Nghề nghiệp</p>
                              <p className="font-medium text-gray-800">{profile.occupation}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Học vấn</p>
                              <p className="font-medium text-gray-800">{profile.education}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-medium text-gray-800">{profile.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Điện thoại</p>
                              <p className="font-medium text-gray-800">{profile.phone}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600 mb-2">Sở thích</p>
                            <div className="flex flex-wrap gap-2">
                              {profile.interests.map((interest, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-white border-2 border-gray-200 rounded-full text-sm text-gray-800"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600 mb-2">Tiểu sử</p>
                            <p className="text-gray-800">{profile.bio}</p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600 mb-2">Mạng xã hội</p>
                            <div className="space-y-2">
                              {profile.socialMedia.map((social, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-white px-4 py-2 rounded-lg border-2 border-gray-200"
                                >
                                  <span className="font-medium text-gray-800">{social.platform}</span>
                                  <span className="text-gray-600">{social.username}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              
                {profileHistory.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-800">📜 Lịch sử profile</p>
                      <button 
                        onClick={resetHistory}
                        className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Xóa lịch sử
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
                      <div className="space-y-3">
                        {profileHistory.map((item, index) => (
                          <div 
                            key={index} 
                            className="relative group"
                            title={`Tạo lúc ${item.timestamp}`}
                          >
                            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
                              <div>
                                <span className="font-medium text-gray-800">{item.profile.fullName}</span>
                                <span className="text-sm text-gray-600 ml-2">({item.profile.occupation})</span>
                              </div>
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
    </div>
  )
}