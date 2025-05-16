'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { UserIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

export default function LoginPage() {
  const { user, signInWithGoogle } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      setIsRedirecting(true)
      // Redirect to workout scheduler or home page
      router.push('/')
    }
  }, [user, router])
  
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      // Auth context will handle the redirect when user state changes
    } catch (error) {
      console.error('Error signing in with Google:', error)
    }
  }
  
  if (isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang chuyển hướng...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 rounded-full bg-black flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Đăng nhập vào tài khoản
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Đăng nhập để lưu trữ lịch tập luyện của bạn và đồng bộ hóa giữa các thiết bị
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              className="group relative flex w-full justify-center items-center gap-3 rounded-md border border-gray-300 bg-white py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Đăng nhập bằng Google</span>
            </button>
            
            <div className="text-center text-xs text-gray-500 mt-2">
              Bằng cách đăng nhập, bạn đồng ý với các điều khoản dịch vụ và chính sách bảo mật của chúng tôi.
            </div>
          </div>
          
          <div className="text-center text-sm">
            <button 
              onClick={() => router.push('/workout-scheduler')}
              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-500"
            >
              <ArrowRightIcon className="h-4 w-4" />
              <span>Tiếp tục mà không đăng nhập</span>
            </button>
            <p className="mt-1 text-xs text-gray-500">
              Các chức năng liên quan tới lưu dữ liệu sẽ chỉ được lưu trên thiết bị này
            </p>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-500 text-center">Lợi ích khi đăng nhập</h3>
          <ul className="mt-4 space-y-3">
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-2 text-sm text-gray-600">
                <span className="font-medium text-gray-900">Lưu trữ đám mây:</span> Không bao giờ mất lịch tập của bạn
              </p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-2 text-sm text-gray-600">
                <span className="font-medium text-gray-900">Đồng bộ hóa:</span> Truy cập lịch tập trên nhiều thiết bị
              </p>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="ml-2 text-sm text-gray-600">
                <span className="font-medium text-gray-900">Tiến độ:</span> Theo dõi tiến trình tập luyện theo thời gian
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
} 