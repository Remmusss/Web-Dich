'use client'

import { useState } from 'react'
import { BookOpen, RefreshCw, AlertCircle, ArrowRight, ArrowLeft, Sparkles, Check, XCircle, BookOpenCheck } from 'lucide-react'
import { aiService } from '@/lib/ai-service'
import { SUPPORTED_LANGUAGES } from '@/constants/languages'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Question {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

const DIFFICULTY_LEVELS = [
  { code: 'easy', name: 'Dễ' },
  { code: 'medium', name: 'Bình thường' },
  { code: 'hard', name: 'Khó' },
  { code: 'expert', name: 'Chuyên gia' },
]

const getDifficultyDescription = (level: string) => {
  switch (level) {
    case 'easy':
      return 'dễ, phù hợp cho người mới bắt đầu, kiến thức cơ bản'
    case 'medium':
      return 'trung bình, đòi hỏi hiểu biết tốt về chủ đề'
    case 'hard':
      return 'khó, yêu cầu kiến thức chuyên sâu và khả năng phân tích'
    case 'expert':
      return 'chuyên gia, cực kỳ khó, đòi hỏi hiểu biết toàn diện và khả năng xử lý tình huống phức tạp'
    default:
      return 'trung bình'
  }
}

const getDifficultyColor = (difficulty: string) => {
  // Return gray gradient for all difficulty levels
  return 'from-gray-600 to-gray-800';
}

export default function QuizGenerator() {
  const [prompt, setPrompt] = useState('')
  const [numQuestions, setNumQuestions] = useState<string>('5')
  const [explanationLanguage, setExplanationLanguage] = useState('vi')
  const [difficulty, setDifficulty] = useState('medium')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: number}>({})
  const [showExplanations, setShowExplanations] = useState<{[key: number]: boolean}>({})
  const [testStarted, setTestStarted] = useState(false)
  const [isNavigationDisabled, setIsNavigationDisabled] = useState(false)
  const [result, setResult] = useState<{
    score: number;
    correctAnswers: number;
    totalQuestions: number;
  } | null>(null)
  const [displayMode, setDisplayMode] = useState<'single' | 'all'>('single')
  const [explanationTiming, setExplanationTiming] = useState<'immediate' | 'end'>('immediate')
  const [autoNext, setAutoNext] = useState(true)

  const handleGenerateQuiz = async () => {
    if (!prompt.trim()) return
    
    // Validate number of questions before submitting
    const validatedNumQuestions = numQuestions === '' ? 5 : Math.min(10, Math.max(1, parseInt(numQuestions)));
    setNumQuestions(validatedNumQuestions.toString());

    setIsLoading(true)
    setError(null)
    setTestStarted(true)
    setQuestions([])
    setSelectedAnswers({})
    setShowExplanations({})
    setCurrentQuestionIndex(0)
    setResult(null)

    try {
      const systemPrompt = `
        Bạn là một giáo viên chuyên tạo câu hỏi trắc nghiệm. 
        Hãy tạo ${validatedNumQuestions} câu hỏi dựa trên yêu cầu của người dùng.
        
        Độ khó yêu cầu: ${getDifficultyDescription(difficulty)}

        Giải thích bằng ${SUPPORTED_LANGUAGES.find(lang => lang.code === explanationLanguage)?.name}
        
        Yêu cầu định dạng:
        1. Mỗi câu hỏi phải có:
           - Câu hỏi rõ ràng, dễ hiểu
           - 4 đáp án lựa chọn
           - Chỉ có 1 đáp án đúng
           - Giải thích chi tiết tại sao đáp án đó là đúng ( bằng ${SUPPORTED_LANGUAGES.find(lang => lang.code === explanationLanguage)?.name})
           - Đảm bảo độ khó phù hợp với yêu cầu
        
        2. Trả về kết quả CHÍNH XÁC theo định dạng JSON sau:
        {
          "questions": [
            {
              "id": 1,
              "question": "Câu hỏi...",
              "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
              "correctAnswer": 0,
              "explanation": "Giải thích..."
            }
          ]
        }

        Lưu ý:
        - Tạo đúng ${validatedNumQuestions} câu hỏi
        - Độ khó phải đúng theo yêu cầu: ${getDifficultyDescription(difficulty)}
        - Chỉ trả về JSON, không thêm bất kỳ text nào khác
        - correctAnswer là index của đáp án đúng (0-3)
        - Đảm bảo JSON hợp lệ và đúng định dạng
        - Không thêm dấu backtick hoặc markdown
      `

      const response = await aiService.generateQuiz(systemPrompt, prompt)
      let questions

      try {
        // Clean up response to ensure valid JSON
        const jsonStr = response.trim().replace(/```json\s*|\s*```/g, '').trim()
        questions = JSON.parse(jsonStr)

        // Validate response structure
        if (!questions.questions || !Array.isArray(questions.questions)) {
          throw new Error('Invalid response format')
        }

        // Validate each question and number of questions
        if (questions.questions.length !== validatedNumQuestions) {
          throw new Error(`Expected ${validatedNumQuestions} questions but got ${questions.questions.length}`)
        }

        questions.questions.forEach((q: any, index: number) => {
          if (!q.id || !q.question || !Array.isArray(q.options) || 
              q.options.length !== 4 || typeof q.correctAnswer !== 'number' || 
              !q.explanation) {
            throw new Error(`Invalid question format at index ${index}`)
          }
        })

        setQuestions(questions.questions)
      } catch (error) {
        console.error('Failed to parse AI response:', response)
        throw new Error('Lỗi khi xử lý câu trả lời từ AI. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('Quiz generation error:', error)
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo câu hỏi')
      setTestStarted(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (questionId: number, optionIndex: number) => {
    // Disable navigation temporarily only in single mode
    if (displayMode === 'single') {
      setIsNavigationDisabled(true)
    }
    
    // Update answers
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }))
    
    // Show explanations based on user preference
    if (explanationTiming === 'immediate') {
      setShowExplanations(prev => ({
        ...prev,
        [questionId]: true
      }))
    }
    
    // Auto-advance to next question after a short delay if enabled and in single mode
    if (displayMode === 'single' && autoNext) {
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1)
        } else if (Object.keys(selectedAnswers).length + 1 === questions.length) {
          // If this was the last question and all questions are answered, calculate results
          calculateResults()
        }
        // Re-enable navigation after advancing
        setIsNavigationDisabled(false)
      }, 600)
    } else if (displayMode === 'single') {
      // Re-enable navigation if not auto-advancing
      setTimeout(() => {
        setIsNavigationDisabled(false)
      }, 300)
    }
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
      setCurrentQuestionIndex(index)
    }
  }

  const calculateResults = () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      setError('Vui lòng trả lời tất cả các câu hỏi trước khi xem kết quả')
      return
    }

    let correctAnswers = 0
    questions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctAnswers++
      }
    })

    const score = Math.round((correctAnswers / questions.length) * 100)
    
    // If user chose to see explanations at the end, show them all now
    if (explanationTiming === 'end') {
      const allExplanationsShown = questions.reduce((acc, question) => {
        acc[question.id] = true
        return acc
      }, {} as Record<number, boolean>)
      
      setShowExplanations(allExplanationsShown)
    }
    
    setResult({
      score,
      correctAnswers,
      totalQuestions: questions.length
    })
  }

  const restartQuiz = () => {
    setTestStarted(false)
    setResult(null)
    setSelectedAnswers({})
    setShowExplanations({})
    setQuestions([])
    setCurrentQuestionIndex(0)
    window.scrollTo(0, 0)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#22c55e" // Green
    if (score >= 75) return "#16a34a" // Dark Green
    if (score >= 60) return "#2563eb" // Blue
    if (score >= 45) return "#3b82f6" // Light Blue
    if (score >= 30) return "#f59e0b" // Yellow
    return "#ef4444" // Red
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Xuất sắc"
    if (score >= 75) return "Giỏi"
    if (score >= 60) return "Khá"
    if (score >= 45) return "Trung bình"
    if (score >= 30) return "Yếu"
    return "Kém"
  }

  const isAnswerCorrect = (questionId: number) => {
    const question = questions.find(q => q.id === questionId)
    return question && selectedAnswers[questionId] === question.correctAnswer
  }

  const currentQuestion = questions[currentQuestionIndex]
  const allQuestionsAnswered = Object.keys(selectedAnswers).length === questions.length

  return (
    <div className="mx-auto px-2 py-8 max-w-3xl">
      <Card className="shadow-md">
        <CardHeader className={`bg-gradient-to-r ${getDifficultyColor(difficulty)}`}>
          <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-white">
            <BookOpenCheck className="h-6 w-6" />
            Quiz Generator
          </CardTitle>
          <CardDescription className="text-white/90">
            Tạo bộ câu hỏi trắc nghiệm tùy chỉnh về bất kỳ chủ đề nào
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm p-2 bg-red-50 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {!testStarted && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${getDifficultyColor(difficulty)} flex items-center justify-center`}>
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Tạo bộ câu hỏi trắc nghiệm</h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Nhập yêu cầu và tùy chỉnh các thông số để tạo bộ câu hỏi phù hợp với nhu cầu của bạn.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quiz-prompt">Nhập yêu cầu tạo câu hỏi:</Label>
                  <Textarea
                    id="quiz-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ví dụ: Tạo câu hỏi trắc nghiệm tiếng Anh về thì hiện tại đơn..."
                    className="min-h-24 bg-gray-50/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="num-questions">Số lượng câu hỏi:</Label>
                    <Select
                      value={numQuestions}
                      onValueChange={setNumQuestions}
                    >
                      <SelectTrigger id="num-questions">
                        <SelectValue placeholder="Chọn số lượng câu hỏi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 câu hỏi</SelectItem>
                        <SelectItem value="3">3 câu hỏi</SelectItem>
                        <SelectItem value="5">5 câu hỏi</SelectItem>
                        <SelectItem value="10">10 câu hỏi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="explanation-language">Ngôn ngữ giải thích:</Label>
                    <Select
                      value={explanationLanguage}
                      onValueChange={setExplanationLanguage}
                    >
                      <SelectTrigger id="explanation-language">
                        <SelectValue placeholder="Chọn ngôn ngữ" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Độ khó:</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {DIFFICULTY_LEVELS.map((level) => (
                      <Button
                        key={level.code}
                        type="button"
                        onClick={() => setDifficulty(level.code)}
                        variant={difficulty === level.code ? "default" : "outline"}
                        className={cn(
                          difficulty === level.code && "bg-gradient-to-r from-gray-600 to-gray-800"
                        )}
                      >
                        {level.name}
                      </Button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {getDifficultyDescription(difficulty)}
                  </p>
                </div>

                {/* New UI preferences section */}
                <div className="space-y-4 border rounded-md p-4 bg-gray-50/50">
                  <h3 className="font-medium text-sm text-gray-700">Tùy chọn hiển thị:</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="display-mode">Chế độ hiển thị:</Label>
                      <Select
                        value={displayMode}
                        onValueChange={(value: 'single' | 'all') => setDisplayMode(value)}
                      >
                        <SelectTrigger id="display-mode">
                          <SelectValue placeholder="Chọn chế độ hiển thị" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Hiển thị từng câu hỏi</SelectItem>
                          <SelectItem value="all">Hiển thị tất cả câu hỏi</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        {displayMode === 'single' ? 
                          'Hiển thị một câu hỏi mỗi lần, dễ tập trung và làm từng bước.' : 
                          'Hiển thị tất cả câu hỏi cùng lúc, có thể làm theo thứ tự tùy ý.'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="explanation-timing">Thời điểm hiện giải thích:</Label>
                      <Select
                        value={explanationTiming}
                        onValueChange={(value: 'immediate' | 'end') => setExplanationTiming(value)}
                      >
                        <SelectTrigger id="explanation-timing">
                          <SelectValue placeholder="Chọn thời điểm giải thích" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Hiện ngay sau khi trả lời</SelectItem>
                          <SelectItem value="end">Hiện khi hoàn thành tất cả câu hỏi</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        {explanationTiming === 'immediate' ? 
                          'Hiển thị giải thích ngay sau khi trả lời từng câu hỏi.' : 
                          'Hiển thị tất cả giải thích khi hoàn thành bài kiểm tra.'}
                      </p>
                    </div>
                  </div>

                  {displayMode === 'single' && (
                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="checkbox"
                        id="auto-next"
                        checked={autoNext}
                        onChange={(e) => setAutoNext(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                      />
                      <Label htmlFor="auto-next" className="cursor-pointer">
                        Tự động chuyển câu hỏi tiếp theo sau khi trả lời
                      </Label>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleGenerateQuiz}
                  disabled={isLoading || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-800 mt-4 hover:opacity-90 text-white"
                  size="lg"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Đang tạo câu hỏi...
                    </span>
                  ) : (
                    'Tạo bộ câu hỏi'
                  )}
                </Button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="space-y-2 p-8 flex flex-col items-center">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-sm font-medium">Đang tạo câu hỏi...</span>
              <Progress value={75} className="h-1 w-32" />
            </div>
          )}

          {testStarted && !isLoading && questions.length > 0 && !result && (
            <div className="space-y-4">
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getDifficultyColor(difficulty)}`}
                  style={{ width: `${(Object.keys(selectedAnswers).length / questions.length) * 100}%` }}
                ></div>
              </div>

              <div className="text-sm text-gray-500 flex justify-between mb-2">
                <span>{displayMode === 'single' ? `Câu hỏi ${currentQuestionIndex + 1}/${questions.length}` : `Tổng số câu hỏi: ${questions.length}`}</span>
                <span>{Object.keys(selectedAnswers).length}/{questions.length} đã trả lời</span>
              </div>

              {/* Question navigation - show only in single mode */}
              {displayMode === 'single' && (
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToQuestion(index)}
                      disabled={isNavigationDisabled}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                        selectedAnswers[questions[index].id] !== undefined
                          ? "bg-gray-200 text-gray-800 border-2 border-gray-300"
                          : "bg-gray-100 text-gray-800 border-2 border-gray-300",
                        currentQuestionIndex === index && "ring-2 ring-offset-2 ring-gray-500",
                        isNavigationDisabled && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      {index + 1}
                      {selectedAnswers[questions[index].id] !== undefined && (
                        <Check className="absolute h-2 w-2 top-0 right-0 text-green-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Display mode: Single question */}
              {displayMode === 'single' && currentQuestion && (
                <div className="space-y-4 border rounded-lg p-4 shadow-sm">
                  <h3 className="font-medium text-lg">
                    {currentQuestion.question}
                  </h3>
                  <RadioGroup
                    value={selectedAnswers[currentQuestion.id]?.toString() || ''}
                    onValueChange={(value) => handleAnswerSelect(currentQuestion.id, parseInt(value))}
                    className="space-y-3 pl-2"
                  >
                    {currentQuestion.options.map((option, optIndex) => (
                      <div key={optIndex}
                        className={cn(
                          "flex items-center space-x-2 p-2 rounded-md transition-colors",
                          isNavigationDisabled && selectedAnswers[currentQuestion.id] === optIndex && explanationTiming === 'immediate'
                            ? isAnswerCorrect(currentQuestion.id) 
                              ? "bg-gray-100 border border-gray-300"
                              : "bg-gray-100 border border-gray-300"
                            : isNavigationDisabled && selectedAnswers[currentQuestion.id] === optIndex
                            ? "bg-gray-100 border border-gray-300"
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
                            isNavigationDisabled && selectedAnswers[currentQuestion.id] === optIndex && "font-medium"
                          )}
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {explanationTiming === 'immediate' && showExplanations[currentQuestion.id] && (
                    <div className={cn(
                      "mt-4 p-4 rounded-md bg-gray-50 border border-gray-200"
                    )}>
                      <div className="flex gap-2">
                        {isAnswerCorrect(currentQuestion.id) ? (
                          <Check className="h-5 w-5 text-gray-600 flex-shrink-0 mt-1" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-1" />
                        )}
                        <div>
                          <p className="font-medium mb-1 text-gray-700">
                            {isAnswerCorrect(currentQuestion.id) 
                              ? "Chính xác!" 
                              : `Chưa đúng. Đáp án đúng là: ${String.fromCharCode(65 + currentQuestion.correctAnswer)}`
                            }
                          </p>
                          <p className="text-sm text-gray-600">{currentQuestion.explanation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Display mode: All questions at once */}
              {displayMode === 'all' && (
                <div className="space-y-6">
                  {questions.map((question, index) => (
                    <div key={question.id} className="space-y-4 border rounded-lg p-4 shadow-sm">
                      <h3 className="font-medium text-lg flex justify-between">
                        <span>{index + 1}. {question.question}</span>
                        {selectedAnswers[question.id] !== undefined && explanationTiming === 'immediate' && (
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            isAnswerCorrect(question.id) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          )}>
                            {isAnswerCorrect(question.id) ? "Đúng" : "Sai"}
                          </span>
                        )}
                      </h3>
                      <RadioGroup
                        value={selectedAnswers[question.id]?.toString() || ''}
                        onValueChange={(value) => handleAnswerSelect(question.id, parseInt(value))}
                        className="space-y-3 pl-2"
                      >
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex}
                            className={cn(
                              "flex items-center space-x-2 p-2 rounded-md transition-colors",
                              selectedAnswers[question.id] === optIndex && explanationTiming === 'immediate'
                                ? isAnswerCorrect(question.id)
                                  ? "bg-gray-100 border border-gray-300"
                                  : "bg-gray-100 border border-gray-300"
                                : selectedAnswers[question.id] === optIndex 
                                ? "bg-gray-100 border border-gray-300"
                                : "hover:bg-gray-50"
                            )}
                          >
                            <RadioGroupItem
                              value={optIndex.toString()}
                              id={`q${question.id}-opt${optIndex}`}
                            />
                            <Label
                              htmlFor={`q${question.id}-opt${optIndex}`}
                              className={cn(
                                "cursor-pointer w-full",
                                selectedAnswers[question.id] === optIndex && "font-medium"
                              )}
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {explanationTiming === 'immediate' && showExplanations[question.id] && (
                        <div className={cn(
                          "mt-4 p-4 rounded-md bg-gray-50 border border-gray-200"
                        )}>
                          <div className="flex gap-2">
                            {isAnswerCorrect(question.id) ? (
                              <Check className="h-5 w-5 text-gray-600 flex-shrink-0 mt-1" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-1" />
                            )}
                            <div>
                              <p className="font-medium mb-1 text-gray-700">
                                {isAnswerCorrect(question.id) 
                                  ? "Chính xác!" 
                                  : `Chưa đúng. Đáp án đúng là: ${String.fromCharCode(65 + question.correctAnswer)}`
                                }
                              </p>
                              <p className="text-sm text-gray-600">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation for single mode */}
              {displayMode === 'single' && (
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
                      onClick={calculateResults}
                      disabled={!allQuestionsAnswered || isNavigationDisabled}
                      className="bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:opacity-90"
                    >
                      Xem kết quả
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
              )}

              {/* Show results button for all questions mode */}
              {displayMode === 'all' && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={calculateResults}
                    disabled={!allQuestionsAnswered}
                    className="bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:opacity-90 px-8"
                    size="lg"
                  >
                    Xem kết quả
                  </Button>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="p-4 rounded-md bg-gradient-to-r from-gray-100 to-gray-200">
              <div className="flex flex-col items-center mb-6">
                <span className="text-2xl font-bold text-gray-800">
                  {getScoreLabel(result.score)}
                </span>
                
                <div className="relative w-36 h-36 rounded-full flex items-center justify-center bg-white mb-4 shadow-lg">
                  <svg className="w-36 h-36 absolute" viewBox="0 0 100 100">
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
                      stroke="#4b5563"
                      strokeWidth="14"
                      strokeDasharray={`${2 * Math.PI * 42 * result.score / 100} ${2 * Math.PI * 42 * (100 - result.score) / 100}`}
                      strokeDashoffset={2 * Math.PI * 42 * 25 / 100}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold text-gray-800" style={{ textShadow: "0px 0px 2px rgba(0,0,0,0.1)" }}>
                      {result.score}%
                    </span>
                    <span className="text-sm text-gray-500">
                      {result.correctAnswers}/{result.totalQuestions} câu đúng
                    </span>
                  </div>
                </div>

                {/* Review all questions section */}
                <div className="w-full mt-6">
                  <h3 className="font-semibold text-lg mb-4 text-center">Xem lại tất cả câu hỏi và đáp án</h3>
                  <div className="space-y-4">
                    {questions.map((question, idx) => {
                      const userAnswer = selectedAnswers[question.id];
                      const isCorrect = userAnswer === question.correctAnswer;
                      
                      return (
                        <div 
                          key={question.id} 
                          className={cn(
                            "border rounded-md p-4",
                            isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                          )}
                        >
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">Câu {idx + 1}</span>
                            <span className={cn(
                              "text-sm px-2 py-0.5 rounded-full",
                              isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            )}>
                              {isCorrect ? "Đúng" : "Sai"}
                            </span>
                          </div>
                          
                          <p className="text-gray-800 mb-3">{question.question}</p>
                          
                          <div className="space-y-2">
                            {question.options.map((option, optIdx) => (
                              <div 
                                key={optIdx}
                                className={cn(
                                  "flex items-start p-2 rounded-md",
                                  optIdx === question.correctAnswer && optIdx === userAnswer && "bg-green-100 border border-green-300",
                                  optIdx === question.correctAnswer && optIdx !== userAnswer && "bg-green-100 border border-green-300",
                                  optIdx !== question.correctAnswer && optIdx === userAnswer && "bg-red-100 border border-red-300",
                                  optIdx !== question.correctAnswer && optIdx !== userAnswer && "bg-gray-50"
                                )}
                              >
                                <div className="flex-shrink-0 mt-0.5 mr-2">
                                  {optIdx === userAnswer && optIdx === question.correctAnswer && (
                                    <Check className="h-5 w-5 text-green-600" />
                                  )}
                                  {optIdx === userAnswer && optIdx !== question.correctAnswer && (
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                  )}
                                  {optIdx === question.correctAnswer && optIdx !== userAnswer && (
                                    <Check className="h-5 w-5 text-green-600" />
                                  )}
                                  {optIdx !== question.correctAnswer && optIdx !== userAnswer && (
                                    <div className="h-5 w-5 rounded-full border border-gray-300" />
                                  )}
                                </div>
                                <span className={cn(
                                  "text-sm",
                                  optIdx === question.correctAnswer && "font-medium",
                                )}>
                                  {option}
                                </span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm font-medium">Giải thích:</p>
                            <p className="text-sm mt-1">{question.explanation}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    onClick={restartQuiz}
                    className={`bg-gradient-to-r ${getDifficultyColor(difficulty)} text-white hover:opacity-90 px-6 font-bold`}
                    size="lg"
                  >
                    Làm lại Quiz
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResult(null);
                      setSelectedAnswers({});
                      setShowExplanations({});
                      setQuestions([]);
                      setCurrentQuestionIndex(0);
                      setTestStarted(false);
                      window.scrollTo(0, 0);
                    }}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-4 w-4" /> Tạo Quiz mới
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 