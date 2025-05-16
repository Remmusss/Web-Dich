'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import QRCode from 'qrcode'
import { ClipboardDocumentIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/hooks/use-toast'

export function QRCodeComponent() {
    const [text, setText] = useState('')
    const [qrCode, setQrCode] = useState('')
    const [scanResult, setScanResult] = useState('')
    const [isScanning, setIsScanning] = useState(false)
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        return () => {
            // Cleanup scanner on unmount
            if (scannerRef.current) {
                scannerRef.current.clear()
            }
        }
    }, [])

    const generateQR = async () => {
        try {
            const url = await QRCode.toDataURL(text)
            setQrCode(url)
        } catch (err) {
            console.error('Failed to generate QR code:', err)
            toast({
                title: "Lỗi",
                description: "Không thể tạo mã QR. Vui lòng thử lại.",
                variant: "destructive",
            })
        }
    }

    const startScanner = () => {
        setIsScanning(true)
        scannerRef.current = new Html5QrcodeScanner(
            'qr-reader',
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        )

        scannerRef.current.render(onScanSuccess, onScanFailure)
    }

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear()
            setIsScanning(false)
        }
    }

    const onScanSuccess = (decodedText: string) => {
        setScanResult(decodedText)
        stopScanner()
        toast({
            title: "Thành công",
            description: "Đã quét mã QR thành công",
        })
    }

    const onScanFailure = (error: string) => {
        // Handle scan failure if needed
        console.warn(`QR code scan failed: ${error}`)
        toast({
            title: "Lỗi",
            description: "Không thể quét mã QR. Vui lòng thử lại.",
            variant: "destructive",
        })
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast({
                title: "Thành công",
                description: "Đã sao chép vào clipboard",
            })
        } catch (err) {
            console.error('Failed to copy:', err)
            toast({
                title: "Lỗi",
                description: "Không thể sao chép. Vui lòng thử lại.",
                variant: "destructive",
            })
        }
    }

    const downloadQR = () => {
        try {
            const link = document.createElement('a')
            link.href = qrCode
            link.download = 'qrcode.png'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast({
                title: "Thành công",
                description: "Đã tải xuống mã QR",
            })
        } catch (err) {
            console.error('Failed to download:', err)
            toast({
                title: "Lỗi",
                description: "Không thể tải xuống. Vui lòng thử lại.",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-8">
                        <div className="space-y-8">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">🔍 QR Code Generator</h1>
                                <p className="text-gray-600">
                                    Tạo và quét mã QR một cách dễ dàng
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* Generate QR Section */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Tạo mã QR</h2>
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            placeholder="Nhập nội dung..."
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                                        />
                                        <button
                                            onClick={generateQR}
                                            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all transform hover:scale-[1.02]"
                                        >
                                            <ArrowPathIcon className="w-5 h-5" />
                                            <span className="font-medium">Tạo mã QR</span>
                                        </button>
                                        {qrCode && (
                                            <div className="space-y-4">
                                                <div className="flex justify-center">
                                                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={downloadQR}
                                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                        <span>Tải xuống</span>
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(qrCode)}
                                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors"
                                                    >
                                                        <ClipboardDocumentIcon className="w-5 h-5" />
                                                        <span>Sao chép</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Scan QR Section */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Quét mã QR</h2>
                                    <div className="space-y-4">
                                        {!isScanning ? (
                                            <button
                                                onClick={startScanner}
                                                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all transform hover:scale-[1.02]"
                                            >
                                                <ArrowPathIcon className="w-5 h-5" />
                                                <span className="font-medium">Bắt đầu quét</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={stopScanner}
                                                className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all transform hover:scale-[1.02]"
                                            >
                                                <ArrowPathIcon className="w-5 h-5" />
                                                <span className="font-medium">Dừng quét</span>
                                            </button>
                                        )}
                                        <div id="qr-reader" className="w-full"></div>
                                        {scanResult && (
                                            <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm break-all text-gray-800">{scanResult}</p>
                                                    <button
                                                        onClick={() => copyToClipboard(scanResult)}
                                                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                                                    >
                                                        <ClipboardDocumentIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 