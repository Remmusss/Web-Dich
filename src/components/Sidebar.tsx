'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { XMarkIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import {
  FaDice,
  FaKeyboard,
  FaHeart,
  FaHome,
  FaBook,
  FaStar,
  FaFlagUsa,
  FaCloud,
  FaQrcode,
  FaClock,
  FaRegClipboard,
  FaCalculator,
  FaChevronDown,
  FaMagic,
  FaDesktop
} from "react-icons/fa";
import {
  FaMoneyBillTransfer,
  FaUser,
  FaChartSimple
} from "react-icons/fa6";
import {
  MdOutlinePassword,
  MdTranslate,
  MdOutlineChatBubbleOutline,
  MdOutlineMovie,
  MdOutlineQuestionMark,
  MdOutlineSchool,
  MdOutlineDocumentScanner,
  MdOutlineModeEdit,
  MdOutlinePhoto,
  MdGrid3X3,
  MdOutlineCurrencyExchange,
  MdEmail,
  MdOutlineCreditCard,
  MdStackedLineChart,
  MdScience,
  MdOutlineLightbulb,
  MdOutlineSettings
} from "react-icons/md";

import { useSidebar } from '@/contexts/SidebarContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

interface MenuItem {
  name: string;
  path: string;
  icon: JSX.Element;
  isExternal?: boolean;
  target?: string;
}

interface MenuGroup {
  name: string;
  icon: JSX.Element;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    name: 'Công cụ AI',
    icon: <FaMagic className="w-5 h-5" />,
    items: [
      {
        name: 'Dịch văn bản',
        path: '/translate',
        icon: <MdTranslate className="w-5 h-5" />
      },
      {
        name: 'Dịch hội thoại',
        path: '/conversation-translate',
        icon: <MdOutlineChatBubbleOutline className="w-5 h-5" />
      },
      {
        name: 'Dịch phụ đề',
        path: '/srt-translate',
        icon: <MdOutlineMovie className="w-5 h-5" />
      },
      {
        name: 'Tóm tắt văn bản',
        path: '/summarize',
        icon: <MdOutlineDocumentScanner className="w-5 h-5" />
      },
      {
        name: 'Cải thiện văn bản',
        path: '/enhance-text',
        icon: <FaMagic className="w-5 h-5" />
      },
      {
        name: 'Hỗ trợ tán gái',
        path: '/flirting',
        icon: <FaHeart className="w-5 h-5" />
      },
      {
        name: 'Tạo câu hỏi',
        path: '/quiz',
        icon: <MdOutlineQuestionMark className="w-5 h-5" />
      },
      {
        name: 'Giải bài tập',
        path: '/aisolver',
        icon: <MdOutlineLightbulb className="w-5 h-5" />
      },
      {
        name: 'Học từ vựng',
        path: '/vocabulary',
        icon: <MdOutlineSchool className="w-5 h-5" />
      },
      {
        name: 'Từ điển',
        path: '/dictionary',
        icon: <FaBook className="w-5 h-5" />
      },
      {
        name: 'Tạo công thức nấu ăn',
        path: '/recipe-generator',
        icon: <MdScience className="w-5 h-5" />
      },
      {
        name: 'Xem bói',
        path: '/fortune-telling',
        icon: <FaStar className="w-5 h-5" />
      }, {
        name: 'Chat với AI',
        path: 'https://chat.amri2k.com/',
        icon: <MdOutlineChatBubbleOutline className="w-5 h-5" />,
        isExternal: true,
        target: '_blank'
      },
    ]
  },
  {
    name: 'Tiện ích',
    icon: <MdGrid3X3 className="w-5 h-5" />,
    items: [
      {
        name: 'Tạo cấu hình PC',
        path: '/pc-builder',
        icon: <FaDesktop className="w-5 h-5" />
      },
      {
        name: 'Kiểm tra tốc độ gõ',
        path: '/typing-speed',
        icon: <FaKeyboard className="w-5 h-5" />
      },
      {
        name: 'Công cụ ngẫu nhiên',
        path: '/random',
        icon: <FaDice className="w-5 h-5" />
      },
      {
        name: 'Chuyển đổi tiền tệ',
        path: '/currency',
        icon: <MdOutlineCurrencyExchange className="w-5 h-5" />
      },
      {
        name: 'Quản lý chi tiêu',
        path: '/money-love',
        icon: <MdOutlineCreditCard className="w-5 h-5" />
      },
      {
        name: 'Email tạm thời',
        path: '/temp-mail',
        icon: <MdEmail className="w-5 h-5" />
      },
      {
        name: 'Thông tin quốc gia',
        path: '/countries',
        icon: <FaFlagUsa className="w-5 h-5" />
      },
      {
        name: 'Dự báo thời tiết',
        path: '/weather',
        icon: <FaCloud className="w-5 h-5" />
      },
      {
        name: 'Mã QR',
        path: '/qrcode',
        icon: <FaQrcode className="w-5 h-5" />
      },
      {
        name: 'Chuyển đổi múi giờ',
        path: '/utilities/time-converter',
        icon: <FaClock className="w-5 h-5" />
      },
      {
        name: 'Chuyển đổi đơn vị',
        path: '/utilities/unit-converter',
        icon: <MdStackedLineChart className="w-5 h-5" />
      },
      {
        name: 'Tính tuổi',
        path: '/utilities/age-calculator',
        icon: <FaCalculator className="w-5 h-5" />
      },
      {
        name: 'Username tools',
        path: '/username-tools',
        icon: <FaUser className="w-5 h-5" />
      },
      {
        name: 'Password tools',
        path: '/password-tools',
        icon: <MdOutlinePassword className="w-5 h-5" />
      }
    ]
  },
  {
    name: 'Tài chính',
    icon: <MdOutlineCurrencyExchange className="w-5 h-5" />,
    items: [
      {
        name: 'Chuyển đổi tiền tệ',
        path: '/currency',
        icon: <FaMoneyBillTransfer className="w-5 h-5" />
      },
      {
        name: 'Tính lãi suất',
        path: '/utilities/interest-calculator',
        icon: <FaCalculator className="w-5 h-5" />
      },
      {
        name: 'Tính khoản vay',
        path: '/utilities/loan-calculator',
        icon: <FaCalculator className="w-5 h-5" />
      },
      {
        name: 'Quản lý chi tiêu',
        path: '/money-love',
        icon: <MdOutlineCreditCard className="w-5 h-5" />
      }
    ]
  },
  {
    name: 'Sức khỏe',
    icon: <FaHeart className="w-5 h-5" />,
    items: [
      {
        name: 'Tính chỉ số BMI',
        path: '/utilities/bmi-calculator',
        icon: <FaCalculator className="w-5 h-5" />
      },
      {
        name: 'Công thức nấu ăn',
        path: '/recipe-generator',
        icon: <MdScience className="w-5 h-5" />
      },
      {
        name: 'Lên lịch luyện tập',
        path: '/workout-scheduler',
        icon: <FaRegClipboard className="w-5 h-5" />
      }
    ]
  }
];

