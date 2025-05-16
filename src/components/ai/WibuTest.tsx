'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, AlertCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import { aiService } from '@/lib/ai-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function WibuTest() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [result, setResult] = useState<{
    score: number;
    explanation: string;
    level: string;
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
      const prompt = `Tạo ra 10 câu hỏi trắc nghiệm vui nhộn để "kiểm tra độ Wibu" (mức độ yêu thích anime/manga) của một người.

Yêu cầu:
- Tạo những câu hỏi liên quan đến anime, manga, văn hóa Nhật Bản, cosplay, và các thuật ngữ otaku
- Mỗi câu hỏi đều là trắc nghiệm với 4 lựa chọn
- Nội dung câu hỏi đa dạng về sở thích, kiến thức và thói quen liên quan đến anime/manga
- Các câu hỏi nên dễ hiểu cho cả người mới và người hâm mộ lâu năm
- Bao gồm các chủ đề như: thói quen xem anime, sưu tầm figure, cosplay, kiến thức anime/manga, âm nhạc Nhật Bản
- Hỏi về cả anime nổi tiếng và anime ít người biết để đánh giá sâu

Trả về kết quả dưới dạng JSON với định dạng sau:
{
  "questions": [
    {
      "id": 1,
      "text": "Nội dung câu hỏi",
      "options": ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
      "scores": từ 1 tới 10 phụ thuộc vào mức độ Wibu
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
      console.error('Wibu Test error:', err)
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

      // Get wibu level
      let wibuLevel = "";
      if (percentage >= 90) wibuLevel = "Otaku Thượng Đẳng";
      else if (percentage >= 75) wibuLevel = "Wibu Chuyên Nghiệp";
      else if (percentage >= 60) wibuLevel = "Wibu Tâm Huyết";
      else if (percentage >= 45) wibuLevel = "Wibu Nghiệp Dư";
      else if (percentage >= 30) wibuLevel = "Fan Anime Bình Thường";
      else if (percentage >= 15) wibuLevel = "Mới Làm Quen Anime";
      else wibuLevel = "Không Biết Wibu Là Gì";

      // Get AI explanation
      const answerDetails = questions.map(q => {
        const answerIndex = answers[q.id]
        return `Câu hỏi: ${q.text}\nLựa chọn: ${q.options[answerIndex]}\nĐiểm: ${q.scores[answerIndex]}/10`
      }).join('\n\n')

      const prompt = `Dưới đây là kết quả trắc nghiệm "Kiểm tra độ Wibu" của một người. Họ đạt ${percentage}% (${totalScore}/${maxPossibleScore} điểm) và được phân loại là "${wibuLevel}". 
      
Chi tiết câu trả lời:
${answerDetails}

Viết một đoạn phân tích vui nhộn, hài hước về kết quả này trong khoảng 3-4 câu ngắn gọn, dễ đọc.
Đảm bảo rằng phân tích này:
- Có tính hài hước nhẹ nhàng, thêm các thuật ngữ anime nếu phù hợp
- Sử dụng từ ngữ dễ hiểu
- Có thể kèm 1-2 emoji hoặc từ tiếng Nhật thích hợp
- Rất ngắn gọn, chỉ 3-4 câu
- Đề cập đến cấp độ Wibu của họ

Chỉ trả về đoạn phân tích, không thêm tiêu đề hay kết luận.`

      const explanation = await aiService.processWithAI(prompt)

      setResult({
        score: percentage,
        explanation: explanation,
        level: wibuLevel
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
    // Anime-themed colors
    if (score >= 90) return "#FF355E" // Neon Pink
    if (score >= 75) return "#FF9933" // Orange
    if (score >= 60) return "#FFCC33" // Yellow
    if (score >= 45) return "#66FF66" // Neon Green
    if (score >= 30) return "#50BFE6" // Light Blue
    if (score >= 15) return "#EE82EE" // Violet
    return "#FF66CC" // Pink
  }

  const currentQuestion = questions[currentQuestionIndex];
  const allQuestionsAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="mx-auto px-2 py-8 max-w-3xl">
      <Card className="shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-400 to-purple-600 text-white">
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-300" />
            Wibu Test
          </CardTitle>
          <CardDescription className="text-blue-100">
            Trắc nghiệm kiểm tra mức độ Wibu (yêu thích anime/manga) của bạn!
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
              <div className="w-28 h-28 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                <div className="text-3xl">🍥</div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">Kiểm tra độ Wibu của bạn</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Trả lời 10 câu hỏi để biết mức độ đam mê anime/manga của bạn cao đến đâu!
                  Bạn đã sẵn sàng để biết mình là "Wibu thứ thiệt" hay chỉ là "Fan anime bình thường"?
                </p>
              </div>
              <Button
                onClick={generateQuestions}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 text-lg font-bold"
                size="lg"
              >
                Bắt đầu Test
              </Button>
            </div>
          )}

          {generating && (
            <div className="space-y-2 p-8 flex flex-col items-center">
              <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
              <span className="text-sm font-medium">Đang tạo câu hỏi...</span>
            </div>
          )}

          {testStarted && !result && !generating && questions.length > 0 && (
            <div className="space-y-4">
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
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
                        ? "bg-blue-100 text-blue-800 border-2 border-blue-300"
                        : "bg-red-100 text-red-800 border-2 border-red-300",
                      currentQuestionIndex === index && "ring-2 ring-offset-2 ring-purple-500",
                      isNavigationDisabled && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {index + 1}
                    {answers[questions[index].id] !== undefined && (
                      <Check className="absolute h-2 w-2 top-0 right-0 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>

              {currentQuestion && (
                <div className="space-y-4 border rounded-lg p-4 shadow-sm border-blue-100">
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
                            ? "bg-blue-50 border border-blue-200"
                            : "hover:bg-gray-50"
                        )}
                      >
                        <RadioGroupItem
                          value={optIndex.toString()}
                          id={`q${currentQuestion.id}-opt${optIndex}`}
                          disabled={isNavigationDisabled}
                          className="text-purple-600"
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
                  className="flex items-center gap-1 border-blue-200 text-blue-700"
                >
                  <ArrowLeft className="h-4 w-4" /> Quay lại
                </Button>

                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={calculateResult}
                    disabled={loading || !allQuestionsAnswered || isNavigationDisabled}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {loading ? 'Đang tính điểm...' : 'Xem kết quả'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={goToNextQuestion}
                    disabled={isNavigationDisabled}
                    className="flex items-center gap-1 border-blue-200 text-blue-700"
                  >
                    Tiếp theo <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="space-y-2 p-8 flex flex-col items-center">
              <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
              <span className="text-sm font-medium">Đang tính điểm...</span>
              <Progress value={75} className="h-1 w-32 bg-blue-100" indicatorClassName="bg-purple-600" />
            </div>
          )}

          {result && (
            <div className="p-4 rounded-md bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-1">
                  <div className="text-xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      <span className="text-2xl font-bold text-center" style={{ color: getScoreColor(result.score) }}>
                      {result.level}
                    </span> 
                  </div>
                  <div className="absolute -top-6 -right-4 text-3xl transform rotate-12">🍥</div>
                </div>

                <div className="relative w-36 h-36 rounded-full flex items-center justify-center bg-white mb-4 shadow-lg">
                  <svg className="w-36 h-36 absolute" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="wibu-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF355E" />
                        <stop offset="16.6%" stopColor="#FF9933" />
                        <stop offset="33.3%" stopColor="#FFCC33" />
                        <stop offset="50%" stopColor="#66FF66" />
                        <stop offset="66.6%" stopColor="#50BFE6" />
                        <stop offset="83.3%" stopColor="#EE82EE" />
                        <stop offset="100%" stopColor="#FF66CC" />
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
                      stroke="url(#wibu-gradient)"
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

                <div className="text-base text-gray-700 p-5 bg-white/70 rounded-md w-full shadow-sm border border-purple-100">
                  <p className="font-medium text-center">{result.explanation}</p>
                </div>

                <Button
                  onClick={restartTest}
                  className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 font-bold"
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