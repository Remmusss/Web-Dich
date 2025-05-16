"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Check, X, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { aiService } from "@/lib/ai-service"
import ReactMarkdown from "react-markdown"

interface PasswordStrengthCheckerProps {
  value: string
  onChange: (value: string) => void
}

export function PasswordStrengthChecker({ value = "", onChange }: PasswordStrengthCheckerProps) {
  const [password, setPassword] = useState(value)
  const [strength, setStrength] = useState(0)
  const [aiEvaluation, setAiEvaluation] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [requirements, setRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  })

  useEffect(() => {
    // Check requirements
    const reqs = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }
    setRequirements(reqs)

    // Calculate strength
    const metRequirements = Object.values(reqs).filter(Boolean).length
    setStrength(metRequirements * 20) // 20% for each requirement

    // Reset AI evaluation when password changes
    setAiEvaluation("")

    // Notify parent component
    onChange(password)
  }, [password, onChange])

  const getStrengthLabel = () => {
    if (strength <= 20) return "Very Weak"
    if (strength <= 40) return "Weak"
    if (strength <= 60) return "Medium"
    if (strength <= 80) return "Strong"
    return "Very Strong"
  }

  const getStrengthColor = () => {
    if (strength <= 20) return "bg-red-500"
    if (strength <= 40) return "bg-orange-500"
    if (strength <= 60) return "bg-yellow-500"
    if (strength <= 80) return "bg-green-400"
    return "bg-green-600"
  }

  const evaluateWithAI = async () => {
    if (!password || password.length < 4) {
      setAiEvaluation("Password is too short for AI evaluation.")
      return
    }

    setIsLoading(true)
    try {
      const prompt = `Đánh giá độ mạnh bảo mật của mật khẩu này: "${password}"
Vui lòng phân tích các khía cạnh bảo mật của mật khẩu này mà không lặp lại nó.
Vui lòng cung cấp đánh giá ngắn gọn bao gồm:
1. Đánh giá độ mạnh tổng thể
2. Các lỗ hổng phổ biến
3. Các đề xuất cải thiện cụ thể
4. Thời gian có thể bị crack

Định dạng phản hồi của bạn bằng Markdown với:
- Tiêu đề cho các phần
- In đậm cho các điểm quan trọng  
- Danh sách cho các đề xuất
- Giữ phản hồi của bạn ngắn gọn (dưới 100 từ) và chỉ tập trung vào khía cạnh bảo mật.
- Trả về bằng tiếng Việt`
      const response = await aiService.processWithAI(prompt)
      setAiEvaluation(response)
    } catch (error) {
      console.error("Error evaluating password:", error)
      setAiEvaluation("Failed to evaluate password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Password Strength</span>
          <span className="text-sm font-medium">{getStrengthLabel()}</span>
        </div>
        <Progress value={strength} className="h-2" indicatorClassName={getStrengthColor()} />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">Password Requirements:</p>
        <ul className="space-y-1 text-sm">
          <Requirement met={requirements.length}>At least 8 characters</Requirement>
          <Requirement met={requirements.lowercase}>At least one lowercase letter</Requirement>
          <Requirement met={requirements.uppercase}>At least one uppercase letter</Requirement>
          <Requirement met={requirements.number}>At least one number</Requirement>
          <Requirement met={requirements.special}>At least one special character</Requirement>
        </ul>
      </div>

      <div className="space-y-2">
        <Button 
          onClick={evaluateWithAI} 
          disabled={!password || password.length < 4 || isLoading}
          className="w-full flex items-center justify-center gap-2"
          variant="secondary"
        >
          {isLoading ? (
            <span>Evaluating...</span>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              <span>AI Evaluation</span>
            </>
          )}
        </Button>
        
        {aiEvaluation && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md border">
            <p className="font-medium mb-1 text-sm">AI Evaluation:</p>
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{aiEvaluation}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Requirement({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      {met ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
      <span className={met ? "text-gray-700" : "text-gray-500"}>{children}</span>
    </li>
  )
}