function MobileSidebar() {
  const pathname = usePathname();
  const { isOpen, setIsOpen } = useSidebar();
  const { t } = useLanguage();
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
    'Công cụ AI': true,
    'Tiện ích': true,
    'Tài chính': true,
    'Sức khỏe': true
  });

  // Load expanded groups from localStorage on mount
  useEffect(() => {
    const savedExpandedGroups = localStorage.getItem('mobileExpandedGroups');
    if (savedExpandedGroups) {
      setExpandedGroups(JSON.parse(savedExpandedGroups));
    }
  }, []);

  const toggleGroup = (groupName: string) => {
    const newExpandedGroups = {
      ...expandedGroups,
      [groupName]: !expandedGroups[groupName]
    };
    setExpandedGroups(newExpandedGroups);
    // Save to localStorage
    localStorage.setItem('mobileExpandedGroups', JSON.stringify(newExpandedGroups));
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed inset-y-0 left-0 w-[90vw] max-w-[320px] bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex flex-col z-50 md:hidden shadow-lg transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 dark:from-gray-700 dark:to-gray-900 flex items-center justify-center text-white">
              <FaMagic className="w-5 h-5" />
            </div>
            <span className="font-medium text-lg text-gray-900 dark:text-white">Amri2k</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Menu - with own scrollable area */}
        <div className="flex-1 py-4 px-3 overflow-y-auto h-[calc(100vh-4rem)] scrollbar-thin">
          <Link
            href="/"
            className={`flex items-center gap-3 px-4 py-2.5 mb-3 rounded-lg ${pathname === '/'
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              } transition-colors`}
            onClick={() => setIsOpen(false)}
          >
            <FaHome className="w-5 h-5" />
            <span className="font-medium text-sm">{t('common.home')}</span>
          </Link>

          <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-3">
            Menu
          </div>

          {menuGroups.map((group, groupIndex) => (
            <div key={group.name} className={`${groupIndex > 0 ? 'mt-3' : 'mt-1'}`}>
              <button
                onClick={() => toggleGroup(group.name)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="text-gray-500 dark:text-gray-400">
                  {group.icon}
                </div>
                <span className="flex-1 text-left font-medium text-sm">
                  {group.name}
                </span>
                <FaChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200
                    ${expandedGroups[group.name] ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedGroups[group.name] && (
                <div className="mt-1 ml-4 pl-4 border-l border-gray-100 dark:border-gray-700 space-y-1">
                  {group.items.map(item => {
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center gap-3 px-4 py-2 rounded-lg ${isActive
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          } transition-colors text-sm`}
                        target={item.target}
                        onClick={() => setIsOpen(false)}
                      >
                        <div className={`${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                          {item.icon}
                        </div>
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Settings at bottom */}
        <div className="mt-auto border-t border-gray-100 dark:border-gray-700 py-4 px-3">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${pathname === '/settings'
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              } transition-colors`}
            onClick={() => setIsOpen(false)}
          >
            <MdOutlineSettings className="w-5 h-5" />
            <span className="font-medium text-sm">{t('common.settings')}</span>
          </Link>
        </div>
      </div>
    </>
  );
}

function DesktopSidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { t } = useLanguage();
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
    'Công cụ AI': true,
    'Tiện ích': true,
    'Tài chính': true,
    'Sức khỏe': true
  });

  // Load expanded groups from localStorage on mount
  useEffect(() => {
    const savedExpandedGroups = localStorage.getItem('desktopExpandedGroups');
    if (savedExpandedGroups) {
      setExpandedGroups(JSON.parse(savedExpandedGroups));
    }
  }, []);

  const toggleGroup = (groupName: string) => {
    const newExpandedGroups = {
      ...expandedGroups,
      [groupName]: !expandedGroups[groupName]
    };
    setExpandedGroups(newExpandedGroups);
    // Save to localStorage
    localStorage.setItem('desktopExpandedGroups', JSON.stringify(newExpandedGroups));
  };

  return (
    <aside
      className={`hidden md:block fixed top-0 left-0 h-screen border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 z-30 ${isCollapsed ? 'w-[70px]' : 'w-[260px]'
        }`}
    >
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
        <Link href="/" className="flex items-center gap-3.5 overflow-hidden">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 dark:from-gray-700 dark:to-gray-900 flex items-center justify-center text-white">
            <FaMagic className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <span className="font-medium text-base text-gray-900 dark:text-white whitespace-nowrap">
              Amri2k
            </span>
          )}
        </Link>
        <div className="flex-1" />
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeftIcon className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Menu - with own scrollable area */}
      <div className="overflow-y-auto h-[calc(100vh-4rem-60px)] scrollbar-thin">
        <div className={`px-3 py-4 ${isCollapsed ? 'text-center' : ''}`}>
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${pathname === '/'
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              } transition-colors`}
          >
            <FaHome className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium text-sm">{t('common.home')}</span>}
          </Link>
        </div>

        {!isCollapsed && (
          <div className="px-5 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Menu
          </div>
        )}

        {menuGroups.map((group, groupIndex) => (
          <div key={group.name} className={`${groupIndex > 0 ? 'mt-4' : 'mt-1'} px-3`}>
            {!isCollapsed ? (
              <button
                onClick={() => toggleGroup(group.name)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="text-gray-500 dark:text-gray-400">
                  {group.icon}
                </div>
                <span className="flex-1 text-left font-medium text-sm">
                  {group.name}
                </span>
                <FaChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200
                    ${expandedGroups[group.name] ? 'rotate-180' : ''}`}
                />
              </button>
            ) : (
              <div className="py-2 text-center">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400">
                  {group.icon}
                </div>
              </div>
            )}

            {(expandedGroups[group.name] || isCollapsed) && (
              <div className={`mt-1 space-y-1 ${!isCollapsed ? 'pl-8' : ''}`}>
                {group.items.map(item => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg ${isActive
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        } transition-colors text-sm`}
                      target={item.target}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <div className={`${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {item.icon}
                      </div>
                      {!isCollapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Settings at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 dark:border-gray-700 py-4 px-3">
        <Link
          href="/settings"
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg ${pathname === '/settings'
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            } transition-colors`}
          title={isCollapsed ? t('common.settings') : undefined}
        >
          <MdOutlineSettings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium text-sm">{t('common.settings')}</span>}
        </Link>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  const { isCollapsed } = useSidebar();

  return (
    <>
      <MobileSidebar />
      <DesktopSidebar />
      {/* Add spacer div to push content */}
      <div className={`hidden md:block ${isCollapsed ? 'w-[70px]' : 'w-[260px]'} transition-all duration-300`}></div>
    </>
  );
}