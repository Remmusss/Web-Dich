'use client'

import { useState } from 'react'
import { aiService } from '@/lib/ai-service'
import {
    CurrencyDollarIcon,
    ComputerDesktopIcon,
    ArrowPathIcon,
    ClipboardIcon,
    TrashIcon,
    CpuChipIcon,
    CircleStackIcon,
    SwatchIcon,
    ServerIcon,
    CircleStackIcon as StorageIcon,
    BoltIcon,
    CubeIcon,
    ArrowPathIcon as FanIcon,
    ComputerDesktopIcon as MonitorIcon,
    CommandLineIcon,
    CursorArrowRaysIcon
} from '@heroicons/react/24/outline'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { Button } from "@/components/ui/button"

interface PCComponent {
    name: string
    model: string
    price: string
    note?: string
}

interface PCConfig {
    budget: string
    purpose: string
    components: PCComponent[]
    totalPrice: string
    notes: string[]
    evaluation?: {
        gaming?: {
            rating: number
            description: string
            games: string[]
        }
        productivity?: {
            rating: number
            description: string
            tasks: string[]
        }
        contentCreation?: {
            rating: number
            description: string
            software: string[]
        }
    }
}

// Component icons
const componentIcons = {
    'CPU': CpuChipIcon,
    'GPU': SwatchIcon,
    'RAM': CircleStackIcon,
    'Mainboard': ServerIcon,
    'Storage': StorageIcon,
    'PSU': BoltIcon,
    'Case': CubeIcon,
    'Cooling': FanIcon,
    'Monitor': MonitorIcon,
    'Keyboard': CommandLineIcon,
    'Mouse': CursorArrowRaysIcon,
    'Other': ComputerDesktopIcon
} as const;

// Component category names in Vietnamese
const componentNames = {
    'CPU': 'Bộ xử lý',
    'GPU': 'Card đồ họa',
    'RAM': 'Bộ nhớ RAM',
    'Mainboard': 'Bo mạch chủ',
    'Storage': 'Ổ cứng',
    'PSU': 'Nguồn máy tính',
    'Case': 'Vỏ máy',
    'Cooling': 'Tản nhiệt',
    'Monitor': 'Màn hình',
    'Keyboard': 'Bàn phím',
    'Mouse': 'Chuột',
    'Other': 'Phụ kiện khác'
} as const;

