'use client'

import { useState } from 'react'
import { RectangleGroupIcon, ScaleIcon, BeakerIcon, CloudIcon, ChartBarIcon } from '@heroicons/react/24/outline'

interface Unit {
    name: string
    symbol: string
    toBase: (value: number) => number
    fromBase: (value: number) => number
}

interface Category {
    name: string
    icon: React.ReactNode
    units: Unit[]
}

const categories: Category[] = [
    {
        name: 'Độ dài',
        icon: <RectangleGroupIcon className="w-5 h-5" />,
        units: [
            { name: 'Kilometer', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
            { name: 'Meter', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
            { name: 'Centimeter', symbol: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
            { name: 'Millimeter', symbol: 'mm', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
            { name: 'Inch', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
            { name: 'Foot', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
            { name: 'Yard', symbol: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
            { name: 'Mile', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 }
        ]
    },
    {
        name: 'Khối lượng',
        icon: <ScaleIcon className="w-5 h-5" />,
        units: [
            { name: 'Kilogram', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
            { name: 'Gram', symbol: 'g', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
            { name: 'Milligram', symbol: 'mg', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
            { name: 'Pound', symbol: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
            { name: 'Ounce', symbol: 'oz', toBase: (v) => v * 0.028349523125, fromBase: (v) => v / 0.028349523125 }
        ]
    },
    {
        name: 'Nhiệt độ',
        icon: <BeakerIcon className="w-5 h-5" />,
        units: [
            { 
                name: 'Celsius', 
                symbol: '°C', 
                toBase: (v) => v, 
                fromBase: (v) => v 
            },
            { 
                name: 'Fahrenheit', 
                symbol: '°F', 
                toBase: (v) => (v - 32) * 5/9, 
                fromBase: (v) => v * 9/5 + 32 
            },
            { 
                name: 'Kelvin', 
                symbol: 'K', 
                toBase: (v) => v - 273.15, 
                fromBase: (v) => v + 273.15 
            }
        ]
    },
    {
        name: 'Thể tích',
        icon: <CloudIcon className="w-5 h-5" />,
        units: [
            { name: 'Liter', symbol: 'L', toBase: (v) => v, fromBase: (v) => v },
            { name: 'Milliliter', symbol: 'mL', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
            { name: 'Cubic Meter', symbol: 'm³', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
            { name: 'Gallon', symbol: 'gal', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
            { name: 'Pint', symbol: 'pt', toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 }
        ]
    },
    {
        name: 'Diện tích',
        icon: <ChartBarIcon className="w-5 h-5" />,
        units: [
            { name: 'Square Meter', symbol: 'm²', toBase: (v) => v, fromBase: (v) => v },
            { name: 'Square Kilometer', symbol: 'km²', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
            { name: 'Hectare', symbol: 'ha', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
            { name: 'Acre', symbol: 'ac', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
            { name: 'Sào', symbol: 'sào', toBase: (v) => v * 360, fromBase: (v) => v / 360 },
            { name: 'Công', symbol: 'công', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 }
        ]
    }
]

export default function UnitConverter() {
    const [selectedCategory, setSelectedCategory] = useState<Category>(categories[0])
    const [fromUnit, setFromUnit] = useState<Unit>(categories[0].units[0])
    const [toUnit, setToUnit] = useState<Unit>(categories[0].units[1])
    const [fromValue, setFromValue] = useState<string>('')
    const [toValue, setToValue] = useState<string>('')

    const convert = (value: string, from: Unit, to: Unit) => {
        if (!value || isNaN(Number(value))) return ''
        const baseValue = from.toBase(Number(value))
        return to.fromBase(baseValue).toString()
    }

    const handleFromValueChange = (value: string) => {
        setFromValue(value)
        setToValue(convert(value, fromUnit, toUnit))
    }

    const handleToValueChange = (value: string) => {
        setToValue(value)
        setFromValue(convert(value, toUnit, fromUnit))
    }

    const handleCategoryChange = (category: Category) => {
        setSelectedCategory(category)
        setFromUnit(category.units[0])
        setToUnit(category.units[1])
        setFromValue('')
        setToValue('')
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-6">Chuyển đổi đơn vị</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Loại đơn vị
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {categories.map((category) => (
                                    <button
                                        key={category.name}
                                        onClick={() => handleCategoryChange(category)}
                                        className={`flex items-center gap-2 p-2 rounded-md ${
                                            selectedCategory.name === category.name
                                                ? 'bg-black text-white'
                                                : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                    >
                                        {category.icon}
                                        <span>{category.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Từ đơn vị
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={fromValue}
                                    onChange={(e) => handleFromValueChange(e.target.value)}
                                    placeholder="Nhập giá trị"
                                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                                <select
                                    value={fromUnit.name}
                                    onChange={(e) => {
                                        const unit = selectedCategory.units.find(u => u.name === e.target.value)
                                        if (unit) {
                                            setFromUnit(unit)
                                            setToValue(convert(fromValue, unit, toUnit))
                                        }
                                    }}
                                    className="w-32 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                                >
                                    {selectedCategory.units.map((unit) => (
                                        <option key={unit.name} value={unit.name}>
                                            {unit.symbol}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sang đơn vị
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={toValue}
                                    onChange={(e) => handleToValueChange(e.target.value)}
                                    placeholder="Kết quả"
                                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                                />
                                <select
                                    value={toUnit.name}
                                    onChange={(e) => {
                                        const unit = selectedCategory.units.find(u => u.name === e.target.value)
                                        if (unit) {
                                            setToUnit(unit)
                                            setToValue(convert(fromValue, fromUnit, unit))
                                        }
                                    }}
                                    className="w-32 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                                >
                                    {selectedCategory.units.map((unit) => (
                                        <option key={unit.name} value={unit.name}>
                                            {unit.symbol}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold mb-2">Các đơn vị phổ biến</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {selectedCategory.units.map((unit) => (
                                <div
                                    key={unit.name}
                                    className="p-3 bg-gray-50 rounded-md"
                                >
                                    <div className="font-medium">{unit.name}</div>
                                    <div className="text-sm text-gray-600">{unit.symbol}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
} 