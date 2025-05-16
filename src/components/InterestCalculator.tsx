'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CalculatorIcon, BanknotesIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const INTEREST_TERMS = [
    { label: '1 tháng', value: 1 },
    { label: '3 tháng', value: 3 },
    { label: '6 tháng', value: 6 },
    { label: '9 tháng', value: 9 },
    { label: '12 tháng', value: 12 },
    { label: '18 tháng', value: 18 },
    { label: '24 tháng', value: 24 },
    { label: '36 tháng', value: 36 }
];

type InterestType = 'simple' | 'compound';
type CompoundingFrequency = 'monthly' | 'quarterly' | 'semi-annually' | 'annually';

export function InterestCalculator() {
    const [principal, setPrincipal] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [term, setTerm] = useState('');
    const [interestType, setInterestType] = useState<InterestType>('simple');
    const [compoundingFrequency, setCompoundingFrequency] = useState<CompoundingFrequency>('monthly');
    const [results, setResults] = useState<{
        term: number;
        total: number;
        interest: number;
        monthly: number;
    }[]>([]);

    const formatInputNumber = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handlePrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatInputNumber(e.target.value);
        setPrincipal(formattedValue);
    };

    const handleTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setTerm(value);
    };

    const calculateInterest = () => {
        if (!principal || !interestRate) return;

        const p = parseFloat(principal.replace(/\./g, ''));
        const r = parseFloat(interestRate) / 100;
        
        let terms: number[];
        if (!term) {
            terms = [1, 3, 6, 9, 12, 18, 24, 36];
        } else {
            terms = [parseInt(term)];
        }

        const newResults = terms.map(t => {
            let total: number;
            let interest: number;
            
            if (interestType === 'simple') {
                total = p * (1 + r * t / 12);
                interest = total - p;
            } else {
                let periodsPerYear: number;
                switch (compoundingFrequency) {
                    case 'monthly':
                        periodsPerYear = 12;
                        break;
                    case 'quarterly':
                        periodsPerYear = 4;
                        break;
                    case 'semi-annually':
                        periodsPerYear = 2;
                        break;
                    case 'annually':
                        periodsPerYear = 1;
                        break;
                    default:
                        periodsPerYear = 12;
                }
                
                const ratePerPeriod = r / periodsPerYear;
                const totalPeriods = (t / 12) * periodsPerYear;
                
                total = p * Math.pow(1 + ratePerPeriod, totalPeriods);
                interest = total - p;
            }
            
            const monthly = interest / t;
            
            return {
                term: t,
                total,
                interest,
                monthly
            };
        });

        setResults(newResults);
    };

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('vi-VN', {
            style: 'currency',
            currency: 'VND'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-8">
                        <div className="space-y-8">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">💰 Tính lãi suất</h1>
                                <p className="text-gray-600">
                                    Tính toán lãi suất tiết kiệm và đầu tư
                                </p>
                            </div>

                            <div className="space-y-6">
                                <Tabs defaultValue="simple" className="w-full" onValueChange={(value) => setInterestType(value as InterestType)}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="simple" className="flex items-center gap-2">
                                            <BanknotesIcon className="w-5 h-5" />
                                            Lãi đơn
                                        </TabsTrigger>
                                        <TabsTrigger value="compound" className="flex items-center gap-2">
                                            <ChartBarIcon className="w-5 h-5" />
                                            Lãi kép
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200 mt-4">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-800 mb-2">
                                                    Số tiền gửi
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={principal}
                                                        onChange={handlePrincipalChange}
                                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all pr-12"
                                                        placeholder="Ví dụ: 10.000.000"
                                                        inputMode="numeric"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">VNĐ</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-800 mb-2">
                                                    Lãi suất gửi
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={interestRate}
                                                        onChange={(e) => setInterestRate(e.target.value)}
                                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all pr-12"
                                                        placeholder="Ví dụ: 6.5"
                                                        step="0.1"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">%/năm</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-800 mb-2">
                                                    Kỳ hạn gửi
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={term}
                                                        onChange={handleTermChange}
                                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all pr-12"
                                                        placeholder="Bỏ trống để xem tất cả kỳ hạn"
                                                        inputMode="numeric"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">tháng</span>
                                                </div>
                                            </div>

                                            {interestType === 'compound' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-800 mb-2">
                                                        Tần suất gộp lãi
                                                    </label>
                                                    <select 
                                                        value={compoundingFrequency}
                                                        onChange={(e) => setCompoundingFrequency(e.target.value as CompoundingFrequency)}
                                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                                                    >
                                                        <option value="monthly">Hàng tháng</option>
                                                        <option value="quarterly">Hàng quý</option>
                                                        <option value="semi-annually">Nửa năm</option>
                                                        <option value="annually">Hàng năm</option>
                                                    </select>
                                                </div>
                                            )}

                                            <button
                                                onClick={calculateInterest}
                                                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all transform hover:scale-[1.02]"
                                            >
                                                <CalculatorIcon className="w-5 h-5" />
                                                <span className="font-medium">Tính toán</span>
                                            </button>
                                        </div>
                                    </div>
                                </Tabs>

                                {results.length > 0 && (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200">
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b border-gray-200">
                                                            <th className="text-left py-2 px-4 text-gray-800">Kỳ hạn</th>
                                                            <th className="text-right py-2 px-4 text-gray-800">Tổng tiền</th>
                                                            <th className="text-right py-2 px-4 text-gray-800">Tiền lãi</th>
                                                            <th className="text-right py-2 px-4 text-gray-800">Lãi/tháng</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {results.map((result, index) => (
                                                            <tr key={index} className="border-b border-gray-100">
                                                                <td className="py-2 px-4 text-gray-700">{result.term} tháng</td>
                                                                <td className="py-2 px-4 text-right text-gray-700">{formatCurrency(result.total)}</td>
                                                                <td className="py-2 px-4 text-right text-green-600">{formatCurrency(result.interest)}</td>
                                                                <td className="py-2 px-4 text-right text-blue-600">{formatCurrency(result.monthly)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200">
                                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Công thức tính</h2>
                                            {interestType === 'simple' ? (
                                                <div className="space-y-4 text-gray-700">
                                                    <p>
                                                        Số tiền lãi = Số tiền gửi × lãi suất (%năm)/12 × số tháng gửi
                                                    </p>
                                                    <div className="space-y-2">
                                                        <h3 className="font-medium text-gray-800">Ví dụ:</h3>
                                                        <p>Gửi tiết kiệm 30.000.000 đồng với kỳ hạn 12 tháng tại ngân hàng có mức lãi suất 6,8%/năm:</p>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            <li>Lãi suất hàng tháng là 30.000.000 × 6,8/100/12 × 1 = 170.000 đồng</li>
                                                            <li>Lãi suất sau 12 tháng gửi là 30.000.000 × 6,8/100/12 × 12 = 2.040.000 đồng</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 text-gray-700">
                                                    <p>
                                                        Số tiền nhận được = Số tiền gửi × (1 + r/n)<sup>nt</sup>
                                                    </p>
                                                    <p>
                                                        Trong đó:<br />
                                                        r = lãi suất hàng năm<br />
                                                        n = số lần gộp lãi mỗi năm<br />
                                                        t = số năm gửi tiền
                                                    </p>
                                                    <div className="space-y-2">
                                                        <h3 className="font-medium text-gray-800">Ví dụ:</h3>
                                                        <p>Gửi tiết kiệm 30.000.000 đồng với kỳ hạn 12 tháng, lãi suất 6,8%/năm, gộp lãi hàng tháng:</p>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            <li>Số tiền nhận được = 30.000.000 × (1 + 0,068/12)<sup>12×1</sup> = 32.101.486 đồng</li>
                                                            <li>Tiền lãi = 32.101.486 - 30.000.000 = 2.101.486 đồng</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 