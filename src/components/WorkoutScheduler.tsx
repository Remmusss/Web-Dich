'use client'

import { useState, useEffect } from 'react'
import { 
  ClipboardDocumentCheckIcon, 
  PlusIcon, 
  TrashIcon, 
  ArrowPathIcon,
  HeartIcon,
  FireIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { aiService } from '@/lib/ai-service'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { collection, doc, setDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore'

// Define workout types
const workoutTypes = [
  { id: 'cardio', name: 'Cardio', icon: <HeartIcon className="w-5 h-5" /> },
  { id: 'strength', name: 'Sức mạnh', icon: <FireIcon className="w-5 h-5" /> },
  { id: 'flexibility', name: 'Linh hoạt', icon: <ArrowPathIcon className="w-5 h-5" /> },
  { id: 'custom', name: 'Tùy chỉnh', icon: <PlusIcon className="w-5 h-5" /> }
]

// Define fitness levels
const fitnessLevels = [
  { id: 'beginner', name: 'Người mới bắt đầu' },
  { id: 'intermediate', name: 'Trung cấp' },
  { id: 'advanced', name: 'Nâng cao' }
]

// Define time slots
const timeSlots = [
  { id: 'morning', name: 'Sáng (5:00 - 8:00)' },
  { id: 'noon', name: 'Trưa (11:00 - 13:00)' },
  { id: 'afternoon', name: 'Chiều (16:00 - 18:00)' },
  { id: 'evening', name: 'Tối (19:00 - 22:00)' }
]

// Define workout recommendations for different BMI categories
const workoutRecommendations = {
  underweight: {
    title: 'Phát triển cơ bắp và tăng cân',
    description: 'Tập trung vào bài tập tăng sức mạnh và cơ bắp, kết hợp với chế độ ăn giàu protein và calo.',
    recommendations: [
      { day: 'Thứ 2 & Thứ 5', workout: 'Tập tay, vai và ngực' },
      { day: 'Thứ 3 & Thứ 6', workout: 'Tập lưng và chân' },
      { day: 'Thứ 4 & Thứ 7', workout: 'Cardio nhẹ và phục hồi' },
      { day: 'Chủ nhật', workout: 'Nghỉ ngơi' }
    ]
  },
  normal: {
    title: 'Duy trì cân nặng và cải thiện thể lực',
    description: 'Kết hợp các bài tập cardio và sức mạnh để duy trì cân nặng và cải thiện sức khỏe tổng thể.',
    recommendations: [
      { day: 'Thứ 2, Thứ 4, Thứ 6', workout: 'Cardio (chạy, bơi, đạp xe)' },
      { day: 'Thứ 3 & Thứ 5', workout: 'Tập sức mạnh toàn thân' },
      { day: 'Thứ 7', workout: 'Yoga hoặc Pilates' },
      { day: 'Chủ nhật', workout: 'Nghỉ ngơi hoặc đi bộ nhẹ' }
    ]
  },
  overweight: {
    title: 'Giảm cân và tăng sức bền',
    description: 'Tập trung vào các bài tập đốt mỡ và cardio, kết hợp với chế độ ăn lành mạnh.',
    recommendations: [
      { day: 'Thứ 2 - Thứ 6', workout: 'Cardio 30-45 phút (cường độ vừa đến cao)' },
      { day: 'Thứ 3 & Thứ 5', workout: 'Tập sức mạnh với tạ nhẹ, nhiều lần lặp lại' },
      { day: 'Thứ 7', workout: 'Tập cường độ cao ngắt quãng (HIIT)' },
      { day: 'Chủ nhật', workout: 'Nghỉ ngơi hoặc đi bộ dài' }
    ]
  },
  obese: {
    title: 'Giảm cân an toàn và cải thiện vận động',
    description: 'Bắt đầu với các bài tập nhẹ nhàng và dần tăng cường độ khi cơ thể thích nghi.',
    recommendations: [
      { day: 'Thứ 2, Thứ 4, Thứ 6', workout: 'Đi bộ 30 phút hoặc bơi' },
      { day: 'Thứ 3 & Thứ 5', workout: 'Tập sức mạnh với dây kháng lực hoặc tạ nhẹ' },
      { day: 'Thứ 7', workout: 'Yoga nhẹ nhàng hoặc các bài tập kéo giãn' },
      { day: 'Chủ nhật', workout: 'Nghỉ ngơi' }
    ]
  }
}

// Workout interface
interface Workout {
  id: string
  day: string
  type: string
  name: string
  duration: number
  timeSlot: string
  notes?: string
}

// Define interface for AI workout plan response
interface AIWorkoutPlanItem {
  day: string
  type: string
  name: string
  duration: number
  timeSlot: string
  notes?: string
}

interface AIWorkoutPlan {
  plan: AIWorkoutPlanItem[]
  advice?: string
}

export default function WorkoutScheduler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  // Get BMI and category from URL if coming from BMI calculator
  const bmiFromUrl = searchParams.get('bmi')
  const categoryFromUrl = searchParams.get('category')
  
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [showForm, setShowForm] = useState(false)
  const [currentWorkout, setCurrentWorkout] = useState<Workout>({
    id: '',
    day: 'monday',
    type: 'cardio',
    name: '',
    duration: 30,
    timeSlot: 'morning',
    notes: ''
  })
  const [fitnessLevel, setFitnessLevel] = useState('beginner')
  const [workoutGoal, setWorkoutGoal] = useState('')
  const [bmiCategory, setBmiCategory] = useState<string | null>(categoryFromUrl)
  const [isGeneratingAIWorkout, setIsGeneratingAIWorkout] = useState(false)
  const [aiWorkoutInput, setAiWorkoutInput] = useState('')
  const [showAiWorkoutForm, setShowAiWorkoutForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [userMessage, setUserMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [importFileInput, setImportFileInput] = useState<HTMLInputElement | null>(null)
  
  // Load workouts from Firebase if user is logged in, otherwise from localStorage
  useEffect(() => {
    const loadWorkouts = async () => {
      if (user) {
        try {
          const workoutsQuery = query(
            collection(db, 'workouts'),
            where('userId', '==', user.uid)
          )
          const querySnapshot = await getDocs(workoutsQuery)
          const userWorkouts: Workout[] = []
          
          querySnapshot.forEach((doc) => {
            userWorkouts.push(doc.data() as Workout)
          })
          
          if (userWorkouts.length > 0) {
            setWorkouts(userWorkouts)
            setUserMessage({ type: 'success', text: 'Lịch tập đã được tải từ tài khoản của bạn.' })
            setTimeout(() => setUserMessage(null), 3000)
          } else {
            // If no workouts in Firebase, try loading from localStorage
            const savedWorkouts = localStorage.getItem('workouts')
            if (savedWorkouts) {
              const localWorkouts = JSON.parse(savedWorkouts)
              setWorkouts(localWorkouts)
              
              // Optionally save local workouts to Firebase
              for (const workout of localWorkouts) {
                await saveWorkoutToFirebase(workout)
              }
              
              setUserMessage({ type: 'success', text: 'Lịch tập từ thiết bị của bạn đã được đồng bộ lên tài khoản.' })
              setTimeout(() => setUserMessage(null), 3000)
            }
          }
        } catch (error) {
          console.error('Error loading workouts from Firebase:', error)
          setUserMessage({ type: 'error', text: 'Không thể tải lịch tập từ tài khoản.' })
          setTimeout(() => setUserMessage(null), 3000)
          
          // Fallback to localStorage
          const savedWorkouts = localStorage.getItem('workouts')
          if (savedWorkouts) {
            setWorkouts(JSON.parse(savedWorkouts))
          }
        }
      } else {
        // User not logged in, load from localStorage
        const savedWorkouts = localStorage.getItem('workouts')
        if (savedWorkouts) {
          setWorkouts(JSON.parse(savedWorkouts))
        }
      }
      
      // If we have BMI data from URL, set BMI category for recommendations
      if (categoryFromUrl) {
        let mappedCategory = 'normal'
        if (categoryFromUrl.includes('Thiếu cân')) {
          mappedCategory = 'underweight'
        } else if (categoryFromUrl.includes('Thừa cân')) {
          mappedCategory = 'overweight'
        } else if (categoryFromUrl.includes('Béo phì')) {
          mappedCategory = 'obese'
        }
        setBmiCategory(mappedCategory)
      }
    }
    
    loadWorkouts()
  }, [user, categoryFromUrl])
  
  // Save workouts to Firebase and localStorage whenever they change
  useEffect(() => {
    const saveWorkouts = async () => {
      // Always save to localStorage for offline access
      localStorage.setItem('workouts', JSON.stringify(workouts))
      
      // If user is logged in, save to Firebase
      if (user && workouts.length > 0) {
        setIsSaving(true)
        
        try {
          // Delete previous workouts to avoid duplications
          const workoutsQuery = query(
            collection(db, 'workouts'),
            where('userId', '==', user.uid)
          )
          const querySnapshot = await getDocs(workoutsQuery)
          
          const deletePromises = querySnapshot.docs.map(document => 
            deleteDoc(doc(db, 'workouts', document.id))
          )
          
          await Promise.all(deletePromises)
          
          // Save current workouts
          const savePromises = workouts.map(workout => 
            saveWorkoutToFirebase(workout)
          )
          
          await Promise.all(savePromises)
        } catch (error) {
          console.error('Error saving workouts to Firebase:', error)
        } finally {
          setIsSaving(false)
        }
      }
    }
    
    saveWorkouts()
  }, [workouts, user])
  
  // Helper function to save a workout to Firebase
  const saveWorkoutToFirebase = async (workout: Workout) => {
    if (!user) return
    
    const workoutWithUser = {
      ...workout,
      userId: user.uid,
      timestamp: Date.now()
    }
    
    const workoutId = workout.id
    await setDoc(doc(db, 'workouts', workoutId), workoutWithUser)
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCurrentWorkout({
      ...currentWorkout,
      [name]: value
    })
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (currentWorkout.id) {
      // Edit existing workout
      setWorkouts(workouts.map(workout => 
        workout.id === currentWorkout.id ? currentWorkout : workout
      ))
    } else {
      // Add new workout
      const newWorkout = {
        ...currentWorkout,
        id: Date.now().toString()
      }
      setWorkouts([...workouts, newWorkout])
    }
    
    // Reset form
    setCurrentWorkout({
      id: '',
      day: 'monday',
      type: 'cardio',
      name: '',
      duration: 30,
      timeSlot: 'morning',
      notes: ''
    })
    setShowForm(false)
  }
  
  const editWorkout = (workout: Workout) => {
    setCurrentWorkout(workout)
    setShowForm(true)
  }
  
  const deleteWorkout = (id: string) => {
    setWorkouts(workouts.filter(workout => workout.id !== id))
  }
  
  const getDayName = (day: string) => {
    const dayNames: {[key: string]: string} = {
      'monday': 'Thứ Hai',
      'tuesday': 'Thứ Ba',
      'wednesday': 'Thứ Tư',
      'thursday': 'Thứ Năm',
      'friday': 'Thứ Sáu',
      'saturday': 'Thứ Bảy',
      'sunday': 'Chủ Nhật'
    }
    return dayNames[day] || day
  }
  
  const applyRecommendedSchedule = () => {
    if (!bmiCategory) return
    
    // Clear existing workouts
    setWorkouts([])
    
    // Map days to corresponding values in our system
    const dayMapping: {[key: string]: string} = {
      'Thứ 2': 'monday',
      'Thứ 3': 'tuesday',
      'Thứ 4': 'wednesday',
      'Thứ 5': 'thursday',
      'Thứ 6': 'friday',
      'Thứ 7': 'saturday',
      'Chủ nhật': 'sunday'
    }
    
    // Get recommendations based on BMI category
    const recommendations = workoutRecommendations[bmiCategory as keyof typeof workoutRecommendations]
    
    // Create workouts from recommendations
    let newWorkouts: Workout[] = []
    
    recommendations.recommendations.forEach(rec => {
      // Handle combined days like "Thứ 2, Thứ 4, Thứ 6"
      const dayParts = rec.day.split(',').map(d => d.trim())
      dayParts.forEach(dayPart => {
        // Handle ranges like "Thứ 2 - Thứ 6"
        if (dayPart.includes(' - ')) {
          const [startDay, endDay] = dayPart.split(' - ').map(d => d.trim())
          const startIdx = Object.keys(dayMapping).indexOf(startDay)
          const endIdx = Object.keys(dayMapping).indexOf(endDay)
          
          for (let i = startIdx; i <= endIdx; i++) {
            const day = Object.keys(dayMapping)[i]
            newWorkouts.push({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              day: dayMapping[day],
              type: rec.workout.toLowerCase().includes('cardio') ? 'cardio' : 
                    rec.workout.toLowerCase().includes('sức mạnh') || 
                    rec.workout.toLowerCase().includes('tập tay') || 
                    rec.workout.toLowerCase().includes('tạ') ? 'strength' : 'flexibility',
              name: rec.workout,
              duration: 45,
              timeSlot: 'afternoon',
              notes: recommendations.description
            })
          }
        } else {
          // Handle days with "&" like "Thứ 2 & Thứ 5"
          const ampDays = dayPart.split('&').map(d => d.trim())
          ampDays.forEach(ampDay => {
            if (dayMapping[ampDay]) {
              newWorkouts.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                day: dayMapping[ampDay],
                type: rec.workout.toLowerCase().includes('cardio') ? 'cardio' : 
                      rec.workout.toLowerCase().includes('sức mạnh') || 
                      rec.workout.toLowerCase().includes('tập tay') || 
                      rec.workout.toLowerCase().includes('tạ') ? 'strength' : 'flexibility',
                name: rec.workout,
                duration: 45,
                timeSlot: 'afternoon',
                notes: recommendations.description
              })
            }
          })
        }
      })
    })
    
    setWorkouts(newWorkouts)
  }
  
  const generateAIWorkoutPlan = async () => {
    if (!aiWorkoutInput.trim()) return
    
    setIsGeneratingAIWorkout(true)
    
    try {
      const prompt = `Tôi cần một lịch trình tập luyện cho mục tiêu sau: "${aiWorkoutInput}".
${bmiFromUrl ? `Chỉ số BMI của tôi là ${bmiFromUrl}. ${categoryFromUrl ? `Loại BMI: ${categoryFromUrl}.` : ''}` : ''}
${fitnessLevel ? `Mức độ tập luyện của tôi là: ${fitnessLevels.find(f => f.id === fitnessLevel)?.name}.` : ''}

Yêu cầu:
1. Tạo lịch tập luyện cho một tuần (từ thứ Hai đến Chủ Nhật)
2. Mỗi ngày nêu rõ:
   - Loại bài tập (cardio, sức mạnh, linh hoạt, hoặc kết hợp)
   - Tên cụ thể của bài tập
   - Thời gian tập (phút)
   - Thời điểm tập luyện phù hợp nhất (sáng, trưa, chiều, tối)
   - Ghi chú hoặc lưu ý đặc biệt
3. Bài tập phải phù hợp với:
   - Chỉ số BMI của tôi (nếu có)
   - Mức độ tập luyện của tôi
   - Mục tiêu tập luyện của tôi

Trả về kết quả dưới dạng JSON với định dạng sau:
\`\`\`json
{
  "plan": [
    {
      "day": "monday/tuesday/wednesday/thursday/friday/saturday/sunday",
      "type": "cardio/strength/flexibility/custom",
      "name": "Tên bài tập",
      "duration": số phút,
      "timeSlot": "morning/noon/afternoon/evening",
      "notes": "Ghi chú hoặc lưu ý"
    }
  ],
  "advice": "Lời khuyên tổng quát về lịch tập này"
}
\`\`\`

QUAN TRỌNG: CHỈ trả lời bằng JSON, không thêm bất kỳ văn bản nào khác.`;

      const response = await aiService.processWithAI(prompt);
      
      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Không tìm thấy JSON trong phản hồi');
        }
        
        const workoutPlan: AIWorkoutPlan = JSON.parse(jsonMatch[0]);
        
        if (workoutPlan.plan && Array.isArray(workoutPlan.plan)) {
          // Convert AI workout plan to our workout format
          const newWorkouts: Workout[] = workoutPlan.plan.map((item: AIWorkoutPlanItem) => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            day: item.day,
            type: item.type,
            name: item.name,
            duration: item.duration,
            timeSlot: item.timeSlot,
            notes: item.notes
          }));
          
          // Add advice as a special "workout" that appears as a note
          if (workoutPlan.advice) {
            setWorkouts([...newWorkouts]);
            
            // Show the advice in an alert
          ///  alert(`Lời khuyên từ AI: ${workoutPlan.advice}`);
          } else {
            setWorkouts([...newWorkouts]);
          }
        }
      } catch (error) {
        console.error('Error parsing AI response:', error);
        alert('Không thể tạo lịch tập từ AI. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error generating workout plan:', error);
      alert('Không thể tạo lịch tập từ AI. Vui lòng thử lại sau.');
    } finally {
      setIsGeneratingAIWorkout(false);
      setShowAiWorkoutForm(false);
      setAiWorkoutInput('');
    }
  };
  
  // Function to export workouts as JSON file
  const exportWorkouts = () => {
    if (workouts.length === 0) {
      alert('Không có lịch tập để xuất')
      return
    }
    
    try {
      // Create a structured export with metadata
      const exportData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        userData: {
          bmi: bmiFromUrl || null,
          bmiCategory: bmiCategory || null,
          fitnessLevel
        },
        workouts
      }
      
      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2)
      
      // Create a blob
      const blob = new Blob([jsonString], { type: 'application/json' })
      
      // Create a download link
      const downloadLink = document.createElement('a')
      downloadLink.href = URL.createObjectURL(blob)
      downloadLink.download = `workout-plan-${new Date().toISOString().slice(0, 10)}.json`
      
      // Trigger download
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      
      setUserMessage({ type: 'success', text: 'Lịch tập đã được xuất thành công' })
      setTimeout(() => setUserMessage(null), 3000)
    } catch (error) {
      console.error('Error exporting workouts:', error)
      setUserMessage({ type: 'error', text: 'Lỗi khi xuất lịch tập' })
      setTimeout(() => setUserMessage(null), 3000)
    }
  }
  
  // Function to set up file input for importing
  const setupImportFile = () => {
    // Create file input if it doesn't exist
    if (!importFileInput) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.style.display = 'none'
      input.onchange = handleImportFile
      document.body.appendChild(input)
      setImportFileInput(input)
      return input
    }
    return importFileInput
  }
  
  // Function to import workouts from JSON file
  const importWorkouts = () => {
    const input = setupImportFile()
    input.click()
  }
  
  // Handle file selection for import
  const handleImportFile = async (event: Event) => {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return
    
    try {
      const file = input.files[0]
      const fileContent = await file.text()
      const importedData = JSON.parse(fileContent)
      
      // Validate the imported data
      if (!importedData.workouts || !Array.isArray(importedData.workouts)) {
        throw new Error('Invalid workout data format')
      }
      
      // Generate new IDs for imported workouts to avoid conflicts
      const importedWorkouts = importedData.workouts.map((workout: Workout) => ({
        ...workout,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      }))
      
      // Ask user if they want to replace or merge
      const shouldReplace = confirm('Bạn muốn thay thế lịch tập hiện tại hay thêm vào lịch tập hiện có? Nhấn OK để thay thế, Cancel để thêm vào.')
      
      if (shouldReplace) {
        setWorkouts(importedWorkouts)
      } else {
        setWorkouts([...workouts, ...importedWorkouts])
      }
      
      // Set fitness level from import if available
      if (importedData.userData?.fitnessLevel) {
        setFitnessLevel(importedData.userData.fitnessLevel)
      }
      
      setUserMessage({ type: 'success', text: 'Lịch tập đã được nhập thành công' })
      setTimeout(() => setUserMessage(null), 3000)
    } catch (error) {
      console.error('Error importing workouts:', error)
      setUserMessage({ type: 'error', text: 'Lỗi khi nhập lịch tập' })
      setTimeout(() => setUserMessage(null), 3000)
    }
    
    // Reset file input
    if (importFileInput) {
      importFileInput.value = ''
    }
  }
  
  // Create a shareable URL with encoded workout data
  const createShareUrl = () => {
    if (workouts.length === 0) {
      alert('Không có lịch tập để chia sẻ')
      return
    }
    
    try {
      // Create a simple subset of data to share (omit user-specific information)
      const shareData = {
        workouts: workouts.map(w => ({
          day: w.day,
          type: w.type,
          name: w.name,
          duration: w.duration,
          timeSlot: w.timeSlot,
          notes: w.notes
        })),
        metadata: {
          bmiCategory: bmiCategory || null,
          fitnessLevel,
          sharedAt: new Date().toISOString()
        }
      }
      
      // Encode the data as base64
      const jsonString = JSON.stringify(shareData)
      const encodedData = btoa(jsonString)
      
      // Create share URL 
      const origin = window.location.origin
      const url = `${origin}/workout-scheduler?share=${encodedData}`
      
      setShareUrl(url)
      setShowShareModal(true)
    } catch (error) {
      console.error('Error creating share URL:', error)
      alert('Lỗi khi tạo liên kết chia sẻ')
    }
  }
  
  // Function to copy share URL to clipboard
  const copyShareUrl = () => {
    if (!shareUrl) return
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        alert('Đã sao chép liên kết chia sẻ vào clipboard')
        setShowShareModal(false)
      })
      .catch(err => {
        console.error('Error copying text: ', err)
        alert('Không thể sao chép liên kết. Vui lòng thử lại.')
      })
  }
  
  // Check for shared workout data in URL
  useEffect(() => {
    const sharedData = searchParams.get('share')
    if (sharedData) {
      try {
        const jsonString = atob(sharedData)
        const importedData = JSON.parse(jsonString)
        
        if (importedData.workouts && Array.isArray(importedData.workouts)) {
          // Ask user if they want to use the shared workouts
          const confirmImport = confirm('Đã tìm thấy lịch tập được chia sẻ. Bạn có muốn tải lịch tập này không?')
          
          if (confirmImport) {
            // Generate new IDs for shared workouts
            const sharedWorkouts = importedData.workouts.map((workout: Omit<Workout, 'id'>) => ({
              ...workout,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
            }))
            
            // Ask if they want to replace or merge
            const shouldReplace = confirm('Bạn muốn thay thế lịch tập hiện tại hay thêm vào lịch tập hiện có? Nhấn OK để thay thế, Cancel để thêm vào.')
            
            if (shouldReplace) {
              setWorkouts(sharedWorkouts)
            } else {
              setWorkouts(prevWorkouts => [...prevWorkouts, ...sharedWorkouts])
            }
            
            // Apply metadata if available
            if (importedData.metadata?.fitnessLevel) {
              setFitnessLevel(importedData.metadata.fitnessLevel)
            }
            
            if (importedData.metadata?.bmiCategory) {
              setBmiCategory(importedData.metadata.bmiCategory)
            }
            
            setUserMessage({ type: 'success', text: 'Lịch tập được chia sẻ đã được tải thành công' })
            setTimeout(() => setUserMessage(null), 3000)
          }
        }
      } catch (error) {
        console.error('Error loading shared workout:', error)
        setUserMessage({ type: 'error', text: 'Không thể tải lịch tập được chia sẻ' })
        setTimeout(() => setUserMessage(null), 3000)
      }
      
      // Remove the share parameter from URL to avoid reloading on refresh
      router.replace('/workout-scheduler')
    }
  }, [searchParams, router])
  
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Lên lịch luyện tập</h1>
          </div>
          
          {/* User status indicator */}
          <div className="text-sm">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-gray-600">Đang đồng bộ với tài khoản</span>
                {isSaving && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </div>
            ) : (
              <Link href="/login" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400"></span>
                </span>
                Đăng nhập để lưu lịch tập
              </Link>
            )}
          </div>
        </div>
        
        {/* User messages */}
        {userMessage && (
          <div className={`mb-4 p-3 rounded-md ${
            userMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {userMessage.text}
          </div>
        )}
        
        {/* BMI Information and Recommendations */}
        {bmiCategory && bmiFromUrl && (
          <div className="mb-8 p-4 border border-gray-100 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-medium">Lịch tập theo chỉ số BMI: {bmiFromUrl}</h2>
                <p className="text-gray-600">{workoutRecommendations[bmiCategory as keyof typeof workoutRecommendations]?.title}</p>
              </div>
              <button 
                onClick={applyRecommendedSchedule}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Áp dụng lịch đề xuất
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">{workoutRecommendations[bmiCategory as keyof typeof workoutRecommendations]?.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {workoutRecommendations[bmiCategory as keyof typeof workoutRecommendations]?.recommendations.map((rec, idx) => (
                <div key={idx} className="p-3 bg-white rounded-md border border-gray-100">
                  <div className="font-medium">{rec.day}</div>
                  <div className="text-gray-600">{rec.workout}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Workout Scheduler Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-medium">Lịch tập cá nhân của bạn</h2>
            <p className="text-gray-600 text-sm">Tạo và quản lý lịch tập luyện hàng tuần của bạn.</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {!bmiCategory && (
              <Link 
                href="/utilities/bmi-calculator"
                className="px-4 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                Tính BMI để nhận lịch tập phù hợp
              </Link>
            )}
            <button 
              onClick={() => setShowAiWorkoutForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center gap-2"
            >
              <SparklesIcon className="w-4 h-4" />
              Tạo lịch tập bằng AI
            </button>
            <button 
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Thêm lịch tập
            </button>
            <div className="flex gap-2">
              <button 
                onClick={exportWorkouts}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
                title="Xuất lịch tập"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={importWorkouts}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
                title="Nhập lịch tập"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={createShareUrl}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
                title="Chia sẻ lịch tập"
              >
                <ShareIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Share Modal */}
        {showShareModal && shareUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
              <h3 className="text-lg font-medium mb-4">Chia sẻ lịch tập</h3>
              <p className="text-sm text-gray-600 mb-4">
                Sao chép liên kết dưới đây để chia sẻ lịch tập của bạn với người khác:
              </p>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                />
                <button
                  onClick={copyShareUrl}
                  className="px-3 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                >
                  Sao chép
                </button>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* AI Workout Form */}
        {showAiWorkoutForm && (
          <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-purple-600" />
              Tạo lịch tập cá nhân hóa bằng AI
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="aiWorkoutInput" className="block text-sm font-medium text-gray-700 mb-1">
                  Mục tiêu tập luyện của bạn
                </label>
                <input
                  type="text"
                  id="aiWorkoutInput"
                  value={aiWorkoutInput}
                  onChange={(e) => setAiWorkoutInput(e.target.value)}
                  placeholder="Ví dụ: Giảm mỡ bụng, tăng cơ cánh tay, cải thiện sức bền..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="fitnessLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Mức độ tập luyện hiện tại
                </label>
                <select
                  id="fitnessLevel"
                  value={fitnessLevel}
                  onChange={(e) => setFitnessLevel(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {fitnessLevels.map(level => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAiWorkoutForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={isGeneratingAIWorkout}
                >
                  Hủy
                </button>
                <button
                  onClick={generateAIWorkoutPlan}
                  disabled={!aiWorkoutInput.trim() || isGeneratingAIWorkout}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingAIWorkout ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-4 h-4" />
                      <span>Tạo lịch tập</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Add/Edit Workout Form */}
        {showForm && (
          <div className="mb-8 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium mb-4">{currentWorkout.id ? 'Chỉnh sửa lịch tập' : 'Thêm lịch tập mới'}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                  <select
                    id="day"
                    name="day"
                    value={currentWorkout.day}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="monday">Thứ Hai</option>
                    <option value="tuesday">Thứ Ba</option>
                    <option value="wednesday">Thứ Tư</option>
                    <option value="thursday">Thứ Năm</option>
                    <option value="friday">Thứ Sáu</option>
                    <option value="saturday">Thứ Bảy</option>
                    <option value="sunday">Chủ Nhật</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Loại bài tập</label>
                  <select
                    id="type"
                    name="type"
                    value={currentWorkout.type}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    {workoutTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Tên bài tập</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={currentWorkout.name}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Chạy bộ, Tập tạ, Yoga..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={currentWorkout.duration}
                    onChange={handleInputChange}
                    min="5"
                    max="240"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700 mb-1">Khung giờ</label>
                  <select
                    id="timeSlot"
                    name="timeSlot"
                    value={currentWorkout.timeSlot}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    {timeSlots.map(slot => (
                      <option key={slot.id} value={slot.id}>{slot.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={currentWorkout.notes || ''}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Thêm ghi chú về bài tập..."
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  {currentWorkout.id ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Workout Schedule */}
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'].map(day => (
              <div key={day} className="p-3 text-center font-medium text-sm">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 min-h-[300px]">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
              const dayWorkouts = workouts.filter(workout => workout.day === day)
              return (
                <div key={day} className="p-2 border-r border-b border-gray-200 last:border-r-0">
                  {dayWorkouts.length > 0 ? (
                    <div className="space-y-2">
                      {dayWorkouts.map(workout => {
                        // Determine background color based on workout type
                        const bgColor = 
                          workout.type === 'cardio' ? 'bg-red-50 border-red-200' :
                          workout.type === 'strength' ? 'bg-blue-50 border-blue-200' :
                          workout.type === 'flexibility' ? 'bg-green-50 border-green-200' :
                          'bg-purple-50 border-purple-200'
                        
                        return (
                          <div key={workout.id} className={`p-2 rounded ${bgColor} border text-sm relative group`}>
                            <div className="font-medium">{workout.name}</div>
                            <div className="text-xs opacity-75">{timeSlots.find(t => t.id === workout.timeSlot)?.name}</div>
                            <div className="text-xs opacity-75">{workout.duration} phút</div>
                            
                            <div className="hidden group-hover:flex absolute top-2 right-2 gap-1">
                              <button 
                                onClick={() => editWorkout(workout)} 
                                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                title="Chỉnh sửa"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => deleteWorkout(workout.id)} 
                                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                title="Xóa"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                      Không có lịch tập
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Summary and Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium mb-2">Tổng thời gian tập luyện</div>
            <div className="text-2xl font-bold">{workouts.reduce((total, workout) => total + workout.duration, 0)} phút/tuần</div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium mb-2">Loại bài tập</div>
            <div className="text-sm space-y-1">
              {workoutTypes.map(type => {
                const count = workouts.filter(w => w.type === type.id).length
                if (count === 0) return null
                return (
                  <div key={type.id} className="flex items-center gap-1">
                    {type.icon}
                    <span>{type.name}: {count} bài tập</span>
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium mb-2">Lời khuyên</div>
            <div className="text-sm text-gray-600">
              Tập luyện đều đặn và từ từ tăng cường độ để đạt hiệu quả tốt nhất.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 