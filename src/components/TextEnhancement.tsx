'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  ClipboardDocumentIcon, 
  ArrowDownTrayIcon,
  SpeakerWaveIcon,
  StopIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { aiService } from '@/lib/ai-service'
import { useToast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import { useDebounce } from '@/hooks/useDebounce'
import { SparklesIcon, ClipboardIcon } from '@heroicons/react/24/outline'

export default function TextEnhancement() {
    const [mounted, setMounted] = useState(false)
    const [text, setText] = useState('')
    const [enhancedText, setEnhancedText] = useState('')
    const [isEnhancing, setIsEnhancing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [useMarkdown, setUseMarkdown] = useState(false)
    const [contentHeight, setContentHeight] = useState<number>(500)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const textRef = useRef<HTMLTextAreaElement>(null)
    const enhancedTextRef = useRef<HTMLDivElement>(null)
    const { toast } = useToast()
    const debouncedText = useDebounce(text, 500)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const updateHeight = () => {
            if (textRef.current && enhancedTextRef.current) {
                const textHeight = textRef.current.scrollHeight
                const enhancedHeight = enhancedTextRef.current.scrollHeight
                const maxHeight = Math.max(textHeight, enhancedHeight, 500)
                setContentHeight(maxHeight)
            }
        }

        updateHeight()
        const resizeObserver = new ResizeObserver(updateHeight)
        if (textRef.current) resizeObserver.observe(textRef.current)
        if (enhancedTextRef.current) resizeObserver.observe(enhancedTextRef.current)

        return () => resizeObserver.disconnect()
    }, [text, enhancedText])

    const handleEnhance = async () => {
        if (!text.trim()) return

        setIsEnhancing(true)
        toast({
            title: "Đang cải thiện văn bản...",
            description: "Vui lòng đợi trong giây lát",
            variant: "default",
        })
        
        try {
            const result = await aiService.enhanceText(text)
            setEnhancedText(result)
            toast({
                title: "Thành công",
                description: "Cải thiện văn bản thành công!",
                variant: "default",
            })
        } catch (err) {
            console.error('Text enhancement error:', err)
            toast({
                title: "Lỗi",
                description: "Có lỗi xảy ra khi cải thiện văn bản. Vui lòng thử lại.",
                variant: "destructive",
            })
        } finally {
            setIsEnhancing(false)
        }
    }

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast({
                title: "Thành công",
                description: "Đã sao chép vào clipboard!",
                variant: "default",
            })
        } catch (err) {
            console.error('Copy error:', err)
            toast({
                title: "Lỗi",
                description: "Không thể sao chép văn bản",
                variant: "destructive",
            })
        }
    }

    const handleDownload = (text: string) => {
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'enhanced.txt'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleSpeech = (text: string) => {
        if (isPlaying) {
            window.speechSynthesis.cancel()
            setIsPlaying(false)
        } else {
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.onend = () => setIsPlaying(false)
            window.speechSynthesis.speak(utterance)
            setIsPlaying(true)
        }
    }

    const handleTextPaste = async () => {
        try {
            const text = await navigator.clipboard.readText()
            setText(text)
        } catch (err) {
            console.error('Failed to paste text:', err)
        }
    }

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true)
        }
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX
        const y = e.clientY
        
        if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
            setIsDragging(false)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        setError(null)

        const files = Array.from(e.dataTransfer.files)
        if (files.length === 0) return

        const file = files[0]
        if (!file.type.startsWith('text/')) {
            setError('Please drop a text file')
            return
        }

        try {
            const text = await file.text()
            setText(text)
        } catch (error) {
            console.error('Error reading file:', error)
            setError('Error reading file. Please try again.')
        }
    }

    const handleTextAreaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = e.target
        const text = e.target.value
        setText(text)

        if (!text.trim()) {
            textarea.style.height = ''
            setContentHeight(500)
            return
        }

        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
    }

    if (!mounted) return null

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 border-b border-gray-200 bg-gray-50/50">
                    <div className="flex flex-1 items-center gap-2 sm:gap-4">
                        <button
                            onClick={handleEnhance}
                            disabled={isEnhancing || !text.trim()}
                            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-white text-sm sm:text-base font-medium transition-all ${
                                isEnhancing || !text.trim()
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gray-800 hover:bg-gray-900 shadow-sm hover:shadow-md'
                            }`}
                        >
                            {isEnhancing ? 'Enhancing...' : 'Enhance'}
                        </button>

                        <button
                            onClick={() => setUseMarkdown(!useMarkdown)}
                            className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                useMarkdown 
                                    ? 'bg-primary/10 text-primary border border-primary/20' 
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                            title="Toggle Markdown rendering"
                        >
                            <DocumentTextIcon className="h-5 w-5" />
                            Markdown
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    {/* Source Panel */}
                    <div className="relative">
                        {/* Source Panel Toolbar */}
                        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-200 bg-gray-50/80">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500">
                                    Source Text
                                </span>
                                <button
                                    onClick={() => setUseMarkdown(!useMarkdown)}
                                    className={`sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                                        useMarkdown 
                                            ? 'bg-primary/10 text-primary border border-primary/20' 
                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                    title="Toggle Markdown rendering"
                                >
                                    <DocumentTextIcon className="h-3 w-3" />
                                    MD
                                </button>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                                    onClick={handleTextPaste}
                                    title="Paste from clipboard"
                                >
                                    <ClipboardIcon className="h-5 w-5" />
                                    <span className="text-xs sm:text-sm"></span>
                                </button>
                                <button 
                                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                                    onClick={() => handleCopy(text)}
                                    title="Copy to clipboard"
                                >
                                    <ClipboardIcon className="h-5 w-5" />
                                    <span className="text-xs sm:text-sm"></span>
                                </button>
                                <button 
                                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                                    onClick={() => handleSpeech(text)}
                                    title={isPlaying ? "Stop" : "Listen to text"}
                                >
                                    {isPlaying ? (
                                        <>
                                            <StopIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                                            <span className="text-xs sm:text-sm"></span>
                                        </>
                                    ) : (
                                        <>
                                            <SpeakerWaveIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                                            <span className="text-xs sm:text-sm"></span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Source Content */}
                        <div className={`relative h-full ${isDragging ? 'bg-gray-100/80 border-2 border-dashed border-primary/50' : ''}`}>
                            <textarea
                                ref={textRef}
                                value={text}
                                onChange={handleTextAreaResize}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                style={{ overflow: 'hidden' }}
                                className="w-full p-4 sm:p-6 resize-none focus:outline-none text-base min-h-[300px] sm:min-h-[500px] bg-transparent border border-gray-50"
                                placeholder={isDragging ? 'Drop text file here' : 'Enter text to enhance...'}
                            />
                        </div>
                    </div>

                    {/* Enhanced Text Panel */}
                    <div className="relative">
                        {/* Enhanced Panel Toolbar */}
                        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-200 bg-gray-50/80">
                            <div className="text-sm font-medium text-gray-500">Enhanced Result</div>
                            <div className="flex items-center gap-1">
                                <button 
                                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                                    onClick={() => handleCopy(enhancedText)}
                                    title="Copy to clipboard"
                                >
                                    <ClipboardIcon className="h-5 w-5" />
                                    <span className="text-xs sm:text-sm"></span>
                                </button>
                                <button
                                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
                                    onClick={() => handleDownload(enhancedText)}
                                    title="Download as text file"
                                >
                                    <ArrowDownTrayIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                                    <span className="text-xs sm:text-sm"></span>
                                </button>
                            </div>
                        </div>

                        <div 
                            ref={enhancedTextRef}
                            style={{ height: `${contentHeight}px` }}
                            className="p-4 sm:p-6 overflow-y-auto min-h-[300px] sm:min-h-[500px]"
                        >
                            {isEnhancing ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative">
                                            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-full border-4 border-primary/30 border-t-transparent animate-spin" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <p className="text-sm sm:text-base text-gray-700 font-medium">
                                                Enhancing text...
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500">
                                                AI is improving your text
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : enhancedText ? (
                                <div className="prose max-w-none text-gray-800 text-base">
                                    {useMarkdown ? (
                                        <ReactMarkdown>{enhancedText}</ReactMarkdown>
                                    ) : (
                                        <div className="whitespace-pre-wrap">{enhancedText}</div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                                    <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                                        <SparklesIcon className="h-5 w-5" />
                                    </div>
                                    <span className="text-sm sm:text-base font-medium text-center">
                                        Enter text to enhance
                                    </span>
                                    <span className="text-xs sm:text-sm text-gray-400 text-center">
                                        Type or paste your text and click Enhance to begin
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
                    <svg className="h-4 sm:h-5 w-4 sm:w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm sm:text-base font-medium">{error}</span>
                </div>
            )}
        </div>
    )
} 