const API_BASE_URL = 'https://api.mail.tm'

export interface Domain {
    id: string
    domain: string
    isActive: boolean
    isPrivate: boolean
}

export interface Account {
    id: string
    address: string
    quota: number
    used: number
    isDisabled: boolean
    isDeleted: boolean
    createdAt: string
    updatedAt: string
}

export interface Message {
    id: string
    accountId: string
    msgid: string
    from: {
        name: string
        address: string
    }
    to: Array<{
        name: string
        address: string
    }>
    subject: string
    intro: string
    seen: boolean
    isDeleted: boolean
    hasAttachments: boolean
    size: number
    downloadUrl: string
    createdAt: string
    updatedAt: string
}

export interface MessageDetails extends Omit<Message, 'intro'> {
    cc: string[]
    bcc: string[]
    text: string
    html: string[]
    attachments: Array<{
        id: string
        filename: string
        contentType: string
        disposition: string
        size: number
        downloadUrl: string
    }>
}

export interface StoredAccount {
    address: string
    password: string
    token: string
    id: string
}

class MailTmService {
    private token: string | null = null
    private currentAccount: StoredAccount | null = null

    constructor() {
        // Load saved account on initialization
        this.loadSavedAccount()
    }

    private loadSavedAccount() {
        if (typeof window === 'undefined') return

        const savedAccount = localStorage.getItem('tempmail_account')
        if (savedAccount) {
            try {
                const account = JSON.parse(savedAccount)
                this.currentAccount = account
                this.token = account.token
            } catch (err) {
                console.error('Failed to load saved account:', err)
                localStorage.removeItem('tempmail_account')
            }
        }
    }

    private saveAccount(account: StoredAccount) {
        if (typeof window === 'undefined') return

        this.currentAccount = account
        localStorage.setItem('tempmail_account', JSON.stringify(account))
    }

    async getDomains(): Promise<Domain[]> {
        const response = await fetch(`${API_BASE_URL}/domains`)
        const data = await response.json()
        return data['hydra:member']
    }

    async createAccount(address: string, password: string): Promise<Account> {
        const response = await fetch(`${API_BASE_URL}/accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address, password }),
        })

        if (!response.ok) {
            throw new Error('Failed to create account')
        }

        const account = await response.json()
        
        // Login after creating account
        const token = await this.login(address, password)
        
        // Save account info
        this.saveAccount({
            address,
            password,
            token,
            id: account.id
        })

        return account
    }

    async login(address: string, password: string): Promise<string> {
        const response = await fetch(`${API_BASE_URL}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ address, password }),
        })

        if (!response.ok) {
            throw new Error('Failed to login')
        }

        const data = await response.json()
        this.token = data.token
        return data.token
    }

    async getMessages(page = 1): Promise<Message[]> {
        if (!this.token) throw new Error('Not authenticated')

        const response = await fetch(`${API_BASE_URL}/messages?page=${page}`, {
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
        })

        if (!response.ok) {
            throw new Error('Failed to fetch messages')
        }

        const data = await response.json()
        return data['hydra:member']
    }

    async getMessage(id: string): Promise<MessageDetails> {
        if (!this.token) throw new Error('Not authenticated')

        const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
        })

        if (!response.ok) {
            throw new Error('Failed to fetch message')
        }

        return response.json()
    }

    async deleteMessage(id: string): Promise<void> {
        if (!this.token) throw new Error('Not authenticated')

        const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
        })

        if (!response.ok) {
            throw new Error('Failed to delete message')
        }
    }

    async deleteAccount(id: string): Promise<void> {
        if (!this.token) throw new Error('Not authenticated')

        const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${this.token}`,
            },
        })

        if (!response.ok) {
            throw new Error('Failed to delete account')
        }
    }

    setToken(token: string) {
        this.token = token
    }

    getToken(): string | null {
        return this.token
    }

    getCurrentAccount(): StoredAccount | null {
        return this.currentAccount
    }

    logout() {
        this.token = null
        this.currentAccount = null
        if (typeof window !== 'undefined') {
            localStorage.removeItem('tempmail_account')
        }
    }
}

export const mailTmService = new MailTmService() 