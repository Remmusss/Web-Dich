'use client'

import { useState, useRef, useEffect } from 'react'
import { PhotoIcon, ArrowDownTrayIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri
} from "@google/genai"
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import { Components } from 'react-markdown'
import { SUPPORTED_LANGUAGES } from '@/constants/languages'
import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiService } from '@/lib/ai-service'

// Custom renderer components for ReactMarkdown
const renderers: Partial<Components> = {
    code({ children, className }) {
        const value = String(children).replace(/\n$/, '')
        
        // Inline math
        if (value.startsWith('$') && value.endsWith('$')) {
            return <InlineMath math={value.slice(1, -1)} />
        }
        
        // Block math
        if (value.startsWith('$$') && value.endsWith('$$')) {
            return <BlockMath math={value.slice(2, -2)} />
        }
        
        // Regular code
        return (
            <pre className={className}>
                <code>{children}</code>
            </pre>
        )
    }
}

export function AiSolver() {
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [solution, setSolution] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPasteEnabled, setIsPasteEnabled] = useState(true)
    const [language, setLanguage] = useState('vi')
    const [needExplanation, setNeedExplanation] = useState(false)
    const [exerciseText, setExerciseText] = useState('')
    const [selectedModel, setSelectedModel] = useState<'gemini-2.5-flash-preview-04-17' | 'gemini-2.0-flash'>('gemini-2.0-flash')
    const [activeTab, setActiveTab] = useState<'image' | 'text' | 'document'>('image')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const documentInputRef = useRef<HTMLInputElement>(null)
    const imageContainerRef = useRef<HTMLDivElement>(null)
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    const createSolverPrompt = (): string => {
        if (!needExplanation) {
            return `You are an expert AI tutor. Please provide a concise solution in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || 'Vietnamese'}.

MARKDOWN FORMATTING REQUIREMENTS:
- Use # for main section headers
- Use ## for subsection headers
- Use > for important notes or key points
- Use **bold** for emphasis on key terms
- Use \`code\` for mathematical terms or variables
- Use --- for section separators
- Use numbered lists (1., 2., etc.) for steps
- Use bullet points (•) for lists of items
- Use tables for organized data presentation
- Use proper indentation for nested lists

Please follow this structure:

# Đáp án
[Ghi rõ đáp án cuối cùng, ví dụ: A, B, C, D hoặc giá trị số cụ thể]

# Giải thích ngắn gọn
- Nêu các ý chính dẫn đến đáp án
- Giải thích tại sao đáp án này là đúng
- Nêu các khái niệm quan trọng liên quan

# Công thức sử dụng
$[Công thức toán học liên quan]$

# Áp dụng
1. [Bước áp dụng công thức]
2. [Các phép tính cụ thể]
3. [Kết quả cuối cùng]

> **Lưu ý quan trọng**: [Nếu có điểm cần lưu ý đặc biệt]

Return language: ${language}

IMPORTANT: Your ENTIRE response MUST be in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.name} ONLY.`
        }

        return `You are an expert AI tutor. Please analyze the exercise/problem and provide a detailed solution in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || 'Vietnamese'}.

MARKDOWN FORMATTING REQUIREMENTS:
- Use # for main section headers
- Use ## for subsection headers
- Use > for important notes or key points
- Use **bold** for emphasis on key terms
- Use \`code\` for mathematical terms or variables
- Use --- for section separators
- Use numbered lists (1., 2., etc.) for steps
- Use bullet points (•) for lists of items
- Use tables for organized data presentation
- Use proper indentation for nested lists

# Phân tích vấn đề
## Dữ kiện cho trước
- Liệt kê các thông tin đã cho
- Xác định các yêu cầu cần giải quyết
- Nêu các điều kiện và ràng buộc

## Kiến thức liên quan
- Các định nghĩa cần thiết
- Công thức sử dụng
- Tính chất áp dụng

---

# Phương pháp giải
## Chiến lược giải quyết
1. Nêu cách tiếp cận bài toán
2. Giải thích tại sao chọn phương pháp này
3. Các bước cần thực hiện

## Các bước giải chi tiết
1. [Bước 1]
   - Chi tiết thực hiện
   - Công thức áp dụng: $công_thức_1$
   - Kết quả trung gian

2. [Bước 2]
   - Chi tiết thực hiện
   - Công thức áp dụng: $công_thức_2$
   - Kết quả trung gian

3. [Bước 3]
   - Chi tiết thực hiện
   - Kết quả cuối cùng

---

# Đáp án và kiểm tra
## Đáp án
**Kết quả: [đáp án]**

## Kiểm chứng
- Kiểm tra tính hợp lý của kết quả
- Đối chiếu với điều kiện đề bài
- Xác nhận đáp án thỏa mãn yêu cầu

---

# Ghi chú bổ sung
> **Lưu ý quan trọng**
- Các điểm cần chú ý
- Các trường hợp đặc biệt
- Mở rộng và liên hệ

## Phương pháp khác (nếu có)
- Cách giải khác
- So sánh ưu nhược điểm
- Khi nào nên sử dụng

Return language: ${language}

IMPORTANT: Your ENTIRE response MUST be in ${SUPPORTED_LANGUAGES.find(l => l.code === language)?.name} ONLY.
Do not use any other language in your response.`
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.type.startsWith('image/')) {
            if (file.size > 10 * 1024 * 1024) {
                setError('Image size should be less than 10MB')
                return
            }

            setSelectedImage(file)
            setImagePreview(URL.createObjectURL(file))
            setError(null)
        } else {
            // Handle document files
            const supportedTypes = [
                'text/plain',
                'application/pdf',
                'application/json',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]

            if (!supportedTypes.includes(file.type)) {
                setError('Unsupported file type. Please upload an image or document (txt, pdf, json, doc, docx)')
                return
            }

            if (file.size > 20 * 1024 * 1024) {
                setError('Document size should be less than 20MB')
                return
            }

            // For documents, we'll set them as selectedImage but won't show preview
            setSelectedImage(file)
            setImagePreview(null)
            setError(null)
        }
    }

    const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setError('Please capture an image')
            return
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('Image size should be less than 10MB')
            return
        }

        setSelectedImage(file)
        setImagePreview(URL.createObjectURL(file))
        setError(null)
    }

    const handleSolve = async () => {
        if (!selectedImage && !exerciseText.trim()) return

        setIsLoading(true)
        setError(null)

        try {
            const prompt = createSolverPrompt()
            const selectedLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language)?.name || 'Vietnamese'
            const fullPrompt = `${prompt}\n\nIMPORTANT: You MUST respond ONLY in ${selectedLanguage}. Do not use any other language in your response.`

            let result;
            // Ưu tiên xử lý text nếu có
            if (exerciseText.trim()) {
                result = await aiService.processWithAI(`${fullPrompt}\n\nBài tập:\n${exerciseText}`)
            } else if (selectedImage) {
                result = await aiService.processImageWithAI(selectedImage, fullPrompt, selectedModel)
            } else {
                throw new Error('No input provided')
            }

            setSolution(result || 'No solution generated')
        } catch (error) {
            console.error('Solving error:', error)
            setError(error instanceof Error ? error.message : 'Failed to solve the exercise')
        } finally {
            setIsLoading(false)
        }
    }

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
        } catch (err) {
            console.error('Failed to copy text:', err)
        }
    }

    const handleDownload = (text: string) => {
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'solution.txt'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    // Handle paste events
    const handlePaste = async (e: ClipboardEvent) => {
        if (!isPasteEnabled) return

        const items = e.clipboardData?.items
        if (!items) return

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault()
                const file = items[i].getAsFile()
                if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                        setError('Image size should be less than 10MB')
                        return
                    }
                    setSelectedImage(file)
                    setImagePreview(URL.createObjectURL(file))
                    setError(null)
                    return
                }
            }
        }
    }

    // Add effect to handle paste events
    useEffect(() => {
        window.addEventListener('paste', handlePaste)
        return () => window.removeEventListener('paste', handlePaste)
    }, [isPasteEnabled])

    return (
        <div className="mx-auto px-2 py-8 max-w-7xl">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                            <PhotoIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">AI Giải Bài Tập</h1>
                            <p className="text-sm text-gray-500">Tải lên hình ảnh hoặc nhập nội dung bài tập</p>
                        </div>
                    </div>
                </div>

                {/* Options Bar */}
                <div className="flex flex-wrap items-center gap-4 p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Model AI</label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            <option value="gemini-2.5-flash-preview-04-17">Gemini 2.5 Flash (Preview)</option>
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="explanation"
                            checked={needExplanation}
                            onChange={(e) => setNeedExplanation(e.target.checked)}
                            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                        />
                        <label htmlFor="explanation" className="text-sm font-medium text-gray-700">
                            Giải thích chi tiết
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                    {/* Input Panel */}
                    <div className="p-6">
                        {/* Tab Navigation */}
                        <div className="flex border-b border-gray-200 mb-4">
                            <button
                                onClick={() => setActiveTab('image')}
                                className={`px-4 py-2 text-sm font-medium ${
                                    activeTab === 'image'
                                        ? 'text-black border-b-2 border-black'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Hình ảnh
                            </button>
                            <button
                                onClick={() => setActiveTab('text')}
                                className={`px-4 py-2 text-sm font-medium ${
                                    activeTab === 'text'
                                        ? 'text-black border-b-2 border-black'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Văn bản
                            </button>
                            <button
                                onClick={() => setActiveTab('document')}
                                className={`px-4 py-2 text-sm font-medium ${
                                    activeTab === 'document'
                                        ? 'text-black border-b-2 border-black'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Tài liệu
                            </button>
                        </div>

                        {activeTab === 'image' ? (
                            <>
                                <div className="mb-4">
                                    <h2 className="text-lg font-medium">Tải lên hình ảnh</h2>
                                    <p className="text-sm text-gray-500">Kéo thả hoặc chọn hình ảnh bài tập</p>
                                </div>

                                {/* Image Upload Area */}
                                <div
                                    ref={imageContainerRef}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`relative min-h-[200px] cursor-pointer rounded-xl border-2 border-dashed transition-colors ${
                                        imagePreview ? 'border-transparent' : 'border-gray-200 hover:border-gray-300'
                                    } mb-4`}
                                >
                                    {imagePreview ? (
                                        <div className="relative h-full">
                                            <img
                                                src={imagePreview}
                                                alt="Xem trước bài tập"
                                                className="w-full h-full object-contain"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedImage(null)
                                                    setImagePreview(null)
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = ''
                                                    }
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                                <PhotoIcon className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <p className="text-sm font-medium">Kéo thả hoặc nhấp để tải lên ảnh</p>
                                            <p className="text-xs text-gray-400 mt-1">Hỗ trợ: JPG, PNG, GIF (tối đa 10MB)</p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    cameraInputRef.current?.click()
                                                }}
                                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Chụp ảnh
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <input
                                    ref={cameraInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleCameraCapture}
                                    className="hidden"
                                />
                            </>
                        ) : activeTab === 'text' ? (
                            <>
                                <div className="mb-4">
                                    <h2 className="text-lg font-medium">Nhập văn bản</h2>
                                    <p className="text-sm text-gray-500">Nhập nội dung bài tập của bạn</p>
                                </div>

                                <textarea
                                    ref={textAreaRef}
                                    value={exerciseText}
                                    onChange={(e) => setExerciseText(e.target.value)}
                                    placeholder="Nhập nội dung bài tập của bạn ở đây..."
                                    className="w-full h-[300px] p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
                                />
                            </>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <h2 className="text-lg font-medium">Tải lên tài liệu</h2>
                                    <p className="text-sm text-gray-500">Tải lên tài liệu bài tập của bạn</p>
                                </div>

                                <div
                                    ref={documentInputRef}
                                    onClick={() => documentInputRef.current?.click()}
                                    className="relative min-h-[200px] cursor-pointer rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors mb-4"
                                >
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium">Kéo thả hoặc nhấp để tải lên tài liệu</p>
                                        <p className="text-xs text-gray-400 mt-1">Hỗ trợ: PDF, DOC, DOCX, TXT (tối đa 20MB)</p>
                                    </div>
                                </div>

                                <input
                                    ref={documentInputRef}
                                    type="file"
                                    accept=".txt,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />

                                {selectedImage && !imagePreview && (
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                                        <div className="flex items-center gap-3">
                                            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{selectedImage.name}</p>
                                                <p className="text-xs text-gray-500">{(selectedImage.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedImage(null)
                                                if (documentInputRef.current) {
                                                    documentInputRef.current.value = ''
                                                }
                                            }}
                                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        <button
                            onClick={handleSolve}
                            disabled={(!selectedImage && !exerciseText.trim()) || isLoading}
                            className={`w-full mt-4 py-2.5 rounded-lg text-white font-medium transition-all ${
                                (!selectedImage && !exerciseText.trim()) || isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-black hover:bg-gray-900'
                            }`}
                        >
                            {isLoading ? 'Đang giải...' : 'Giải bài tập'}
                        </button>
                    </div>

                    {/* Solution Panel */}
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-medium">Lời giải</h2>
                                <p className="text-sm text-gray-500">Giải thích từng bước</p>
                            </div>
                            {solution && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleCopy(solution)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Sao chép vào clipboard"
                                    >
                                        <ClipboardDocumentIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDownload(solution)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Tải xuống lời giải"
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="min-h-[400px] p-4 bg-gray-50 rounded-xl">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border-4 border-black border-t-transparent animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-6 h-6 rounded-full border-4 border-black/30 border-t-transparent animate-spin" />
                                        </div>
                                    </div>
                                    <div className="mt-4 text-center">
                                        <p className="text-sm font-medium text-gray-900">AI đang giải bài tập...</p>
                                        <p className="text-xs text-gray-500 mt-1">Vui lòng đợi trong giây lát</p>
                                    </div>
                                </div>
                            ) : solution ? (
                                <div className="prose prose-sm max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-pre:bg-gray-50 prose-pre:p-2 prose-pre:rounded-lg">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {solution}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                    <p className="text-sm font-medium">Tải lên bài tập để bắt đầu</p>
                                    <p className="text-xs mt-1">AI sẽ cung cấp lời giải chi tiết từng bước</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}
        </div>
    )
} 