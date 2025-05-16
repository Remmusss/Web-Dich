'use client'

import { useState, useRef, useEffect } from 'react'
import { ClipboardDocumentIcon, SparklesIcon, HandRaisedIcon } from '@heroicons/react/24/outline'
import { aiService } from '@/lib/ai-service'
import { useToast } from '@/hooks/use-toast'

interface Message {
    id: number;
    text: string;
    isMe: boolean;
    isTranslating: boolean;
}

type Gender = 'male' | 'female' | 'gay' | 'lesbian';

export default function FlirtingChat() {
    const [text, setText] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isTranslating, setIsTranslating] = useState(false)
    const [copySuccess, setCopySuccess] = useState<{id: number, type: 'original' | 'translated' | 'main'} | null>(null)
    const [targetgender, setTargetGender] = useState<Gender>('male')
    const [responseCount, setResponseCount] = useState(1)
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [showCustomInput, setShowCustomInput] = useState(false)
    const [customScenario, setCustomScenario] = useState('')
    
    // Add ref for chat container
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const { toast } = useToast()

    // Auto scroll to bottom when messages change
    useEffect(() => {
        if (chatContainerRef.current) {
            const scrollContainer = chatContainerRef.current
            // Smooth scroll to bottom
            scrollContainer.scrollTo({
                top: scrollContainer.scrollHeight,
                behavior: 'smooth'
            })
        }
    }, [messages])

    const handleCopy = async (text: string, messageId: number, type: 'original' | 'translated' | 'main') => {
        try {
            await navigator.clipboard.writeText(text)
            setCopySuccess({ id: messageId, type })
            setTimeout(() => setCopySuccess(null), 2000)
            toast({
                title: "Thành công",
                description: "Đã sao chép vào clipboard!",
                variant: "default",
            })
        } catch (err) {
            console.error('Failed to copy text:', err)
            toast({
                title: "Lỗi",
                description: "Không thể sao chép văn bản",
                variant: "destructive",
            })
        }
    }

    const generateAIResponse = async (userMessage: string) => {
        setIsTranslating(true)

        try {
            // Generate AI response
            const prompt = `Bạn là một chuyên gia tán tỉnh. Bạn đang giúp người dùng tán tỉnh một người ${targetgender === 'male' ? 'nam' : targetgender === 'female' ? 'nữ' : targetgender === 'gay' ? 'nam (gay)' : 'nữ (lesbian)'}. 
Hãy tạo ${responseCount} câu trả lời phù hợp để tán tỉnh người đó. Sử dụng ngôn ngữ thân mật, đơn giản và tự nhiên như trong cuộc sống hàng ngày. Tránh sử dụng từ ngữ quá trang trọng hoặc phức tạp.

Tin nhắn từ đối phương: "${userMessage}"

Chỉ trả lời ${responseCount} tin nhắn, mỗi tin nhắn một dòng, không giải thích thêm.`

            const aiResponse = await aiService.processWithAI(prompt)
            const responses = aiResponse.split('\n').filter(line => line.trim())

            // Add AI responses to messages
            responses.forEach(response => {
                const newMessage: Message = {
                    id: Date.now() + Math.random(),
                    text: response.trim(),
                    isMe: false,
                    isTranslating: false
                }
                setMessages(prev => [...prev, newMessage])
            })
        } catch (error) {
            console.error('AI response error:', error)
            toast({
                title: "Lỗi",
                description: "Có lỗi xảy ra khi tạo phản hồi. Vui lòng thử lại.",
                variant: "destructive",
            })
        } finally {
            setIsTranslating(false)
        }
    }

    const generateSuggestions = async (type: 'opening' | 'goodbye' | 'goodnight' | 'meet' | 'food' | 'breakup' | 'flirt' | 'apology') => {
        setIsTranslating(true)
        setShowSuggestions(true)

        try {
            const prompt = `Bạn là một chuyên gia tán tỉnh. Bạn đang giúp người dùng tán tỉnh một người ${targetgender === 'male' ? 'nam' : targetgender === 'female' ? 'nữ' : targetgender === 'gay' ? 'nam (gay)' : 'nữ (lesbian)'}. 
Hãy tạo ${responseCount} ${type === 'opening' ? 'câu mở đầu' : type === 'goodbye' ? 'câu tạm biệt' : type === 'goodnight' ? 'câu chúc ngủ ngon' : type === 'meet' ? 'câu hẹn gặp' : type === 'food' ? 'câu hỏi xem đã ăn cơm chưa' : type === 'breakup' ? 'câu nói chia tay' : type === 'flirt' ? 'câu tán tỉnh' : 'câu xin lỗi'} phù hợp để tán tỉnh người đó. Sử dụng ngôn ngữ thân mật, đơn giản và tự nhiên như trong cuộc sống hàng ngày. Tránh sử dụng từ ngữ quá trang trọng hoặc phức tạp.

Chỉ trả lời ${responseCount} tin nhắn, mỗi tin nhắn một dòng, không giải thích thêm.`

            const aiResponse = await aiService.processWithAI(prompt)
            const responses = aiResponse.split('\n').filter(line => line.trim())
            setSuggestions(responses)
        } catch (error) {
            console.error('AI response error:', error)
            toast({
                title: "Lỗi",
                description: "Có lỗi xảy ra khi tạo gợi ý. Vui lòng thử lại.",
                variant: "destructive",
            })
        } finally {
            setIsTranslating(false)
        }
    }

    const generateCustomSuggestions = async () => {
        if (!customScenario.trim()) return
        
        setIsTranslating(true)
        setShowSuggestions(true)

        try {
            const prompt = `Bạn là một chuyên gia tán tỉnh. Bạn đang giúp người dùng tán tỉnh một người ${targetgender === 'male' ? 'nam' : targetgender === 'female' ? 'nữ' : targetgender === 'gay' ? 'nam (gay)' : 'nữ (lesbian)'}. 
Hãy tạo ${responseCount} câu trả lời phù hợp cho tình huống sau: "${customScenario}". Sử dụng ngôn ngữ thân mật, đơn giản và tự nhiên như trong cuộc sống hàng ngày. Tránh sử dụng từ ngữ quá trang trọng hoặc phức tạp.

Chỉ trả lời ${responseCount} tin nhắn, mỗi tin nhắn một dòng, không giải thích thêm.`

            const aiResponse = await aiService.processWithAI(prompt)
            const responses = aiResponse.split('\n').filter(line => line.trim())
            setSuggestions(responses)
        } catch (error) {
            console.error('AI response error:', error)
            toast({
                title: "Lỗi",
                description: "Có lỗi xảy ra khi tạo gợi ý. Vui lòng thử lại.",
                variant: "destructive",
            })
        } finally {
            setIsTranslating(false)
        }
    }

    const handleSendMessage = async () => {
        if (!text.trim()) return

        // Add user message
        const userMessage: Message = {
            id: Date.now(),
            text: text.trim(),
            isMe: true,
            isTranslating: false
        }

        setMessages(prev => [...prev, userMessage])
        setText('')

        // Generate AI response
        await generateAIResponse(text.trim())
    }

    const handleSuggestionClick = (suggestion: string) => {
        setText(suggestion)
        setShowSuggestions(false)
        setSuggestions([])
    }

    return (
        <div className="space-y-4 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Gender Selection */}
                <div className="p-3 sm:p-4 border-b border-gray-100">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Giới tính của đối phương:</label>
                                <div className="group relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4" />
                                        <path d="M12 8h.01" />
                                    </svg>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                                        Chọn giới tính của người bạn muốn tán tỉnh
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setTargetGender('male')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                        targetgender === 'male'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="8" r="5" />
                                        <path d="M20 21v-2a8 8 0 0 0-16 0v2" />
                                    </svg>
                                    Nam
                                </button>
                                <button
                                    onClick={() => setTargetGender('female')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                        targetgender === 'female'
                                            ? 'bg-pink-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="8" r="5" />
                                        <path d="M20 21v-2a8 8 0 0 0-16 0v2" />
                                        <path d="M12 8v8" />
                                        <path d="M8 12h8" />
                                    </svg>
                                    Nữ
                                </button>
                                <button
                                    onClick={() => setTargetGender('gay')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                        targetgender === 'gay'
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="8" r="5" />
                                        <path d="M20 21v-2a8 8 0 0 0-16 0v2" />
                                        <path d="M12 8v8" />
                                    </svg>
                                    Gay
                                </button>
                                <button
                                    onClick={() => setTargetGender('lesbian')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                        targetgender === 'lesbian'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="8" r="5" />
                                        <path d="M20 21v-2a8 8 0 0 0-16 0v2" />
                                        <path d="M12 8v8" />
                                        <path d="M8 12h8" />
                                    </svg>
                                    Lesbian
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-4">
                            <label className="text-sm font-medium text-gray-700">Số câu trả lời:</label>
                            <select
                                value={responseCount}
                                onChange={(e) => setResponseCount(Number(e.target.value))}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                {[1, 2, 3, 4, 5].map(num => (
                                    <option key={num} value={num}>{num}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Suggestion Buttons */}
                <div className="p-3 sm:p-4 border-b border-gray-100">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                            onClick={() => generateSuggestions('opening')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <SparklesIcon className="h-5 w-5" />
                            Câu mở đầu
                        </button>
                        <button
                            onClick={() => generateSuggestions('goodbye')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <HandRaisedIcon className="h-5 w-5" />
                            Câu tạm biệt
                        </button>
                        <button
                            onClick={() => generateSuggestions('goodnight')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                            Chúc ngủ ngon
                        </button>
                        <button
                            onClick={() => generateSuggestions('meet')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Muốn làm quen
                        </button>
                        <button
                            onClick={() => generateSuggestions('food')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                                <line x1="6" y1="1" x2="6" y2="4" />
                                <line x1="10" y1="1" x2="10" y2="4" />
                                <line x1="14" y1="1" x2="14" y2="4" />
                            </svg>
                            Hỏi ăn cơm
                        </button>
                        <button
                            onClick={() => generateSuggestions('breakup')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                            Chia tay
                        </button>
                        <button
                            onClick={() => generateSuggestions('flirt')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-pink-50 text-pink-600 hover:bg-pink-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0L12 5.34l-.77-.76a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
                            </svg>
                            Tán tỉnh
                        </button>
                        <button
                            onClick={() => generateSuggestions('apology')}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                            </svg>
                            Xin lỗi
                        </button>
                        <button
                            onClick={() => setShowCustomInput(true)}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-teal-50 text-teal-600 hover:bg-teal-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            Tình huống khác
                        </button>
                    </div>

                    {/* Custom Input */}
                    {showCustomInput && (
                        <div className="mt-4 flex flex-col gap-3">
                            <textarea
                                value={customScenario}
                                onChange={(e) => setCustomScenario(e.target.value)}
                                placeholder="Nhập tình huống bạn muốn AI tạo câu trả lời..."
                                className="w-full h-20 p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none bg-gray-50/50"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowCustomInput(false)
                                        setCustomScenario('')
                                    }}
                                    className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={generateCustomSuggestions}
                                    disabled={isTranslating || !customScenario.trim()}
                                    className="px-4 py-2 rounded-lg font-medium bg-teal-600 text-white hover:bg-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Tạo câu trả lời
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Suggestions Panel */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="space-y-2">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="w-full text-left p-2 rounded-lg hover:bg-white transition-all duration-200"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat Messages */}
                <div 
                    ref={chatContainerRef}
                    className="h-[400px] sm:h-[600px] overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50/50"
                >
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex flex-col ${message.isMe ? 'items-start' : 'items-end'}`}
                        >
                            {/* Main Message Bubble */}
                            <div
                                className={`max-w-[90%] sm:max-w-[80%] p-2.5 sm:p-3 rounded-2xl mb-1 group relative
                                    ${message.isMe
                                        ? 'bg-primary text-white rounded-tl-none'
                                        : 'bg-white border border-gray-200 rounded-tr-none'
                                    }`}
                            >
                                {message.isTranslating ? (
                                    <div className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                                        <span>...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm sm:text-base flex-1">
                                            {message.text}
                                        </p>
                                        <button
                                            onClick={() => handleCopy(message.text, message.id, 'main')}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                                                message.isMe 
                                                    ? 'hover:bg-white/20 text-white/80 hover:text-white' 
                                                    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                                            }`}
                                            title="Copy message"
                                        >
                                            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-3 sm:p-4 border-t border-gray-100">
                    <div className="relative">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage()
                                }
                            }}
                            placeholder="Nhập tin nhắn của đối phương..."
                            className="w-full h-16 sm:h-20 p-2.5 sm:p-3 pr-20 sm:pr-24 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none bg-gray-50/50"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isTranslating || !text.trim()}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-white text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                isTranslating || !text.trim()
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gray-800 hover:bg-gray-900 shadow-sm hover:shadow-md'
                            }`}
                        >
                            {isTranslating ? (
                                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
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
                            ) : (
                                'Gửi'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
} 