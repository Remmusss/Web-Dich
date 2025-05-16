'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ArrowsRightLeftIcon, 
  CalculatorIcon, 
  ListBulletIcon,
  SwatchIcon,
  KeyIcon,
  CubeIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  FaceSmileIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline'
import { QuoteIcon } from 'lucide-react'
import { MdOutlineFastfood } from 'react-icons/md'
import { GiCard10Clubs } from "react-icons/gi";

export default function RandomToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Track page view
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await fetch('/api/page-views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: pathname,
          }),
        })
      } catch (error) {
        console.error('Error tracking page view:', error)
      }
    }

    trackPageView()
  }, [pathname])

  const navItems = [
    {
      name: 'Tổng quan',
      path: '/random',
      icon: <ArrowsRightLeftIcon className="w-5 h-5" />
    },
    {
      name: 'Số',
      path: '/random/number',
      icon: <CalculatorIcon className="w-5 h-5" />
    },
    {
      name: 'Văn bản',
      path: '/random/text',
      icon: <ListBulletIcon className="w-5 h-5" />
    },
    {
      name: 'Màu sắc',
      path: '/random/color',
      icon: <SwatchIcon className="w-5 h-5" />
    },
    {
      name: 'Mật khẩu',
      path: '/random/password',
      icon: <KeyIcon className="w-5 h-5" />
    },
    {
      name: 'Username',
      path: '/random/username',
      icon: <UserIcon className="w-5 h-5" />
    },
    {
      name: 'Xúc xắc',
      path: '/random/dice',
      icon: <CubeIcon className="w-5 h-5" />
    },
    {
      name: 'Đồng xu',
      path: '/random/coin',
      icon: <CurrencyDollarIcon className="w-5 h-5" />
    },
    {
      name: 'Tên',
      path: '/random/name',
      icon: <UserIcon className="w-5 h-5" />
    },
    {
      name: 'Ngày tháng',
      path: '/random/date',
      icon: <CalendarIcon className="w-5 h-5" />
    },
    {
      name: 'Câu nói',
      path: '/random/quote',
      icon: <QuoteIcon className="w-5 h-5" />
    },
    {
      name: 'Emoji',
      path: '/random/emoji',
      icon: <FaceSmileIcon className="w-5 h-5" />
    },
    {
      name: 'Món ăn',
      path: '/random/food',
      icon: <MdOutlineFastfood className="w-5 h-5" />
    },
    {
      name: 'Lá bài',
      path: '/random/card',
      icon: <GiCard10Clubs className="w-5 h-5" />
    },
    {
      name: 'Profile',
      path: '/random/profile',
      icon: <UserIcon className="w-5 h-5" />
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <ArrowsRightLeftIcon className="w-8 h-8 text-gray-700" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Công cụ ngẫu nhiên</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Tạo số ngẫu nhiên, màu sắc, mật khẩu và nhiều thứ ngẫu nhiên khác cho nhu cầu của bạn
        </p>
      </div>

      {/* Main layout with sidebar and content */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex flex-col">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                    pathname === item.path
                      ? 'bg-gray-50 border-l-4 border-gray-900 pl-3'
                      : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className={`${pathname === item.path ? 'text-gray-900' : 'text-gray-500'}`}>
                    {item.icon}
                  </div>
                  <span className={`font-medium text-sm ${
                    pathname === item.path ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="rounded-xl p-6">
            {children}
          </div>
        </div>
      </div>
      

    </div>
  )
} 