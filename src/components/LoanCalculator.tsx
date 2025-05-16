'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CalculatorIcon, BanknotesIcon, ChartBarIcon, CalendarIcon } from '@heroicons/react/24/outline';

const LOAN_TERMS = [
    { label: '3 tháng', value: 3 },
    { label: '6 tháng', value: 6 },
    { label: '9 tháng', value: 9 },
    { label: '12 tháng', value: 12 },
    { label: '18 tháng', value: 18 },
    { label: '24 tháng', value: 24 },
    { label: '36 tháng', value: 36 },
    { label: '48 tháng', value: 48 },
    { label: '60 tháng', value: 60 }
];

type LoanType = 'fixed' | 'reducing';

export function LoanCalculator() {
    const [loanAmount, setLoanAmount] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [term, setTerm] = useState('');
    const [loanType, setLoanType] = useState<LoanType>('fixed');
    const [results, setResults] = useState<{
        monthlyPayment: number;
        totalPayment: number;
        totalInterest: number;
        paymentSchedule: {
            month: number;
            principal: number;
            interest: number;
            remaining: number;
        }[];
    } | null>(null);

    const formatInputNumber = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatInputNumber(e.target.value);
        setLoanAmount(formattedValue);
    };

    const handleTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setTerm(value);
    };

    const calculateLoan = () => {
        if (!loanAmount || !interestRate || !term) return;

        const p = parseFloat(loanAmount.replace(/\./g, ''));
        const r = parseFloat(interestRate) / 100 / 12; // Monthly interest rate
        const n = parseInt(term);

        if (loanType === 'fixed') {
            // Fixed monthly payment calculation
            const monthlyPayment = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
            const totalPayment = monthlyPayment * n;
            const totalInterest = totalPayment - p;

            // Calculate payment schedule
            const paymentSchedule = [];
            let remaining = p;
            for (let i = 1; i <= n; i++) {
                const interest = remaining * r;
                const principal = monthlyPayment - interest;
                remaining -= principal;
                paymentSchedule.push({
                    month: i,
                    principal,
                    interest,
                    remaining: Math.max(0, remaining)
                });
            }

            setResults({
                monthlyPayment,
                totalPayment,
                totalInterest,
                paymentSchedule
            });
        } else {
            // Reducing balance calculation
            const principalPayment = p / n;
            let totalInterest = 0;
            const paymentSchedule = [];
            let remaining = p;

            for (let i = 1; i <= n; i++) {
                const interest = remaining * r;
                const monthlyPayment = principalPayment + interest;
                remaining -= principalPayment;
                totalInterest += interest;
                paymentSchedule.push({
                    month: i,
                    principal: principalPayment,
                    interest,
                    remaining: Math.max(0, remaining)
                });
            }

            setResults({
                monthlyPayment: paymentSchedule[0].principal + paymentSchedule[0].interest,
                totalPayment: p + totalInterest,
                totalInterest,
                paymentSchedule
            });
        }
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
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">💰 Tính lãi vay</h1>
                                <p className="text-gray-600">
                                    Tính toán lãi vay ngân hàng và lịch trả nợ
                                </p>
                            </div>

                            <div className="space-y-6">
                                <Tabs defaultValue="fixed" className="w-full" onValueChange={(value) => setLoanType(value as LoanType)}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="fixed" className="flex items-center gap-2">
                                            <BanknotesIcon className="w-5 h-5" />
                                            Lãi suất cố định
                                        </TabsTrigger>
                                        <TabsTrigger value="reducing" className="flex items-center gap-2">
                                            <ChartBarIcon className="w-5 h-5" />
                                            Lãi suất giảm dần
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200 mt-4">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-800 mb-2">
                                                    Số tiền vay
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={loanAmount}
                                                        onChange={handleLoanAmountChange}
                                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all pr-12"
                                                        placeholder="Ví dụ: 100.000.000"
                                                        inputMode="numeric"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">VNĐ</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-800 mb-2">
                                                    Lãi suất vay
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={interestRate}
                                                        onChange={(e) => setInterestRate(e.target.value)}
                                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all pr-12"
                                                        placeholder="Ví dụ: 12"
                                                        step="0.1"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">%/năm</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-800 mb-2">
                                                    Thời hạn vay
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={term}
                                                        onChange={handleTermChange}
                                                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all pr-12"
                                                        placeholder="Nhập số tháng"
                                                        inputMode="numeric"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">tháng</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={calculateLoan}
                                                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all transform hover:scale-[1.02]"
                                            >
                                                <CalculatorIcon className="w-5 h-5" />
                                                <span className="font-medium">Tính toán</span>
                                            </button>
                                        </div>
                                    </div>
                                </Tabs>

                                {results && (
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-white p-4 rounded-xl border border-gray-200">
                                                    <div className="text-sm text-gray-600">Số tiền trả hàng tháng</div>
                                                    <div className="text-xl font-semibold text-gray-800">{formatCurrency(results.monthlyPayment)}</div>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-gray-200">
                                                    <div className="text-sm text-gray-600">Tổng số tiền phải trả</div>
                                                    <div className="text-xl font-semibold text-gray-800">{formatCurrency(results.totalPayment)}</div>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-gray-200">
                                                    <div className="text-sm text-gray-600">Tổng tiền lãi</div>
                                                    <div className="text-xl font-semibold text-red-600">{formatCurrency(results.totalInterest)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200">
                                            <div className="flex items-center gap-2 mb-4">
                                                <CalendarIcon className="w-5 h-5 text-gray-800" />
                                                <h2 className="text-lg font-semibold text-gray-800">Lịch trả nợ</h2>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="border-b border-gray-200">
                                                            <th className="text-left py-2 px-4 text-gray-800">Tháng</th>
                                                            <th className="text-right py-2 px-4 text-gray-800">Gốc</th>
                                                            <th className="text-right py-2 px-4 text-gray-800">Lãi</th>
                                                            <th className="text-right py-2 px-4 text-gray-800">Còn lại</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {results.paymentSchedule.map((payment, index) => (
                                                            <tr key={index} className="border-b border-gray-100">
                                                                <td className="py-2 px-4 text-gray-700">{payment.month}</td>
                                                                <td className="py-2 px-4 text-right text-gray-700">{formatCurrency(payment.principal)}</td>
                                                                <td className="py-2 px-4 text-right text-red-600">{formatCurrency(payment.interest)}</td>
                                                                <td className="py-2 px-4 text-right text-gray-700">{formatCurrency(payment.remaining)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200">
                                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Công thức tính</h2>
                                            {loanType === 'fixed' ? (
                                                <div className="space-y-4 text-gray-700">
                                                    <p>
                                                        Số tiền trả hàng tháng = Số tiền vay x (lãi suất/12) x (1 + lãi suất/12)^số tháng / ((1 + lãi suất/12)^số tháng - 1)
                                                    </p>
                                                    <div className="space-y-2">
                                                        <h3 className="font-medium text-gray-800">Ví dụ:</h3>
                                                        <p>Vay 100.000.000 đồng với lãi suất 12%/năm trong 12 tháng:</p>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            <li>Lãi suất hàng tháng: 12%/12 = 1%</li>
                                                            <li>Số tiền trả hàng tháng: 8.884,88 đồng</li>
                                                            <li>Tổng số tiền phải trả: 106.618,56 đồng</li>
                                                            <li>Tổng tiền lãi: 6.618,56 đồng</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 text-gray-700">
                                                    <p>
                                                        Số tiền gốc trả hàng tháng = Số tiền vay / số tháng<br />
                                                        Số tiền lãi trả hàng tháng = Số tiền còn lại x lãi suất/12
                                                    </p>
                                                    <div className="space-y-2">
                                                        <h3 className="font-medium text-gray-800">Ví dụ:</h3>
                                                        <p>Vay 100.000.000 đồng với lãi suất 12%/năm trong 12 tháng:</p>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            <li>Gốc trả hàng tháng: 100.000.000/12 = 8.333.333 đồng</li>
                                                            <li>Lãi tháng đầu: 100.000.000 x 1% = 1.000.000 đồng</li>
                                                            <li>Lãi tháng cuối: 8.333.333 x 1% = 83.333 đồng</li>
                                                            <li>Tổng tiền lãi: 6.500.000 đồng</li>
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