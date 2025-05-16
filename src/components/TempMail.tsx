'use client'

import { useState, useEffect } from 'react'
import { mailTmService, type Domain, type Message, type MessageDetails } from '@/lib/mail-tm'
import { EnvelopeIcon, TrashIcon, ArrowPathIcon, ClipboardDocumentIcon, EyeIcon, EyeSlashIcon, ArrowRightOnRectangleIcon, ArrowPathRoundedSquareIcon } from '@heroicons/react/24/outline'

export function TempMail() {
    const [domains, setDomains] = useState<Domain[]>([])
    const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [email, setEmail] = useState('')
    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [selectedMessage, setSelectedMessage] = useState<MessageDetails | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Load saved account and fetch domains on mount
    useEffect(() => {
        const savedAccount = mailTmService.getCurrentAccount()
        if (savedAccount) {
            setEmail(savedAccount.address)
            setPassword(savedAccount.password)
            fetchMessages()
        }
        fetchDomains()
    }, [])

    // Auto-refresh messages every 30 seconds if logged in
    useEffect(() => {
        if (email) {
            const interval = setInterval(fetchMessages, 30000)
            return () => clearInterval(interval)
        }
    }, [email])

    const fetchDomains = async () => {
        try {
            const fetchedDomains = await mailTmService.getDomains()
            setDomains(fetchedDomains)
            if (!selectedDomain) {
                setSelectedDomain(fetchedDomains[0])
            }
        } catch (err) {
            setError('Failed to fetch domains')
        }
    }
    const generateRandomUsername = () => {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
    const generatePassword = () => {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }
    const generateRandomUsernameHandler = () => {
        setUsername(generateRandomUsername())
    }

    const createAccount = async () => {
        if (!selectedDomain || !username) return

        setLoading(true)
        setError(null)

        try {
            const generatedPassword = generatePassword()
            const address = `${username}@${selectedDomain.domain}`
            
            await mailTmService.createAccount(address, generatedPassword)
            
            setEmail(address)
            setPassword(generatedPassword)
            await fetchMessages()
        } catch (err) {
            setError('Failed to create account. Username might be taken.')
        } finally {
            setLoading(false)
        }
    }

    const handleLogin = async () => {
        if (!loginEmail || !loginPassword) {
            setError('Vui lòng nhập email và mật khẩu')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await mailTmService.login(loginEmail, loginPassword)
            setEmail(loginEmail)
            setPassword(loginPassword)
            await fetchMessages()
        } catch (err) {
            console.error('Failed to login:', err)
            setError('Email hoặc mật khẩu không đúng')
        } finally {
            setLoading(false)
        }
    }

    // Update the logout function to only handle temp mail logout
    const handleLogout = () => {
        mailTmService.logout()
        setEmail('')
        setPassword('')
        setMessages([])
        setSelectedMessage(null)
    }

    const fetchMessages = async () => {
        try {
            const fetchedMessages = await mailTmService.getMessages()
            setMessages(fetchedMessages)
        } catch (err) {
            setError('Failed to fetch messages')
        }
    }

    const viewMessage = async (id: string) => {
        try {
            const message = await mailTmService.getMessage(id)
            setSelectedMessage(message)
        } catch (err) {
            setError('Failed to fetch message details')
        }
    }

    const deleteMessage = async (id: string) => {
        try {
            await mailTmService.deleteMessage(id)
            setMessages(messages.filter(msg => msg.id !== id))
            if (selectedMessage?.id === id) {
                setSelectedMessage(null)
            }
        } catch (err) {
            setError('Failed to delete message')
        }
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            setError('Failed to copy to clipboard')
        }
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-0">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                            <EnvelopeIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Temp Mail</h1>
                            <p className="text-sm text-gray-500">Tạo email tạm thời để nhận mã xác thực</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                    {/* Left Panel - Email Creation/Login */}
                    <div className="p-6">
                        {!email ? (
                            <>
                                <div className="mb-6">
                                    <h2 className="text-lg font-medium mb-1">Tạo Email Mới</h2>
                                    <p className="text-sm text-gray-500">Nhập tên người dùng và chọn tên miền</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên người dùng</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                placeholder="username"
                                                className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            />
                                            <button
                                                onClick={generateRandomUsernameHandler}
                                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Tạo ngẫu nhiên"
                                            >
                                                <ArrowPathRoundedSquareIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên miền</label>
                                        <select
                                            value={selectedDomain?.id}
                                            onChange={(e) => setSelectedDomain(domains.find(d => d.id === e.target.value) || null)}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        >
                                            {domains.map((domain) => (
                                                <option key={domain.id} value={domain.id}>
                                                    @{domain.domain}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={createAccount}
                                        disabled={!selectedDomain || !username || loading}
                                        className={`w-full py-2.5 rounded-lg text-white font-medium transition-all ${
                                            !selectedDomain || !username || loading
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-black hover:bg-gray-900'
                                        }`}
                                    >
                                        {loading ? (
                                            <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto" />
                                        ) : (
                                            'Tạo email'
                                        )}
                                    </button>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200" />
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-gray-500">Hoặc</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                placeholder="example@domain.com"
                                                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={loginPassword}
                                                    onChange={(e) => setLoginPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                                >
                                                    {showPassword ? (
                                                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                                    ) : (
                                                        <EyeIcon className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleLogin}
                                            disabled={!loginEmail || !loginPassword || loading}
                                            className={`w-full py-2.5 rounded-lg text-white font-medium transition-all ${
                                                !loginEmail || !loginPassword || loading
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-black hover:bg-gray-900'
                                            }`}
                                        >
                                            {loading ? (
                                                <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto" />
                                            ) : (
                                                'Đăng nhập'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email của bạn</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={email}
                                            readOnly
                                            className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(email)}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Sao chép email"
                                        >
                                            <ClipboardDocumentIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Đăng xuất"
                                        >
                                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            readOnly
                                            className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg"
                                        />
                                        <button
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                            title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                        >
                                            {showPassword ? (
                                                <EyeSlashIcon className="h-5 w-5" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(password)}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Sao chép mật khẩu"
                                        >
                                            <ClipboardDocumentIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel - Messages */}
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-medium mb-1">Hộp thư đến</h2>
                                <p className="text-sm text-gray-500">Tự động làm mới sau 30 giây</p>
                            </div>
                            {email && (
                                <button
                                    onClick={fetchMessages}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Làm mới"
                                >
                                    <ArrowPathIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>

                        {email ? (
                            <div className="space-y-4">
                                {/* Message List */}
                                <div className="space-y-2">
                                    {messages.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <EnvelopeIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Chưa có email nào</p>
                                        </div>
                                    ) : (
                                        messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                                                onClick={() => viewMessage(message.id)}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">{message.subject}</p>
                                                        <p className="text-sm text-gray-500 truncate">
                                                            From: {message.from.address}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {new Date(message.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteMessage(message.id)
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa email"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Message Content */}
                                {selectedMessage && (
                                    <div className="mt-6 p-4 border border-gray-200 rounded-lg">
                                        <div className="mb-4 pb-4 border-b border-gray-200">
                                            <h3 className="text-lg font-medium mb-2">{selectedMessage.subject}</h3>
                                            <p className="text-sm text-gray-500">
                                                From: {selectedMessage.from.address}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(selectedMessage.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="prose prose-sm max-w-none">
                                            {selectedMessage.html.length > 0 ? (
                                                <div dangerouslySetInnerHTML={{ __html: selectedMessage.html[0] }} />
                                            ) : (
                                                <pre className="whitespace-pre-wrap">{selectedMessage.text}</pre>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <EnvelopeIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>Tạo email để bắt đầu nhận thư</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {copied && (
                <div className="fixed bottom-4 right-4 p-4 bg-black text-white rounded-lg shadow-lg">
                    <p className="text-sm">Đã sao chép vào clipboard</p>
                </div>
            )}
        </div>
    )
}