'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ExpenseService, Expense, UserSettings, Wallet } from '../lib/expense-service';
import { ChartBarIcon, PlusIcon, TrashIcon, PencilIcon, SparklesIcon, ArrowUpIcon, ArrowDownIcon, Cog6ToothIcon, PencilSquareIcon, XMarkIcon, ArrowRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { aiService } from '../lib/ai-service';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Đăng ký các components của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const EXPENSE_CATEGORIES = [
    'Ăn uống',
    'Giải trí',
    'Di chuyển',
    'Đầu tư',
    'Mua sắm',
    'Hóa đơn',
    'Y tế',
    'Giáo dục',
    'Du lịch', 
    'Nhà cửa',
    'Tiền điện',
    'Tiền nước',
    'Tiền internet',
    'Tiền điện thoại',
    'Bảo hiểm',
    'Quần áo',
    'Mỹ phẩm',
    'Thể thao',
    'Sách vở',
    'Đồ gia dụng',
    'Quà tặng',
    'Từ thiện',
    'Tiết kiệm',
    'Trả nợ',
    'Làm rơi tiền',
    'Sinh nhật',
    'Khác'
];

const INCOME_CATEGORIES = [
    'Lương',
    'Thưởng',
    'Đầu tư',
    'Kinh doanh', 
    'Cho thuê',
    'Bán hàng',
    'Freelance',
    'Bảo hiểm',
    'Thừa kế',
    'Quà tặng',
    'Nhặt được tiền',
    'Sinh nhật',
    'Khác'
];

const DEFAULT_CATEGORIES = [
    ...EXPENSE_CATEGORIES,
    ...INCOME_CATEGORIES
];

export function ExpenseManager() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [smartInput, setSmartInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isIncome, setIsIncome] = useState(false);
    const [settings, setSettings] = useState<UserSettings>({
        currency: {
            symbol: 'đ',
            position: 'after',
            decimalSeparator: ',',
            thousandsSeparator: '.'
        }
    });
    const [formData, setFormData] = useState({
        amount: '',
        category: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        type: 'expense' as 'expense' | 'income'
    });
    const [filter, setFilter] = useState({
        type: 'all' as 'all' | 'income' | 'expense',
        period: 'all' as 'all' | 'day' | 'month' | 'year',
        day: format(new Date(), 'yyyy-MM-dd'),
        month: format(new Date(), 'yyyy-MM'),
        year: format(new Date(), 'yyyy'),
        category: 'all' as 'all' | string
    });
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [newBalance, setNewBalance] = useState('');
    const [showCharts, setShowCharts] = useState(true);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [lastAnalysisCount, setLastAnalysisCount] = useState(0);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [currentExpense, setCurrentExpense] = useState<Expense>({
        id: '',
        userId: '',
        amount: 0,
        date: new Date(),
        category: 'Khác',
        type: 'expense',
        description: '',
        createdAt: new Date()
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

    const expenseService = ExpenseService.getInstance();

    useEffect(() => {
        if (user) {
            loadExpenses();
            loadSettings();
            loadWallet();
        }
    }, [user]);
            
            // Load chart visibility preference from localStorage
    useEffect(() => {
            const savedChartVisibility = localStorage.getItem('expenseChartVisibility');
            if (savedChartVisibility !== null) {
                setShowCharts(savedChartVisibility === 'true');
            }
    }, []);

    // Save chart visibility to localStorage when changed
    useEffect(() => {
            localStorage.setItem('expenseChartVisibility', showCharts.toString());
    }, [showCharts]);

    // Check if we need to update AI suggestions when transaction count changes
    useEffect(() => {
        const checkForAiUpdate = async () => {
            if (!user || expenses.length === 0) {
                // Reset AI suggestions when there are no expenses
                if (aiSuggestions.length > 0) {
                    setAiSuggestions([]);
                    setLastAnalysisCount(0);
                }
                return;
            }
            
            // Only update if we have 3 or more new transactions since last analysis
            if (expenses.length >= lastAnalysisCount + 3) {
                await generateAiSuggestions();
            }
        };
        
        checkForAiUpdate();
    }, [expenses.length, user, lastAnalysisCount, aiSuggestions.length]);

    const generateAiSuggestions = async () => {
        if (!user || expenses.length < 3 || isLoadingAI) return;
        
        setIsLoadingAI(true);
        try {
            // Get the 3 most recent transactions
            const recentExpenses = [...expenses].sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            ).slice(0, 3);
            
            const prompt = `Phân tích 3 giao dịch gần đây sau đây và đưa ra 1-3 gợi ý chi tiêu hữu ích:
            ${recentExpenses.map(exp => 
                `- ${exp.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}: ${Math.abs(exp.amount)}đ cho ${exp.category} - ${exp.description || 'Không có mô tả'} vào ${format(exp.date, 'dd/MM/yyyy')}`
            ).join('\n')}
            
            Cần trả về danh sách gợi ý dưới dạng mảng JSON, ví dụ:
            ["Gợi ý 1", "Gợi ý 2", "Gợi ý 3"]
            
            Gợi ý nên bao gồm cách tiết kiệm tiền, cách quản lý chi tiêu tốt hơn, hoặc cơ hội đầu tư dựa trên mẫu chi tiêu.
            Mỗi gợi ý nên ngắn gọn, thực tế và cụ thể cho người dùng này.`;
            
            const aiResult = await aiService.processWithAI(prompt);
            
            try {
                const cleanResult = aiResult
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .trim();
                
                const suggestions = JSON.parse(cleanResult);
                setAiSuggestions(suggestions);
                setLastAnalysisCount(expenses.length);
            } catch (e) {
                console.error('Error parsing AI suggestions:', e);
                // Fallback in case the AI doesn't return valid JSON
                setAiSuggestions([
                    'Hãy theo dõi chi tiêu hàng ngày của bạn để quản lý tài chính tốt hơn.',
                    'Xem xét lập ngân sách cho các khoản chi tiêu cố định hàng tháng.',
                    'Tiết kiệm 20% thu nhập của bạn mỗi tháng là một mục tiêu tốt.'
                ]);
                setLastAnalysisCount(expenses.length);
            }
        } catch (error) {
            console.error('Error generating AI suggestions:', error);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const loadExpenses = async () => {
        try {
            setLoading(true);
            const userExpenses = await expenseService.getExpenses(user!.uid);
            setExpenses(userExpenses);
        } catch (error) {
            setError('Không thể tải danh sách chi tiêu');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const userSettings = await expenseService.getUserSettings(user!.uid);
            setSettings(userSettings);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const loadWallet = async () => {
        if (!user) return;
        try {
            const userWallet = await expenseService.getWallet(user.uid);
            setWallet(userWallet);
        } catch (error) {
            console.error('Error loading wallet:', error);
            setError('Không thể tải số dư ví');
        }
    };

    const handleSaveSettings = async () => {
        try {
            await expenseService.updateUserSettings(user!.uid, settings);
            setShowSettings(false);
        } catch (error) {
            console.error('Error saving settings:', error);
            setError('Không thể lưu cài đặt');
        }
    };

    const formatCurrency = (amount: number) => {
        return expenseService.formatCurrency(amount, settings);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            // Đóng modal ngay lập tức
            setShowAddForm(false);
            setEditingExpense(null);

            const expenseData = {
                userId: user.uid,
                amount: parseFloat(formData.amount) * (formData.type === 'expense' ? -1 : 1),
                category: formData.category,
                description: formData.description || '',
                date: new Date(formData.date),
                type: formData.type
            };

            if (editingExpense) {
                // Cập nhật UI ngay lập tức
                const updatedExpense = {
                    ...editingExpense,
                    ...expenseData
                };
                setExpenses(prev => prev.map(exp => 
                    exp.id === editingExpense.id ? updatedExpense : exp
                ));
                // Cập nhật số dư ví
                setWallet(prev => prev ? {
                    ...prev,
                    balance: prev.balance - editingExpense.amount + expenseData.amount
                } : null);
                
                await expenseService.updateExpense(editingExpense.id!, expenseData);
            } else {
                // Thêm vào UI ngay lập tức
                const tempId = 'temp-' + Date.now();
                const tempExpense = {
                    ...expenseData,
                    id: tempId,
                    createdAt: new Date()
                };
                setExpenses(prev => [tempExpense, ...prev]);
                // Cập nhật số dư ví
                setWallet(prev => prev ? {
                    ...prev,
                    balance: prev.balance + expenseData.amount
                } : null);
                
                // Thêm vào database và cập nhật lại với ID thật
                const savedExpense = await expenseService.addExpense(expenseData);
                setExpenses(prev => prev.map(exp => 
                    exp.id === tempId ? savedExpense : exp
                ));
            }

            // Reset form data
            setFormData({
                amount: '',
                category: '',
                description: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                type: 'expense'
            });

            // After successfully adding a new transaction, check if we need to update AI suggestions
            if (expenses.length % 3 === 0) {
                await generateAiSuggestions();
            }
        } catch (error) {
            setError('Không thể lưu chi tiêu');
            console.error(error);
            // Rollback UI changes
            if (editingExpense) {
                loadExpenses();
                loadWallet();
            } else {
                const tempId = 'temp-' + Date.now();
                setExpenses(prev => prev.filter(exp => exp.id !== tempId));
                loadWallet();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (expenseId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa chi tiêu này?')) return;

        setLoading(true);
        try {
            // Lưu expense để rollback nếu cần
            const expenseToDelete = expenses.find(exp => exp.id === expenseId);
            if (!expenseToDelete) return;

            // Cập nhật UI ngay lập tức
            setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
            setWallet(prev => prev ? {
                ...prev,
                balance: prev.balance - expenseToDelete.amount
            } : null);

            await expenseService.deleteExpense(expenseId);
            
            // Nếu đã xóa hết giao dịch, xóa luôn gợi ý AI
            if (expenses.length === 1) {
                setAiSuggestions([]);
                setLastAnalysisCount(0);
            }
        } catch (error) {
            setError('Không thể xóa chi tiêu');
            console.error(error);
            // Rollback UI changes
            loadExpenses();
            loadWallet();
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setFormData({
            amount: Math.abs(expense.amount).toString(),
            category: expense.category,
            description: expense.description,
            date: format(expense.date, 'yyyy-MM-dd'),
            type: expense.amount >= 0 ? 'income' : 'expense'
        });
        setShowAddForm(true);
    };

    const analyzeExpense = async (text: string) => {
        if (!text.trim() || !user) return;
        
        setIsAnalyzing(true);
        try {
            const prompt = `Phân tích giao dịch từ mô tả sau và trả về kết quả theo định dạng JSON:
            "${text}"
            
            Yêu cầu:
            1. Xác định đây là thu nhập hay chi tiêu
            2. Tìm số tiền trong mô tả (nếu có)
            3. Chọn danh mục phù hợp từ danh sách đã cho:
               - Danh mục chi tiêu: ${EXPENSE_CATEGORIES.join(', ')}
               - Danh mục thu nhập: ${INCOME_CATEGORIES.join(', ')}
            4. Tóm tắt mô tả ngắn gọn
            
            Chỉ trả về JSON, không thêm bất kỳ text nào khác:
            {
                "type": "income" | "expense",
                "amount": number,
                "category": "string", // Phải là một trong các danh mục đã cho
                "description": "string"
            }`;

            const aiResult = await aiService.processWithAI(prompt);
            
            const cleanResult = aiResult
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();
            
            const analysis = JSON.parse(cleanResult);

            const validCategories = analysis.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
            if (!validCategories.includes(analysis.category)) {
                analysis.category = analysis.type === 'expense' ? 'Khác' : 'Lương';
            }

            const expenseData = {
                userId: user.uid,
                amount: analysis.amount * (analysis.type === 'expense' ? -1 : 1),
                category: analysis.category,
                description: analysis.description || text,
                date: new Date(),
                type: analysis.type
            };

            // Thêm vào UI ngay lập tức
            const tempId = 'temp-' + Date.now();
            const tempExpense = {
                ...expenseData,
                id: tempId,
                createdAt: new Date()
            };
            setExpenses(prev => [tempExpense, ...prev]);
            setWallet(prev => prev ? {
                ...prev,
                balance: prev.balance + expenseData.amount
            } : null);

            // Thêm vào database và cập nhật lại với ID thật
            const savedExpense = await expenseService.addExpense(expenseData);
            setExpenses(prev => prev.map(exp => 
                exp.id === tempId ? savedExpense : exp
            ));

            setSmartInput(''); // Xóa input sau khi thêm thành công
            
            // Kiểm tra nếu cần cập nhật gợi ý AI
            if ((expenses.length + 1) % 3 === 0) {
                await generateAiSuggestions();
            }
        } catch (error) {
            console.error('Error analyzing expense:', error);
            setError('Không thể phân tích giao dịch. Vui lòng thử lại.');
            // Rollback UI changes
            const tempId = 'temp-' + Date.now();
            setExpenses(prev => prev.filter(exp => exp.id !== tempId));
            loadWallet();
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleUpdateWallet = async () => {
        if (!user || !newBalance || isNaN(parseFloat(newBalance))) return;
        try {
            const balance = parseFloat(newBalance);
            if (balance < 0) return;
            
            await expenseService.updateWalletBalance(user.uid, balance);
            setWallet(prev => prev ? { ...prev, balance } : { 
                userId: user.uid, 
                balance, 
                lastUpdated: new Date() 
            });
            setShowWalletModal(false);
            setNewBalance('');
            setError(null);
        } catch (error) {
            console.error('Error updating wallet:', error);
            setError('Không thể cập nhật số dư ví');
        }
    };

    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            if (filter.type !== 'all' && 
                (filter.type === 'income' ? expense.amount <= 0 : expense.amount >= 0)) {
                return false;
            }
            if (filter.category !== 'all' && expense.category !== filter.category) {
                return false;
            }
            if (filter.period !== 'all') {
                const expenseDate = new Date(expense.date);
                switch (filter.period) {
                    case 'day':
                        return format(expenseDate, 'yyyy-MM-dd') === filter.day;
                    case 'month':
                        return format(expenseDate, 'yyyy-MM') === filter.month;
                    case 'year':
                        return format(expenseDate, 'yyyy') === filter.year;
                    default:
                        return true;
                }
            }
            return true;
        });
    }, [expenses, filter]);

    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const income = filteredExpenses.filter(e => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
    const expenseTotal = filteredExpenses.filter(e => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);
    const balance = income - expenseTotal;

    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
        const category = expense.category;
        const amount = Math.abs(expense.amount);
        acc[category] = (acc[category] || 0) + amount;
        return acc;
    }, {} as Record<string, number>);

    // Thêm các hàm xử lý dữ liệu cho biểu đồ
    const getMonthlyData = (expenses: Expense[]) => {
        const monthlyData: { [key: string]: { income: number; expense: number } } = {};
        
        expenses.forEach(expense => {
            const monthKey = format(expense.date, 'MM/yyyy');
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { income: 0, expense: 0 };
            }
            if (expense.amount > 0) {
                monthlyData[monthKey].income += expense.amount;
            } else {
                monthlyData[monthKey].expense += Math.abs(expense.amount);
            }
        });
        
        return monthlyData;
    };

    const getCategoryData = (expenses: Expense[], type: 'income' | 'expense') => {
        const categoryData: { [key: string]: number } = {};
        
        expenses.forEach(expense => {
            if ((type === 'income' && expense.amount > 0) || (type === 'expense' && expense.amount < 0)) {
                if (!categoryData[expense.category]) {
                    categoryData[expense.category] = 0;
                }
                categoryData[expense.category] += Math.abs(expense.amount);
            }
        });
        
        return categoryData;
    };

    const handleExport = async () => {
        try {
            const data = {
                expenses,
                settings,
                wallet
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `expense-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting data:', error);
            setError('Không thể xuất dữ liệu');
        }
    };

    // Add function to clear all expenses if needed
    const handleClearAllExpenses = async () => {
        if (!user) return;
        if (!confirm('Bạn có chắc chắn muốn xóa tất cả giao dịch? Hành động này không thể hoàn tác.')) return;
        
        setLoading(true);
        try {
            // Xóa tất cả giao dịch từ cơ sở dữ liệu
            const deletePromises = expenses.map(expense => 
                expenseService.deleteExpense(expense.id!)
            );
            await Promise.all(deletePromises);
            
            // Cập nhật UI
            setExpenses([]);
            setWallet(prev => prev ? { ...prev, balance: 0 } : null);
            
            // Xóa gợi ý AI
            setAiSuggestions([]);
            setLastAnalysisCount(0);
            
            setError(null);
        } catch (error) {
            setError('Không thể xóa tất cả giao dịch');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Get recent transactions (10 most recent)
    const getRecentTransactions = () => {
        return [...expenses]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden max-w-5xl mx-auto mt-2 sm:mt-6 mb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-6 border-b border-gray-200 gap-3 sm:gap-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-black flex items-center justify-center">
                            <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base sm:text-xl font-semibold">Quản lý tài chính</h1>
                            <p className="text-xs sm:text-sm text-gray-500">Theo dõi thu nhập và chi tiêu của bạn</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={() => setShowWalletModal(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <PencilSquareIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Số dư ví:</span> {wallet ? formatCurrency(wallet.balance) : '0đ'}
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Cog6ToothIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Cài đặt</span>
                        </button>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                        >
                            <PlusIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Thêm giao dịch</span>
                            <span className="sm:hidden">Thêm</span>
                        </button>
                </div>
            </div>

            <div className="flex border-b border-gray-200">
                <button
                    className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-colors ${
                        activeTab === 'overview'
                            ? 'border-b-2 border-gray-900 text-gray-900'
                            : 'text-gray-500 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('overview')}
                >
                    Tổng quan
                </button>
                <button
                    className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-colors ${
                        activeTab === 'history'
                            ? 'border-b-2 border-gray-900 text-gray-900'
                            : 'text-gray-500 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab('history')}
                >
                    Lịch sử giao dịch
                </button>
            </div>

            <div className="p-3 sm:p-6">
                {/* Add Expense Form */}
                {showAddForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg">
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold">
                                    {editingExpense ? 'Sửa giao dịch' : 'Thêm giao dịch mới'}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setEditingExpense(null);
                                        setFormData({
                                            amount: '',
                                            category: '',
                                            description: '',
                                            date: format(new Date(), 'yyyy-MM-dd'),
                                            type: 'expense'
                                        });
                                        setSmartInput('');
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                            
                            {/* AI Powered Input */}
                            <div className="p-4 bg-gray-50 border-b border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <SparklesIcon className="h-5 w-5 text-gray-600" />
                                    <h3 className="font-medium text-gray-800">Nhập bằng AI</h3>
                                </div>
                                <p className="text-xs text-gray-600 mb-3">
                                    Ví dụ: "Mua sắm quần áo hết 500.000đ hôm qua" hoặc "Nhận lương 10 triệu hôm nay"
                                </p>
                                <div className="relative">
                                    <textarea
                                        className="w-full p-3 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 min-h-[80px] shadow-sm"
                                        placeholder="Nhập mô tả giao dịch bằng ngôn ngữ tự nhiên..."
                                        value={smartInput}
                                        onChange={(e) => setSmartInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                if (!smartInput.trim() || isAnalyzing) return;
                                                
                                                const analyzeButton = e.currentTarget.parentElement?.querySelector('button');
                                                analyzeButton?.click();
                                            }
                                        }}
                                    ></textarea>
                                <button
                                        onClick={async () => {
                                            if (!smartInput.trim()) return;
                                            
                                            setIsAnalyzing(true);
                                            try {
                                                const prompt = `Phân tích giao dịch từ mô tả sau và trả về kết quả theo định dạng JSON:
                                                "${smartInput}"
                                                
                                                Yêu cầu:
                                                1. Xác định đây là thu nhập hay chi tiêu
                                                2. Tìm số tiền trong mô tả (nếu có)
                                                3. Chọn danh mục phù hợp từ danh sách đã cho:
                                                   - Danh mục chi tiêu: ${EXPENSE_CATEGORIES.join(', ')}
                                                   - Danh mục thu nhập: ${INCOME_CATEGORIES.join(', ')}
                                                4. Tóm tắt mô tả ngắn gọn
                                                5. Nếu có thông tin ngày, xác định ngày. Nếu không, sử dụng ngày hiện tại.
                                                Chỉ trả về JSON, không thêm bất kỳ text nào khác:
                                                {
                                                    "type": "income" | "expense",
                                                    "amount": number,
                                                    "category": "string", // Phải là một trong các danh mục đã cho
                                                    "description": "string",
                                                    "date": "yyyy-MM-dd" // Định dạng ISO
                                                }`;

                                                const aiResult = await aiService.processWithAI(prompt);

                                                const cleanResult = aiResult
                                                    .replace(/```json/g, '')
                                                    .replace(/```/g, '')
                                                    .trim();

                                                const analysis = JSON.parse(cleanResult);

                                                const validCategories = analysis.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
                                                if (!validCategories.includes(analysis.category)) {
                                                    analysis.category = analysis.type === 'expense' ? 'Khác' : 'Lương';
                                                }
                                                
                                                // Populate form with analyzed data
                                                setFormData({
                                                    amount: Math.abs(analysis.amount).toString(),
                                                    category: analysis.category,
                                                    description: analysis.description || smartInput,
                                                    date: format(new Date(), 'yyyy-MM-dd'),
                                                    type: analysis.type
                                                });
                                                // Clear the smart input
                                                setSmartInput('');
                                                
                                            } catch (error) {
                                                console.error('Error analyzing expense:', error);
                                                setError('Không thể phân tích giao dịch. Vui lòng thử lại.');
                                            } finally {
                                                setIsAnalyzing(false);
                                            }
                                        }}
                                        disabled={isAnalyzing || !smartInput.trim()}
                                        className="absolute right-3 bottom-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isAnalyzing ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
                                        ) : (
                                            <div className="flex items-center gap-1 bg-black hover:bg-gray-800 transition-colors py-1.5 px-3 rounded-lg text-white">
                                                <SparklesIcon className="h-4 w-4" />
                                                <span className="text-xs font-medium">Phân tích</span>
                                            </div>
                                        )}
                                </button>
                            </div>
                        </div>

                            <form onSubmit={handleSubmit} className="p-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Loại giao dịch
                                    </label>
                                        <div className="flex gap-2">
                                        <button
                                            type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
                                                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                                    formData.type === 'expense'
                                                        ? 'bg-red-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                <ArrowUpIcon className="h-4 w-4" />
                                                Chi tiêu
                                        </button>
                                        <button
                                            type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
                                                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                                    formData.type === 'income'
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                            >
                                                <ArrowDownIcon className="h-4 w-4" />
                                                Thu nhập
                                        </button>
                                    </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Số tiền
                                        </label>
                                        <div className="relative">
                                    <input
                                                type="number"
                                                value={formData.amount}
                                                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                                placeholder="Nhập số tiền"
                                                className="w-full p-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
                                                min="0"
                                                required
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                                {settings.currency.symbol}
                                            </span>
                                </div>
                                    </div>
                                    
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Danh mục
                                    </label>
                                    <select
                                            value={formData.category}
                                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                            className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm appearance-none bg-white"
                                            required
                                        >
                                            <option value="" disabled>Chọn danh mục</option>
                                            {formData.type === 'expense' 
                                                ? EXPENSE_CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))
                                                : INCOME_CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))
                                            }
                                    </select>
                                </div>
                                    
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mô tả
                                    </label>
                                    <input
                                        type="text"
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Nhập mô tả (không bắt buộc)"
                                            className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
                                    />
                                </div>
                                    
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ngày
                                    </label>
                                    <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                            className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
                                            required
                                    />
                                </div>
                                    
                                    <div className="pt-2">
                                <button
                                            type="submit"
                                            className={`w-full py-2.5 px-4 rounded-lg text-white font-medium transition-colors ${
                                                formData.type === 'expense'
                                                ? 'bg-red-600 hover:bg-red-700'
                                                : 'bg-green-600 hover:bg-green-700'
                                            }`}
                                        >
                                            {editingExpense ? 'Cập nhật giao dịch' : 'Thêm giao dịch'}
                                </button>
                                <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddForm(false);
                                                setEditingExpense(null);
                                                setFormData({
                                                    amount: '',
                                                    category: '',
                                                    description: '',
                                                    date: format(new Date(), 'yyyy-MM-dd'),
                                                    type: 'expense'
                                                });
                                                setSmartInput('');
                                            }}
                                            className="w-full mt-2 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                        >
                                            Hủy
                                </button>
                            </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'overview' ? (
                    <div>
                        {/* Summary Cards Section */}
                <div className="py-3 px-2 sm:p-6 border-b border-gray-200">
                            <div className="grid grid-cols-1 gap-2 mb-4">
                                <div className="w-full flex items-center gap-2">
                                    <span className="text-xs text-gray-500 whitespace-nowrap">Loại:</span>
                            <select
                                value={filter.type}
                                        onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as 'all' | 'income' | 'expense' }))}
                                        className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                            >
                                <option value="all">Tất cả</option>
                                <option value="income">Thu nhập</option>
                                <option value="expense">Chi tiêu</option>
                            </select>
                                </div>

                                <div className="w-full flex items-center gap-2">
                                    <span className="text-xs text-gray-500 whitespace-nowrap">Danh mục:</span>
                            <select
                                value={filter.category}
                                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                                        className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                            >
                                        <option value="all">Tất cả</option>
                                {filter.type === 'all' && (
                                    <>
                                        <optgroup label="Thu nhập">
                                            {INCOME_CATEGORIES.map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Chi tiêu">
                                            {EXPENSE_CATEGORIES.map(category => (
                                                <option key={category} value={category}>{category}</option>
                                            ))}
                                        </optgroup>
                                    </>
                                )}
                                {filter.type === 'income' && INCOME_CATEGORIES.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                                {filter.type === 'expense' && EXPENSE_CATEGORIES.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                                </div>
                                <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 whitespace-nowrap">Thời gian:</span>
                                        <div className="flex flex-wrap gap-1">
                                            <button
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filter.period === 'all'
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                                onClick={() => setFilter(prev => ({ ...prev, period: 'all' }))}
                                            >
                                                Tất cả
                                            </button>
                                            <button
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filter.period === 'day'
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                                onClick={() => setFilter(prev => ({ ...prev, period: 'day' }))}
                                            >
                                                Ngày
                                            </button>
                                            <button
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filter.period === 'month'
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                                onClick={() => setFilter(prev => ({ ...prev, period: 'month' }))}
                                            >
                                                Tháng
                                            </button>
                                            <button
                                                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filter.period === 'year'
                                                    ? 'bg-black text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                                onClick={() => setFilter(prev => ({ ...prev, period: 'year' }))}
                                            >
                                                Năm
                                            </button>
                                        </div>
                                    </div>

                                    {filter.period !== 'all' && (
                                        <div className="w-full sm:w-auto flex items-center gap-2 mt-2 sm:mt-0">
                                {filter.period === 'day' && (
                                    <input
                                        type="date"
                                        value={filter.day}
                                        onChange={(e) => setFilter(prev => ({ ...prev, day: e.target.value }))}
                                                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                    />
                                )}
                                {filter.period === 'month' && (
                                    <input
                                        type="month"
                                        value={filter.month}
                                        onChange={(e) => setFilter(prev => ({ ...prev, month: e.target.value }))}
                                                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                    />
                                )}
                                {filter.period === 'year' && (
                                    <input
                                        type="number"
                                        value={filter.year}
                                        onChange={(e) => setFilter(prev => ({ ...prev, year: e.target.value }))}
                                        min="2000"
                                        max="2100"
                                                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                        placeholder="Năm"
                                    />
                                )}
                            </div>
                                    )}
                                </div>
                            </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                            <p className="text-xs text-gray-500">Số dư</p>
                            <p className={`text-base sm:text-2xl font-semibold truncate ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(balance)}
                            </p>
                        </div>
                        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                            <p className="text-xs text-gray-500">Thu nhập</p>
                            <p className="text-base sm:text-2xl font-semibold truncate text-green-600">
                                {formatCurrency(income)}
                            </p>
                        </div>
                        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                            <p className="text-xs text-gray-500">Chi tiêu</p>
                            <p className="text-base sm:text-2xl font-semibold truncate text-red-600">
                                {formatCurrency(expenseTotal)}
                            </p>
                        </div>
                        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                            <p className="text-xs text-gray-500">Số giao dịch</p>
                            <p className="text-base sm:text-2xl font-semibold truncate">{filteredExpenses.length}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Transaction Input with AI */}
                <div className="py-3 px-2 sm:p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                            <SparklesIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
                            Thêm giao dịch nhanh với AI
                        </h3>
                    </div>
                    <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4">
                        <p className="text-xs text-gray-600 mb-2">
                            Ví dụ: "Mua cà phê 35.000đ", "Tiền lương tháng 6: 15 triệu"
                        </p>
                        <div className="relative">
                            <textarea
                                className="w-full p-2 sm:p-3 pr-10 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 min-h-[50px] sm:min-h-[60px] shadow-sm"
                                placeholder="Nhập mô tả giao dịch bằng ngôn ngữ tự nhiên..."
                                value={smartInput}
                                onChange={(e) => setSmartInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (!smartInput.trim() || isAnalyzing) return;
                                        analyzeExpense(smartInput);
                                    }
                                }}
                            ></textarea>
                            <button
                                onClick={() => analyzeExpense(smartInput)}
                                disabled={isAnalyzing || !smartInput.trim()}
                                className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAnalyzing ? (
                                    <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-gray-600" />
                                ) : (
                                    <div className="flex items-center gap-1 bg-black hover:bg-gray-800 transition-colors py-1 sm:py-1.5 px-2 sm:px-3 rounded-lg text-white">
                                        <SparklesIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span className="text-xs font-medium">Thêm</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                        {/* Recent Transactions - Redesigned */}
                        <div className="border-t border-gray-200">
                            <div className="p-3 sm:p-5">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">
                                        Giao dịch gần đây
                                        <span className="text-xs sm:text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">
                                            ({Math.min(expenses.length, 10)} giao dịch)
                                        </span>
                                    </h2>
                                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                        {format(new Date(), 'MMMM yyyy', { locale: vi })}
                                    </span>
                                </div>

                                {getRecentTransactions().length > 0 ? (
                                    <div className="space-y-2">
                                        {getRecentTransactions().map((exp) => (
                                            <div
                                                key={exp.id}
                                                className="group flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200"
                                            >
                                                <div
                                                    className={`p-2 sm:p-2.5 rounded-lg ${exp.amount >= 0 
                                                        ? 'bg-green-100 dark:bg-green-800/30 border border-green-200 dark:border-green-800' 
                                                        : 'bg-red-100 dark:bg-red-800/30 border border-red-200 dark:border-red-800'}`}
                                                >
                                                    {exp.amount >= 0 ? (
                                                        <ArrowDownIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                                                    ) : (
                                                        <ArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                                                    )}
                                                </div>

                                                <div className="flex-1 flex items-center justify-between min-w-0">
                                                    <div className="space-y-0.5 sm:space-y-1 truncate pr-2">
                                                        <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {exp.category}
                                                        </h3>
                                                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">
                                                            {exp.description || 'Không có mô tả'} • {format(new Date(exp.date), 'dd/MM/yyyy')}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-3">
                                                        <span
                                                            className={`text-xs sm:text-sm font-medium ${exp.amount >= 0 
                                                                ? 'text-green-600 dark:text-green-400' 
                                                                : 'text-red-600 dark:text-red-400'}`}
                                                        >
                                                            {exp.amount >= 0 ? '+' : '-'}
                                                            {formatCurrency(Math.abs(exp.amount))}
                                                        </span>
                                                        
                                                        <div className="flex items-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEdit(exp)}
                                                                className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
                                                            >
                                                                <PencilSquareIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(exp.id!)}
                                                                className="p-1 sm:p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                                            >
                                                                <TrashIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 sm:py-10">
                                        <DocumentTextIcon className="h-10 w-10 sm:h-14 sm:w-14 mx-auto text-gray-300" />
                                        <p className="mt-2 text-gray-500 text-sm sm:text-base">Chưa có giao dịch nào.</p>
                                    </div>
                                )}
                            </div>

                            {expenses.length > 10 && (
                                <div className="p-3 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('history')}
                                        className="w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium 
                                        bg-gradient-to-r from-black to-gray-800 text-white
                                        hover:from-gray-800 hover:to-gray-700
                                        shadow-sm hover:shadow transform transition-all duration-200
                                        active:translate-y-0.5
                                        focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    >
                                        <span>Xem tất cả giao dịch</span>
                                        <ArrowRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                {/* Charts Section */}
                {filteredExpenses.length > 0 && (
                    <div className="py-4 px-2 sm:p-6 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <h2 className="text-sm sm:text-lg font-medium">Biểu đồ phân tích</h2>
                            <button
                                onClick={() => setShowCharts(!showCharts)}
                                className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                            >
                                {showCharts ? 'Ẩn biểu đồ' : 'Hiện biểu đồ'}
                            </button>
                        </div>
                        
                        {showCharts && (
                            <div className="grid grid-cols-1 gap-4 sm:gap-6">
                                {/* Thu nhập & Chi tiêu theo tháng - Line Chart */}
                                <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
                                    <h3 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4">Thu chi theo thời gian</h3>
                                    <div className="h-[200px] sm:h-[250px]">
                                        {expenses.length > 0 && (() => {
                                            const monthlyData = getMonthlyData(filteredExpenses);
                                            const months = Object.keys(monthlyData).sort((a, b) => {
                                                const [monthA, yearA] = a.split('/');
                                                const [monthB, yearB] = b.split('/');
                                                return new Date(`${yearA}-${monthA}`).getTime() - new Date(`${yearB}-${monthB}`).getTime();
                                            });
                                            
                                            const incomes = months.map(month => monthlyData[month].income);
                                            const expenses = months.map(month => monthlyData[month].expense);

                                            const chartData = {
                                                labels: months,
                                                datasets: [
                                                    {
                                                        label: 'Thu nhập',
                                                        data: incomes,
                                                        borderColor: 'rgb(34, 197, 94)',
                                                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                                        fill: true,
                                                        tension: 0.3,
                                                    },
                                                    {
                                                        label: 'Chi tiêu',
                                                        data: expenses,
                                                        borderColor: 'rgb(239, 68, 68)',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                                        fill: true,
                                                        tension: 0.3,
                                                    }
                                                ]
                                            };

                                            const options = {
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'top' as const,
                                                        labels: {
                                                            boxWidth: 8,
                                                            padding: 8,
                                                            usePointStyle: true,
                                                            font: {
                                                                size: 10,
                                                            }
                                                        }
                                                    },
                                                    tooltip: {
                                                        callbacks: {
                                                            label: function(context: any) {
                                                                return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                                                            }
                                                        }
                                                    }
                                                },
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        ticks: {
                                                            font: {
                                                                size: 10,
                                                            },
                                                            callback: function(value: any) {
                                                                if (value >= 1000000) return (value / 1000000).toFixed(0) + 'M';
                                                                if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                                                                return value;
                                                            }
                                                        }
                                                    },
                                                    x: {
                                                        ticks: {
                                                            font: {
                                                                size: 10,
                                                            }
                                                        }
                                                    }
                                                }
                                            };

                                            return <Line data={chartData} options={options} />;
                                        })()}
                                    </div>
                                </div>

                                {/* Phân bổ Chi tiêu theo danh mục - Doughnut Chart */}
                                <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
                                    <h3 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4">Chi tiêu theo danh mục</h3>
                                    <div className="h-[180px] sm:h-[250px] flex justify-center">
                                        {filteredExpenses.filter(e => e.amount < 0).length > 0 && (() => {
                                            const expenseCategoryData = getCategoryData(filteredExpenses, 'expense');
                                            const categories = Object.keys(expenseCategoryData);
                                            const amounts = Object.values(expenseCategoryData);

                                            // Generate colors for each category
                                            const generateColors = (num: number) => {
                                                const colors = [
                                                    'rgba(239, 68, 68, 0.8)',
                                                    'rgba(249, 115, 22, 0.8)',
                                                    'rgba(234, 179, 8, 0.8)',
                                                    'rgba(16, 185, 129, 0.8)',
                                                    'rgba(14, 165, 233, 0.8)',
                                                    'rgba(99, 102, 241, 0.8)',
                                                    'rgba(217, 70, 239, 0.8)',
                                                    'rgba(236, 72, 153, 0.8)',
                                                    'rgba(249, 168, 212, 0.8)',
                                                    'rgba(156, 163, 175, 0.8)',
                                                ];
                                                
                                                if (num <= colors.length) {
                                                    return colors.slice(0, num);
                                                }
                                                
                                                // If more colors needed, repeat with different opacity
                                                return [
                                                    ...colors,
                                                    ...colors.map(c => c.replace('0.8', '0.6')).slice(0, num - colors.length)
                                                ];
                                            };

                                            const chartData = {
                                                labels: categories,
                                                datasets: [
                                                    {
                                                        data: amounts,
                                                        backgroundColor: generateColors(categories.length),
                                                        borderColor: 'rgb(255, 255, 255)',
                                                        borderWidth: 1,
                                                        hoverOffset: 5
                                                    }
                                                ]
                                            };

                                            const options = {
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: window.innerWidth < 640 ? 'bottom' as const : 'right' as const,
                                                        labels: {
                                                            boxWidth: 8,
                                                            padding: 6,
                                                            usePointStyle: true,
                                                            font: {
                                                                size: 10,
                                                            }
                                                        }
                                                    },
                                                    tooltip: {
                                                        callbacks: {
                                                            label: function(context: any) {
                                                                const percent = Math.round((context.raw / amounts.reduce((a, b) => a + b, 0)) * 100);
                                                                return `${context.label}: ${formatCurrency(context.raw)} (${percent}%)`;
                                                            }
                                                        }
                                                    }
                                                }
                                            };

                                            return <Doughnut data={chartData} options={options} />;
                                        })()}
                                    </div>
                                </div>

                                {/* Thu nhập theo danh mục - Bar Chart */}
                                <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
                                    <h3 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4">Top danh mục thu nhập</h3>
                                    <div className="h-[180px] sm:h-[250px]">
                                        {filteredExpenses.filter(e => e.amount > 0).length > 0 && (() => {
                                            const incomeCategoryData = getCategoryData(filteredExpenses, 'income');
                                            
                                            // Sort categories by amount (descending)
                                            const sortedCategories = Object.entries(incomeCategoryData)
                                                .sort(([, amountA], [, amountB]) => amountB - amountA)
                                                .slice(0, 5); // Limit to top 5 categories for mobile
                                            
                                            const categories = sortedCategories.map(([category]) => category);
                                            const amounts = sortedCategories.map(([, amount]) => amount);

                                            const chartData = {
                                                labels: categories,
                                                datasets: [
                                                    {
                                                        label: 'Thu nhập',
                                                        data: amounts,
                                                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                                                        borderColor: 'rgb(21, 128, 61)',
                                                        borderWidth: 1,
                                                        borderRadius: 3,
                                                        hoverBackgroundColor: 'rgb(34, 197, 94)'
                                                    }
                                                ]
                                            };

                                            const options = {
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                indexAxis: 'y' as const,
                                                plugins: {
                                                    legend: {
                                                        display: false
                                                    },
                                                    tooltip: {
                                                        callbacks: {
                                                            label: function(context: any) {
                                                                return `${formatCurrency(context.raw)}`;
                                                            }
                                                        }
                                                    }
                                                },
                                                scales: {
                                                    x: {
                                                        beginAtZero: true,
                                                        ticks: {
                                                            font: {
                                                                size: 10,
                                                            },
                                                            callback: function(value: any) {
                                                                if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                                                                if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                                                                return value;
                                                            }
                                                        }
                                                    },
                                                    y: {
                                                        ticks: {
                                                            font: {
                                                                size: 10,
                                                            }
                                                        }
                                                    }
                                                }
                                            };

                                            return <Bar data={chartData} options={options} />;
                                        })()}
                                    </div>
                                </div>

                                {/* Chi tiêu top danh mục - Bar Chart */}
                                <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
                                    <h3 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4">Top danh mục chi tiêu</h3>
                                    <div className="h-[180px] sm:h-[250px]">
                                        {filteredExpenses.filter(e => e.amount < 0).length > 0 && (() => {
                                            const expenseCategoryData = getCategoryData(filteredExpenses, 'expense');
                                            
                                            // Sort categories by amount (descending)
                                            const sortedCategories = Object.entries(expenseCategoryData)
                                                .sort(([, amountA], [, amountB]) => amountB - amountA)
                                                .slice(0, 5); // Limit to top 5 categories for mobile
                                            
                                            const categories = sortedCategories.map(([category]) => category);
                                            const amounts = sortedCategories.map(([, amount]) => amount);

                                            const chartData = {
                                                labels: categories,
                                                datasets: [
                                                    {
                                                        label: 'Chi tiêu',
                                                        data: amounts,
                                                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                                        borderColor: 'rgb(185, 28, 28)',
                                                        borderWidth: 1,
                                                        borderRadius: 3,
                                                        hoverBackgroundColor: 'rgb(239, 68, 68)'
                                                    }
                                                ]
                                            };

                                            const options = {
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                indexAxis: 'y' as const,
                                                plugins: {
                                                    legend: {
                                                        display: false
                                                    },
                                                    tooltip: {
                                                        callbacks: {
                                                            label: function(context: any) {
                                                                return `${formatCurrency(context.raw)}`;
                                                            }
                                                        }
                                                    }
                                                },
                                                scales: {
                                                    x: {
                                                        beginAtZero: true,
                                                        ticks: {
                                                            font: {
                                                                size: 10,
                                                            },
                                                            callback: function(value: any) {
                                                                if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                                                                if (value >= 1000) return (value / 1000).toFixed(0) + 'k';
                                                                return value;
                                                            }
                                                        }
                                                    },
                                                    y: {
                                                        ticks: {
                                                            font: {
                                                                size: 10,
                                                            }
                                                        }
                                                    }
                                                }
                                            };

                                            return <Bar data={chartData} options={options} />;
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {/* AI Analysis */}
                {expenses.length > 0 && (
                    <div className="p-6 border-t border-gray-200">
                        <h2 className="text-lg font-medium mb-4">Phân tích AI</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <h3 className="font-medium mb-2">Chi tiêu theo danh mục</h3>
                                <div className="space-y-2">
                                    {Object.entries(categoryTotals).map(([category, total]) => (
                                        <div key={category} className="flex items-center justify-between">
                                            <span className="text-sm">{category}</span>
                                            <span className="text-sm font-medium">
                                                {formatCurrency(total)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium">Gợi ý từ AI</h3>
                                    <div className="flex items-center gap-2">
                                        {isLoadingAI && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                                        )}
                                        <span className="text-xs text-gray-500">
                                            Cập nhật mỗi 3 giao dịch
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {aiSuggestions.length > 0 ? (
                                        aiSuggestions.map((suggestion, index) => (
                                            <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                                                <div className="w-2 h-2 rounded-full bg-black mt-2" />
                                                <div className="flex-1">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ children }) => <p className="text-sm">{children}</p>,
                                                            strong: ({ children }) => <strong className="font-medium text-black">{children}</strong>,
                                                            em: ({ children }) => <em className="italic">{children}</em>,
                                                            ul: ({ children }) => <ul className="list-disc pl-4 mt-1">{children}</ul>,
                                                            ol: ({ children }) => <ol className="list-decimal pl-4 mt-1">{children}</ol>,
                                                            li: ({ children }) => <li className="text-sm">{children}</li>,
                                                            code: ({ children }) => <code className="bg-gray-100 px-1 rounded">{children}</code>,
                                                            a: ({ href, children }) => (
                                                                <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                                                    {children}
                                                                </a>
                                                            ),
                                                        }}
                                                    >
                                                        {suggestion}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex justify-center items-center p-4">
                                            <p className="text-sm text-gray-500">Chưa có gợi ý. Thêm ít nhất 3 giao dịch để nhận gợi ý.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                    </div>
                ) : (
                    <div>
                        {/* Transaction History Tab - Redesigned */}
                        <div className="border-t border-gray-200">
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                        Lịch sử giao dịch
                                        <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">
                                            ({filteredExpenses.length} giao dịch)
                                        </span>
                                    </h2>
                                </div>
                                
                                {/* Filtering options */}
                                <div className="mb-5 flex flex-wrap gap-2">
                                    <select
                                        value={filter.type}
                                        onChange={(e) => setFilter({...filter, type: e.target.value as 'all' | 'income' | 'expense'})}
                                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                    >
                                        <option value="all">Tất cả</option>
                                        <option value="income">Thu nhập</option>
                                        <option value="expense">Chi tiêu</option>
                                    </select>
                                    
                                    <select
                                        value={filter.period}
                                        onChange={(e) => setFilter({...filter, period: e.target.value as 'all' | 'day' | 'month' | 'year'})}
                                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                    >
                                        <option value="all">Tất cả thời gian</option>
                                        <option value="day">Theo ngày</option>
                                        <option value="month">Theo tháng</option>
                                        <option value="year">Theo năm</option>
                                    </select>
                                    
                                    {filter.period === 'day' && (
                                        <input
                                            type="date"
                                            value={filter.day}
                                            onChange={(e) => setFilter({...filter, day: e.target.value})}
                                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                        />
                                    )}
                                    
                                    {filter.period === 'month' && (
                                        <input
                                            type="month"
                                            value={filter.month}
                                            onChange={(e) => setFilter({...filter, month: e.target.value})}
                                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                        />
                                    )}
                                    
                                    {filter.period === 'year' && (
                                        <select
                                            value={filter.year}
                                            onChange={(e) => setFilter({...filter, year: e.target.value})}
                                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                        >
                                            {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    )}
                                    
                                    <select
                                        value={filter.category}
                                        onChange={(e) => setFilter({...filter, category: e.target.value})}
                                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                    >
                                        <option value="all">Tất cả danh mục</option>
                                        {(EXPENSE_CATEGORIES.concat(INCOME_CATEGORIES)).map((category) => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                    
                                    <button
                                        type="button"
                                        onClick={() => setFilter({
                                            type: 'all',
                                            period: 'all',
                                            day: format(new Date(), 'yyyy-MM-dd'),
                                            month: format(new Date(), 'yyyy-MM'),
                                            year: format(new Date(), 'yyyy'),
                                            category: 'all'
                                        })}
                                        className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Đặt lại
                                    </button>
                                </div>

                                {filteredExpenses.length > 0 ? (
                                    <div className="space-y-2">
                                        {filteredExpenses.map((exp) => (
                                            <div
                                                key={exp.id}
                                                className="group flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200"
                                            >
                                                <div
                                                    className={`p-2.5 rounded-lg ${exp.amount >= 0 
                                                        ? 'bg-green-100 dark:bg-green-800/30 border border-green-200 dark:border-green-800' 
                                                        : 'bg-red-100 dark:bg-red-800/30 border border-red-200 dark:border-red-800'}`}
                                                >
                                                    {exp.amount >= 0 ? (
                                                        <ArrowDownIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                    ) : (
                                                        <ArrowUpIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                    )}
                                                </div>

                                                <div className="flex-1 flex items-center justify-between min-w-0">
                                                    <div className="space-y-1 truncate pr-2">
                                                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {exp.category}
                                                        </h3>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            {exp.description || 'Không có mô tả'} • {format(new Date(exp.date), 'dd/MM/yyyy')}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2 pl-3">
                                                        <span
                                                            className={`text-sm font-medium ${exp.amount >= 0 
                                                                ? 'text-green-600 dark:text-green-400' 
                                                                : 'text-red-600 dark:text-red-400'}`}
                                                        >
                                                            {exp.amount >= 0 ? '+' : '-'}
                                                            {formatCurrency(Math.abs(exp.amount))}
                                                        </span>
                                                        
                                                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEdit(exp)}
                                                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
                                                            >
                                                                <PencilSquareIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(exp.id!)}
                                                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <DocumentTextIcon className="h-14 w-14 mx-auto text-gray-300" />
                                        <p className="mt-2 text-gray-500 text-base">Không tìm thấy giao dịch nào phù hợp với bộ lọc.</p>
                                        <div className="mt-4">
                                            <button
                                                type="button"
                                                onClick={() => setFilter({
                                                    type: 'all',
                                                    period: 'all',
                                                    day: format(new Date(), 'yyyy-MM-dd'),
                                                    month: format(new Date(), 'yyyy-MM'),
                                                    year: format(new Date(), 'yyyy'),
                                                    category: 'all'
                                                })}
                                                className="px-4 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
                                            >
                                                Đặt lại bộ lọc
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Wallet Modal */}
                {showWalletModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
                        <div className="bg-white rounded-xl w-full max-w-md shadow-lg">
                            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100">
                                <h2 className="text-base sm:text-lg font-semibold">Cập nhật số dư ví</h2>
                                <button
                                    onClick={() => {
                                        setShowWalletModal(false);
                                        setNewBalance('');
                                    }}
                                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                            
                            <div className="p-3 sm:p-4">
                                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                                    Nhập số dư mới cho ví của bạn. Thao tác này sẽ ghi đè số dư hiện tại.
                                </p>
                                
                                <div className="mb-3 sm:mb-4">
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                        Số dư mới
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={newBalance}
                                            onChange={(e) => setNewBalance(e.target.value)}
                                            placeholder="Nhập số dư mới"
                                            className="w-full p-2 sm:p-2.5 pr-8 sm:pr-10 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
                                            min="0"
                                            required
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-xs sm:text-sm">
                                            {settings.currency.symbol}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleUpdateWallet}
                                        disabled={!newBalance || isNaN(parseFloat(newBalance)) || parseFloat(newBalance) < 0}
                                        className="w-full py-2 sm:py-2.5 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cập nhật số dư
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowWalletModal(false);
                                            setNewBalance('');
                                        }}
                                        className="w-full py-2 sm:py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-xs sm:text-sm"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Modal */}
                {showSettings && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-lg">
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold">Cài đặt</h2>
                                <button 
                                    onClick={() => setShowSettings(false)}
                                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="p-4">
                                {/* Tiền tệ */}
                                <div className="mb-6">
                                    <h3 className="text-md font-medium mb-3 flex items-center">
                                        <Cog6ToothIcon className="h-4 w-4 mr-2 text-gray-500" />
                                        Cài đặt tiền tệ
                                    </h3>
                                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ký hiệu tiền tệ
                                            </label>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        currency: { ...prev.currency, symbol: 'đ' }
                                                    }))}
                                                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${settings.currency.symbol === 'đ'
                                                        ? 'bg-black text-white border-black'
                                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    VND (đ)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        currency: { ...prev.currency, symbol: '$' }
                                                    }))}
                                                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${settings.currency.symbol === '$'
                                                        ? 'bg-black text-white border-black'
                                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    USD ($)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        currency: { ...prev.currency, symbol: '¥' }
                                                    }))}
                                                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${settings.currency.symbol === '¥'
                                                        ? 'bg-black text-white border-black'
                                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    CNY (¥)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        currency: { ...prev.currency, symbol: '₩' }
                                                    }))}
                                                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${settings.currency.symbol === '₩'
                                                        ? 'bg-black text-white border-black'
                                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    KRW (₩)
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                value={settings.currency.symbol}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    currency: { ...prev.currency, symbol: e.target.value }
                                                }))}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 shadow-sm"
                                                placeholder="Hoặc nhập ký hiệu khác"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Vị trí ký hiệu
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        currency: { ...prev.currency, position: 'before' }
                                                    }))}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                                        settings.currency.position === 'before'
                                                            ? 'bg-black text-white'
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    Trước số tiền
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        currency: { ...prev.currency, position: 'after' }
                                                    }))}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                                        settings.currency.position === 'after'
                                                            ? 'bg-black text-white'
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    Sau số tiền
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Dấu phân cách thập phân
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        currency: { ...prev.currency, decimalSeparator: ',' }
                                                    }))}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                                        settings.currency.decimalSeparator === ','
                                                            ? 'bg-black text-white'
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    Dấu phẩy (,)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        currency: { ...prev.currency, decimalSeparator: '.' }
                                                    }))}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                                        settings.currency.decimalSeparator === '.'
                                                            ? 'bg-black text-white'
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    Dấu chấm (.)
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Dấu phân cách hàng nghìn
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        currency: { ...prev.currency, thousandsSeparator: '.' }
                                                    }))}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                                        settings.currency.thousandsSeparator === '.'
                                                            ? 'bg-black text-white'
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    Dấu chấm (.)
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings(prev => ({
                                                        ...prev,
                                                        currency: { ...prev.currency, thousandsSeparator: ',' }
                                                    }))}
                                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                                        settings.currency.thousandsSeparator === ','
                                                            ? 'bg-black text-white'
                                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    Dấu phẩy (,)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                            </div>

                                {/* Quản lý dữ liệu */}
                                <div className="mb-6">
                                    <h3 className="text-md font-medium mb-3 flex items-center">
                                        <ArrowUpIcon className="h-4 w-4 mr-2 text-gray-500" />
                                        Quản lý dữ liệu
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                                                <ArrowUpIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                                                Xuất dữ liệu
                                            </h4>
                                            <p className="text-sm text-gray-600 mb-3">
                                                Xuất tất cả dữ liệu chi tiêu, thu nhập và cài đặt của bạn ra file JSON để sao lưu.
                                            </p>
                                            <button
                                                onClick={handleExport}
                                                className="w-full flex justify-center items-center gap-2 px-3 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                                            >
                                                <ArrowUpIcon className="h-4 w-4" />
                                                <span>Xuất dữ liệu</span>
                                            </button>
                            </div>

                                        {expenses.length > 0 && (
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                                                    <TrashIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                                                    Xóa tất cả dữ liệu
                                                </h4>
                                                <p className="text-sm text-gray-700 mb-3">
                                                    Cảnh báo: Hành động này sẽ xóa tất cả giao dịch của bạn và không thể hoàn tác.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Bạn có chắc chắn muốn xóa tất cả giao dịch? Hành động này không thể hoàn tác.')) {
                                                            handleClearAllExpenses();
                                                            setShowSettings(false);
                                                        }
                                                    }}
                                                    className="w-full flex justify-center items-center gap-2 px-3 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                    <span>Xóa tất cả dữ liệu</span>
                                                </button>
                        </div>
                    )}
                                    </div>
                </div>

                                <div className="flex flex-col gap-2 mt-6">
                                    <button
                                        onClick={handleSaveSettings}
                                        className="w-full py-2.5 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex justify-center items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Lưu cài đặt
                                    </button>
                                    <button
                                        onClick={() => setShowSettings(false)}
                                        className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}