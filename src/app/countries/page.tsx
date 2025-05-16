'use client'

import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, MapPinIcon, GlobeAltIcon, UsersIcon, LanguageIcon, PhoneIcon, CurrencyDollarIcon, ArrowPathIcon, BuildingOfficeIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface Country {
    name: {
        common: string
        official: string
        nativeName: {
            [key: string]: {
                official: string
                common: string
            }
        }
    }
    cca2: string  // ISO 3166-1 alpha-2 country code
    capital: string[]
    region: string
    subregion: string
    languages: {
        [key: string]: string
    }
    population: number
    flags: {
        png: string
        svg: string
        alt: string
    }
    currencies: {
        [key: string]: {
            name: string
            symbol: string
        }
    }
    borders: string[]
    area: number
    maps: {
        googleMaps: string
    }
    timezones: string[]
    continents: string[]
    coatOfArms: {
        png: string
        svg: string
    }
    capitalInfo: {
        latlng: number[]
    }
    car: {
        side: string
        signs: string[]
    }
    idd: {
        root: string
        suffixes: string[]
    }
}

interface City {
    geonameId: number
    name: string
    toponymName: string
    lat: string
    lng: string
    population: number
    countryCode: string
    adminName1: string
    adminCode1: string
    fcode: string
    fcodeName: string
    fcl: string
    fclName: string
    countryName: string
    timezone?: string
    isCapital?: boolean
}

interface CityResponse {
    geonames: City[]
    totalResultsCount: number
    status?: {
        message: string
        value: number
    }
}

