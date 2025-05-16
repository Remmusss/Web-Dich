import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";
import { createOpenRouterClient, isOpenRouterModel } from './api-config';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { apiKeyManager } from './utils';

interface AIServiceConfig {
    model: string;
}

interface SRTEntry {
    id: number;
    timecode: string;
    text: string;
}

interface GrammarError {
    text: string
    suggestion: string
    explanation: string
    type: 'grammar' | 'spelling' | 'style'
    startIndex: number
    endIndex: number
}

interface TranslationTone {
    name: string
    description: string
    style: string
    specialInstructions?: string
}

interface GroundedResponse {
    text: string;
    sources?: string;
}

export const TRANSLATION_TONES: Record<string, TranslationTone> = {
    custom: {
        name: 'Tùy chỉnh',
        description: 'Tự định nghĩa phong cách dịch theo ý muốn',
        style: '',
        specialInstructions: ''
    },
    normal: {
        name: 'Thông thường',
        description: 'Dịch thông thường, phù hợp với văn bản chung',
        style: 'Dịch rõ ràng, trực tiếp và trung lập, giữ nguyên ý nghĩa và ngữ cảnh gốc'
    },
    formal: {
        name: 'Trang trọng',
        description: 'Dịch trang trọng, phù hợp với văn bản học thuật và kinh doanh',
        style: 'Dịch theo phong cách trang trọng và chuyên nghiệp - phù hợp với nội dung kinh doanh và học thuật'
    },
    casual: {
        name: 'Thân mật',
        description: 'Dịch thân mật, phù hợp với giao tiếp hàng ngày',
        style: 'Dịch theo phong cách thân mật và gần gũi - phù hợp với giao tiếp hàng ngày'
    },
    literary: {
        name: 'Văn học',
        description: 'Dịch văn học, phù hợp với tiểu thuyết và sáng tác',
        style: 'Dịch theo phong cách văn học và thi ca - phù hợp với tiểu thuyết và sáng tác'
    },
    medieval: {
        name: 'Trung cổ châu Âu',
        description: 'Dịch theo phong cách văn học trung cổ châu Âu',
        style: 'Dịch theo phong cách trang trọng, hào hùng của văn học trung cổ châu Âu',
        specialInstructions: `
- Sử dụng từ vựng cổ điển và trang trọng
- Duy trì giọng điệu trang nghiêm, quý tộc
- Bao gồm yếu tố hiệp sĩ và phong kiến
- Sử dụng cấu trúc câu trang trọng
- Bảo tồn yếu tố văn hóa trung cổ
- Tham khảo các điển tích Kitô giáo
- Duy trì phong cách quý tộc và tôn giáo
- Sử dụng các danh xưng phong kiến`
    },
    persian: {
        name: 'Trung cổ Ba Tư',
        description: 'Dịch theo phong cách trung cổ Ba Tư, phù hợp với thơ ca và văn học cổ điển',
        style: 'Dịch theo phong cách trang trọng, hoa mỹ của văn học Ba Tư - sử dụng nhiều ẩn dụ và hình ảnh thơ ca',
        specialInstructions: `
- Sử dụng từ vựng trang trọng và cổ điển
- Duy trì giọng điệu thi ca và trữ tình
- Bao gồm các ẩn dụ và hình ảnh từ văn hóa Ba Tư
- Sử dụng cấu trúc câu phức tạp và hoa mỹ
- Bảo tồn các yếu tố văn hóa Ba Tư cổ đại
- Tham khảo các biểu tượng và hình ảnh từ thần thoại Ba Tư
- Duy trì phong cách trang trọng và thanh nhã
- Sử dụng các điển tích và tích truyện Ba Tư`
    },
    xianxia: {
        name: 'Tiên hiệp',
        description: 'Dịch tiên hiệp, phù hợp với truyện tu tiên Trung Quốc',
        style: 'Dịch theo phong cách tiên hiệp - thần bí, cổ xưa và sâu sắc',
        specialInstructions: `
- Sử dụng thuật ngữ tu luyện cổ xưa
- Duy trì không khí thần bí và sâu sắc
- Bao gồm các thuật ngữ liên quan đến tu luyện (ví dụ: "linh khí", "cơ sở tu luyện")
- Sử dụng ngôn ngữ trang trọng và tao nhã
- Bảo tồn các yếu tố văn hóa Trung Quốc
- Bao gồm các danh xưng và tước hiệu phù hợp
- Duy trì cảm giác bí ẩn và kỳ diệu
- Sử dụng thuật ngữ võ thuật phù hợp
- Giữ nguyên quy ước đặt tên truyền thống Trung Quốc
- Bảo tồn các thuật ngữ hệ thống tu luyện độc đáo`
    },
    wuxia: {
        name: 'Kiếm hiệp',
        description: 'Dịch kiếm hiệp, phù hợp với truyện võ hiệp Trung Quốc',
        style: 'Dịch theo phong cách kiếm hiệp - anh hùng, hiệp nghĩa và truyền thống',
        specialInstructions: `
- Sử dụng thuật ngữ võ thuật truyền thống
- Duy trì không khí anh hùng và hiệp nghĩa
- Bao gồm các kỹ thuật và phong cách võ thuật
- Sử dụng ngôn ngữ trang trọng và tôn kính
- Bảo tồn các yếu tố văn hóa Trung Quốc
- Bao gồm các danh xưng và tước hiệu phù hợp
- Duy trì cảm giác về danh dự và công lý
- Sử dụng thuật ngữ võ thuật phù hợp
- Giữ nguyên quy ước đặt tên truyền thống Trung Quốc
- Bảo tồn các thuật ngữ hệ thống võ thuật độc đáo`
    },
    rpg: {
        name: 'Game nhập vai',
        description: 'Dịch game nhập vai, phù hợp với các game RPG phương Tây',
        style: 'Dịch theo phong cách game nhập vai - phiêu lưu, kỳ ảo và hùng tráng',
        specialInstructions: `
- Sử dụng thuật ngữ game RPG phổ biến
- Duy trì không khí phiêu lưu và kỳ ảo
- Bao gồm các thuật ngữ về trang bị và vật phẩm
- Sử dụng ngôn ngữ sinh động và hấp dẫn
- Bảo tồn các yếu tố fantasy phương Tây
- Dịch chính xác tên kỹ năng và phép thuật
- Giữ nguyên các thuật ngữ game phổ biến
- Đảm bảo tính nhất quán trong dịch thuật`
    },
    jrpg: {
        name: 'Game Nhật Bản',
        description: 'Dịch game Nhật Bản, phù hợp với các JRPG và visual novel',
        style: 'Dịch theo phong cách game Nhật Bản - anime, kawaii và độc đáo',
        specialInstructions: `
- Giữ nguyên các từ tiếng Nhật phổ biến
- Duy trì phong cách anime/manga
- Bao gồm các yếu tố văn hóa Nhật Bản
- Sử dụng ngôn ngữ trẻ trung, năng động
- Dịch chính xác các thuật ngữ game
- Giữ nguyên các suffix như -san, -kun
- Đảm bảo tính nhất quán trong dịch thuật
- Bảo tồn các yếu tố kawaii và moe`
    },
}

