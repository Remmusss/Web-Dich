import StockAnalyzer from '@/components/StockAnalyzer';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Phân Tích Chứng Khoán | AI Stock Analysis',
    description: 'Phân tích chi tiết về mã chứng khoán, tình hình tài chính và đưa ra lời khuyên đầu tư dựa trên AI',
    keywords: 'chứng khoán, phân tích cổ phiếu, đầu tư, tài chính, AI analysis, stock market',
};

export default function StockAnalyzerPage() {
    return (
        <main className="min-h-screen bg-background">
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-bold text-center mb-8">
                    Phân Tích Chứng Khoán AI
                </h1>
                <StockAnalyzer />
            </div>
        </main>
    );
} 