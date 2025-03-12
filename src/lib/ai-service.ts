import { GoogleGenerativeAI } from '@google/generative-ai';
import { createOpenRouterClient, isOpenRouterModel } from './api-config';
import { dictionaryService } from './dictionary-service';
import { OpenAI } from 'openai';

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
}

export const TRANSLATION_TONES: Record<string, TranslationTone> = {
    normal: {
        name: 'Normal',
        description: 'Dịch thông thường, phù hợp với văn bản chung',
        style: 'Clear, direct, and neutral translation maintaining the original meaning and context'
    },
    novel: {
        name: 'Chinese Novel',
        description: 'Tối ưu cho dịch tiểu thuyết Trung Quốc',
        style: 'Literary style with classical Chinese novel elements, martial arts terminology, cultivation terms, and poetic expressions'
    },
    academic: {
        name: 'Academic',
        description: 'Tối ưu cho dịch văn bản khoa học và chuyên ngành',
        style: 'Technical and specialized language with precise terminology, complex sentence structures, and detailed explanations'
    }
}

interface EnhancementOptions {
    improveStyle: boolean
    formalLevel: 'casual' | 'neutral' | 'formal'
    tone: 'friendly' | 'professional' | 'academic'
    preserveContext: boolean
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

    private async processWithLocalModel(prompt: string): Promise<string> {
        if (this.config.model === 'gemini-2.0-flash' || this.config.model === 'gemini-2.0-flash-lite') {
            const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            if (!geminiKey) {
                throw new Error('Gemini API key is not configured');
            }

            try {
                console.log(`📤 Sending request to ${this.config.model}...`);
                const genAI = new GoogleGenerativeAI(geminiKey);
                const geminiModel = genAI.getGenerativeModel({ model: this.config.model });
                const generationConfig = {
                    temperature: 1,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192
                };

                const chatSession = geminiModel.startChat({
                    generationConfig,
                    history: []
                });

                const result = await chatSession.sendMessage(prompt);
                return result.response.text();
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
                console.log('📤 Sending request to GPT-4o Mini...');
                const client = new OpenAI({
                    apiKey: gptKey,
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
        } else {
            throw new Error('Unsupported model');
        }
    }

    // Translation specific method
    async translate(
        text: string,
        targetLanguage: string,
        preserveContext: boolean,
        tone: string = 'normal',
        onProgress?: (current: number, total: number) => void
    ): Promise<string> {
        // Kiểm tra text trống
        if (!text.trim()) {
            return '';
        }

        // Tối ưu kích thước chunk dựa trên model
        const MAX_CHUNK_LENGTH = 3000;

        // Chuẩn hóa xuống dòng
        const normalizedText = text.replace(/\r\n/g, '\n');

        // Tách văn bản thành các đoạn dựa trên xuống dòng kép
        const paragraphs = normalizedText.split(/\n\s*\n/).filter(p => p.trim());

        // Nếu văn bản ngắn, xử lý trực tiếp
        if (text.length <= MAX_CHUNK_LENGTH) {
            onProgress?.(1, 1);
            const prompt = this.createTranslationPrompt(text, targetLanguage, preserveContext, { tone });
            const result = await this.processWithAI(prompt);
            return dictionaryService.applyDictionary(result);
        }

        // Nhóm các đoạn thành các chunk
        const chunks: string[] = [];
        let currentChunk = '';

        for (const paragraph of paragraphs) {
            // Nếu đoạn quá dài, chia nhỏ thành các câu
            if (paragraph.length > MAX_CHUNK_LENGTH) {
                const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
                for (const sentence of sentences) {
                    if (currentChunk.length + sentence.length > MAX_CHUNK_LENGTH && currentChunk) {
                        chunks.push(currentChunk.trim());
                        currentChunk = sentence;
                    } else {
                        currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
                    }
                }
            }
            // Nếu không, thêm cả đoạn vào chunk
            else {
                if (currentChunk.length + paragraph.length > MAX_CHUNK_LENGTH) {
                    chunks.push(currentChunk.trim());
                    currentChunk = paragraph;
                } else {
                    currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
                }
            }
        }

        // Thêm chunk cuối cùng nếu còn
        if (currentChunk) {
            chunks.push(currentChunk.trim());
        }

        // Dịch từng chunk
        const translatedChunks: string[] = [];
        let previousContext = '';

        for (let i = 0; i < chunks.length; i++) {
            onProgress?.(i + 1, chunks.length);

            const chunk = chunks[i];
            const isFirstChunk = i === 0;
            const isLastChunk = i === chunks.length - 1;

            // Tạo prompt với context
            let prompt = this.createTranslationPrompt(
                chunk,
                targetLanguage,
                preserveContext,
                {
                    previousContext: isFirstChunk ? '' : previousContext,
                    isFirstChunk,
                    isLastChunk,
                    totalChunks: chunks.length,
                    currentChunk: i + 1,
                    tone
                }
            );

            try {
                const result = await this.processWithAI(prompt);
                const processedResult = await dictionaryService.applyDictionary(result);
                translatedChunks.push(processedResult);

                // Lưu context cho chunk tiếp theo
                previousContext = processedResult.slice(-200); // Lấy 200 ký tự cuối làm context

                // Log tiến độ
                console.log(`✓ Completed chunk ${i + 1}/${chunks.length}`);
            } catch (error) {
                console.error(`Error translating chunk ${i + 1}:`, error);
                // Nếu lỗi, thử lại với chunk nhỏ hơn
                const subChunks = chunk.split(/[.!?] /).filter(Boolean);
                let subTranslated = '';
                for (const subChunk of subChunks) {
                    try {
                        const subPrompt = this.createTranslationPrompt(subChunk, targetLanguage, preserveContext, { tone });
                        const subResult = await this.processWithAI(subPrompt);
                        subTranslated += subResult + ' ';
                    } catch (e) {
                        console.error('Sub-chunk translation failed:', e);
                        subTranslated += subChunk + ' '; // Giữ nguyên text gốc nếu lỗi
                    }
                }
                translatedChunks.push(subTranslated.trim());
            }
        }

        // Kết hợp các chunk đã dịch
        return translatedChunks.join('\n\n');
    }

    private createTranslationPrompt(
        text: string,
        targetLanguage: string,
        preserveContext: boolean,
        options?: {
            previousContext?: string;
            isFirstChunk?: boolean;
            isLastChunk?: boolean;
            totalChunks?: number;
            currentChunk?: number;
            tone?: string;
        }
    ): string {
        // Determine the target language name and characteristics
        const languageCharacteristics = {
            vi: {
                name: 'Vietnamese',
                features: 'tonal language with six tones, no verb conjugation, extensive use of particles and context-dependent meanings',
                style: 'preference for concrete expressions, emphasis on politeness levels, and rich idiomatic expressions'
            },
            en: {
                name: 'English',
                features: 'subject-verb-object structure, verb tenses, articles, and prepositions',
                style: 'clear and direct expression, active voice preference, and diverse vocabulary'
            },
            // Add more languages as needed
        }[targetLanguage] || { name: targetLanguage, features: '', style: '' };

        const translationTone = TRANSLATION_TONES[options?.tone || 'normal'];

        let prompt = `You are an expert translator with native-level proficiency in both the source language and ${languageCharacteristics.name}. 
Your task is to provide a high-quality translation that sounds natural and authentic to native ${languageCharacteristics.name} speakers.

TRANSLATION STYLE:
${translationTone.style}

TRANSLATION CONTEXT:
${preserveContext ? `- Preserve the original context, style, tone, and cultural elements
- Maintain the author's voice and intended message
- Keep any specialized terminology or jargon in their appropriate context` : '- Focus on clarity and accuracy of meaning'}
${options?.previousContext ? `\nPrevious context for reference (use this to maintain consistency):\n${options.previousContext}` : ''}
${options?.totalChunks ? `\nThis is part ${options.currentChunk}/${options.totalChunks} of the text.` : ''}

TRANSLATION REQUIREMENTS:
1. PRODUCE ONLY THE TRANSLATED TEXT - NO EXPLANATIONS OR NOTES
2. PRESERVE ALL FORMATTING INCLUDING:
   - Paragraph breaks
   - Line spacing
   - Special characters
   - Text emphasis (bold, italic, etc.)
3. MAINTAIN AUTHENTICITY:
   - Use natural ${languageCharacteristics.name} expressions and idioms
   - Adapt cultural references appropriately
   - Consider ${languageCharacteristics.features}
   - Follow ${languageCharacteristics.style}
4. ENSURE CONSISTENCY:
   - Maintain consistent terminology throughout
   - Use consistent tone and style
   - Keep proper nouns and technical terms consistent
5. GRAMMAR AND STRUCTURE:
   - Use correct grammar and punctuation
   - Ensure proper sentence structure
   - Maintain logical flow between sentences
   - Use appropriate connecting words
6. CONTEXT AND MEANING:
   - Preserve the original meaning precisely
   - Maintain the emotional impact and tone
   - Keep any humor or wordplay (adapt if necessary)
   - Preserve any technical or specialized content
7. QUALITY CHECKS:
   - Ensure no omissions or additions
   - Verify terminology accuracy
   - Check for natural flow and readability
   - Maintain professional language level

CONTENT TO TRANSLATE:
${text}`;

        return prompt;
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

    // Summarization specific method
    async summarize(text: string, language: string, type: string = 'concise'): Promise<string> {
        let prompt = '';

        switch (type) {
            case 'concise':
                prompt = `Hãy tóm tắt ngắn gọn, súc tích văn bản sau bằng ${language}. Chỉ tập trung vào những điểm quan trọng nhất:

${text}

## Tóm tắt tổng quan
[Tóm tắt ngắn gọn nội dung chính]
## Các điểm chính
- [Điểm chính 1]
- [Điểm chính 2]
...`;
                break;

            case 'detailed':
                prompt = `Hãy tóm tắt chi tiết văn bản sau bằng ${language} theo cấu trúc:

## Tóm tắt tổng quan
[Tóm tắt ngắn gọn nội dung chính]

## Phân tích chi tiết
[Phân tích chi tiết các nội dung quan trọng]

## Kết luận
[Kết luận và ý nghĩa chính]

Văn bản cần tóm tắt:
${text}`;
                break;

            case 'bullet':
                prompt = `Hãy tóm tắt văn bản sau bằng ${language} dưới dạng các điểm chính:

## Tóm tắt ngắn gọn
[Tóm tắt ngắn gọn trong 1-2 câu]

## Các điểm chính
- [Điểm chính 1]
- [Điểm chính 2]
...

## Các chi tiết quan trọng
- [Chi tiết 1]
- [Chi tiết 2]
...

Văn bản cần tóm tắt:
${text}`;
                break;

            default:
                throw new Error('Unsupported summary type');
        }

        return this.processWithAI(prompt);
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

            // Apply dictionary to the entire translated text
            translatedText = await dictionaryService.applyDictionary(translatedText);

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
}

export const aiService = new AIService(); 