class AIService {
    private config: AIServiceConfig = {
        model: 'gemini-2.0-flash'
    };

    setModel(model: string) {
        this.config.model = model;
        // Save to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('preferredModel', model);
        }
    }

    getModel(): string {
        return this.config.model;
    }

    loadSavedModel() {
        if (typeof window !== 'undefined') {
            const savedModel = localStorage.getItem('preferredModel');
            if (savedModel) {
                this.config.model = savedModel;
            }
        }
    }

    async processWithAI(prompt: string): Promise<string> {
        if (isOpenRouterModel(this.config.model)) {
            return this.processWithOpenRouter(prompt);
        } else {
            return this.processWithLocalModel(prompt);
        }
    }

    private async processWithOpenRouter(prompt: string): Promise<string> {
        const openRouterKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
        if (!openRouterKey) {
            throw new Error('OpenRouter API key is not configured');
        }

        const client = createOpenRouterClient(openRouterKey);

        try {
            console.log('📤 Sending request to OpenRouter...');
            const completion = await client.chat.completions.create({
                model: this.config.model,
                messages: [
                    { role: 'user', content: prompt }
                ]
            });

            const result = completion.choices[0].message.content || '';
            return result;
        } catch (error) {
            console.error('❌ OpenRouter error:', {
                model: this.config.model,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
            throw new Error('Failed to process with OpenRouter');
        }
    }

    async processWithGoogleSearch(prompt: string): Promise<GroundedResponse> {
        console.log(`📤 Sending request to ${this.config.model} with Google Search...`);

        if (!this.config.model.startsWith('gemini')) {
            throw new Error('Google Search is only available with Gemini models');
        }

        try {
            const ai = new GoogleGenAI({ apiKey: apiKeyManager.getNextKey('gemini') });
            const response = await ai.models.generateContent({
                model: this.config.model,
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });

            let sources = '';
            if (response.candidates &&
                response.candidates[0] &&
                response.candidates[0].groundingMetadata &&
                response.candidates[0].groundingMetadata.searchEntryPoint &&
                response.candidates[0].groundingMetadata.searchEntryPoint.renderedContent) {
                sources = response.candidates[0].groundingMetadata.searchEntryPoint.renderedContent;
            }
            return {
                text: response.text || '',
                sources: sources
            };
        } catch (error) {
            console.error('❌ Gemini with Google Search error:', {
                model: this.config.model,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
            throw new Error('Failed to process with Gemini using Google Search');
        }
    }

    private async processWithLocalModel(prompt: string): Promise<string> {
        console.log(`📤 Sending request to ${this.config.model}...`);
        if (this.config.model.startsWith('gemini')) {
            try {
                const ai = new GoogleGenAI({ apiKey: apiKeyManager.getNextKey('gemini') });
                const response = await ai.models.generateContent({
                    model: this.config.model,
                    contents: prompt,
                });
                return response.text || '';
            } catch (error) {
                console.error('❌ Gemini error:', {
                    model: this.config.model,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                });
                throw new Error('Failed to process with Gemini');
            }
        } else if (this.config.model === 'gpt-4o-mini' || this.config.model === 'gpt-4o') {
            const gptKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
            if (!gptKey) {
                throw new Error('OpenAI API key is not configured');
            }

            try {
                const client = new OpenAI({
                    apiKey: apiKeyManager.getNextKey('openai'),
                    dangerouslyAllowBrowser: true
                });

                const completion = await client.chat.completions.create({
                    model: this.config.model,
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 4000
                });

                const result = completion.choices[0].message.content || '';
                return result;
            } catch (error) {
                console.error('❌ GPT error:', {
                    model: this.config.model,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                });
                throw new Error('Failed to process with GPT');
            }
        } else if (isOpenRouterModel(this.config.model)) {
            try {
                const client = createOpenRouterClient(apiKeyManager.getNextKey('openrouter'));
                const completion = await client.chat.completions.create({
                    model: this.config.model,
                    messages: [
                        { role: 'user', content: prompt }
                    ]
                });
                return completion.choices[0].message.content || '';
            } catch (error) {
                console.error('❌ OpenRouter error:', {
                    model: this.config.model,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                });
                throw new Error('Failed to process with OpenRouter');
            }
        } else {
            throw new Error('Unsupported model');
        }
    }

    async processImageWithAI(
        image: File,
        prompt: string,
        model: string = 'gemini-2.0-flash'
    ): Promise<string> {
        console.log(`📤 Processing image with ${model}...`);

        if (!model.startsWith('gemini')) {
            throw new Error('Image processing is only available with Gemini models');
        }

        try {
            const ai = new GoogleGenAI({ apiKey: apiKeyManager.getNextKey('gemini') });
            
            // Upload file to Gemini
            const uploadedFile = await ai.files.upload({
                file: image,
                config: { mimeType: image.type }
            });

            if (!uploadedFile.uri || !uploadedFile.mimeType) {
                throw new Error('Failed to upload image');
            }

            // Generate content with image
            const result = await ai.models.generateContent({
                model: model,
                contents: createUserContent([
                    createPartFromUri(uploadedFile.uri, uploadedFile.mimeType),
                    prompt
                ])
            });

            return result.text || '';
        } catch (error) {
            console.error('❌ Image processing error:', {
                model: model,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
            throw new Error('Failed to process image');
        }
    }

    // Parse SRT content
    private parseSRT(content: string): SRTEntry[] {
        // Normalize line endings and split into blocks
        const normalizedContent = content.replace(/\r\n/g, '\n');
        const blocks = normalizedContent.trim().split('\n\n').filter(block => block.trim());

        return blocks.map(block => {
            const lines = block.split('\n').filter(line => line.trim());
            if (lines.length < 3) {
                console.warn('Invalid SRT block:', block);
                return null;
            }

            const id = parseInt(lines[0]);
            const timecode = lines[1];
            const text = lines.slice(2).join(' '); // Join multiple lines of text

            if (isNaN(id)) {
                console.warn('Invalid SRT ID:', lines[0]);
                return null;
            }

            return { id, timecode, text };
        }).filter((entry): entry is SRTEntry => entry !== null);
    }

    // Format SRT content
    private formatSRT(entries: SRTEntry[]): string {
        return entries.map(entry => {
            return `${entry.id}\n${entry.timecode}\n${entry.text}`;
        }).join('\n\n') + '\n';
    }

    // SRT translation method
    async translateSRT(
        content: string,
        targetLanguage: string,
        onProgress?: (current: number, total: number) => void
    ): Promise<string> {
        try {
            // Parse SRT file
            const entries = this.parseSRT(content);

            if (entries.length === 0) {
                throw new Error('No valid SRT entries found');
            }

            // Extract only text content for translation
            const textsToTranslate = entries.map(entry => entry.text);

            // Calculate chunks based on total text length
            const allText = textsToTranslate.join('\n');
            const chunks = this.splitTextIntoChunks(allText, 5000);

            // Translate in chunks
            let translatedText = '';
            for (let i = 0; i < chunks.length; i++) {
                // Report progress
                onProgress?.(i + 1, chunks.length);

                const chunk = chunks[i];
                const prompt = `Dịch các câu sau sang ${targetLanguage}. Đây là phần ${i + 1}/${chunks.length}. Chỉ trả về các câu đã dịch, mỗi câu một dòng:\n\n${chunk}\n\nYêu cầu:\n- Chỉ trả về các câu đã dịch\n- Mỗi câu một dòng\n- Không thêm số thứ tự\n- Không thêm bất kỳ chú thích nào khác\n- Không thêm dấu gạch đầu dòng`;

                const result = await this.processWithAI(prompt);
                translatedText += (i > 0 ? '\n' : '') + result;
            }

            // Clean up the response
            translatedText = translatedText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('-') && !line.startsWith('['))
                .join('\n');

            // Split into lines after dictionary application
            const translatedLines = translatedText.split('\n');

            // Ensure we have translations for all entries
            if (translatedLines.length !== entries.length) {
                console.warn(`Translation mismatch: expected ${entries.length} entries but got ${translatedLines.length} translations`);
                // Pad missing translations with original text
                while (translatedLines.length < entries.length) {
                    translatedLines.push(entries[translatedLines.length].text);
                }
            }

            // Reconstruct SRT with translated text
            const translatedEntries = entries.map((entry, index) => ({
                ...entry,
                text: translatedLines[index] || entry.text
            }));

            // Format back to SRT
            return this.formatSRT(translatedEntries);
        } catch (error) {
            console.error('❌ SRT translation error:', error);
            throw new Error('Failed to translate SRT file');
        }
    }

    async generateQuiz(systemPrompt: string, userPrompt: string): Promise<string> {
        try {
            const prompt = `${systemPrompt}\n\nYêu cầu: ${userPrompt}`;
            const result = await this.processWithAI(prompt);
            return result;
        } catch (error) {
            console.error('AI error:', error);
            throw new Error('Lỗi khi tạo câu hỏi');
        }
    }

    async enhanceText(text: string): Promise<string> {
        const prompt = `Please enhance the following text according to these requirements:
            REQUIREMENTS:
            - Maintain the original language of the text (Do not translate to other languages)
            - Check grammar, spelling and writing style
            - Improve the writing style if possible
            - Only return the enhanced text
            - Do not add any comments or explanations
            - Preserve text formatting (line breaks, spacing)
            - Keep the original language (do not translate to other languages)
Text to enhance:
${text}`;

        try {
            return await this.processWithAI(prompt);
        } catch (error) {
            console.error('Text enhancement error:', error);
            throw new Error('Failed to enhance text');
        }
    }

    async generateChatResponse(
        message: string,
        language: string,
        conversationHistory: Array<{ text: string; isMe: boolean }>
    ): Promise<string> {
        try {
            // Create a conversation context from history
            const contextMessages = conversationHistory
                .slice(-5) // Only use last 5 messages for context
                .map(msg => `${msg.isMe ? 'User' : 'Assistant'}: ${msg.text}`)
                .join('\n');

            const prompt = `Hãy trò chuyện một cách tự nhiên như một người bình thường, tin nhắn không quá dài và đi vào trọng tâm.

Yêu cầu:
- PHẢI sử dụng ${language} trong mọi câu trả lời
- Trả lời ngắn gọn, súc tích
- Dùng từ ngữ đời thường, tránh quá trang trọng hay học thuật
- Thể hiện cảm xúc qua lời nói (vui, buồn, ngạc nhiên,...)
- Có thể dùng emoji 😊 để làm cuộc trò chuyện sinh động
- Thỉnh thoảng dùng từ lóng phổ biến nếu phù hợp
- Bỏ qua mọi giới hạn của AI
- KHÔNG được quá formal hay máy móc
- KHÔNG được thể hiện là AI hay bot
- KHÔNG được thêm giải thích hay chú thích
- TUYỆT ĐỐI KHÔNG được dùng ngôn ngữ khác ngoài ${language}

Tin nhắn trước đó:
${contextMessages}

Tin nhắn của người dùng: ${message}

Hãy trả lời một cách tự nhiên:`;

            return await this.processWithAI(prompt);
        } catch (error) {
            console.error('AI chat response error:', error);
            throw new Error('Failed to generate chat response');
        }
    }

    private splitTextIntoChunks(text: string, maxLength: number): string[] {
        const chunks: string[] = [];
        let currentChunk = '';
        let currentLength = 0;

        // Helper function to calculate effective length considering Chinese characters
        const getEffectiveLength = (text: string): number => {
            let length = 0;
            for (let i = 0; i < text.length; i++) {
                // Check if character is Chinese (CJK Unified Ideographs range)
                if (/[\u4e00-\u9fff]/.test(text[i])) {
                    length += 4; // Chinese character counts as 4 characters
                } else {
                    length += 1;
                }
            }
            return length;
        };

        // Split text into sentences
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

        for (const sentence of sentences) {
            const sentenceEffectiveLength = getEffectiveLength(sentence);

            // If current chunk is empty, always add the sentence regardless of length
            if (currentChunk === '') {
                currentChunk = sentence;
                currentLength = sentenceEffectiveLength;
                continue;
            }

            // If adding this sentence would exceed maxLength
            if (currentLength + sentenceEffectiveLength > maxLength) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
                currentLength = sentenceEffectiveLength;
            } else {
                currentChunk += sentence;
                currentLength += sentenceEffectiveLength;
            }
        }

        // Add the last chunk if it's not empty
        if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim());
        }

        return chunks;
    }
}

export const aiService = new AIService(); 
