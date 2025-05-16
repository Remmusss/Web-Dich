'use client';

import { useAuth } from '../contexts/AuthContext';
import { ExpenseManager } from '../components/ExpenseManager';
import { useEffect } from 'react';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function MoneyLovePage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Yêu cầu đăng nhập</h2>
                    <p className="text-gray-600 mb-6">Vui lòng đăng nhập để sử dụng tính năng quản lý chi tiêu</p>
                    <div className="flex justify-center">
                        <GoogleLoginButton />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <ExpenseManager />
        </div>
    );
}
