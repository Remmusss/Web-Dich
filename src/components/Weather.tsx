'use client'

import { useEffect, useState, useRef } from 'react'
import { CloudIcon, BeakerIcon, ArrowDownIcon, MapPinIcon, MagnifyingGlassIcon, CloudIcon as CloudIconSolid, CloudArrowDownIcon, SunIcon, ArrowsRightLeftIcon, ArrowLeftIcon, ArrowRightIcon, ClockIcon } from '@heroicons/react/24/outline'

interface WeatherData {
    current: {
        time: string
        temperature: number
        relativeHumidity: number
        apparentTemperature: number
        precipitation: number
        weatherCode: number
        windSpeed: number
        windDirection: number
        isDay: number
        uvIndex: number
        visibility: number
        cloudCover: number
        dewPoint: number
    }
    daily: {
        time: string[]
        weatherCode: number[]
        temperatureMax: number[]
        temperatureMin: number[]
        sunrise: string[]
        sunset: string[]
        precipitationProbabilityMax: number[]
        windSpeedMax: number[]
        uvIndexMax: number[]
        rainSum: number[]
        snowfallSum: number[]
        precipitationHours: number[]
        windGusts: number[]
    }
    hourly: {
        time: string[]
        temperature: number[]
        precipitation: number[]
        weatherCode: number[]
        cloudCover: number[]
        windSpeed: number[]
        relativeHumidity: number[]
    }
    location: string
}

// WMO Weather interpretation codes
const weatherCodes: { [key: number]: { icon: string, description: string } } = {
    0: { icon: '☀️', description: 'Trời quang đãng' },
    1: { icon: '🌤️', description: 'Chủ yếu quang đãng' },
    2: { icon: '⛅', description: 'Có mây rải rác' },
    3: { icon: '☁️', description: 'Nhiều mây' },
    45: { icon: '🌫️', description: 'Có sương mù' },
    48: { icon: '🌫️', description: 'Có sương mù giá' },
    51: { icon: '🌧️', description: 'Mưa phùn nhẹ' },
    53: { icon: '🌧️', description: 'Mưa phùn vừa' },
    55: { icon: '🌧️', description: 'Mưa phùn mạnh' },
    61: { icon: '🌧️', description: 'Mưa nhỏ' },
    63: { icon: '🌧️', description: 'Mưa vừa' },
    65: { icon: '🌧️', description: 'Mưa to' },
    66: { icon: '🌧️', description: 'Mưa băng giá nhẹ' },
    67: { icon: '🌧️', description: 'Mưa băng giá mạnh' },
    71: { icon: '🌨️', description: 'Tuyết rơi nhẹ' },
    73: { icon: '🌨️', description: 'Tuyết rơi vừa' },
    75: { icon: '🌨️', description: 'Tuyết rơi mạnh' },
    77: { icon: '🌨️', description: 'Hạt tuyết' },
    80: { icon: '🌦️', description: 'Mưa rào nhẹ' },
    81: { icon: '🌦️', description: 'Mưa rào vừa' },
    82: { icon: '🌦️', description: 'Mưa rào mạnh' },
    85: { icon: '🌨️', description: 'Mưa tuyết nhẹ' },
    86: { icon: '🌨️', description: 'Mưa tuyết mạnh' },
    95: { icon: '⛈️', description: 'Giông bão' },
    96: { icon: '⛈️', description: 'Giông bão và mưa đá nhẹ' },
    99: { icon: '⛈️', description: 'Giông bão và mưa đá mạnh' }
};

interface SavedLocation {
    name: string
    latitude: number
    longitude: number
    timestamp: number
}

