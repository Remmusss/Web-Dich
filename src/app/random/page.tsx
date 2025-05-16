'use client'

import Link from 'next/link'
import { 
  CalculatorIcon, 
  ListBulletIcon, 
  SwatchIcon, 
  KeyIcon, 
  CubeIcon, 
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { BsEmojiSmile } from "react-icons/bs";
import { QuoteIcon } from 'lucide-react';
import { MdOutlineFastfood } from "react-icons/md";
import { GiCard10Clubs } from "react-icons/gi";

interface FeatureCardProps {
  title: string
  description: string
  icon: React.ReactNode
  path: string
}

const FeatureCard = ({ title, description, icon, path }: FeatureCardProps) => {
  return (
    <Link href={path} className="block group">
      <div className="p-6 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all duration-300 h-full flex flex-col">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
            <div className="w-5 h-5 text-gray-700 group-hover:text-black transition-colors">
              {icon}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-base text-gray-900 group-hover:text-black transition-colors">{title}</h3>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function RandomToolsPage() {
  const features: FeatureCardProps[] = [
    {
      title: "Số ngẫu nhiên",
      description: "Tạo số ngẫu nhiên trong một khoảng bạn chọn",
      icon: <CalculatorIcon className="w-5 h-5" />,
      path: "/random/number"
    },
    {
      title: "Văn bản ngẫu nhiên",
      description: "Chọn ngẫu nhiên một mục từ danh sách của bạn",
      icon: <ListBulletIcon className="w-5 h-5" />,
      path: "/random/text"
    },
    {
      title: "Màu sắc ngẫu nhiên",
      description: "Tạo mã màu HEX ngẫu nhiên cho thiết kế của bạn",
      icon: <SwatchIcon className="w-5 h-5" />,
      path: "/random/color"
    },
    {
      title: "Mật khẩu ngẫu nhiên",
      description: "Tạo mật khẩu mạnh với các tùy chọn tùy chỉnh",
      icon: <KeyIcon className="w-5 h-5" />,
      path: "/random/password"
    },
    {
      title: "Username ngẫu nhiên",
      description: "Tạo username độc đáo với sự trợ giúp của AI",
      icon: <UserIcon className="w-5 h-5" />,
      path: "/random/username"
    },
    {
      title: "Xúc xắc ngẫu nhiên",
      description: "Mô phỏng gieo nhiều xúc xắc với số mặt khác nhau",
      icon: <CubeIcon className="w-5 h-5" />,
      path: "/random/dice"
    },
    {
      title: "Tung đồng xu",
      description: "Mô phỏng tung đồng xu để giúp ra quyết định",
      icon: <CurrencyDollarIcon className="w-5 h-5" />,
      path: "/random/coin"
    },
    {
      title: "Emoji ngẫu nhiên",
      description: "Chọn ngẫu nhiên một emoji từ danh sách của bạn",
      icon: <BsEmojiSmile className="w-5 h-5" />,
      path: "/random/emoji"
    },
    {
      title: "Ngày tháng ngẫu nhiên",
      description: "Tạo ngày tháng ngẫu nhiên với các tùy chọn tùy chỉnh",
      icon: <CalendarIcon className="w-5 h-5" />,
      path: "/random/date"
    },
    {
      title: "Món ăn ngẫu nhiên",
      description: "Tạo món ăn ngẫu nhiên với các tùy chọn tùy chỉnh",
      icon: <MdOutlineFastfood className="w-5 h-5" />,
      path: "/random/food"
    },
    {
      title: "Câu nói ngẫu nhiên",
      description: "Tạo câu nói ngẫu nhiên với các tùy chọn tùy chỉnh",
      icon: <QuoteIcon className="w-5 h-5" />,
      path: "/random/quote"
    },
    {
      title: "Lá bài ngẫu nhiên",
      description: "Tạo lá bài ngẫu nhiên với các tùy chọn tùy chỉnh",
      icon: <GiCard10Clubs className="w-5 h-5" />,
      path: "/random/card"
    },
    {
      title: "Profile ngẫu nhiên",
      description: "Tạo profile ngẫu nhiên với các tùy chọn tùy chỉnh",
      icon: <UserIcon className="w-5 h-5" />,
      path: "/random/profile"
    }

    
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>
    </div>
  )
} 