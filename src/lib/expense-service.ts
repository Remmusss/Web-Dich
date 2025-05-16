import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc, orderBy, limit, setDoc, getDoc } from 'firebase/firestore';

export interface UserSettings {
    currency: {
        symbol: string;
        position: 'before' | 'after';
        decimalSeparator: string;
        thousandsSeparator: string;
    };
}

export interface Expense {
    id?: string;
    userId: string;
    amount: number;
    category: string;
    description: string;
    date: Date;
    createdAt: Date;
    type: 'income' | 'expense';
}

export interface Wallet {
    id?: string;
    userId: string;
    balance: number;
    lastUpdated: Date;
}

export class ExpenseService {
    private static instance: ExpenseService;

    private constructor() {}

    public static getInstance(): ExpenseService {
        if (!ExpenseService.instance) {
            ExpenseService.instance = new ExpenseService();
        }
        return ExpenseService.instance;
    }

    async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
        try {
            const expenseData = {
                ...expense,
                createdAt: new Date(),
                date: expense.date instanceof Date ? expense.date : new Date(expense.date)
            };

            // Thêm giao dịch mới
            const docRef = await addDoc(collection(db, 'expenses'), expenseData);
            
            // Cập nhật số dư ví ngay lập tức
            const walletRef = doc(db, 'wallets', expense.userId);
            const walletSnap = await getDoc(walletRef);
            const currentBalance = walletSnap.exists() ? walletSnap.data().balance : 0;
            await updateDoc(walletRef, {
                balance: currentBalance + expense.amount,
                lastUpdated: new Date()
            });

            return {
                ...expenseData,
                id: docRef.id
            };
        } catch (error) {
            console.error('Error adding expense:', error);
            throw error;
        }
    }

    async getExpenses(userId: string): Promise<Expense[]> {
        try {
            const q = query(
                collection(db, 'expenses'),
                where('userId', '==', userId),
                orderBy('date', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    ...data,
                    id: doc.id,
                    date: data.date?.toDate?.() || new Date(),
                    createdAt: data.createdAt?.toDate?.() || new Date()
                } as Expense;
            });
        } catch (error) {
            console.error('Error getting expenses:', error);
            throw error;
        }
    }

    async deleteExpense(expenseId: string): Promise<void> {
        try {
            // Lấy thông tin giao dịch trước khi xóa
            const expenseDoc = await getDoc(doc(db, 'expenses', expenseId));
            const expense = expenseDoc.data() as Expense;
            
            // Cập nhật số dư ví
            const walletRef = doc(db, 'wallets', expense.userId);
            const walletSnap = await getDoc(walletRef);
            const currentBalance = walletSnap.exists() ? walletSnap.data().balance : 0;
            await updateDoc(walletRef, {
                balance: currentBalance - expense.amount,
                lastUpdated: new Date()
            });
            
            await deleteDoc(doc(db, 'expenses', expenseId));
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    }

    async updateExpense(expenseId: string, expense: Partial<Expense>): Promise<void> {
        try {
            // Lấy thông tin giao dịch cũ
            const oldExpenseDoc = await getDoc(doc(db, 'expenses', expenseId));
            const oldExpense = oldExpenseDoc.data() as Expense;
            
            const expenseData = {
                ...expense,
                date: expense.date instanceof Date ? expense.date : new Date(expense.date!)
            };
            
            // Cập nhật số dư ví
            if (expense.amount !== undefined && expense.amount !== oldExpense.amount) {
                const walletRef = doc(db, 'wallets', oldExpense.userId);
                const walletSnap = await getDoc(walletRef);
                const currentBalance = walletSnap.exists() ? walletSnap.data().balance : 0;
                const balanceChange = expense.amount - oldExpense.amount;
                await updateDoc(walletRef, {
                    balance: currentBalance + balanceChange,
                    lastUpdated: new Date()
                });
            }
            
            await updateDoc(doc(db, 'expenses', expenseId), expenseData);
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    }

    async getUserSettings(userId: string): Promise<UserSettings> {
        try {
            const docRef = doc(db, 'userSettings', userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data() as UserSettings;
            } else {
                const defaultSettings: UserSettings = {
                    currency: {
                        symbol: 'đ',
                        position: 'after',
                        decimalSeparator: ',',
                        thousandsSeparator: '.'
                    }
                };
                await setDoc(docRef, defaultSettings);
                return defaultSettings;
            }
        } catch (error) {
            console.error('Error getting user settings:', error);
            throw error;
        }
    }

    async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
        try {
            const docRef = doc(db, 'userSettings', userId);
            await setDoc(docRef, settings, { merge: true });
        } catch (error) {
            console.error('Error updating user settings:', error);
            throw error;
        }
    }

    formatCurrency(amount: number, settings: UserSettings): string {
        const { symbol, position, decimalSeparator, thousandsSeparator } = settings.currency;
        const isNegative = amount < 0;
        const absoluteAmount = Math.abs(amount);
        const formattedAmount = absoluteAmount
            .toFixed(0)
            .replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
        
        const sign = isNegative ? '-' : '';
        return position === 'before' 
            ? `${sign}${symbol}${formattedAmount}`
            : `${sign}${formattedAmount}${symbol}`;
    }

    async getWallet(userId: string): Promise<Wallet> {
        try {
            const docRef = doc(db, 'wallets', userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    ...data,
                    id: docSnap.id,
                    lastUpdated: data.lastUpdated?.toDate?.() || new Date()
                } as Wallet;
            } else {
                const defaultWallet: Wallet = {
                    userId,
                    balance: 0,
                    lastUpdated: new Date()
                };
                await setDoc(docRef, defaultWallet);
                return defaultWallet;
            }
        } catch (error) {
            console.error('Error getting wallet:', error);
            throw error;
        }
    }

    async updateWalletBalance(userId: string, newBalance: number): Promise<void> {
        try {
            const docRef = doc(db, 'wallets', userId);
            await updateDoc(docRef, {
                balance: newBalance,
                lastUpdated: new Date()
            });
        } catch (error) {
            console.error('Error updating wallet:', error);
            throw error;
        }
    }
} 