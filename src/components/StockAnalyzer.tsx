'use client';

import React, { useState } from 'react';
import { Loader2, LineChart, PieChart } from "lucide-react";
import { aiService } from '@/lib/ai-service';
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Import additional packages for rendering tables in markdown
import remarkGfm from 'remark-gfm';

export default function StockAnalyzer() {
    // Stock Analysis Tab
    const [stockSymbol, setStockSymbol] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [stockHistory, setStockHistory] = useState<string[]>([]);
    const [analysisPeriod, setAnalysisPeriod] = useState<number>(30); // Default to 30 days
    const [sharesOwned, setSharesOwned] = useState<string>('');
    const [showCompanyInfo, setShowCompanyInfo] = useState<boolean>(true);
    const [showFinancialInfo, setShowFinancialInfo] = useState<boolean>(true);
    
    // Portfolio Allocation Tab
    const [investmentAmount, setInvestmentAmount] = useState<string>('');
    const [investmentStyle, setInvestmentStyle] = useState<string>('balanced');
    const [portfolioLoading, setPortfolioLoading] = useState(false);
    const [portfolioAllocation, setPortfolioAllocation] = useState<string | null>(null);
    
    const { toast } = useToast();

    const analysisPeriods = [
        { value: 1, label: '1 ngày' },
        { value: 3, label: '3 ngày' },
        { value: 7, label: '7 ngày' },
        { value: 30, label: '30 ngày' },
        { value: 90, label: '90 ngày' },
        { value: 180, label: '180 ngày' },
        { value: 365, label: '1 năm' },
        { value: 0, label: 'Tất cả' },
    ];
    
    const investmentStyles = [
        { value: 'conservative', label: 'An toàn (Rủi ro thấp)' },
        { value: 'balanced', label: 'Cân bằng (Rủi ro trung bình)' },
        { value: 'growth', label: 'Tăng trưởng (Rủi ro cao)' },
        { value: 'aggressive', label: 'Mạo hiểm (Rủi ro rất cao)' },
    ];

    const analyzeStock = async () => {
        if (!stockSymbol.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập mã chứng khoán",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const timeframeText = analysisPeriod === 0 
                ? "toàn bộ lịch sử" 
                : `${analysisPeriod} ngày gần đây`;
                
            const ownershipInfo = sharesOwned && parseInt(sharesOwned) > 0
                ? `\n\nNgười dùng hiện đang nắm giữ ${sharesOwned} cổ phiếu. Vui lòng đưa ra lời khuyên cụ thể cho trường hợp này, bao gồm chiến lược phù hợp (giữ/bán bớt/mua thêm) và ước tính giá trị danh mục.`
                : '';
                
            // Build sections based on user preferences
            const sections = [];
            if (showCompanyInfo) sections.push("1. Thông tin cơ bản về công ty");
            if (showFinancialInfo) sections.push(`${sections.length + 1}. Tình hình tài chính gần đây`);
            sections.push(`${sections.length + 1}. Xu hướng giá cổ phiếu trong ${timeframeText}`);
            sections.push(`${sections.length + 1}. Đánh giá rủi ro`);
            sections.push(`${sections.length + 1}. Lời khuyên đầu tư (nên mua/bán/giữ)`);
                
            const prompt = `Phân tích chi tiết về mã chứng khoán ${stockSymbol.toUpperCase()} trong ${timeframeText} bao gồm:
${sections.join('\n')}

Hãy phân tích dựa trên dữ liệu thực tế và đưa ra lời khuyên khách quan. Trả về kết quả theo định dạng markdown.${ownershipInfo}. Lưu ý: Không nói gì thêm chỉ đưa ra kết quả phân tích`;

            const result = await aiService.processWithGoogleSearch(prompt);
            setAnalysis(result.text);
            
            // Add to history (only if not already there)
            if (!stockHistory.includes(stockSymbol.toUpperCase())) {
                setStockHistory(prev => {
                    const updatedHistory = [stockSymbol.toUpperCase(), ...prev];
                    return updatedHistory.slice(0, 10); // Keep only 10 entries
                });
            }
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể phân tích mã chứng khoán. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };
    
    const generatePortfolio = async () => {
        if (!investmentAmount.trim() || parseFloat(investmentAmount) <= 0) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập số tiền đầu tư hợp lệ",
                variant: "destructive",
            });
            return;
        }

        setPortfolioLoading(true);
        try {
            // Get investment style description
            const styleInfo = investmentStyles.find(style => style.value === investmentStyle);
            const styleLabel = styleInfo ? styleInfo.label : 'Cân bằng';
            
            const formattedAmount = new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND',
                maximumFractionDigits: 0
            }).format(parseFloat(investmentAmount));
            
            const prompt = `Tôi muốn đầu tư ${formattedAmount} vào thị trường chứng khoán Việt Nam với phong cách "${styleLabel}". 

Hãy giúp tôi phân bổ số tiền này vào các mã cổ phiếu cụ thể trên sàn chứng khoán Việt Nam (HOSE, HNX, UPCOM) theo tỷ lệ phù hợp. Cần làm rõ:

1. Các mã cổ phiếu được khuyến nghị và lý do chọn
2. Tỷ lệ phân bổ cho mỗi mã (% tổng số tiền)
3. Số tiền cụ thể cần đầu tư vào mỗi mã
4. Số lượng cổ phiếu dự kiến (làm tròn xuống) dựa trên giá hiện tại
5. Chiến lược đầu tư tổng thể
6. Khuyến nghị thời gian nắm giữ

Trả về kết quả theo định dạng markdown có cấu trúc rõ ràng. Lưu ý: Không nói gì thêm, chỉ đưa ra kết quả phân tích.`;

            const result = await aiService.processWithGoogleSearch(prompt);
            setPortfolioAllocation(result.text);
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể tạo phân bổ danh mục đầu tư. Vui lòng thử lại sau.",
                variant: "destructive",
            });
        } finally {
            setPortfolioLoading(false);
        }
    };

    const resetHistory = () => {
        setStockHistory([]);
        setAnalysis(null);
    };

    const handleSharesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only numbers
        const value = e.target.value.replace(/[^0-9]/g, '');
        setSharesOwned(value);
    };
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow only numbers and decimal point
        const value = e.target.value.replace(/[^0-9]/g, '');
        setInvestmentAmount(value);
    };

    return (
        <div className="min-h-screen to-gray-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-8">
                        <div className="space-y-8">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">📈 Phân Tích & Đầu Tư Chứng Khoán</h1>
                                <p className="text-gray-600">
                                    Công cụ thông minh hỗ trợ phân tích và lập kế hoạch đầu tư chứng khoán
                                </p>
                            </div>
                            
                            <Tabs defaultValue="analysis" className="w-full">
                                <TabsList className="grid grid-cols-2 mb-6">
                                    <TabsTrigger value="analysis" className="text-sm">Phân Tích Cổ Phiếu</TabsTrigger>
                                    <TabsTrigger value="portfolio" className="text-sm">Phân Bổ Danh Mục</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="analysis" className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Mã chứng khoán</label>
                                            <input
                                                type="text"
                            placeholder="Nhập mã chứng khoán (VD: VNM, FPT, VIC...)"
                            value={stockSymbol}
                            onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng thời gian phân tích</label>
                                            <select
                                                value={analysisPeriod}
                                                onChange={(e) => setAnalysisPeriod(Number(e.target.value))}
                                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                                            >
                                                {analysisPeriods.map(period => (
                                                    <option key={period.value} value={period.value}>
                                                        {period.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Số lượng cổ phiếu đang nắm giữ <span className="text-gray-500 text-xs">(không bắt buộc)</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Nhập số lượng cổ phiếu bạn đang sở hữu"
                                            value={sharesOwned}
                                            onChange={handleSharesChange}
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                                        />
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-3">Tùy chọn hiển thị</p>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={showCompanyInfo} 
                                                    onChange={() => setShowCompanyInfo(!showCompanyInfo)}
                                                    className="rounded text-gray-600 focus:ring-gray-400"
                                                />
                                                <span className="text-sm text-gray-700">Hiển thị thông tin công ty</span>
                                            </label>
                                            
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={showFinancialInfo} 
                                                    onChange={() => setShowFinancialInfo(!showFinancialInfo)}
                                                    className="rounded text-gray-600 focus:ring-gray-400"
                                                />
                                                <span className="text-sm text-gray-700">Hiển thị thông tin tài chính</span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <button
                            onClick={analyzeStock} 
                            disabled={loading}
                                        className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                        >
                            {loading ? (
                                <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span className="font-medium">Đang phân tích...</span>
                                            </>
                                        ) : (
                                            <>
                                                <LineChart className="w-5 h-5" />
                                                <span className="font-medium">Phân tích</span>
                                            </>
                                        )}
                                    </button>
                                
                                    {(analysis !== null || loading) && (
                                        <div className="mt-8">
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200 transition-all">
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <p className="text-sm text-gray-600 font-medium">Kết quả phân tích</p>
                                                    <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                                                        {analysisPeriod === 0 ? 'Tất cả' : `${analysisPeriod} ngày`}
                                                    </span>
                                                    {sharesOwned && parseInt(sharesOwned) > 0 && (
                                                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                                                            {sharesOwned} cổ phiếu
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {!showCompanyInfo && (
                                                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                                                            Không hiển thị thông tin công ty
                                                        </span>
                                                    )}
                                                    {!showFinancialInfo && (
                                                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                                                            Không hiển thị thông tin tài chính
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {loading ? (
                                                    <div className="text-center py-8">
                                                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-gray-500" />
                                                        <p className="mt-4 text-gray-700">Đang tìm thông tin...</p>
                                                    </div>
                                                ) : (
                                                    <div className="prose prose-slate prose-headings:text-gray-800 prose-strong:text-gray-700 prose-a:text-gray-600 hover:prose-a:text-gray-800 max-w-none">
                                                        <ReactMarkdown>{analysis || ''}</ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {stockHistory.length > 0 && (
                                        <div className="mt-8">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-sm font-medium text-gray-700">📜 Lịch sử tìm kiếm</p>
                                                <button
                                                    onClick={resetHistory}
                                                    className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
                                                >
                                                    Xóa lịch sử
                                                </button>
                                            </div>

                                            <div className="bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
                                                <div className="divide-y divide-gray-200">
                                                    {stockHistory.map((symbol, index) => (
                                                        <button 
                                                            key={index} 
                                                            className="p-4 text-sm hover:bg-gray-100 transition-colors w-full text-left"
                                                            onClick={() => {
                                                                setStockSymbol(symbol);
                                                                analyzeStock();
                                                            }}
                                                        >
                                                            <p className="font-medium text-gray-800">{symbol}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                                
                                <TabsContent value="portfolio" className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền đầu tư (VND)</label>
                                        <input
                                            type="text"
                                            placeholder="Nhập số tiền đầu tư (VD: 10000000)"
                                            value={investmentAmount}
                                            onChange={handleAmountChange}
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                                        />
                                        {investmentAmount && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                {new Intl.NumberFormat('vi-VN', { 
                                                    style: 'currency', 
                                                    currency: 'VND',
                                                    maximumFractionDigits: 0
                                                }).format(parseFloat(investmentAmount) || 0)}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phong cách đầu tư</label>
                                        <select
                                            value={investmentStyle}
                                            onChange={(e) => setInvestmentStyle(e.target.value)}
                                            className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                                        >
                                            {investmentStyles.map(style => (
                                                <option key={style.value} value={style.value}>
                                                    {style.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                        <h3 className="text-sm font-medium text-gray-700 mb-2">Mô tả phong cách đầu tư</h3>
                                        {investmentStyle === 'conservative' && (
                                            <p className="text-sm text-gray-600">
                                                <strong>An toàn:</strong> Ưu tiên bảo toàn vốn, phân bổ nhiều vào cổ phiếu blue-chip, cổ tức cao và có độ biến động thấp. Lợi nhuận kỳ vọng thấp hơn nhưng ổn định.
                                            </p>
                                        )}
                                        {investmentStyle === 'balanced' && (
                                            <p className="text-sm text-gray-600">
                                                <strong>Cân bằng:</strong> Kết hợp giữa an toàn và tăng trưởng, phân bổ hợp lý giữa cổ phiếu blue-chip và cổ phiếu tăng trưởng. Mức rủi ro và lợi nhuận kỳ vọng ở mức trung bình.
                                            </p>
                                        )}
                                        {investmentStyle === 'growth' && (
                                            <p className="text-sm text-gray-600">
                                                <strong>Tăng trưởng:</strong> Ưu tiên tìm kiếm lợi nhuận cao, phân bổ nhiều vào cổ phiếu tăng trưởng và cổ phiếu có biến động cao. Chấp nhận mức độ rủi ro cao hơn.
                                            </p>
                                        )}
                                        {investmentStyle === 'aggressive' && (
                                            <p className="text-sm text-gray-600">
                                                <strong>Mạo hiểm:</strong> Tìm kiếm lợi nhuận tối đa, ưu tiên cổ phiếu biến động mạnh, penny stocks hoặc cổ phiếu ngành mới nổi. Mức độ rủi ro rất cao nhưng có khả năng sinh lời lớn.
                                            </p>
                                        )}
                                    </div>
                                    
                                    <button
                                        onClick={generatePortfolio}
                                        disabled={portfolioLoading || !investmentAmount}
                                        className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 shadow-lg"
                                    >
                                        {portfolioLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span className="font-medium">Đang tạo danh mục...</span>
                                </>
                            ) : (
                                            <>
                                                <PieChart className="w-5 h-5" />
                                                <span className="font-medium">Tạo danh mục đầu tư</span>
                                            </>
                                        )}
                                    </button>
                                    
                                    {(portfolioAllocation !== null || portfolioLoading) && (
                                        <div className="mt-8">
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl border-2 border-gray-200 transition-all">
                                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                                    <p className="text-sm text-gray-600 font-medium">Phân bổ danh mục đầu tư</p>
                                                    <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                                                        {new Intl.NumberFormat('vi-VN', { 
                                                            style: 'currency', 
                                                            currency: 'VND',
                                                            maximumFractionDigits: 0
                                                        }).format(parseFloat(investmentAmount) || 0)}
                                                    </span>
                                                    <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                                                        {investmentStyles.find(s => s.value === investmentStyle)?.label || 'Cân bằng'}
                                                    </span>
                    </div>

                                                {portfolioLoading ? (
                                                    <div className="text-center py-8">
                                                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-gray-500" />
                                                        <p className="mt-4 text-gray-700">Đang tạo danh mục đầu tư...</p>
                                                    </div>
                                                ) : (
                                                    <div className="prose prose-slate prose-headings:text-gray-800 prose-strong:text-gray-700 prose-a:text-gray-600 hover:prose-a:text-gray-800 prose-table:w-full prose-table:border-collapse prose-td:border prose-td:border-gray-300 prose-td:p-2 prose-th:border prose-th:border-gray-300 prose-th:p-2 prose-th:bg-gray-100 max-w-none">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{portfolioAllocation || ''}</ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 