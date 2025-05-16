'use client'

import { useState, useEffect } from 'react'
import { Heart, RefreshCw, AlertCircle, ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react'
import { aiService } from '@/lib/ai-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface Question {
    id: number;
    text: string;
    options: string[];
    scores: number[];
}

export default function GayTest() {
    const [questions, setQuestions] = useState<Question[]>([])
    const [answers, setAnswers] = useState<Record<number, number>>({})
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [result, setResult] = useState<{
        score: number;
        explanation: string;
    } | null>(null)
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [testStarted, setTestStarted] = useState(false)
    const [isNavigationDisabled, setIsNavigationDisabled] = useState(false)

    const generateQuestions = async () => {
        setTestStarted(true)
        setGenerating(true)
        setError(null)
        setQuestions([])
        setAnswers({})
        setResult(null)
        setCurrentQuestionIndex(0)

        try {
            const prompt = `Tạo ra 10 câu hỏi trắc nghiệm chuyên nghiệp dùng để kiểm tra độ gay của một người.

Yêu cầu:
- Mỗi câu hỏi đều là trắc nghiệm với 4 lựa chọn
- Mỗi lựa chọn đi kèm với điểm số từ 0-10 (0: hoàn toàn không gay, 10: rất gay)
- Nội dung câu hỏi nên đa dạng về sở thích, quan điểm và thói quen
- Các câu trả lời nên đa dạng và không quá rõ ràng đâu là câu trả lời "đúng"
- Bộ câu hỏi như của các bác sĩ tâm lý
- Mỗi câu hỏi nên có 2 câu có điểm từ 5 trở lên và 2 câu có điểm từ 0 tới 4
Trả về kết quả dưới dạng JSON với định dạng sau:
{
  "questions": [
    {
      "id": 1,
      "text": "Nội dung câu hỏi",
      "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
      "scores": 1 tới 10
    },
    ...
  ]
}

Chỉ trả về JSON, không thêm giải thích hay chú thích.`

            const response = await aiService.processWithAI(prompt)

            try {
                // Extract JSON from response
                const jsonMatch = response.match(/\{[\s\S]*\}/)
                if (jsonMatch) {
                    const jsonResponse = JSON.parse(jsonMatch[0])
                    if (jsonResponse.questions && Array.isArray(jsonResponse.questions)) {
                        setQuestions(jsonResponse.questions)
                    } else {
                        throw new Error('Định dạng kết quả không hợp lệ')
                    }
                } else {
                    throw new Error('Không thể phân tích kết quả')
                }
            } catch (parseError) {
                console.error('Parse error:', parseError)
                setError('Không thể tạo câu hỏi. Vui lòng thử lại.')
            }
        } catch (err) {
            console.error('Gay Test error:', err)
            setError('Đã xảy ra lỗi khi tạo câu hỏi. Vui lòng thử lại sau.')
        } finally {
            setGenerating(false)
        }
    }

    const handleAnswerChange = (questionId: number, optionIndex: number) => {
        // Disable navigation temporarily
        setIsNavigationDisabled(true)

        // Update answers
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }))

        // Auto-advance to next question after a short delay
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1)
            }
            // Re-enable navigation after advancing
            setIsNavigationDisabled(false)
        }, 600)
    }

    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0 && !isNavigationDisabled) {
            setCurrentQuestionIndex(currentQuestionIndex - 1)
        }
    }

    const goToNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1 && !isNavigationDisabled) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
        }
    }

    const goToQuestion = (index: number) => {
        if (!isNavigationDisabled) {
            setCurrentQuestionIndex(index);
        }
    }

    const calculateResult = async () => {
        if (Object.keys(answers).length < questions.length) {
            setError('Vui lòng trả lời tất cả các câu hỏi trước khi xem kết quả')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Calculate raw score
            let totalScore = 0
            let maxPossibleScore = 0

            questions.forEach(question => {
                const answerIndex = answers[question.id]
                if (answerIndex !== undefined) {
                    totalScore += question.scores[answerIndex]
                }
                maxPossibleScore += Math.max(...question.scores)
            })

            // Convert to percentage
            const percentage = Math.round((totalScore / maxPossibleScore) * 100)

            // Get AI explanation
            const answerDetails = questions.map(q => {
                const answerIndex = answers[q.id]
                return `Câu hỏi: ${q.text}\nLựa chọn: ${q.options[answerIndex]}\nĐiểm: ${q.scores[answerIndex]}/10`
            }).join('\n\n')

            const prompt = `Dưới đây là kết quả trắc nghiệm "Kiểm tra độ Gay/LGBT" của một người. Họ đạt ${percentage}% (${totalScore}/${maxPossibleScore} điểm). 
      
Chi tiết câu trả lời:
${answerDetails}

Viết một đoạn phân tích vui nhộn, hài hước và tích cực về kết quả này trong khoảng 3-4 câu dễ đọc, với cỡ chữ lớn. 
Đảm bảo rằng phân tích này:
- Có tính hài hước nhẹ nhàng
- Tích cực và không xúc phạm
- Sử dụng từ ngữ dễ hiểu
- Có thể kèm 1-2 emoji thích hợp
- Rất ngắn gọn, chỉ 3-4 câu

Chỉ trả về đoạn phân tích, không thêm tiêu đề hay kết luận.`

            const explanation = await aiService.processWithAI(prompt)

            setResult({
                score: percentage,
                explanation: explanation
            })
        } catch (err) {
            console.error('Result calculation error:', err)
            setError('Đã xảy ra lỗi khi tính kết quả. Vui lòng thử lại sau.')
        } finally {
            setLoading(false)
        }
    }

    const restartTest = () => {
        setResult(null)
        setAnswers({})
        setCurrentQuestionIndex(0)
        setTestStarted(false)
        window.scrollTo(0, 0)
    }

    const getScoreColor = (score: number) => {
        // Brighter, more vibrant colors
        if (score >= 90) return "#FF4D4D" // Bright Red
        if (score >= 75) return "#FF8C00" // Dark Orange
        if (score >= 60) return "#FFD700" // Gold
        if (score >= 45) return "#32CD32" // Lime Green
        if (score >= 30) return "#1E90FF" // Dodger Blue
        if (score >= 15) return "#9370DB" // Medium Purple
        return "#FF69B4" // Hot Pink
    }

    const getScoreLabel = (score: number) => {
        if (score >= 90) return "Siêu Gay"
        if (score >= 75) return "Rất Gay"
        if (score >= 60) return "Khá Gay"
        if (score >= 45) return "Hơi Gay"
        if (score >= 30) return "Một chút Gay"
        if (score >= 15) return "Không mấy Gay"
        return "Hoàn toàn Straight"
    }

    const currentQuestion = questions[currentQuestionIndex];
    const allQuestionsAnswered = Object.keys(answers).length === questions.length;

    return (
        <div className="mx-auto px-2 py-8 max-w-3xl">
            <Card className="shadow-md">
                <CardHeader className="bg-gradient-to-r from-pink-100 to-purple-100">
                    <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                        <Heart className="h-6 w-6 text-pink-500" />
                        Gay Test
                    </CardTitle>
                    <CardDescription>
                        Bài trắc nghiệm vui nhộn đánh giá "mức độ gay" của bạn. Chỉ mang tính giải trí!
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm p-2 bg-red-50 rounded-md">
                            <AlertCircle className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    )}

                    {!testStarted && !result && (
                        <div className="flex flex-col items-center justify-center p-10 text-center space-y-6">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center">
                                <Sparkles className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Kiểm tra độ Gay của bạn</h2>
                                <p className="text-gray-600 max-w-md mx-auto">
                                    Trả lời 10 câu hỏi vui nhộn để khám phá "mức độ gay" của bạn!
                                    Hoàn toàn mang tính giải trí và mỗi lần test sẽ có các câu hỏi khác nhau.
                                </p>
                            </div>
                            <Button
                                onClick={generateQuestions}
                                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-8 text-lg font-bold"
                                size="lg"
                            >
                                Bắt đầu Test
                            </Button>
                        </div>
                    )}

                    {generating && (
                        <div className="space-y-2 p-8 flex flex-col items-center">
                            <RefreshCw className="h-6 w-6 animate-spin text-pink-500" />
                            <span className="text-sm font-medium">Đang tạo câu hỏi...</span>
                        </div>
                    )}

                    {testStarted && !result && !generating && questions.length > 0 && (
                        <div className="space-y-4">
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                                    style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                                ></div>
                            </div>

                            <div className="text-sm text-gray-500 flex justify-between mb-2">
                                <span>Câu hỏi {currentQuestionIndex + 1}/{questions.length}</span>
                                <span>{Object.keys(answers).length}/{questions.length} đã trả lời</span>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-center mb-4">
                                {questions.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToQuestion(index)}
                                        disabled={isNavigationDisabled}
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                                            answers[questions[index].id] !== undefined
                                                ? "bg-green-100 text-green-800 border-2 border-green-300"
                                                : "bg-red-100 text-red-800 border-2 border-red-300",
                                            currentQuestionIndex === index && "ring-2 ring-offset-2 ring-pink-500",
                                            isNavigationDisabled && "opacity-70 cursor-not-allowed"
                                        )}
                                    >
                                        {index + 1}
                                        {answers[questions[index].id] !== undefined && (
                                            <Check className="absolute h-2 w-2 top-0 right-0 text-green-600" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {currentQuestion && (
                                <div className="space-y-4 border rounded-lg p-4 shadow-sm">
                                    <h3 className="font-medium text-lg">
                                        {currentQuestion.text}
                                    </h3>
                                    <RadioGroup
                                        value={answers[currentQuestion.id]?.toString() || ''}
                                        onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
                                        className="space-y-3 pl-2"
                                    >
                                        {currentQuestion.options.map((option, optIndex) => (
                                            <div key={optIndex}
                                                className={cn(
                                                    "flex items-center space-x-2 p-2 rounded-md transition-colors",
                                                    isNavigationDisabled && answers[currentQuestion.id] === optIndex
                                                        ? "bg-pink-50 border border-pink-200"
                                                        : "hover:bg-gray-50"
                                                )}
                                            >
                                                <RadioGroupItem
                                                    value={optIndex.toString()}
                                                    id={`q${currentQuestion.id}-opt${optIndex}`}
                                                    disabled={isNavigationDisabled}
                                                />
                                                <Label
                                                    htmlFor={`q${currentQuestion.id}-opt${optIndex}`}
                                                    className={cn(
                                                        "cursor-pointer w-full",
                                                        isNavigationDisabled && answers[currentQuestion.id] === optIndex && "font-medium"
                                                    )}
                                                >
                                                    {option}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={goToPreviousQuestion}
                                    disabled={currentQuestionIndex === 0 || isNavigationDisabled}
                                    className="flex items-center gap-1"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Quay lại
                                </Button>

                                {currentQuestionIndex === questions.length - 1 ? (
                                    <Button
                                        onClick={calculateResult}
                                        disabled={loading || !allQuestionsAnswered || isNavigationDisabled}
                                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                                    >
                                        {loading ? 'Đang tính điểm...' : 'Xem kết quả'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        onClick={goToNextQuestion}
                                        disabled={isNavigationDisabled}
                                        className="flex items-center gap-1"
                                    >
                                        Tiếp theo <ArrowRight className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="space-y-2 p-8 flex flex-col items-center">
                            <RefreshCw className="h-6 w-6 animate-spin text-pink-500" />
                            <span className="text-sm font-medium">Đang tính điểm...</span>
                            <Progress value={75} className="h-1 w-32" />
                        </div>
                    )}

                    {result && (
                        <div className="p-4 rounded-md bg-gradient-to-r from-pink-50 to-purple-50">
                            <div className="flex flex-col items-center mb-6">
                                <span className="text-2xl font-bold" style={{ color: getScoreColor(result.score) }}>{getScoreLabel(result.score)}</span>
                                <div className="relative w-36 h-36 rounded-full flex items-center justify-center bg-white mb-4 shadow-lg" >
                                    <svg className="w-36 h-36 absolute" viewBox="0 0 100 100">
                                        <defs>
                                            <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#FF4D4D" />
                                                <stop offset="16.6%" stopColor="#FF8C00" />
                                                <stop offset="33.3%" stopColor="#FFD700" />
                                                <stop offset="50%" stopColor="#32CD32" />
                                                <stop offset="66.6%" stopColor="#1E90FF" />
                                                <stop offset="83.3%" stopColor="#9370DB" />
                                                <stop offset="100%" stopColor="#FF69B4" />
                                            </linearGradient>
                                        </defs>
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="42"
                                            fill="none"
                                            stroke="#e5e7eb"
                                            strokeWidth="12"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="42"
                                            fill="none"
                                            stroke="url(#rainbow)"
                                            strokeWidth="14"
                                            strokeDasharray={`${2 * Math.PI * 42 * result.score / 100} ${2 * Math.PI * 42 * (100 - result.score) / 100}`}
                                            strokeDashoffset={2 * Math.PI * 42 * 25 / 100}
                                            transform="rotate(-90 50 50)"
                                        />
                                    </svg>
                                    <div className="flex flex-col items-center">
                                        <span className="text-4xl font-bold" style={{ color: getScoreColor(result.score), textShadow: "0px 0px 2px rgba(0,0,0,0.1)" }}>
                                            {result.score}%
                                        </span>
                                    </div>
                                </div>

                                <div className="text-base text-gray-700 p-5 bg-white/70 rounded-md w-full shadow-sm">
                                    <p className="font-medium text-center">{result.explanation}</p>
                                </div>

                                <Button
                                    onClick={restartTest}
                                    className="mt-6 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-6 font-bold"
                                    size="lg"
                                >
                                    Làm lại bài test
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
