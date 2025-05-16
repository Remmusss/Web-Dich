'use client'

import { useState, useRef, useEffect } from 'react'
import { LanguageIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { aiService } from '@/lib/ai-service'
import { SUPPORTED_LANGUAGES } from '@/constants/languages'
import { useTabState } from '@/hooks/useTabState'

interface Message {
    id: number;
    text: string;
    translation: {
        text: string;
        reading?: string;  // For hiragana/furigana readings
        sourceReading?: string;  // For source text hiragana reading
    };
    isMe: boolean;
    isTranslating: boolean;
}

export default function ConversationTranslator() {
    const [myLanguage, setMyLanguage] = useTabState('conversationMyLanguage', 'en')
    const [theirLanguage, setTheirLanguage] = useTabState('conversationTheirLanguage', 'en')
    const [myText, setMyText] = useState('')
    const [theirText, setTheirText] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [isTranslatingMine, setIsTranslatingMine] = useState(false)
    const [isTranslatingTheirs, setIsTranslatingTheirs] = useState(false)
    const [isAIMode, setIsAIMode] = useTabState('conversationAIMode', false)
    const [copySuccess, setCopySuccess] = useState<{id: number, type: 'original' | 'translated' | 'main'} | null>(null)
    
    // Add ref for chat container
    const chatContainerRef = useRef<HTMLDivElement>(null)

    // Prevent same language selection
    useEffect(() => {
        if (myLanguage === theirLanguage) {
            // If they become the same, pick a different language for theirLanguage
            const availableLanguages = SUPPORTED_LANGUAGES.filter(
                lang => lang.code !== 'auto' && lang.code !== myLanguage
            );
            if (availableLanguages.length > 0) {
                setTheirLanguage(availableLanguages[0].code);
            }
        }
    }, [myLanguage, theirLanguage, setTheirLanguage]);

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
    }, [messages]) // Run effect when messages array changes

    const handleCopy = async (text: string, messageId: number, type: 'original' | 'translated' | 'main') => {
        try {
            await navigator.clipboard.writeText(text)
            setCopySuccess({ id: messageId, type })
            setTimeout(() => setCopySuccess(null), 2000)
        } catch (err) {
            console.error('Failed to copy text:', err)
        }
    }

    const translateAndSend = async (text: string, isMe: boolean) => {
        if (!text.trim()) return

        const sourceLanguage = isMe ? myLanguage : theirLanguage
        const targetLanguage = isMe ? theirLanguage : myLanguage
        const isSourceJapanese = sourceLanguage === 'ja'
        const isTargetJapanese = targetLanguage === 'ja'

        const newMessage: Message = {
            id: Date.now(),
            text,
            translation: {
                text: '',
                reading: '',
                sourceReading: ''
            },
            isMe,
            isTranslating: true
        }

        setMessages(prev => [...prev, newMessage])

        try {
            const prompt = `Translate this text from ${SUPPORTED_LANGUAGES.find(l => l.code === sourceLanguage)?.name} to ${SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)?.name}.
                            ${isSourceJapanese ? 'Include hiragana reading for the source Japanese text.' : ''}
                            ${isTargetJapanese ? 'Include hiragana reading for the translated Japanese text.' : ''}
                            Return the response in this JSON format:
                            {
                                "text": "translated text"${isTargetJapanese ? ',\n    "reading": "hiragana reading for translated text"' : ''}${isSourceJapanese ? ',\n    "sourceReading": "hiragana reading for source text"' : ''}
                            }

                            Text to translate: ${text}`

            const result = await aiService.processWithAI(prompt)
            let translationData
            try {
                // Clean the response string by removing any extra quotes, backticks, and markdown code blocks
                const cleanResult = result
                    .replace(/^[\s\S]*?{/, '{') // Remove everything before the first {
                    .replace(/}[\s\S]*$/, '}') // Remove everything after the last }
                    .replace(/^['"`]+|['"`]+$/g, '') // Remove quotes/backticks from start and end
                    .replace(/\\"/g, '"')  // Handle escaped quotes
                    .replace(/^json\s*/, '') // Remove 'json' text if present
                    .replace(/```/g, '') // Remove markdown code block markers
                    .trim()
                
                console.log('Cleaned JSON:', cleanResult) // For debugging
                
                translationData = JSON.parse(cleanResult)
                
                // Validate the required fields
                if (!translationData.text) {
                    throw new Error('Missing required text field')
                }
                
                // Ensure all fields exist
                translationData = {
                    text: translationData.text || '',
                    reading: isTargetJapanese ? (translationData.reading || '') : '',
                    sourceReading: isSourceJapanese ? (translationData.sourceReading || '') : ''
                }
            } catch (e) {
                console.error('JSON parsing error:', e, 'Raw result:', result)
                // Fallback if response is not valid JSON
                translationData = { 
                    text: result
                        .replace(/^[\s\S]*?["']([^"']+)["'][\s\S]*$/, '$1') // Try to extract text between quotes
                        .replace(/^['"`]+|['"`]+$/g, '')
                        .replace(/```/g, '')
                        .trim(), 
                    reading: '',
                    sourceReading: ''
                }
            }

            setMessages(prev => prev.map(msg =>
                msg.id === newMessage.id
                    ? { ...msg, translation: translationData, isTranslating: false }
                    : msg
            ))

            // If AI mode is on and this is a user message, generate AI response
            if (isAIMode && isMe) {
                await generateAIResponse(translationData.text);
            }
        } catch (error) {
            console.error('Translation error:', error)
            setMessages(prev => prev.map(msg =>
                msg.id === newMessage.id
                    ? { ...msg, translation: { text: 'Lỗi dịch', reading: '', sourceReading: '' }, isTranslating: false }
                    : msg
            ))
        }
    }

    const generateAIResponse = async (translatedText: string) => {
        setIsTranslatingTheirs(true)

        try {
            // Generate AI response in their language
            const aiResponse = await aiService.generateChatResponse(
                translatedText,
                SUPPORTED_LANGUAGES.find(l => l.code === theirLanguage)?.name || 'English',
                messages.map(msg => ({ text: msg.translation.text || msg.text, isMe: msg.isMe }))
            )

            // Send the AI response directly through translation flow
            await translateAndSend(aiResponse, false)
        } catch (error) {
            console.error('AI response error:', error)
        } finally {
            setIsTranslatingTheirs(false)
        }
    }

    const handleSendMyMessage = async () => {
        if (!myText.trim()) return
        setIsTranslatingMine(true)
        await translateAndSend(myText, true)
        setMyText('')
        setIsTranslatingMine(false)
    }

    const handleSendTheirMessage = async () => {
        if (!theirText.trim()) return
        setIsTranslatingTheirs(true)
        await translateAndSend(theirText, false)
        setTheirText('')
        setIsTranslatingTheirs(false)
    }

    return (
        <div className="mx-auto px-2 py-8 mt-2 max-w-5xl">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Language Selection */}
                <div className="p-3 sm:p-4 border-b border-gray-100">
                    <div className="flex flex-col gap-3">
                        {/* AI Mode Toggle */}
                        <div className="flex items-center justify-end gap-2">
                            <label className="text-sm font-medium text-gray-700">AI Chat Mode</label>
                            <button
                                onClick={() => setIsAIMode(!isAIMode)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                    isAIMode ? 'bg-primary' : 'bg-gray-200'
                                }`}
                            >
                                <span
                                    className={`${
                                        isAIMode ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </button>
                        </div>

                        {/* Language Selection Row */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <LanguageIcon className="h-5 w-5 text-gray-400" />
                                    Input
                                </label>
                                <select
                                    value={myLanguage}
                                    onChange={(e) => setMyLanguage(e.target.value)}
                                    className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/50"
                                >
                                    {SUPPORTED_LANGUAGES.filter(lang => 
                                        lang.code !== 'auto' && lang.code !== theirLanguage
                                    ).map((lang) => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <LanguageIcon className="h-5 w-5 text-gray-400" />
                                    Target
                                </label>
                                <select
                                    value={theirLanguage}
                                    onChange={(e) => setTheirLanguage(e.target.value)}
                                    className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none bg-gray-50/50"
                                >
                                    {SUPPORTED_LANGUAGES.filter(lang => 
                                        lang.code !== 'auto' && lang.code !== myLanguage
                                    ).map((lang) => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

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
                                            {message.isMe ? message.translation.text : message.text}
                                        </p>
                                        <button
                                            onClick={() => handleCopy(message.isMe ? message.translation.text : message.text, message.id, 'main')}
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

                            {/* Secondary Text Below */}
                            <div className={`max-w-[90%] sm:max-w-[80%] text-xs sm:text-sm ${message.isMe ? 'text-left' : 'text-right'}`}>
                                <div className="text-gray-600 italic">
                                    {message.isMe ? (
                                        <>
                                            <div className="flex items-center gap-2 group">
                                                <span>"{message.text}"</span>
                                                <button
                                                    onClick={() => handleCopy(message.text, message.id, 'original')}
                                                    className="p-1 hover:bg-gray-100 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                                                    title="Copy original text"
                                                >
                                                    <ClipboardDocumentIcon className="h-3 w-3 text-gray-400" />
                                                </button>
                                            </div>
                                            {message.translation.sourceReading && (
                                                <div className="text-gray-500 mt-1">
                                                    Phiên âm gốc: {message.translation.sourceReading}
                                                </div>
                                            )}
                                            {message.translation.reading && (
                                                <div className="text-gray-500 mt-1">
                                                    Phiên âm: {message.translation.reading}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {message.translation.sourceReading && (
                                                <div className="text-gray-500 mt-1">
                                                    Phiên âm: {message.translation.sourceReading}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mt-1 group">
                                                <span>"{message.translation.text}"</span>
                                                <button
                                                    onClick={() => handleCopy(message.translation.text, message.id, 'translated')}
                                                    className="p-1 hover:bg-gray-100 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
                                                    title="Copy translated text"
                                                >
                                                    <ClipboardDocumentIcon className="h-3 w-3 text-gray-400" />
                                                </button>
                                            </div>
                                            {message.translation.reading && (
                                                <div className="text-gray-500 mt-1">
                                                    Phiên âm: {message.translation.reading}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-3 sm:p-4 border-t border-gray-100 space-y-3">
                    <div className="flex flex-row gap-3 sm:gap-4">
                        {/* My Message Input */}
                        <div className="flex-1 space-y-2">
                            <div className="relative">
                                <textarea
                                    value={myText}
                                    onChange={(e) => setMyText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendMyMessage()
                                        }
                                    }}
                                    placeholder={`Nhập tin nhắn bằng ${SUPPORTED_LANGUAGES.find(l => l.code === myLanguage)?.name}...`}
                                    className="w-full h-16 sm:h-20 p-2.5 sm:p-3 pr-20 sm:pr-24 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none bg-gray-50/50"
                                />
                                <button
                                    onClick={handleSendMyMessage}
                                    disabled={isTranslatingMine || !myText.trim()}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-white text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isTranslatingMine || !myText.trim()
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-primary hover:bg-primary/90'
                                        }`}
                                >
                                    {isTranslatingMine ? (
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

                        {/* Their Message Input */}
                        <div className="flex-1 space-y-2">
                            <div className="relative">
                                <textarea
                                    value={theirText}
                                    onChange={(e) => setTheirText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSendTheirMessage()
                                        }
                                    }}
                                    placeholder={`Nhập tin nhắn bằng ${SUPPORTED_LANGUAGES.find(l => l.code === theirLanguage)?.name}...`}
                                    className="w-full h-16 sm:h-20 p-2.5 sm:p-3 pr-20 sm:pr-24 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none bg-gray-50/50"
                                />
                                <button
                                    onClick={handleSendTheirMessage}
                                    disabled={isTranslatingTheirs || !theirText.trim()}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-white text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isTranslatingTheirs || !theirText.trim()
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-primary hover:bg-primary/90'
                                        }`}
                                >
                                    {isTranslatingTheirs ? (
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
            </div>
        </div>
    )
} 