export default function Weather() {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [gettingLocation, setGettingLocation] = useState(false)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const hourlyContainerRef = useRef<HTMLDivElement>(null)
    const currentHourRef = useRef<HTMLDivElement>(null)
    const [refreshing, setRefreshing] = useState(false)
    const pageRef = useRef<HTMLDivElement>(null)
    const swipeStartY = useRef<number | null>(null)
    const pullDistance = useRef<number>(0)
    const isPulling = useRef<boolean>(false)

    const DEFAULT_CITY = 'Hà Nội'
    const DEFAULT_COORDS = { latitude: 21.0285, longitude: 105.8542 }
    const STORAGE_KEY = 'lastWeatherLocation'
    const LOCATION_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

    const saveLocationToStorage = (name: string, latitude: number, longitude: number) => {
        const locationData: SavedLocation = {
            name,
            latitude,
            longitude,
            timestamp: Date.now()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(locationData))
    }

    const getStoredLocation = (): SavedLocation | null => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (!stored) return null

            const locationData: SavedLocation = JSON.parse(stored)
            const isExpired = Date.now() - locationData.timestamp > LOCATION_EXPIRY

            if (isExpired) {
                localStorage.removeItem(STORAGE_KEY)
                return null
            }

            return locationData
        } catch (err) {
            console.error('Error reading from localStorage:', err)
            return null
        }
    }

    const fetchWeatherData = async (lat: number, lon: number) => {
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weathercode,` +
                `windspeed_10m,winddirection_10m,is_day,uv_index,visibility,cloud_cover,dew_point_2m` +
                `&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,` +
                `windspeed_10m_max,uv_index_max,rain_sum,snowfall_sum,precipitation_hours,wind_gusts_10m_max` +
                `&hourly=temperature_2m,precipitation,weathercode,cloud_cover,windspeed_10m,relative_humidity_2m` +
                `&timezone=auto&forecast_days=7`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }

            const data = await response.json();
            
            setWeatherData({
                current: {
                    time: data.current.time,
                    temperature: data.current.temperature_2m,
                    relativeHumidity: data.current.relative_humidity_2m,
                    apparentTemperature: data.current.apparent_temperature,
                    precipitation: data.current.precipitation,
                    weatherCode: data.current.weathercode,
                    windSpeed: data.current.windspeed_10m,
                    windDirection: data.current.winddirection_10m,
                    isDay: data.current.is_day,
                    uvIndex: data.current.uv_index,
                    visibility: data.current.visibility,
                    cloudCover: data.current.cloud_cover,
                    dewPoint: data.current.dew_point_2m
                },
                daily: {
                    time: data.daily.time,
                    weatherCode: data.daily.weathercode,
                    temperatureMax: data.daily.temperature_2m_max,
                    temperatureMin: data.daily.temperature_2m_min,
                    sunrise: data.daily.sunrise,
                    sunset: data.daily.sunset,
                    precipitationProbabilityMax: data.daily.precipitation_probability_max,
                    windSpeedMax: data.daily.windspeed_10m_max,
                    uvIndexMax: data.daily.uv_index_max,
                    rainSum: data.daily.rain_sum,
                    snowfallSum: data.daily.snowfall_sum,
                    precipitationHours: data.daily.precipitation_hours,
                    windGusts: data.daily.wind_gusts_10m_max
                },
                hourly: {
                    time: data.hourly.time,
                    temperature: data.hourly.temperature_2m,
                    precipitation: data.hourly.precipitation,
                    weatherCode: data.hourly.weathercode,
                    cloudCover: data.hourly.cloud_cover,
                    windSpeed: data.hourly.windspeed_10m,
                    relativeHumidity: data.hourly.relative_humidity_2m
                },
                location: searchQuery
            });
            setError(null);

            if (searchQuery) {
                saveLocationToStorage(searchQuery, lat, lon)
            }
        } catch (err) {
            console.error('Error fetching weather data:', err);
            setError('Không thể lấy dữ liệu thời tiết. Vui lòng thử lại sau.');
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        
        setLoading(true);
        try {
            const geocodeResponse = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=vi`
            );
            const geocodeData = await geocodeResponse.json();

            if (geocodeData.results?.[0]) {
                const { latitude, longitude, name } = geocodeData.results[0];
                setSearchQuery(name); // Update with official name
                await fetchWeatherData(latitude, longitude);
            } else {
                setError('Không tìm thấy địa điểm. Vui lòng thử lại với tên khác.');
            }
        } catch (err) {
            console.error('Error during search:', err);
            setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    }

    const searchDefaultCity = async () => {
        setSearchQuery(DEFAULT_CITY);
        await fetchWeatherData(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude);
    }

    const getCurrentLocation = () => {
        setGettingLocation(true)
        setError(null)

        if (!navigator.geolocation) {
            setError('Trình duyệt của bạn không hỗ trợ định vị. Đang hiển thị thời tiết tại Hà Nội.')
            setGettingLocation(false)
            searchDefaultCity()
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords
                    
                    // Reverse geocoding to get location name
                    const geocodeResponse = await fetch(
                        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=vi`
                    )
                    const geocodeData = await geocodeResponse.json()
                    
                    if (geocodeData.results?.[0]) {
                        setSearchQuery(geocodeData.results[0].name)
                        await fetchWeatherData(latitude, longitude)
                    } else {
                        setError('Không thể xác định tên địa điểm. Đang hiển thị thời tiết tại Hà Nội.')
                        searchDefaultCity()
                    }
                } catch (err) {
                    console.error('Error getting location:', err)
                    setError('Có lỗi xảy ra khi lấy thông tin vị trí. Đang hiển thị thời tiết tại Hà Nội.')
                    searchDefaultCity()
                } finally {
                    setGettingLocation(false)
                }
            },
            (err) => {
                console.error('Geolocation error:', err)
                setError('Không thể lấy vị trí của bạn. Đang hiển thị thời tiết tại Hà Nội.')
                setGettingLocation(false)
                searchDefaultCity()
            },
            { timeout: 5000 }
        )
    }

    // Try to load last location first, then try geolocation
    useEffect(() => {
        const storedLocation = getStoredLocation()
        
        if (storedLocation) {
            setSearchQuery(storedLocation.name)
            fetchWeatherData(storedLocation.latitude, storedLocation.longitude)
        } else {
            getCurrentLocation()
        }
    }, [])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Hàm để kiểm tra xem một ngày có phải là ngày được chọn không
    const isSelectedDay = (date: string) => {
        if (!selectedDate) return false;
        return new Date(date).toDateString() === new Date(selectedDate).toDateString();
    }

    // Hàm để lấy các giờ trong ngày được chọn
    const getHourlyDataForDay = (date: string) => {
        if (!weatherData?.hourly) return [];
        
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        return weatherData.hourly.time.reduce((acc: number[], time, index) => {
            const currentTime = new Date(time);
            if (currentTime >= startOfDay && currentTime <= endOfDay) {
                acc.push(index);
            }
            return acc;
        }, []);
    }

    const isCurrentHour = (timeString: string) => {
        const now = new Date()
        const time = new Date(timeString)
        return now.getHours() === time.getHours() && 
               now.getDate() === time.getDate() &&
               now.getMonth() === time.getMonth() &&
               now.getFullYear() === time.getFullYear()
    }

    const getCurrentHourIndex = () => {
        if (!weatherData?.hourly) return -1;
        return weatherData.hourly.time.findIndex(time => isCurrentHour(time));
    }

    const scrollToCurrentHour = () => {
        if (!hourlyContainerRef.current || !currentHourRef.current) return;

        const container = hourlyContainerRef.current;
        const currentHourElement = currentHourRef.current;

        // Tính toán vị trí để giờ hiện tại nằm giữa container
        const scrollPosition = currentHourElement.offsetLeft - 
            (container.clientWidth / 2) + 
            (currentHourElement.clientWidth / 2);

        container.scrollTo({
            left: Math.max(0, scrollPosition),
            behavior: 'smooth'
        });
    };

    // Tự động cuộn đến giờ hiện tại khi dữ liệu được tải
    useEffect(() => {
        if (weatherData && !selectedDate) {
            scrollToCurrentHour();
        }
    }, [weatherData, selectedDate]);

    const refreshWeather = async () => {
        setRefreshing(true)
        try {
            const storedLocation = getStoredLocation()
            
            if (storedLocation) {
                await fetchWeatherData(storedLocation.latitude, storedLocation.longitude)
            } else {
                await getCurrentLocation()
            }
        } finally {
            setRefreshing(false)
        }
    }

    // Handle horizontal touch scrolling manually for improved mobile experience
    useEffect(() => {
        const container = hourlyContainerRef.current
        if (!container) return
        
        let startX: number
        let scrollLeft: number
        
        const onTouchStart = (e: TouchEvent) => {
            startX = e.touches[0].pageX - container.offsetLeft
            scrollLeft = container.scrollLeft
        }
        
        const onTouchMove = (e: TouchEvent) => {
            if (!startX) return
            const x = e.touches[0].pageX - container.offsetLeft
            const walk = (x - startX) * 1.5 // Scroll speed multiplier
            container.scrollLeft = scrollLeft - walk
        }
        
        container.addEventListener('touchstart', onTouchStart)
        container.addEventListener('touchmove', onTouchMove)
        
        return () => {
            container.removeEventListener('touchstart', onTouchStart)
            container.removeEventListener('touchmove', onTouchMove)
        }
    }, [weatherData])

    // Implement a simple pull-to-refresh
    useEffect(() => {
        const page = pageRef.current
        if (!page) return
        
        const onTouchStart = (e: TouchEvent) => {
            // Only enable pull-to-refresh at the top of the page
            if (window.scrollY <= 10) {
                swipeStartY.current = e.touches[0].clientY
                isPulling.current = true
                pullDistance.current = 0
            }
        }
        
        const onTouchMove = (e: TouchEvent) => {
            if (!isPulling.current || swipeStartY.current === null) return
            
            const currentY = e.touches[0].clientY
            const diff = currentY - swipeStartY.current
            
            // Only handle pull-down gesture
            if (diff > 0 && window.scrollY <= 0) {
                pullDistance.current = Math.min(80, diff) // Limit max pull distance
                
                // Visual feedback for pull - add a loading indicator
                if (pullDistance.current > 60 && !refreshing) {
                    // Show visual cue that release will refresh
                    document.body.style.setProperty('--pull-indicator-opacity', '1')
                } else {
                    document.body.style.setProperty('--pull-indicator-opacity', '0.5')
                }
                
                document.body.style.setProperty('--pull-distance', `${pullDistance.current}px`)
            }
        }
        
        const onTouchEnd = () => {
            if (isPulling.current && pullDistance.current > 60 && !refreshing) {
                refreshWeather()
            }
            
            isPulling.current = false
            swipeStartY.current = null
            pullDistance.current = 0
            document.body.style.setProperty('--pull-distance', '0px')
            document.body.style.setProperty('--pull-indicator-opacity', '0')
        }
        
        page.addEventListener('touchstart', onTouchStart)
        page.addEventListener('touchmove', onTouchMove)
        page.addEventListener('touchend', onTouchEnd)
        
        return () => {
            page.removeEventListener('touchstart', onTouchStart)
            page.removeEventListener('touchmove', onTouchMove)
            page.removeEventListener('touchend', onTouchEnd)
        }
    }, [refreshing])

    return (
        <div ref={pageRef} className="mx-auto px-2 sm:px-4 py-6 sm:py-8 max-w-7xl bg-slate-50 min-h-screen">
            {/* Search Bar - Tối ưu cho mobile & desktop */}
            <div className="mb-4 sm:mb-6 px-2 w-full max-w-3xl mx-auto">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Nhập tên thành phố..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="block w-full rounded-lg border border-slate-300 bg-white pl-10 sm:pl-12 pr-28 sm:pr-32 py-2.5 sm:py-3 text-sm sm:text-base text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm"
                    />
                    <div className="absolute inset-y-0 right-0 flex">
                        <button
                            onClick={getCurrentLocation}
                            disabled={gettingLocation}
                            className="px-3 sm:px-4 flex items-center text-slate-500 hover:text-sky-600 border-l border-slate-300 transition-colors"
                            title="Lấy vị trí hiện tại"
                        >
                            {gettingLocation ? (
                                <ArrowsRightLeftIcon className="h-5 w-5 animate-spin" />
                            ) : (
                                <MapPinIcon className="h-5 w-5" />
                            )}
                        </button>
                        <button
                            onClick={handleSearch}
                            disabled={loading || gettingLocation}
                            className="px-3 sm:px-4 flex items-center bg-sky-600 text-white text-sm sm:text-base font-medium rounded-r-lg hover:bg-sky-700 disabled:bg-slate-400 transition-colors"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Tìm...
                                </div>
                            ) : 'Tìm kiếm'}
                        </button>
                    </div>
                </div>
                {error && (
                    <div className="mt-2.5 p-3 bg-red-50 border border-red-300 rounded-lg shadow-sm">
                        <p className="text-red-700 text-sm text-center">{error}</p>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {(loading || gettingLocation) && !weatherData && (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <svg className="animate-spin h-8 w-8 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-slate-500">{gettingLocation ? 'Đang lấy vị trí...' : 'Đang tải dữ liệu thời tiết...'}</p>
                </div>
            )}

            {weatherData && (
                <div className="px-2 w-full max-w-3xl mx-auto">
                    {/* Current Weather Card */}
                    <div className="mb-4 sm:mb-6 bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-5 gap-2 sm:gap-0">
                            <div className="flex items-center">
                                <MapPinIcon className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500 mr-2 flex-shrink-0" />
                                <h2 className="text-lg sm:text-xl font-semibold text-slate-800 truncate max-w-[calc(100vw-150px)] sm:max-w-md">{weatherData.location}</h2>
                            </div>
                            <div className="flex items-center space-x-3 sm:space-x-4 text-sm text-slate-600">
                                <div className="flex items-center">
                                    <SunIcon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400 mr-1.5" />
                                    <span>{formatTime(weatherData.daily.sunrise[0])}</span>
                                </div>
                                <div className="flex items-center">
                                    <SunIcon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400 mr-1.5" />
                                    <span>{formatTime(weatherData.daily.sunset[0])}</span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile view */}
                        <div className="sm:hidden w-full">
                            <div className="flex items-center p-3 bg-slate-50 rounded-lg mb-2.5 w-full border border-slate-200">
                                <div className="flex-shrink-0 mr-3 text-4xl">
                                    {weatherCodes[weatherData.current.weatherCode]?.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xl font-semibold text-slate-800">
                                        {weatherData.current.temperature.toFixed(1)}°C
                                    </p>
                                    <p className="text-xs text-slate-500 capitalize">
                                        {weatherCodes[weatherData.current.weatherCode]?.description}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Cảm giác: {weatherData.current.apparentTemperature.toFixed(1)}°C
                                    </p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2.5 w-full">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-sky-600 mr-2 flex-shrink-0">
                                          <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.562l2.14-2.139a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 111.06-1.06l2.14 2.139V3.75A.75.75 0 0110 3zM3.75 15a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="text-xs text-slate-500">Gió</p>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {weatherData.current.windSpeed.toFixed(1)} km/h
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-sky-500 mr-2 flex-shrink-0">
                                          <path d="M10 3.75a.75.75 0 01.75.75v3.444A3.733 3.733 0 0112.53 7c.174 0 .345.018.512.052A3.755 3.755 0 0116.25 8.5c0 .099.012.197.022.293V10.5a2.5 2.5 0 002.04 2.438A5.25 5.25 0 0113 17.5a5.223 5.223 0 01-4.25-2.315A5.25 5.25 0 013 12.938V10.5A2.5 2.5 0 005.04 8.062 5.188 5.188 0 013.75 7a3.75 3.75 0 013.75-3.75h1.062A3.733 3.733 0 0110 3.75zM5.423 13.699a3.734 3.734 0 001.487 1.012 3.734 3.734 0 004.179 0 3.733 3.733 0 001.487-1.012A3.75 3.75 0 0010 11.25a3.75 3.75 0 00-4.577 2.449z" />
                                        </svg>
                                        <div>
                                            <p className="text-xs text-slate-500">Độ ẩm</p>
                                            <p className="text-sm font-semibold text-slate-700">
                                                {weatherData.current.relativeHumidity}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop view */}
                        <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                            <div className="md:col-span-1 flex items-center p-3.5 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex-shrink-0 mr-3 sm:mr-4 text-4xl sm:text-5xl">
                                    {weatherCodes[weatherData.current.weatherCode]?.icon}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xl sm:text-2xl font-semibold text-slate-800">
                                        {weatherData.current.temperature.toFixed(1)}°C
                                    </p>
                                    <p className="text-xs sm:text-sm text-slate-500 capitalize">
                                        {weatherCodes[weatherData.current.weatherCode]?.description}
                                    </p>
                                    <p className="text-xs sm:text-sm text-slate-500">
                                        Cảm giác: {weatherData.current.apparentTemperature.toFixed(1)}°C
                                    </p>
                                </div>
                            </div>

                            <div className="p-3.5 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 sm:h-6 sm:w-6 text-sky-600 mr-2.5 mt-0.5 flex-shrink-0">
                                      <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.562l2.14-2.139a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 111.06-1.06l2.14 2.139V3.75A.75.75 0 0110 3zM3.75 15a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-xs sm:text-sm text-slate-500">Gió</p>
                                        <p className="text-sm sm:text-base font-semibold text-slate-700">
                                            {weatherData.current.windSpeed.toFixed(1)} km/h
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Hướng: {weatherData.current.windDirection}°
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3.5 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 sm:h-6 sm:w-6 text-sky-500 mr-2.5 mt-0.5 flex-shrink-0">
                                      <path d="M10 3.75a.75.75 0 01.75.75v3.444A3.733 3.733 0 0112.53 7c.174 0 .345.018.512.052A3.755 3.755 0 0116.25 8.5c0 .099.012.197.022.293V10.5a2.5 2.5 0 002.04 2.438A5.25 5.25 0 0113 17.5a5.223 5.223 0 01-4.25-2.315A5.25 5.25 0 013 12.938V10.5A2.5 2.5 0 005.04 8.062 5.188 5.188 0 013.75 7a3.75 3.75 0 013.75-3.75h1.062A3.733 3.733 0 0110 3.75zM5.423 13.699a3.734 3.734 0 001.487 1.012 3.734 3.734 0 004.179 0 3.733 3.733 0 001.487-1.012A3.75 3.75 0 0010 11.25a3.75 3.75 0 00-4.577 2.449z" />
                                    </svg>
                                    <div>
                                        <p className="text-xs sm:text-sm text-slate-500">Độ ẩm</p>
                                        <p className="text-sm sm:text-base font-semibold text-slate-700">
                                            {weatherData.current.relativeHumidity}%
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Điểm sương: {weatherData.current.dewPoint.toFixed(1)}°C
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hourly Forecast */}
                    <div className="mb-4 sm:mb-6 bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                            <h3 className="text-base sm:text-lg font-semibold text-slate-800">
                                {selectedDate 
                                    ? `Dự báo theo giờ - ${formatDate(selectedDate)}`
                                    : 'Dự báo 24 giờ tới'}
                            </h3>
                            <div className="flex items-center gap-2">
                                {!selectedDate && getCurrentHourIndex() !== -1 && (
                                    <button
                                        onClick={scrollToCurrentHour}
                                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-sky-100 text-sky-700 rounded-full hover:bg-sky-200 transition-colors"
                                        title="Cuộn đến giờ hiện tại"
                                    >
                                        <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        Hiện tại
                                    </button>
                                )}
                                {selectedDate && (
                                    <button
                                        onClick={() => setSelectedDate(null)}
                                        className="text-xs sm:text-sm text-sky-600 hover:text-sky-800 font-medium"
                                    >
                                        Xem 24 giờ tới
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="relative">
                            <div 
                                ref={hourlyContainerRef}
                                className="overflow-x-auto scroll-smooth hide-scrollbar py-2.5 w-full"
                                style={{ WebkitOverflowScrolling: 'touch' }}
                            >
                                <div className="flex space-x-2.5 sm:space-x-3 min-w-max">
                                    {(selectedDate 
                                        ? getHourlyDataForDay(selectedDate)
                                        : Array.from({ length: Math.min(24, weatherData.hourly.time.length - getCurrentHourIndex()) }, (_, i) => getCurrentHourIndex() + i).filter(idx => idx >=0 && idx < weatherData.hourly.time.length) // Ensure index is valid
                                    ).map((hourlyIndex) => {
                                        const timeString = weatherData.hourly.time[hourlyIndex];
                                        const isCurrent = !selectedDate && isCurrentHour(timeString);
                                        
                                        return (
                                            <div 
                                                key={timeString} 
                                                ref={isCurrent ? currentHourRef : null}
                                                className={`flex-none w-[70px] sm:w-24 p-2.5 sm:p-3 rounded-lg transition-all duration-150 ease-in-out border ${
                                                    isCurrent 
                                                        ? 'bg-sky-50 border-sky-400 shadow-md' 
                                                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 active:bg-slate-200'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <p className={`text-xs sm:text-sm font-medium ${isCurrent ? 'text-sky-700' : 'text-slate-700'}`}>
                                                        {new Date(timeString).toLocaleTimeString('vi-VN', { 
                                                            hour: '2-digit', 
                                                            minute: 'numeric'
                                                        })}
                                                    </p>
                                                    {isCurrent && (
                                                        <span className="text-[9px] sm:text-xs font-semibold text-sky-700 bg-sky-200 px-1.5 py-0.5 rounded-full">
                                                            Nay
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="my-1.5 sm:my-2 text-2xl sm:text-3xl text-center">
                                                    {weatherCodes[weatherData.hourly.weatherCode[hourlyIndex]]?.icon}
                                                </div>
                                                <p className={`text-sm sm:text-base font-semibold text-center ${isCurrent ? 'text-sky-800' : 'text-slate-800'}`}>
                                                    {weatherData.hourly.temperature[hourlyIndex].toFixed(0)}°C
                                                </p>
                                                <div className="mt-1.5 space-y-0.5 text-center">
                                                    <p className="text-[10px] sm:text-xs text-slate-500">
                                                        <CloudArrowDownIcon className="inline-block h-3 w-3 mr-0.5 relative -top-px text-sky-600" />
                                                        {weatherData.hourly.precipitation[hourlyIndex].toFixed(1)}mm
                                                    </p>
                                                    <p className="text-[10px] sm:text-xs text-slate-500">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="inline-block h-3 w-3 mr-0.5 relative -top-px text-slate-400">
                                                          <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.562l2.14-2.139a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 111.06-1.06l2.14 2.139V3.75A.75.75 0 0110 3zM3.75 15a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                                                        </svg>
                                                        {weatherData.hourly.windSpeed[hourlyIndex].toFixed(0)}km/h
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {/* Scroll Indicator for Mobile - more subtle */}
                            <div className="mt-3 sm:hidden flex justify-center items-center h-2">
                                <div className="w-10 h-1 bg-slate-300 rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* 7-Day Forecast */}
                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full">
                        <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Dự báo 7 ngày tới</h3>
                        
                        {/* Mobile Layout */}
                        <div className="sm:hidden w-full space-y-2.5">
                            {weatherData.daily.time.map((time, index) => (
                                <div 
                                    key={time} 
                                    className={`p-3 bg-slate-50 rounded-lg cursor-pointer transition-all duration-150 ease-in-out border ${
                                        isSelectedDay(time) ? 'border-sky-400 ring-1 ring-sky-400 shadow-md' : 'border-slate-200 hover:bg-slate-100 active:bg-slate-200'
                                    } touch-manipulation w-full`}
                                    onClick={() => setSelectedDate(time)}
                                >
                                    <div className="flex items-center w-full">
                                        <div className="text-2xl mr-3 flex-shrink-0 w-8 text-center">{weatherCodes[weatherData.daily.weatherCode[index]]?.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 truncate">{formatDate(time).split(', ')[0]}</p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {weatherCodes[weatherData.daily.weatherCode[index]]?.description}
                                            </p>
                                        </div>
                                        <div className="text-right ml-2 flex-shrink-0">
                                            <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                                                {weatherData.daily.temperatureMax[index].toFixed(0)}° / {weatherData.daily.temperatureMin[index].toFixed(0)}°
                                            </p>
                                            <p className="text-xs text-slate-500 whitespace-nowrap">
                                                <CloudArrowDownIcon className="inline-block h-3 w-3 mr-0.5 relative -top-px text-sky-600" />
                                                {weatherData.daily.precipitationProbabilityMax[index]}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Desktop Layout */}
                        <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
                            {weatherData.daily.time.map((time, index) => (
                                <div 
                                    key={time} 
                                    className={`p-3 bg-slate-50 rounded-lg cursor-pointer transition-all duration-150 ease-in-out flex flex-col text-center items-center border ${
                                        isSelectedDay(time) ? 'border-sky-400 ring-1 ring-sky-400 shadow-md' : 'border-slate-200 hover:bg-slate-100 active:bg-slate-200'
                                    } touch-manipulation`}
                                    onClick={() => setSelectedDate(time)}
                                >
                                    <p className="text-xs font-semibold text-slate-700 w-full truncate">{formatDate(time).split(', ')[0]}</p>
                                    <p className="text-[10px] text-slate-500 mb-1 w-full truncate">{formatDate(time).split(', ')[1]}</p>
                                    <div className="my-1.5 text-3xl">
                                        {weatherCodes[weatherData.daily.weatherCode[index]]?.icon}
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {weatherData.daily.temperatureMax[index].toFixed(0)}°<span className="text-slate-500">/{weatherData.daily.temperatureMin[index].toFixed(0)}°</span>
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5 w-full truncate" title={weatherCodes[weatherData.daily.weatherCode[index]]?.description}>
                                        {weatherCodes[weatherData.daily.weatherCode[index]]?.description}
                                    </p>
                                    <div className="mt-2 pt-2 border-t border-slate-200 space-y-1 text-left w-full opacity-90">
                                        <p className="text-[10px] text-slate-600 flex items-center">
                                            <SunIcon className="w-3 h-3 mr-1 text-yellow-500 flex-shrink-0" />
                                            UV: {weatherData.daily.uvIndexMax[index].toFixed(0)}
                                        </p>
                                        <p className="text-[10px] text-slate-600 flex items-center">
                                            <CloudArrowDownIcon className="w-3 h-3 mr-1 text-sky-600 flex-shrink-0" />
                                            {weatherData.daily.rainSum[index].toFixed(1)}mm ({weatherData.daily.precipitationHours[index]}h)
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Add a safe area for mobile devices and overall page bottom padding */}
            <div className="h-12 sm:h-16"></div>
        </div>
    )
}

// Thêm style cho scrollbar và mobile optimizations
const styles = `
@media (max-width: 639px) { /* Adjusted breakpoint to sm: 640px */
    .hide-scrollbar {
        scrollbar-width: none;
        -ms-overflow-style: none;
    }
    .hide-scrollbar::-webkit-scrollbar {
        display: none;
    }
    
    body {
        -webkit-tap-highlight-color: transparent;
        overscroll-behavior-y: contain;
        background-color: #f8fafc; /* Softer default bg for body if needed - matches slate-50 */
    }
    
    input, button, a {
        -webkit-tap-highlight-color: transparent;
    }
    
    /* Fix cho mobile width */
    /* * {
        box-sizing: border-box; // This can sometimes cause issues if not carefully managed
    } */
    
    body, html {
        width: 100%;
        max-width: 100vw;
        overflow-x: hidden;
    }
    
    /* Ensure divs don't overflow their containers, especially on mobile */
    div:not(.pull-to-refresh-indicator):not(.pull-to-refresh-spinner) { /* Avoid affecting fixed elements */
        max-width: 100%;
      /* width: auto; // This was causing issues with some layouts, let tailwind handle width */
    }
}

@media (min-width: 640px) { /* Adjusted breakpoint to sm: 640px */
    .hide-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent; /* slate-300 */
    }
    .hide-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    .hide-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .hide-scrollbar::-webkit-scrollbar-thumb {
        background-color: #cbd5e1; /* slate-300 */
        border-radius: 3px;
    }
    .hide-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #94a3b8; /* slate-400 */
    }
}

/* Pull to refresh styling */
.pull-to-refresh-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(0,0,0,0.1); /* Slightly thicker border */
    border-top-color: #0ea5e9; /* sky-500 */
    border-radius: 50%;
    margin-right: 10px; /* More spacing */
    animation: spinner 0.7s linear infinite;
}

.pull-to-refresh-indicator span {
    font-size: 14px;
    color: #334155; /* slate-700 */
    font-weight: 500;
}

@keyframes spinner {
    to {transform: rotate(360deg);}
}

/* Fix for iOS Safari bottom bar */
@supports (-webkit-touch-callout: none) {
    body {
        /* Padding for iPhone X notch and bottom bar */
        padding-top: env(safe-area-inset-top, 0px); 
        padding-bottom: env(safe-area-inset-bottom, 20px);
    }
}
`;

// Thêm style vào head
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
} 