export default function PCBuilder() {
    const [budget, setBudget] = useState('')
    const [currency, setCurrency] = useState<'vnd' | 'usd' | 'jpy' | 'cny'>('vnd')
    const [formattedBudget, setFormattedBudget] = useState('')
    const [purpose, setPurpose] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [config, setConfig] = useState<PCConfig | null>(null)
    const [configHistory, setConfigHistory] = useState<PCConfig[]>([])
    const [showVNDConversion, setShowVNDConversion] = useState(false)
    const [convertedPrices, setConvertedPrices] = useState<{ [key: string]: string }>({})
    const [gpuBrand, setGpuBrand] = useState<'any' | 'nvidia' | 'amd'>('any')
    const [ramSize, setRamSize] = useState<'any' | '8' | '16' | '32' | '64' | '128'>('any')
    const [ssdSize, setSsdSize] = useState<'any' | '256' | '512' | '1000' | '2000'>('any')
    const [hddSize, setHddSize] = useState<'any' | '1000' | '2000' | '4000' | '8000'>('any')
    const [includePeripherals, setIncludePeripherals] = useState({
        monitor: false,
        keyboard: false,
        mouse: false
    })

    const formatNumber = (value: string) => {
        // Remove all non-digit characters
        const numericValue = value.replace(/\D/g, '')
        // Format with dots as thousand separators
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const formatted = formatNumber(value)
        setBudget(value.replace(/\D/g, ''))
        setFormattedBudget(formatted)
    }

    const handleGenerateConfig = async () => {
        if (!budget.trim()) {
            setError('Vui lòng nhập ngân sách')
            return
        }

        setIsLoading(true)
        setError(null)
        setConfig(null)

        try {
            const gpuBrandPreference = gpuBrand !== 'any' ? `- Ưu tiên GPU hãng: ${gpuBrand.toUpperCase()}` : ''
            const ramSizePreference = ramSize !== 'any' ? `- Dung lượng RAM: ${ramSize}GB` : ''
            const ssdSizePreference = ssdSize !== 'any' ? `- Dung lượng SSD: ${ssdSize}GB` : ''
            const hddSizePreference = hddSize !== 'any' ? `- Dung lượng HDD: ${hddSize}GB` : ''
            const peripheralRequirements = Object.entries(includePeripherals)
                .filter(([_, included]) => included)
                .map(([peripheral]) => `${peripheral === 'monitor' ? 'Monitor' : peripheral === 'keyboard' ? 'Keyboard' : 'Mouse'}`)
                .join(', ')

            const budgetWithCurrency = `${budget} ${currency.toUpperCase()}`
            const prompt = `Hãy đề xuất cấu hình PC với các thông tin sau:
- Ngân sách: ${budgetWithCurrency}
- Mục đích sử dụng: ${purpose || 'Đa năng'}
${gpuBrandPreference}
${ramSizePreference}
${ssdSizePreference}
${hddSizePreference}

Yêu cầu:
- Trả về kết quả theo định dạng JSON với các trường:
  + budget: ngân sách (bao gồm đơn vị tiền tệ, ví dụ: "15.000.000 VNĐ", "500 USD")
  + purpose: mục đích sử dụng
  + components: mảng các thành phần, mỗi thành phần gồm:
    * name: tên loại bao gồm (CPU, GPU, RAM, Mainboard, Storage, PSU, Case, Cooling, ${peripheralRequirements}
    * model: model cụ thể
    * price: giá tiền (bao gồm đơn vị tiền tệ, ví dụ: "3.500.000 VNĐ", "150 USD") không ghi kèm chú thích của mệnh giá khác
    * note: ghi chú (nếu có)
  + totalPrice: tổng giá tiền (bằng tổng giá của tất cả các thành phần, bao gồm đơn vị tiền tệ)
  + notes: mảng các lưu ý
  + evaluation: đánh giá cấu hình (nếu có):
    * gaming: đánh giá cho mục đích chơi game
      - rating: điểm đánh giá từ 1-10
      - description: mô tả khả năng chơi game
      - games: danh sách các tựa game có thể chơi tốt
    * productivity: đánh giá cho mục đích làm việc
      - rating: điểm đánh giá từ 1-10
      - description: mô tả khả năng làm việc
      - tasks: danh sách các tác vụ có thể thực hiện tốt
    * contentCreation: đánh giá cho mục đích sáng tạo nội dung
      - rating: điểm đánh giá từ 1-10
      - description: mô tả khả năng sáng tạo nội dung
      - software: danh sách các phần mềm có thể chạy tốt
- Chỉ trả về JSON thuần túy, không thêm markdown, không thêm text khác
- KHÔNG thêm \`\`\`json hoặc \`\`\` ở đầu và cuối
- Giá tiền phải phù hợp với ngân sách
- Tổng giá (totalPrice) PHẢI bằng tổng của tất cả các thành phần trong components
- Ưu tiên hiệu năng/giá tiền tốt nhất
- Các thành phần phải tương thích với nhau
- Ưu tiên sát với ngân sách đầu vào nhất có thể
- Nếu ngân sách quá thấp, đề xuất cấu hình tối thiểu có thể
- Nếu ngân sách cao, đề xuất cấu hình cao cấp phù hợp
- Sử dụng đơn vị tiền tệ phù hợp với ngân sách đầu vào là ${currency.toUpperCase()}
  `
            console.log(prompt)
            // Sử dụng Google Search để tìm thông tin về giá và đánh giá
            const searchResult = await aiService.processWithGoogleSearch(prompt)
            const result = searchResult.text

            // Clean up the response to ensure it's valid JSON
            const cleanResult = result.replace(/```json\n?|\n?```/g, '').trim()
            const parsedConfig = JSON.parse(cleanResult) as PCConfig

            // Filter out peripheral components based on includePeripherals state
            parsedConfig.components = parsedConfig.components.filter(comp => {
                if (comp.name === 'Monitor' && !includePeripherals.monitor) return false;
                if (comp.name === 'Keyboard' && !includePeripherals.keyboard) return false;
                if (comp.name === 'Mouse' && !includePeripherals.mouse) return false;
                return true;
            });

            // Validate total price matches sum of components
            const totalComponentPrice = parsedConfig.components.reduce((sum, comp) => {
                const price = comp.price.toLowerCase()
                let numericPrice = price
                    .replace(/[^\d.]/g, '')
                    .replace(/,/g, '')
                    .replace(/\.(?=.*\.)/g, '')

                if (price.includes('triệu')) {
                    numericPrice = (parseFloat(numericPrice) * 1000000).toString()
                } else if (price.includes('tỷ')) {
                    numericPrice = (parseFloat(numericPrice) * 1000000000).toString()
                } else if (price.includes('k')) {
                    numericPrice = (parseFloat(numericPrice) * 1000).toString()
                }

                return sum + parseFloat(numericPrice)
            }, 0)

            const totalConfigPrice = parsedConfig.totalPrice.toLowerCase()
            let numericTotalPrice = totalConfigPrice
                .replace(/[^\d.]/g, '')
                .replace(/,/g, '')
                .replace(/\.(?=.*\.)/g, '')

            if (totalConfigPrice.includes('triệu')) {
                numericTotalPrice = (parseFloat(numericTotalPrice) * 1000000).toString()
            } else if (totalConfigPrice.includes('tỷ')) {
                numericTotalPrice = (parseFloat(numericTotalPrice) * 1000000000).toString()
            } else if (totalConfigPrice.includes('k')) {
                numericTotalPrice = (parseFloat(numericTotalPrice) * 1000).toString()
            }

            const totalPriceDiff = Math.abs(parseFloat(numericTotalPrice) - totalComponentPrice)
            if (totalPriceDiff > 100000) { // Allow 100k VND difference for rounding
                console.warn('Total price mismatch detected:', {
                    componentsTotal: totalComponentPrice,
                    configTotal: parseFloat(numericTotalPrice),
                    difference: totalPriceDiff
                })
            }

            // Ensure all price values are strings
            parsedConfig.budget = parsedConfig.budget.toString()
            parsedConfig.totalPrice = parsedConfig.totalPrice.toString()
            parsedConfig.components = parsedConfig.components.map(comp => ({
                ...comp,
                price: comp.price.toString()
            }))

            setConfig(parsedConfig)

            // Add to history (max 5 entries)
            setConfigHistory(prev => {
                const updatedHistory = [parsedConfig, ...prev]
                return updatedHistory.slice(0, 5)
            })
        } catch (error) {
            console.error('PC config generation error:', error)
            setError('Có lỗi xảy ra khi tạo cấu hình PC')
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (!config) return

        const configText = config.components.map(comp => {
            const categoryName = componentNames[comp.name as keyof typeof componentNames] || comp.name
            return `${categoryName}:\n- ${comp.model}`
        }).join('\n')

        navigator.clipboard.writeText(configText)
    }

    const resetHistory = () => {
        setConfigHistory([])
        setConfig(null)
        setError(null)
    }

    const convertToVND = async (amount: string, fromCurrency: string) => {
        try {
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency.toUpperCase()}`)
            const data = await response.json()
            const rate = data.rates.VND
            const numericAmount = parseFloat(amount.replace(/[^\d]/g, ''))
            const convertedAmount = Math.round(numericAmount * rate)
            return convertedAmount.toLocaleString('vi-VN') + ' VNĐ'
        } catch (error) {
            console.error('Error converting currency:', error)
            return 'Không thể quy đổi'
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-8">
                        <div className="space-y-8">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">🖥️ PC Builder</h1>
                                <p className="text-gray-600">
                                    Không biết build PC như thế nào? Để chúng tôi giúp bạn!
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                                            Ngân sách
                                        </label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="text"
                                                value={formattedBudget}
                                                onChange={handleBudgetChange}
                                                placeholder="Nhập số tiền"
                                                className="w-[450px]"
                                            />
                                            <Select
                                                value={currency}
                                                onValueChange={(value) => setCurrency(value as 'vnd' | 'usd' | 'jpy' | 'cny')}
                                            >
                                                <SelectTrigger className="w-[80px]">
                                                    <SelectValue placeholder="Chọn đơn vị tiền tệ" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="vnd">VNĐ</SelectItem>
                                                    <SelectItem value="usd">USD</SelectItem>
                                                    <SelectItem value="jpy">JPY</SelectItem>
                                                    <SelectItem value="cny">CNY</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <ComputerDesktopIcon className="h-5 w-5 text-gray-400" />
                                            Mục đích sử dụng
                                        </label>
                                        <Input
                                            type="text"
                                            value={purpose}
                                            onChange={(e) => setPurpose(e.target.value)}
                                            placeholder="Ví dụ: Gaming, Đồ họa, Văn phòng..."
                                            className="w-[450px]"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <SwatchIcon className="h-5 w-5 text-gray-400" />
                                            Ưu tiên GPU
                                        </label>
                                        <Select
                                            value={gpuBrand}
                                            onValueChange={(value) => setGpuBrand(value as 'any' | 'nvidia' | 'amd')}
                                        >
                                            <SelectTrigger className="w-[450px]">
                                                <SelectValue placeholder="Chọn GPU" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Không ưu tiên</SelectItem>
                                                <SelectItem value="nvidia">NVIDIA</SelectItem>
                                                <SelectItem value="amd">AMD</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <CircleStackIcon className="h-5 w-5 text-gray-400" />
                                            Dung lượng RAM
                                        </label>
                                        <Select
                                            value={ramSize}
                                            onValueChange={(value) => setRamSize(value as 'any' | '8' | '16' | '32' | '64' | '128')}
                                        >
                                            <SelectTrigger className="w-[450px]">
                                                <SelectValue placeholder="Chọn dung lượng RAM" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Không yêu cầu</SelectItem>
                                                <SelectItem value="8">8GB</SelectItem>
                                                <SelectItem value="16">16GB</SelectItem>
                                                <SelectItem value="32">32GB</SelectItem>
                                                <SelectItem value="64">64GB</SelectItem>
                                                <SelectItem value="128">128GB</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <StorageIcon className="h-5 w-5 text-gray-400" />
                                            Dung lượng SSD
                                        </label>
                                        <Select
                                            value={ssdSize}
                                            onValueChange={(value) => setSsdSize(value as 'any' | '256' | '512' | '1000' | '2000')}
                                        >
                                            <SelectTrigger className="w-[450px]">
                                                <SelectValue placeholder="Chọn dung lượng SSD" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Không yêu cầu</SelectItem>
                                                <SelectItem value="256">256GB</SelectItem>
                                                <SelectItem value="512">512GB</SelectItem>
                                                <SelectItem value="1000">1TB</SelectItem>
                                                <SelectItem value="2000">2TB</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <StorageIcon className="h-5 w-5 text-gray-400" />
                                            Dung lượng HDD
                                        </label>
                                        <Select
                                            value={hddSize}
                                            onValueChange={(value) => setHddSize(value as 'any' | '1000' | '2000' | '4000' | '8000')}
                                        >
                                            <SelectTrigger className="w-[450px]">
                                                <SelectValue placeholder="Chọn dung lượng HDD" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="any">Không yêu cầu</SelectItem>
                                                <SelectItem value="1000">1TB</SelectItem>
                                                <SelectItem value="2000">2TB</SelectItem>
                                                <SelectItem value="4000">4TB</SelectItem>
                                                <SelectItem value="8000">8TB</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <ComputerDesktopIcon className="h-5 w-5 text-gray-400" />
                                            Phụ kiện
                                        </label>
                                        <div className="flex flex-wrap gap-4">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={includePeripherals.monitor}
                                                    onChange={(e) => setIncludePeripherals(prev => ({ ...prev, monitor: e.target.checked }))}
                                                    className="rounded border-gray-300 text-gray-800 focus:ring-gray-500"
                                                />
                                                <span className="text-sm text-gray-600">Màn hình</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={includePeripherals.keyboard}
                                                    onChange={(e) => setIncludePeripherals(prev => ({ ...prev, keyboard: e.target.checked }))}
                                                    className="rounded border-gray-300 text-gray-800 focus:ring-gray-500"
                                                />
                                                <span className="text-sm text-gray-600">Bàn phím</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={includePeripherals.mouse}
                                                    onChange={(e) => setIncludePeripherals(prev => ({ ...prev, mouse: e.target.checked }))}
                                                    className="rounded border-gray-300 text-gray-800 focus:ring-gray-500"
                                                />
                                                <span className="text-sm text-gray-600">Chuột</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerateConfig}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                                >
                                    <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                                    <span className="font-medium">{isLoading ? 'Đang tạo cấu hình...' : 'Tạo cấu hình PC'}</span>
                                </button>
                            </div>

                            {error && (
                                <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            {(config !== null || isLoading) && (
                                <div className="mt-8">
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200 text-center">
                                        <p className="text-sm text-gray-600 mb-3">Cấu hình PC được đề xuất</p>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-3xl font-bold text-gray-800">
                                                    {isLoading ? '...' : `${config?.purpose} - ${config?.budget}`}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {isLoading ? '' : (
                                                        <>
                                                            Tổng giá: {config?.totalPrice}
                                                            {showVNDConversion && convertedPrices.total && (
                                                                <span className="ml-2 text-gray-500">
                                                                    ({convertedPrices.total})
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </p>
                                            </div>

                                            {!isLoading && config && (
                                                <div className="text-left space-y-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="outline" onClick={copyToClipboard}>
                                                                <ClipboardIcon className="w-5 h-5" />
                                                                <span className="text-sm font-medium">Copy cấu hình</span>
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                                                        <h3 className="font-medium text-gray-800 mb-4">Thành phần:</h3>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                            {config.components.map((component, index) => {
                                                                const ComponentIcon = componentIcons[component.name as keyof typeof componentIcons] || ComputerDesktopIcon;
                                                                const categoryName = componentNames[component.name as keyof typeof componentNames] || 'Phụ kiện khác';
                                                                return (
                                                                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors flex flex-col h-full">
                                                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                                                                            <ComponentIcon className="w-5 h-5 text-gray-600" />
                                                                            <h4 className="text-sm font-medium text-gray-700">{categoryName}</h4>
                                                                        </div>
                                                                        <div className="flex-grow space-y-2">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="font-medium text-gray-800">{component.model}</span>
                                                                            </div>
                                                                            {component.note && (
                                                                                <p className="text-sm text-gray-500">{component.note}</p>
                                                                            )}
                                                                        </div>
                                                                        <div className="mt-auto pt-2">
                                                                            <span className="text-gray-600">
                                                                                {component.price}
                                                                                {showVNDConversion && convertedPrices[component.name] && (
                                                                                    <span className="ml-2 text-gray-500">
                                                                                        ({convertedPrices[component.name]})
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>

                                                    {config.evaluation && (
                                                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                                                            <h3 className="font-medium text-gray-800 mb-4">Đánh giá cấu hình:</h3>
                                                            <div className="space-y-6">
                                                                {config.evaluation.gaming && (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <h4 className="text-lg font-medium text-gray-800">Gaming</h4>
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-2xl font-bold text-gray-800">{config.evaluation.gaming.rating}</span>
                                                                                <span className="text-gray-500">/10</span>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-gray-600">{config.evaluation.gaming.description}</p>
                                                                        <div className="space-y-1">
                                                                            <p className="text-sm font-medium text-gray-700">Có thể chơi tốt:</p>
                                                                            <ul className="list-disc list-inside text-gray-600">
                                                                                {config.evaluation.gaming.games.map((game, index) => (
                                                                                    <li key={index}>{game}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {config.evaluation.productivity && (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <h4 className="text-lg font-medium text-gray-800">Làm việc</h4>
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-2xl font-bold text-gray-800">{config.evaluation.productivity.rating}</span>
                                                                                <span className="text-gray-500">/10</span>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-gray-600">{config.evaluation.productivity.description}</p>
                                                                        <div className="space-y-1">
                                                                            <p className="text-sm font-medium text-gray-700">Có thể thực hiện tốt:</p>
                                                                            <ul className="list-disc list-inside text-gray-600">
                                                                                {config.evaluation.productivity.tasks.map((task, index) => (
                                                                                    <li key={index}>{task}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {config.evaluation.contentCreation && (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <h4 className="text-lg font-medium text-gray-800">Sáng tạo nội dung</h4>
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-2xl font-bold text-gray-800">{config.evaluation.contentCreation.rating}</span>
                                                                                <span className="text-gray-500">/10</span>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-gray-600">{config.evaluation.contentCreation.description}</p>
                                                                        <div className="space-y-1">
                                                                            <p className="text-sm font-medium text-gray-700">Có thể chạy tốt:</p>
                                                                            <ul className="list-disc list-inside text-gray-600">
                                                                                {config.evaluation.contentCreation.software.map((software, index) => (
                                                                                    <li key={index}>{software}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {config.notes.length > 0 && (
                                                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                                                            <h3 className="font-medium text-gray-800 mb-3">Lưu ý:</h3>
                                                            <div className="space-y-2">
                                                                {config.notes.map((note, index) => (
                                                                    <div key={index} className="flex items-start gap-2">
                                                                        <span className="text-gray-500">•</span>
                                                                        <span className="text-gray-600">{note}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {configHistory.length > 0 && (
                                <div className="mt-8">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-medium text-gray-800">📜 Lịch sử cấu hình</p>
                                        <button
                                            onClick={resetHistory}
                                            className="text-xs text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            Xóa lịch sử
                                        </button>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
                                        <div className="divide-y divide-gray-200">
                                            {configHistory.map((item, index) => (
                                                <div key={index} className="p-4 text-sm hover:bg-gray-100 transition-colors">
                                                    <p className="font-medium text-gray-800">{item.purpose} - {item.budget}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">{item.components.length} thành phần</span>
                                                        <span className="text-xs text-gray-500">{item.totalPrice}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 