import Link from 'next/link'
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
    FaSearch,
    FaEye,
    FaRobot,
    FaLanguage
} from "react-icons/fa";
import {
    FaMoneyBillTransfer,
    FaUser,
    FaChartSimple,
    FaBookJournalWhills
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
    MdOutlineRestartAlt,
    MdOutlineSwapHoriz,
    MdOutlineAutoFixHigh,
    MdCrop
} from "react-icons/md";
import { useEffect, useState } from 'react';
import { PageView } from '@/models/PageView';
import { useLanguage } from '@/contexts/LanguageContext';

interface FeatureCardProps {
    title: string
    description: string
    icon: React.ReactNode
    views: number
    path: string
    badge?: 'Popular' | 'New'
    isHot?: boolean,
    categories?: string[]
    multiCategory?: boolean
}


interface CategoryProps {
    title: string
    description: string
    icon: React.ReactNode
}

const FeatureCard = ({ title, description, icon, views, path, badge, isHot }: FeatureCardProps) => {
    // Determine if this feature is popular based on view count
    const isPopular = views > 100; // Consider features with more than 100 views as popular

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
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-base text-gray-900 group-hover:text-black transition-colors">{title}</h3>
                            {isHot && (
                                <span className="px-2 py-0.5 text-xs rounded-full text-white bg-gradient-to-r from-orange-500 to-red-500">
                                    Hot
                                </span>
                            )}
                            {(badge === 'Popular' || isPopular) && !isHot && (
                                <span className="px-2 py-0.5 text-xs rounded-full text-white bg-gray-900">
                                    Popular
                                </span>
                            )}
                            {badge === 'New' && (
                                <span className="px-2 py-0.5 text-xs rounded-full text-white bg-gradient-to-r from-blue-500 to-indigo-500">
                                    New
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{description}</p>
                    </div>
                </div>

                <div className="mt-auto flex justify-end text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                        <FaEye className="h-3 w-3" />
                        <span>{views}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

// Category definitions
const categoryDefinitions: CategoryProps[] = [
    {
        title: "AI",
        description: "Các công cụ sử dụng trí tuệ nhân tạo",
        icon: <FaMagic className="w-6 h-6 text-black" />
    },
    {
        title: "Utilities",
        description: "Các công cụ hỗ trợ tiện ích",
        icon: <MdGrid3X3 className="w-6 h-6 text-black" />
    },
    {
        title: "Fiance",
        description: "Các công cụ tài chính",
        icon: <MdOutlineCurrencyExchange className="w-6 h-6 text-black" />
    },
    {
        title: "Health",
        description: "Các công cụ sức khỏe",
        icon: <FaHeart className="w-6 h-6 text-black" />
    },
    {
        title: "Quiz",
        description: "Các công cụ quiz",
        icon: <MdOutlineQuestionMark className="w-6 h-6 text-black" />
    },
    {
        title: "Image",
        description: "Các công cụ xử lý ảnh",
        icon: <MdOutlinePhoto className="w-6 h-6 text-black" />
    }
];

export default function Features() {
    const { t } = useLanguage();
    const [pageViews, setPageViews] = useState<Record<string, number>>({});
    const [topPages, setTopPages] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    // All available features with their metadata
    const allFeatures: FeatureCardProps[] = [
        {
            title: t('translate.ai_translate'),
            description: t('translate.ai_translate_description'),
            icon: <MdTranslate className="w-6 h-6 text-black" />,
            views: 0,
            path: "/translate",
            categories: ["AI", "Utilities"],
            multiCategory: true
        },
        {
            title: t('translate.conversation_translate'),
            description: t('translate.conversation_translate_description'),
            icon: <MdOutlineChatBubbleOutline className="w-6 h-6 text-black" />,
            views: 0,
            path: "/conversation-translate",
            categories: ["AI"]
        },
        {
            title: "Dịch phụ đề",
            description: "Dịch file phụ đề SRT sang nhiều ngôn ngữ",
            icon: <MdOutlineMovie className="w-6 h-6 text-black" />,
            views: 0,
            path: "/srt-translate",
            categories: ["AI"]
        },
        {
            title: "Từ điển",
            description: "Tra cứu từ điển đa ngôn ngữ",
            icon: <FaBook className="w-6 h-6 text-black" />,
            views: 0,
            path: "/dictionary",
            categories: ["AI", "Utilities"],
            multiCategory: true
        },
        {
            title: "Học từ vựng",
            description: "Học và luyện tập từ vựng hiệu quả",
            icon: <MdOutlineSchool className="w-6 h-6 text-black" />,
            views: 0,
            path: "/vocabulary",
            categories: ["AI"]
        },
        {
            title: "Tạo câu hỏi",
            description: "Tạo các bài tập và câu hỏi trắc nghiệm",
            icon: <MdOutlineQuestionMark className="w-6 h-6 text-black" />,
            views: 0,
            path: "/quiz",
            categories: ["AI"]
        },
        {
            title: "Cải thiện văn bản",
            description: "Nâng cao chất lượng văn bản của bạn",
            icon: <FaMagic className="w-6 h-6 text-black" />,
            views: 0,
            path: "/enhance-text",
            categories: ["AI"]
        },
        {
            title: "Tóm tắt văn bản",
            description: "Tự động tóm tắt văn bản dài",
            icon: <MdOutlineDocumentScanner className="w-6 h-6 text-black" />,
            views: 0,
            path: "/summarize",
            categories: ["AI"]
        },
        {
            title: "Giải bài tập",
            description: "Giải bài tập bằng AI",
            icon: <MdOutlineLightbulb className="w-6 h-6 text-black" />,
            views: 0,
            path: "/aisolver",
            categories: ["AI"]
        },
        {
            title: "Hỗ trợ tán gái",
            description: "Hỗ trợ tán gái bằng AI",
            icon: <FaHeart className="w-6 h-6 text-black" />,
            views: 0,
            path: "/flirting",
            categories: ["AI"]
        },
        {
            title: "Xem bói",
            description: "Xem bói bằng AI",
            icon: <FaStar className="w-6 h-6 text-black" />,
            views: 0,
            path: "/fortune-telling",
            categories: ["AI"]
        },
        {
            title: "Kiểm tra tốc độ gõ",
            description: "Kiểm tra và cải thiện tốc độ gõ phím của bạn",
            icon: <FaKeyboard className="w-6 h-6 text-black" />,
            views: 0,
            path: "/typing-speed",
            badge: "New",
            categories: ["Utilities"]
        },
        {
            title: "Công cụ ngẫu nhiên",
            description: "Tạo số ngẫu nhiên, chuỗi",
            icon: <FaDice className="w-6 h-6 text-black" />,
            views: 0,
            path: "/random",
            badge: "New",
            categories: ["Utilities"]
        },
        {
            title: "Thông tin quốc gia",
            description: "Thông tin chi tiết về quốc gia",
            icon: <FaFlagUsa className="w-6 h-6 text-black" />,
            views: 0,
            path: "/countries",
            categories: ["Utilities"]
        },
        {
            title: "Dự báo thời tiết",
            description: "Xem dự báo thời tiết chi tiết với bản đồ tương tác",
            icon: <FaCloud className="w-6 h-6 text-black" />,
            views: 0,
            path: "/weather",
            badge: "New",
            categories: ["Utilities"]
        },
        {
            title: "Mã QR",
            description: "Tạo và quét mã QR",
            icon: <FaQrcode className="w-6 h-6 text-black" />,
            views: 0,
            path: "/qrcode",
            categories: ["Utilities"]
        },
        {
            title: "Email tạm thời",
            description: "Tạo email tạm",
            icon: <MdEmail className="w-6 h-6 text-black" />,
            views: 0,
            path: "/temp-mail",
            categories: ["Utilities"]
        },
        {
            title: "Chuyển đổi múi giờ",
            description: "Chuyển đổi múi giờ giữa các thành phố trên thế giới",
            icon: <FaClock className="w-6 h-6 text-black" />,
            views: 0,
            path: "/utilities/time-converter",
            categories: ["Utilities"]
        },
        {
            title: "Chuyển đổi đơn vị",
            description: "Chuyển đổi đơn vị giữa các đơn vị khác nhau",
            icon: <MdStackedLineChart className="w-6 h-6 text-black" />,
            views: 0,
            path: "/utilities/unit-converter",
            categories: ["Utilities"]
        },
        {
            title: "Tính tuổi",
            description: "Tính tuổi của bạn",
            icon: <FaCalculator className="w-6 h-6 text-black" />,
            views: 0,
            path: "/utilities/age-calculator",
            categories: ["Utilities"]
        },
        {
            title: "Username tools",
            description: "Username tools",
            icon: <FaUser className="w-6 h-6 text-black" />,
            views: 0,
            path: "/username-tools",
            categories: ["Utilities"]
        },
        {
            title: "Password tools",
            description: "Password tools",
            icon: <MdOutlinePassword className="w-6 h-6 text-black" />,
            views: 0,
            path: "/password-tools",
            categories: ["Utilities"]
        },
        {
            title: "Chuyển đổi tiền tệ",
            description: "Chuyển đổi giữa các loại tiền tệ khác nhau",
            icon: <FaMoneyBillTransfer className="w-6 h-6 text-black" />,
            views: 0,
            path: "/currency",
            badge: "New",
            categories: ["Fiance", "Utilities"],
            multiCategory: true
        },
        {
            title: "Tính lãi suất",
            description: "Tính lãi suất tiết kiệm",
            icon: <FaCalculator className="w-6 h-6 text-black" />,
            views: 0,
            path: "/utilities/interest-calculator",
            categories: ["Fiance"]
        },
        {
            title: "Tính khoản vay",
            description: "Tính khoản vay và lãi suất",
            icon: <FaCalculator className="w-6 h-6 text-black" />,
            views: 0,
            path: "/utilities/loan-calculator",
            categories: ["Fiance"]
        },
        {
            title: "Quản lý chi tiêu",
            description: "Quản lý chi tiêu của bạn",
            icon: <MdOutlineCreditCard className="w-6 h-6 text-black" />,
            views: 0,
            path: "/money-love",
            categories: ["Fiance"]
        },
        {
            title: "Tính chỉ số BMI",
            description: "Tính chỉ số BMI của bạn",
            icon: <FaCalculator className="w-6 h-6 text-black" />,
            views: 0,
            path: "/utilities/bmi-calculator",
            categories: ["Health"]
        },
        {
            title: "Lên lịch luyện tập",
            description: "Tạo lịch tập phù hợp với cơ thể bạn",
            icon: <FaRegClipboard className="w-6 h-6 text-black" />,
            views: 0,
            path: "/workout-scheduler",
            badge: "New",
            categories: ["Health"]
        },
        {
            title: "Công thức nấu ăn",
            description: "Tạo công thức nấu ăn bằng AI",
            icon: <MdScience className="w-6 h-6 text-black" />,
            views: 0,
            path: "/recipe-generator",
            categories: ["Health", "AI"],
            multiCategory: true
        },
        {
            title: "Công cụ cắt ảnh",
            description: "Cắt, xoay, thay đổi kích thước ảnh của bạn",
            icon: <MdCrop className="w-6 h-6 text-black" />,
            views: 0,
            path: "/image-cropper",
            badge: "New",
            categories: ["Utilities", "Image"]
        },
        {
            title: "Gay Test",
            description: "Gay Test",
            icon: <FaHeart className="w-6 h-6 text-black" />,
            views: 0,
            path: "/ai/gay-test",
            categories: ["Quiz"],
            multiCategory: true
        },
        {
            title: "Wibu Test",
            description: "Wibu Test",
            icon: <FaBookJournalWhills className="w-6 h-6 text-black" />,
            views: 0,
            path: "/ai/wibu-test",
            categories: ["Quiz"],
            multiCategory: true
        },
        {
            title: "English Test",
            description: "English Quiz",
            icon: <FaLanguage className="w-6 h-6 text-black" />,
            views: 0,
            path: "/ai/english",
            categories: ["Quiz"]
        },
        {
            title: "Ai Detector",
            description: "Ai Detector",
            icon: <FaRobot className="w-6 h-6 text-black" />,
            views: 0,
            path: "/ai/detect",
            categories: ["AI", "Utilities"],
            multiCategory: true
        },
        // ,
        // {
        //     title: t('image_remover.title'),
        //     description: t('image_remover.description'),
        //     icon: <MdOutlineAutoFixHigh className="w-6 h-6 text-black" />,
        //     views: 0,
        //     path: "/image-bg-remover",
        //     badge: "New",
        //     categories: ["AI", "Utilities"],
        //     multiCategory: true
        // }
    ];
    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300); // 300ms delay

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Normalize text for search
    const normalizeText = (text: string) => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[đĐ]/g, 'd')           // Handle Vietnamese đ/Đ
            .trim();
    };

    // Assign each feature to exactly one category - the first one in categoryDefinitions 
    // that it belongs to (applies only to features without multiCategory=true)
    const assignedFeatures = new Map(); // Maps feature path to its assigned category

    // First, iterate through categories in order
    categoryDefinitions.forEach(category => {
        // Find features for this category that haven't been assigned yet
        allFeatures.forEach(feature => {
            // Skip multi-category features, they'll be handled separately
            if (feature.multiCategory) return;

            if (
                feature.categories?.includes(category.title) &&
                !assignedFeatures.has(feature.path)
            ) {
                // Assign this feature to this category
                assignedFeatures.set(feature.path, category.title);
            }
        });
    });

    // Generate categories with their features for rendering
    const categories = categoryDefinitions.map(category => {
        // Get features that should appear in this category
        const categoryFeatures = allFeatures.filter(feature =>
            // Include if it's a multi-category feature that belongs to this category
            (feature.multiCategory && feature.categories?.includes(category.title)) ||
            // OR if it's a single-category feature assigned to this category
            (!feature.multiCategory && assignedFeatures.get(feature.path) === category.title)
        );

        // Create a unique key for each feature in this category
        const featuresWithKeys = categoryFeatures.map(feature => ({
            ...feature,
            uniqueKey: `${feature.path}-${category.title}`
        }));

        return {
            ...category,
            features: featuresWithKeys
        };
    });

    // Filter features based on search query and selected category
    const filteredCategories = categories
        .filter(category => !selectedCategory || category.title === selectedCategory)
        .map(category => ({
            ...category,
            features: category.features.filter(feature => {
                if (!debouncedSearchQuery) return true;

                const normalizedSearch = normalizeText(debouncedSearchQuery);
                const normalizedTitle = normalizeText(feature.title);
                const normalizedDescription = normalizeText(feature.description);

                return normalizedTitle.includes(normalizedSearch) ||
                    normalizedDescription.includes(normalizedSearch);
            })
        }))
        .filter(category => category.features.length > 0);

    // Fetch page views
    const fetchPageViews = async () => {
        try {
            const response = await fetch('/api/page-views');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.reduce((acc: Record<string, number>, view: { path: string; views: number }) => {
                acc[view.path] = view.views;
                return acc;
            }, {} as Record<string, number>);
        } catch (error) {
            console.error('Error fetching page views:', error);
            return {};
        }
    };

    // Updated to use SWR in the future:
    // import useSWR from 'swr'
    // const { data: viewsData, error } = useSWR('/api/page-views', fetchPageViews, {
    //   refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    //   revalidateOnFocus: false,
    //   dedupingInterval: 60 * 1000, // Dedupe requests within 1 minute
    // });

    useEffect(() => {
        // Helper function to update top pages
        const updateTopPages = (viewsMap: Record<string, number>) => {
            // Get all paths and sort by views
            const sortedPaths = Object.entries(viewsMap)
                .sort((a, b) => b[1] - a[1]) // Sort by views in descending order
                .slice(0, 3) // Take top 3
                .map(([path]) => path); // Extract just the paths

            setTopPages(sortedPaths);
        };

        const fetchData = async () => {
            const data = await fetchPageViews();
            setPageViews(data);
            updateTopPages(data);
        };

        fetchData();
        const intervalId = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Search and Filter Section */}
            <div className="mb-10 space-y-5 max-w-3xl mx-auto">
                {/* Search Bar */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm công cụ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-full border border-gray-200 pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 shadow-sm"
                        autoComplete="off"
                        spellCheck="false"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-2 bg-white dark:bg-gray-800 rounded-full p-1.5 max-w-fit mx-auto shadow-sm">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-4 py-2 rounded-full text-sm font-normal transition-all duration-300 flex items-center gap-2 ${selectedCategory === null
                            ? 'bg-gray-900 text-white shadow-sm'
                            : ' text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <MdGrid3X3 className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-shrink-0">Tất cả</span>
                    </button>
                    {categoryDefinitions.map((category) => (
                        <button
                            key={category.title}
                            onClick={() => setSelectedCategory(category.title)}
                            className={`px-4 py-2 rounded-full text-sm font-normal transition-all duration-300 flex items-center gap-2 ${selectedCategory === category.title
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                                {category.icon}
                            </div>
                            <span className="flex-shrink-0">{category.title}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Features Grid */}
            <div className="space-y-16">
                {filteredCategories.map((category, index) => (
                    <div key={index} className="space-y-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-2">
                            <div className="p-2 rounded-lg bg-gray-50">
                                {category.icon}
                            </div>
                            <div>
                                <h2 className="text-xl font-medium text-gray-900">{category.title}</h2>
                                <p className="text-sm text-gray-500">{category.description}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {category.features.map((feature) => (
                                <FeatureCard
                                    key={feature.uniqueKey}
                                    title={feature.title}
                                    description={feature.description}
                                    icon={feature.icon}
                                    views={pageViews[feature.path] || 0}
                                    path={feature.path}
                                    badge={feature.badge}
                                    isHot={topPages.includes(feature.path)}
                                />
                            ))}
                        </div>
                    </div>
                ))}

                {/* No Results Message */}
                {filteredCategories.length === 0 && (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <FaSearch className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg font-light">
                            Không tìm thấy kết quả phù hợp với tìm kiếm của bạn.
                        </p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-3 text-sm text-gray-900 underline underline-offset-2"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
