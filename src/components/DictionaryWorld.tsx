'use client'

import { useState, useEffect } from 'react'
import { dictionaryService } from '@/lib/dictionary-service'
import { useTabState } from '@/hooks/useTabState'
import { SpeakerWaveIcon, XMarkIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'
import { BookmarkIcon, DocumentArrowUpIcon, LanguageIcon } from '@heroicons/react/24/outline'
import { VocabularyService } from '@/lib/vocabulary-service'
import { SUPPORTED_LANGUAGES } from '@/constants/languages'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'

interface VocabularyItem {
  id?: string;
  word: string
  meaning: string
  pronunciation: string
  example: string
  translation: string
  language?: string
  topic?: string
}

export default function DictionaryWorld() {
  const { user } = useAuth()
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [nativeLanguage, setNativeLanguage] = useState('vi')
  const [searchWord, setSearchWord] = useState('')
  const [searchResult, setSearchResult] = useState<VocabularyItem | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookmarkedWords, setBookmarkedWords] = useState<VocabularyItem[]>([])

  // Load bookmarked words from Firestore on component mount or when user changes
  useEffect(() => {
    const loadBookmarkedWords = async () => {
      if (!user) {
        setBookmarkedWords([])
        return
      }

      try {
        const q = query(
          collection(db, 'bookmarkedWords'),
          where('userId', '==', user.uid)
        )
        const querySnapshot = await getDocs(q)
        const words = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VocabularyItem[]
        setBookmarkedWords(words)
      } catch (error) {
        console.error('Error loading bookmarked words:', error)
      }
    }

    loadBookmarkedWords()
  }, [user])

  const toggleBookmark = async (word: VocabularyItem) => {
    if (!user) {
      alert('Vui lòng đăng nhập để lưu từ vựng')
      return
    }

    try {
      if (isBookmarked(word.word)) {
        // Remove from Firestore
        const wordDoc = bookmarkedWords.find(w => w.word === word.word)
        if (wordDoc?.id) {
          await deleteDoc(doc(db, 'bookmarkedWords', wordDoc.id))
        }
        setBookmarkedWords(prev => prev.filter(w => w.word !== word.word))
      } else {
        // Add to Firestore
        const wordData = {
          ...word,
          userId: user.uid,
          language: targetLanguage,
          createdAt: new Date().toISOString()
        }
        const docRef = await addDoc(collection(db, 'bookmarkedWords'), wordData)
        setBookmarkedWords(prev => [...prev, { ...wordData, id: docRef.id }])
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      alert('Có lỗi xảy ra khi lưu từ vựng')
    }
  }

  const isBookmarked = (word: string) => {
    return bookmarkedWords.some(w => w.word === word)
  }

  const playPronunciation = (word: string, language: string) => {
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = language
    window.speechSynthesis.speak(utterance)
  }

  const handleSearch = async () => {
    if (!searchWord.trim()) return

    setIsSearching(true)
    setError(null)
    setSearchResult(null)

    try {
      const data = await VocabularyService.generateVocabulary({
        targetLanguage,
        nativeLanguage,
        topic: '',
        searchWord: searchWord.trim(),
        wordCount: 1
      })

      if (data.vocabulary && data.vocabulary.length > 0) {
        setSearchResult(data.vocabulary[0])
      } else {
        throw new Error('Không tìm thấy từ này')
      }
    } catch (error) {
      console.error('Search error:', error)
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tra từ')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="max-w-[800px] mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900">Tra từ điển</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <LanguageIcon className="h-5 w-5 text-primary/60" />
                Ngôn ngữ cần tra
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/30 hover:border-primary/50"
              >
                {SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'auto' && lang.code !== nativeLanguage).map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <LanguageIcon className="h-5 w-5 text-primary/60" />
                Ngôn ngữ mẹ đẻ
              </label>
              <select
                value={nativeLanguage}
                onChange={(e) => setNativeLanguage(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/30 hover:border-primary/50"
              >
                {SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'auto' && lang.code !== targetLanguage).map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <DocumentArrowUpIcon className="h-5 w-5 text-primary/60" />
              Nhập từ cần tra
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                placeholder="Nhập từ cần tra..."
                className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-gray-50/30 hover:border-primary/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchWord.trim()) {
                    handleSearch()
                  }
                }}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchWord.trim()}
                className={`px-4 py-3 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-[1.02] ${
                  isSearching || !searchWord.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gray-800 hover:bg-gray-900 shadow-md hover:shadow-lg'
                }`}
              >
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </span>
                ) : (
                  'Tra từ'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 flex items-center gap-2 text-sm">
              <XMarkIcon className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {searchResult && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium text-gray-900">{searchResult.word}</h3>
                    <button
                      onClick={() => toggleBookmark(searchResult)}
                      className="text-primary hover:text-primary/80 transition-colors transform hover:scale-110 duration-200"
                    >
                      {isBookmarked(searchResult.word) ? (
                        <BookmarkSolidIcon className="h-5 w-5" />
                      ) : (
                        <BookmarkIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{searchResult.pronunciation}</p>
                </div>
                <button
                  onClick={() => playPronunciation(searchResult.word, targetLanguage)}
                  className="p-2 text-gray-400 hover:text-primary transition-colors transform hover:scale-110 duration-200"
                >
                  <SpeakerWaveIcon className="h-5 w-5" />
                </button>
              </div>

              <p className="text-gray-700 text-base">{searchResult.meaning}</p>
              <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 space-y-2">
                <p className="text-gray-600 text-sm">{searchResult.example}</p>
                <p className="text-gray-500 text-sm">{searchResult.translation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 