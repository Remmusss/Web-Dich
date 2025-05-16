'use client'

import { useState, useEffect } from 'react'
import { ClockIcon, ArrowsRightLeftIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline'

interface City {
    name: string
    timezone: string
    country: string
    code: string
}

const popularCities: City[] = [
    { name: 'Hà Nội', timezone: 'Asia/Ho_Chi_Minh', country: 'Việt Nam', code: 'VN' },
    { name: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Nhật Bản', code: 'JP' },
    { name: 'Seoul', timezone: 'Asia/Seoul', country: 'Hàn Quốc', code: 'KR' },
    { name: 'Bắc Kinh', timezone: 'Asia/Shanghai', country: 'Trung Quốc', code: 'CN' },
    { name: 'Singapore', timezone: 'Asia/Singapore', country: 'Singapore', code: 'SG' },
    { name: 'New York', timezone: 'America/New_York', country: 'Mỹ', code: 'US' },
    { name: 'London', timezone: 'Europe/London', country: 'Anh', code: 'GB' },
    { name: 'Paris', timezone: 'Europe/Paris', country: 'Pháp', code: 'FR' },
    { name: 'Berlin', timezone: 'Europe/Berlin', country: 'Đức', code: 'DE' },
    { name: 'Sydney', timezone: 'Australia/Sydney', country: 'Úc', code: 'AU' }
]

export default function TimeZoneConverter() {
    const [selectedCity, setSelectedCity] = useState<City>(popularCities[0])
    const [currentTime, setCurrentTime] = useState<Date>(new Date())
    const [isDaytime, setIsDaytime] = useState(true)

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date()
            setCurrentTime(now)
            
            // Kiểm tra xem có phải ban ngày không (6h - 18h)
            const hour = now.getHours()
            setIsDaytime(hour >= 6 && hour < 18)
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    const formatTime = (date: Date, timezone: string) => {
        return date.toLocaleTimeString('vi-VN', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        })
    }

    const formatDate = (date: Date, timezone: string) => {
        return date.toLocaleDateString('vi-VN', {
            timeZone: timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const getGMTOffset = (timezone: string) => {
        const date = new Date()
        const options: Intl.DateTimeFormatOptions = {
            timeZone: timezone,
            timeZoneName: 'shortOffset'
        }
        const formatter = new Intl.DateTimeFormat('en-US', options)
        const parts = formatter.formatToParts(date)
        const offset = parts.find(part => part.type === 'timeZoneName')?.value || ''
        return offset.replace('GMT', 'GMT ')
    }

    const getGMTTime = () => {
        return currentTime.toLocaleTimeString('vi-VN', {
            timeZone: 'UTC',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        })
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-6">
                    <ArrowsRightLeftIcon className="h-6 w-6" />
                    <h2 className="text-2xl font-bold">Chuyển đổi múi giờ</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Chọn thành phố
                            </label>
                            <select
                                value={selectedCity.name}
                                onChange={(e) => {
                                    const city = popularCities.find(c => c.name === e.target.value)
                                    if (city) setSelectedCity(city)
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                            >
                                {popularCities.map((city) => (
                                    <option key={city.name} value={city.name}>
                                        {city.name}, {city.country} ({getGMTOffset(city.timezone)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-md">
                            <div className="flex items-center gap-2 mb-2">
                                <ClockIcon className="h-6 w-6 text-gray-700" />
                                <span className="font-medium">Thời gian hiện tại</span>
                            </div>
                            <div className="text-3xl font-bold mb-1">
                                {formatTime(currentTime, selectedCity.timezone)}
                            </div>
                            <div className="text-sm text-gray-600">
                                {formatDate(currentTime, selectedCity.timezone)}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                {getGMTOffset(selectedCity.timezone)}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-md">
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowsRightLeftIcon className="h-5 w-5" />
                                <span className="font-medium">Giờ GMT</span>
                            </div>
                            <div className="text-2xl font-bold mb-1">
                                {getGMTTime()}
                            </div>
                            <div className="text-sm text-gray-500">
                                Giờ chuẩn Greenwich (GMT/UTC)
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-md">
                            <div className="flex items-center gap-2 mb-2">
                                {isDaytime ? (
                                    <SunIcon className="w-5 h-5 text-gray-600" />
                                ) : (
                                    <MoonIcon className="w-5 h-5 text-gray-600" />
                                )}
                                <span className="font-medium">
                                    {isDaytime ? 'Ban ngày' : 'Ban đêm'}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                {isDaytime ? 'Mặt trời đang chiếu sáng' : 'Mặt trời đã lặn'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-2">Thời gian các thành phố</h3>
                        <div className="space-y-2">
                            {popularCities.map((city) => (
                                <div
                                    key={city.name}
                                    className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium">{city.name}</div>
                                            <div className="text-sm text-gray-600">
                                                {city.country} ({getGMTOffset(city.timezone)})
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">
                                                {formatTime(currentTime, city.timezone)}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {formatDate(currentTime, city.timezone)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 