export default function Countries() {
    const [countries, setCountries] = useState<Country[]>([])
    const [filteredCountries, setFilteredCountries] = useState<Country[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedRegion, setSelectedRegion] = useState<string>('all')
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
    const [cities, setCities] = useState<City[]>([])
    const [loadingCities, setLoadingCities] = useState(false)
    const [citiesError, setCitiesError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCities, setTotalCities] = useState(0)
    const CITIES_PER_PAGE = 20 // API Ninjas giới hạn 30 kết quả mỗi request

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch('https://restcountries.com/v3.1/all')
                if (!response.ok) {
                    throw new Error('Failed to fetch countries')
                }
                const data = await response.json()
                setCountries(data)
                setFilteredCountries(data)
                setError(null)
            } catch (err) {
                setError('Không thể tải dữ liệu. Vui lòng thử lại sau.')
                console.error('Error fetching countries:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchCountries()
    }, [])

    useEffect(() => {
        const filtered = countries.filter(country => {
            const matchesSearch = country.name.common.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                country.name.official.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesRegion = selectedRegion === 'all' || country.region === selectedRegion
            return matchesSearch && matchesRegion
        })
        setFilteredCountries(filtered)
    }, [searchQuery, selectedRegion, countries])

    const regions = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania']
    const formatNumber = (num: number) => new Intl.NumberFormat('vi-VN').format(num)

    const fetchCities = async (country: Country, page = 1) => {
        setLoadingCities(true)
        setCitiesError(null)
        
        try {
            const username = 'amri2k' // Thay thế bằng username GeoNames của bạn
            const startRow = (page - 1) * CITIES_PER_PAGE + 1

            const response = await fetch(
                `https://secure.geonames.org/searchJSON?` +
                `country=${country.cca2}&` +
                `lang=vi&` + // Ngôn ngữ tiếng Việt
                `maxRows=${CITIES_PER_PAGE}&` +
                `startRow=${startRow}&` +
                `cities=cities15000&` + // Lọc thành phố có dân số > 15000
                `orderby=population&` + // Sắp xếp theo dân số
                `username=${username}`,
                {
                    headers: {
                        'Accept': 'application/json',
                    }
                }
            )

            if (!response.ok) {
                const errorText = await response.text()
                console.error('GeoNames API Error:', errorText)
                
                if (response.status === 401) {
                    throw new Error('Vui lòng kích hoạt tài khoản web services của GeoNames')
                } else if (response.status === 403) {
                    throw new Error('Username GeoNames không hợp lệ hoặc đã hết giới hạn truy cập')
                } else {
                    throw new Error(`Lỗi API: ${response.status}`)
                }
            }

            const data: CityResponse = await response.json()
            
            if (data.status?.message) {
                throw new Error(data.status.message)
            }
            
            // Đánh dấu thành phố là thủ đô và chuyển đổi dữ liệu
            const cities = data.geonames.map(city => ({
                ...city,
                isCapital: city.fcode === 'PPLC', // PPLC = capital of a political entity
                elevation: undefined, // GeoNames không trả về độ cao trong endpoint này
                timezone: undefined // GeoNames không trả về timezone trong endpoint này
            }))

            setCities(cities)
            setTotalCities(data.totalResultsCount)
        } catch (err) {
            console.error('Error fetching cities:', err)
            if (err instanceof Error) {
                setCitiesError(err.message)
            } else {
                setCitiesError('Không thể tải dữ liệu thành phố. Vui lòng thử lại sau.')
            }
        } finally {
            setLoadingCities(false)
        }
    }

    const handleCountryClick = (country: Country) => {
        setSelectedCountry(country)
        setCurrentPage(1)
        fetchCities(country, 1)
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
        if (selectedCountry) {
            fetchCities(selectedCountry, newPage)
        }
    }

    return (
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">Thông tin các quốc gia</h1>

            {/* Search and Filter */}
            <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm quốc gia..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full rounded-lg border border-gray-200 pl-8 sm:pl-10 pr-4 py-2 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                </div>
                <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="rounded-lg border border-gray-200 px-4 py-2 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                    <option value="all">Tất cả khu vực</option>
                    {regions.map(region => (
                        <option key={region} value={region}>{region}</option>
                    ))}
                </select>
            </div>

            {/* Error Message */}
            {error && (
                <div className="text-red-500 text-center mb-4">
                    {error}
                </div>
            )}

            {/* Modal for City Details */}
            {selectedCountry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    Các thành phố - {selectedCountry.name.common}
                                </h2>
                                {!loadingCities && !citiesError && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Tổng số: {totalCities} thành phố
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedCountry(null)}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[calc(80vh-4rem)]">
                            {loadingCities ? (
                                <div className="flex justify-center items-center h-40">
                                    <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
                                </div>
                            ) : citiesError ? (
                                <div className="text-red-500 text-center">
                                    {citiesError}
                                </div>
                            ) : cities.length === 0 ? (
                                <div className="text-gray-500 text-center">
                                    Không có dữ liệu thành phố.
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4 mb-4">
                                        {cities.map((city) => (
                                            <div
                                                key={`${city.name}-${city.lat}-${city.lng}`}
                                                className="p-4 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />
                                                        <div>
                                                            <h3 className="font-medium flex items-center gap-2">
                                                                {city.name}
                                                                {city.isCapital && (
                                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                                                        Thủ đô
                                                                    </span>
                                                                )}
                                                            </h3>
                                                            {city.toponymName && (
                                                                <p className="text-sm text-gray-500">
                                                                    {city.toponymName}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatNumber(city.population)} dân
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-sm text-gray-500 space-y-1">
                                                    <div>Vĩ độ: {Number(city.lat).toFixed(4)}°</div>
                                                    <div>Kinh độ: {Number(city.lng).toFixed(4)}°</div>
                                                    {city.adminName1 && (
                                                        <div>Vùng: {city.adminName1}</div>
                                                    )}
                                                    <div>Loại: {city.fcodeName}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Pagination */}
                                    {totalCities > CITIES_PER_PAGE && (
                                        <div className="flex justify-center items-center space-x-2 mt-4 pt-4 border-t">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1 || loadingCities}
                                                className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                            >
                                                Trước
                                            </button>
                                            <span className="text-sm text-gray-600">
                                                Trang {currentPage} / {Math.ceil(totalCities / CITIES_PER_PAGE)}
                                            </span>
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage >= Math.ceil(totalCities / CITIES_PER_PAGE) || loadingCities}
                                                className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                            >
                                                Sau
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Countries Grid */}
            {loading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                    <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredCountries.map((country) => (
                        <div
                            key={country.name.common}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handleCountryClick(country)}
                        >
                            <div className="aspect-w-3 aspect-h-2">
                                <img
                                    src={country.flags.png}
                                    alt={country.flags.alt || `Flag of ${country.name.common}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-4">
                                <h2 className="text-lg font-semibold mb-2">{country.name.common}</h2>
                                <div className="space-y-2 text-sm">
                                    {country.capital && (
                                        <div className="flex items-center gap-2">
                                            <MapPinIcon className="h-4 w-4 text-gray-500" />
                                            <span>Thủ đô: {country.capital.join(', ')}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <GlobeAltIcon className="h-4 w-4 text-gray-500" />
                                        <span>Khu vực: {country.region}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UsersIcon className="h-4 w-4 text-gray-500" />
                                        <span>Dân số: {formatNumber(country.population)}</span>
                                    </div>
                                    {country.languages && (
                                        <div className="flex items-center gap-2">
                                            <LanguageIcon className="h-4 w-4 text-gray-500" />
                                            <span>Ngôn ngữ: {Object.values(country.languages).join(', ')}</span>
                                        </div>
                                    )}
                                    {country.idd.root && (
                                        <div className="flex items-center gap-2">
                                            <PhoneIcon className="h-4 w-4 text-gray-500" />
                                            <span>Mã vùng: {country.idd.root}{country.idd.suffixes?.[0]}</span>
                                        </div>
                                    )}
                                    {country.currencies && (
                                        <div className="flex items-center gap-2">
                                            <CurrencyDollarIcon className="h-4 w-4 text-gray-500" />
                                            <span>Tiền tệ: {
                                                Object.values(country.currencies)
                                                    .map(currency => `${currency.name} (${currency.symbol})`)
                                                    .join(', ')
                                            }</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-blue-600 hover:text-blue-800">
                                <span>Xem các thành phố lớn</span>
                                <ChevronRightIcon className="h-4 w-4" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results Message */}
            {!loading && filteredCountries.length === 0 && (
                <div className="text-center text-gray-500 mt-8">
                    Không tìm thấy quốc gia nào phù hợp với tìm kiếm của bạn.
                </div>
            )}
        </div>
    )
} 