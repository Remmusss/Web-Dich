'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { aiService } from '@/lib/ai-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export default function AiDetector() {
  const [text, setText] = useState('')
  const [result, setResult] = useState<{
    isAI: boolean;
    confidence: number;
    explanation: string;
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeText = async () => {
    if (!text || text.trim().length < 50) {
      setError('Vui lòng nhập ít nhất 50 ký tự để phân tích')
      return
    }

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const prompt = `Phân tích đoạn văn bản sau và xác định khả năng nó được viết bởi AI hay con người. Trả về kết quả dưới định dạng JSON với các trường sau:
      - isAI: boolean (true nếu có khả năng cao là do AI tạo ra, false nếu có vẻ do con người viết)
      - confidence: number (Độ tin cậy của phân tích, từ 0-100)
      - explanation: string (Giải thích lý do phân tích, tối đa 100 từ)

      Khi phân tích, hãy chú ý đến các yếu tố sau:
      - Sự lặp lại và mẫu câu
      - Sự sáng tạo và những lỗi thường gặp ở người
      - Tính nhất quán về ngữ điệu
      - Tính cá nhân và cảm xúc
      
      Văn bản cần phân tích:
      "${text.trim()}"
      
      Chỉ trả về kết quả theo định dạng JSON:
      `

      const response = await aiService.processWithAI(prompt)
      
      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const jsonResponse = JSON.parse(jsonMatch[0])
          setResult({
            isAI: jsonResponse.isAI,
            confidence: jsonResponse.confidence,
            explanation: jsonResponse.explanation
          })
        } else {
          throw new Error('Không thể phân tích kết quả')
        }
      } catch (parseError) {
        console.error('Parse error:', parseError)
        setError('Không thể phân tích kết quả. Vui lòng thử lại.')
      }
    } catch (err) {
      console.error('AI Detection error:', err)
      setError('Đã xảy ra lỗi khi phân tích văn bản. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setText('')
    setResult(null)
    setError(null)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "#10b981" // green-500
    if (confidence >= 60) return "#3b82f6" // blue-500
    if (confidence >= 40) return "#eab308" // yellow-500
    if (confidence >= 20) return "#f97316" // orange-500
    return "#ef4444" // red-500
  }

  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-50"
    if (confidence >= 60) return "bg-blue-50" 
    if (confidence >= 40) return "bg-yellow-50"
    if (confidence >= 20) return "bg-orange-50"
    return "bg-red-50"
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return "Rất cao"
    if (confidence >= 60) return "Cao" 
    if (confidence >= 40) return "Trung bình"
    if (confidence >= 20) return "Thấp"
    return "Rất thấp"
  }

  return (
    <div className="mx-auto px-2 py-8 max-w-5xl">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Phát hiện văn bản AI</CardTitle>
          <CardDescription>
            Công cụ giúp xác định văn bản có khả năng được tạo bởi AI hay không
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Nhập văn bản cần phân tích (ít nhất 50 ký tự)..."
              className="min-h-[400px] w-full"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
            <div className="text-xs text-gray-500">
              {text.length} ký tự {text.length < 50 ? '(cần ít nhất 50 ký tự)' : ''}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm p-2 bg-red-50 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Đang phân tích...</span>
              </div>
              <Progress value={45} className="h-1" />
            </div>
          )}

          {result && (
            <div className={`p-4 rounded-md ${result.isAI ? 'bg-amber-50' : 'bg-green-50'}`}>
              <div className="flex items-center gap-2 mb-3">
                {result.isAI ? (
                  <XCircle className="h-6 w-6 text-amber-500" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                )}
                <h3 className="font-medium">
                  {result.isAI
                    ? 'Có khả năng cao là văn bản AI'
                    : 'Có vẻ là văn bản của con người'}
                </h3>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 mb-3">
                <div className="flex flex-col items-center">
                  <div className="text-sm font-medium mb-2">Độ tin cậy:</div>
                  <div 
                    className={cn("relative w-28 h-28 rounded-full flex items-center justify-center", 
                    getConfidenceBgColor(result.confidence))}
                  >
                    <svg className="w-28 h-28 absolute" viewBox="0 0 100 100">
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="44" 
                        fill="none" 
                        stroke="#e5e7eb" 
                        strokeWidth="12" 
                      />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="44" 
                        fill="none" 
                        stroke={getConfidenceColor(result.confidence)} 
                        strokeWidth="12" 
                        strokeDasharray={`${2 * Math.PI * 44 * result.confidence / 100} ${2 * Math.PI * 44 * (100 - result.confidence) / 100}`}
                        strokeDashoffset={2 * Math.PI * 44 * 25 / 100}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold" style={{ color: getConfidenceColor(result.confidence) }}>
                        {result.confidence}%
                      </span>
                      <span className="text-xs" style={{ color: getConfidenceColor(result.confidence) }}>
                        {getConfidenceLabel(result.confidence)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 text-sm text-gray-700 p-3 bg-white/50 rounded-md">
                  <p className="font-medium mb-1">Phân tích:</p>
                  <p>{result.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleClear} disabled={loading || (!text && !result)}>
            Xóa
          </Button>
          <Button onClick={analyzeText} disabled={loading || text.length < 50}>
            {loading ? 'Đang phân tích...' : 'Phân tích'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
