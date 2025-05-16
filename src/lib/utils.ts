import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function base64ToFile(base64Data: string, mimeType: string, fileName: string = 'file'): File {
  // Remove data URL prefix if present
  const base64String = base64Data.split(',')[1] || base64Data;
  
  // Convert base64 to binary
  const binaryData = atob(base64String);
  const arrayBuffer = new ArrayBuffer(binaryData.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  
  for (let i = 0; i < binaryData.length; i++) {
    uint8Array[i] = binaryData.charCodeAt(i);
  }
  
  // Create blob and file
  const blob = new Blob([arrayBuffer], { type: mimeType });
  return new File([blob], fileName, { type: mimeType });
}

type ApiKeyType = 'gemini' | 'openai' | 'openrouter';

class ApiKeyManager {
  private keyMap: Map<ApiKeyType, string[]>;
  private currentIndices: Map<ApiKeyType, number>;
  private static instance: ApiKeyManager;

  private constructor() {
    this.keyMap = new Map();
    this.currentIndices = new Map();
    this.initializeKeys();
  }

  private initializeKeys() {
    // Initialize Gemini keys
    const geminiKeys = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.split('|') || [];
    if (geminiKeys.length > 0) {
      this.keyMap.set('gemini', geminiKeys);
      this.currentIndices.set('gemini', 0);
    }

    // Initialize OpenAI keys
    const openaiKeys = process.env.NEXT_PUBLIC_OPENAI_API_KEY?.split('|') || [];
    if (openaiKeys.length > 0) {
      this.keyMap.set('openai', openaiKeys);
      this.currentIndices.set('openai', 0);
    }

    // Initialize OpenRouter keys
    const openrouterKeys = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY?.split('|') || [];
    if (openrouterKeys.length > 0) {
      this.keyMap.set('openrouter', openrouterKeys);
      this.currentIndices.set('openrouter', 0);
    }
  }

  public static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  public getCurrentKey(type: ApiKeyType): string {
    const keys = this.keyMap.get(type);
    const currentIndex = this.currentIndices.get(type);
    
    if (!keys || currentIndex === undefined) {
      throw new Error(`No API keys configured for ${type}`);
    }
    
    return keys[currentIndex];
  }

  public getNextKey(type: ApiKeyType): string {
    const keys = this.keyMap.get(type);
    const currentIndex = this.currentIndices.get(type);
    
    if (!keys || currentIndex === undefined) {
      throw new Error(`No API keys configured for ${type}`);
    }
    
    const nextIndex = (currentIndex + 1) % keys.length;
    this.currentIndices.set(type, nextIndex);
    return keys[nextIndex];
  }

  public getRandomKey(type: ApiKeyType): string {
    const keys = this.keyMap.get(type);
    
    if (!keys) {
      throw new Error(`No API keys configured for ${type}`);
    }
    
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
  }

  public hasKeys(type: ApiKeyType): boolean {
    return this.keyMap.has(type) && (this.keyMap.get(type)?.length || 0) > 0;
  }

  public getKeyCount(type: ApiKeyType): number {
    return this.keyMap.get(type)?.length || 0;
  }
}

export const apiKeyManager = ApiKeyManager.getInstance();
