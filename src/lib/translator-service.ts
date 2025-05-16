import { aiService } from './ai-service';
import { dictionaryService } from './dictionary-service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLanguageName } from '@/constants/languages';
import { TRANSLATION_TONES } from './ai-service';
import { base64ToFile } from './utils';

interface TranslationOptions {
    targetLanguage: string;
    preserveContext: boolean;
    tone: string;
    useFormat?: boolean;
    useMarkdown?: boolean;
    useMarkdownFormat?: boolean;
    useMarkdownDisplay?: boolean;
}

interface ImageTranslationOptions extends TranslationOptions {
    imageData: string;
    mimeType: string;
}

interface TranslationTone {
    name: string;
    style: string;
    description: string;
    specialInstructions?: string;
}

interface TranslationTones {
    [key: string]: TranslationTone;
}

class TranslatorService {
    private createMarkdownPrompt(useMarkdown: boolean, useFormat: boolean, isImage: boolean = false): string {
        if (!useFormat) return '';

        let prompt = `
- Định dạng văn bản để dễ đọc hơn:
  + Giữ nguyên ý nghĩa và nội dung gốc
  + Đảm bảo tính nhất quán trong định dạng
  + Sử dụng khoảng cách và xuống dòng phù hợp
  + Cấu trúc nội dung một cách hợp lý`;

        if (useMarkdown) {
            prompt += `
- CRITICAL: The response MUST be formatted using markdown syntax:
  + Use **bold** for important terms and emphasis
  + Use *italics* for special terms and foreign words
  + Use # ## ### for headings and section hierarchy
  + Use ordered lists (1. 2. 3.) for sequential items
  + Use unordered lists (- or *) for non-sequential items
  + Use > for quotes and blockquotes
  + Use \`code\` for technical terms and code snippets
  + Use --- or === for horizontal dividers
  + Use tables (| Header | Header |) when appropriate
  + Use [link text](url) for links
  + Use ![alt text](image-url) for images
  + Use ~~strikethrough~~ for deleted or corrected text
  + Use superscript^text^ for footnotes
  + Use subscript~text~ for chemical formulas
  + Use >!spoiler!< for spoiler text
  + Use Discord-style markdown when appropriate
- The response MUST be properly formatted markdown
- Do not include any explanations about markdown formatting
- Do not include any markdown syntax guides or examples
- Just return the translated and markdown-formatted text`;

            if (isImage) {
                prompt += `
- Preserve the original text structure and hierarchy
- Format headings and sections appropriately based on visual hierarchy in the image`;
            } else {
                prompt += `
- If the input text contains markdown, preserve and translate the markdown syntax appropriately`;
            }
        }

        return prompt;
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
            useFormat?: boolean;
            useMarkdownFormat?: boolean;
        }
    ): string {
        const translationTone = TRANSLATION_TONES[options?.tone || 'normal'];
        const targetLangName = getLanguageName(targetLanguage);

        let prompt = `You are a professional translator with expertise in ${targetLangName}. Please translate the following text to ${targetLangName}.

Translation Style: ${translationTone.style}

Context:
${preserveContext ? '- Preserve the original context, style, tone, and terminology' : '- Focus on clarity and accuracy'}
${options?.previousContext ? `\nPrevious context:\n${options.previousContext}` : ''}
${options?.totalChunks ? `\nPart ${options.currentChunk}/${options.totalChunks}` : ''}

CRITICAL REQUIREMENTS:
1. Translation Accuracy:
   - Translate ALL text content accurately
   - Maintain the original meaning and intent
   - Preserve technical terms and proper nouns
   - Keep cultural references when appropriate
   - Ensure natural flow in the target language
   - Consider cultural nuances and idioms
   - Adapt expressions to be culturally appropriate
   - Maintain the author's voice and style
   - Preserve humor, sarcasm, and tone
   - Keep metaphors and analogies meaningful

2. Language Quality:
   - Use proper grammar and syntax in ${targetLangName}
   - Maintain consistent terminology throughout
   - Adapt idioms and expressions appropriately
   - Ensure readability and natural flow
   - Use appropriate register and formality level
   - Consider regional language variations
   - Use natural and modern language
   - Avoid literal translations when inappropriate
   - Maintain proper sentence structure
   - Use appropriate punctuation and formatting

3. Content Understanding:
   - Analyze the text's purpose and audience
   - Consider the text's genre and style
   - Understand cultural references and context
   - Identify key themes and messages
   - Recognize technical or specialized content
   - Consider the emotional tone and impact
   - Understand implicit meanings
   - Identify wordplay or double meanings
   - Recognize formal vs informal language
   - Understand the text's historical context

4. Special Handling:
   - Keep URLs, email addresses, and code unchanged
   - Preserve mathematical formulas and equations
   - Maintain proper names and trademarks
   - Keep dates and numbers in original format
   - Preserve HTML/Markdown tags if present
   - Handle quotes and citations properly
   - Maintain formatting of lists and tables
   - Preserve special characters and symbols
   - Keep currency and measurement units
   - Handle abbreviations and acronyms

5. Output Requirements:
   - Return ONLY the translated text
   - Do not add explanations or notes
   - Do not include the original text
   - Ensure the translation is complete
   - Verify all content is translated
   - Maintain proper spacing and formatting
   - Use appropriate line breaks
   - Ensure consistent terminology
   - Check for any missing content
   - Verify cultural appropriateness`;

        if (options?.useFormat) {
            prompt += `
6. Formatting Guidelines:
   - Improve readability with proper spacing
   - Use appropriate line breaks
   - Structure content logically
   - Maintain consistent formatting
   - Ensure clear visual hierarchy
   - Use proper paragraph structure
   - Maintain list formatting
   - Preserve table structure
   - Keep proper indentation
   - Ensure consistent styling`;
        }

        // Add special instructions for xianxia and wuxia tones
        if (translationTone.specialInstructions) {
            prompt += `\n\nSpecial Genre Requirements:\n${translationTone.specialInstructions}`;
        }

        prompt += this.createMarkdownPrompt(options?.useMarkdownFormat || false, options?.useFormat || false);

        prompt += `\n\nText to translate:\n${text}`;

        return prompt;
    }

    private createImageTranslationPrompt(
        targetLanguage: string,
        preserveContext: boolean,
        tone: string,
        useMarkdown: boolean,
        useFormat: boolean
    ): string {
        const translationTone = TRANSLATION_TONES[tone];
        const targetLangName = getLanguageName(targetLanguage);
        
        let prompt = `You are a professional translator specializing in image text translation. Please translate ALL text content in the image to ${targetLangName}.

Translation Style: ${translationTone.style}

CRITICAL REQUIREMENTS:
1. Text Analysis:
   - Identify ALL text elements in the image
   - Understand the context of each text element
   - Recognize text hierarchy and importance
   - Identify UI elements and their functions
   - Understand the image's purpose and audience
   - Recognize text formatting and style
   - Identify text relationships and connections
   - Understand the visual hierarchy
   - Recognize text in different languages
   - Identify text in different fonts/styles

2. Translation Quality:
   - Ensure accurate translation to ${targetLangName}
   - Maintain original meaning and context
   - Preserve technical terms and proper nouns
   - Keep cultural references when appropriate
   - Ensure natural language flow
   - Use appropriate register and formality
   - Consider cultural nuances
   - Adapt expressions appropriately
   - Maintain consistent terminology
   - Ensure readability and clarity

3. Text Processing:
   - Translate ALL visible text content
   - Include UI elements, buttons, and labels
   - Translate headings and subheadings
   - Capture text in diagrams and charts
   - Include any visible metadata
   - Preserve text hierarchy and importance
   - Maintain text formatting and style
   - Keep original line breaks and spacing
   - Preserve text emphasis and styling
   - Maintain proper text alignment

4. Special Handling:
   - Keep URLs and email addresses unchanged
   - Preserve proper names and trademarks
   - Maintain dates and numbers format
   - Keep code snippets and commands
   - Preserve mathematical expressions
   - Keep currency symbols and units
   - Preserve special characters and symbols
   - Handle abbreviations and acronyms
   - Keep technical terms when appropriate
   - Preserve formatting elements

5. Output Requirements:
   - Return ONLY the translated text
   - Do not add explanations or comments
   - Maintain original text structure
   - Ensure complete translation
   - Verify all important text is translated
   - Use proper ${targetLangName} punctuation
   - Maintain proper spacing
   - Ensure consistent formatting
   - Check for missing translations
   - Verify cultural appropriateness`;

        if (useFormat) {
            prompt += `
6. Formatting Guidelines:
   - Add appropriate line breaks
   - Separate paragraphs clearly
   - Maintain visual hierarchy
   - Ensure consistent formatting
   - Improve overall readability
   - Use proper spacing
   - Maintain text structure
   - Preserve formatting elements
   - Ensure clear organization
   - Use appropriate styling`;
        }

        prompt += this.createMarkdownPrompt(useMarkdown, useFormat, true);
        
        return prompt;
    }

    async translateText(
        text: string,
        options: TranslationOptions,
        onProgress?: (current: number, total: number) => void
    ): Promise<string> {
        if (!text.trim()) {
            return '';
        }

        try {
            // Tối ưu kích thước chunk dựa trên model
            const MAX_CHUNK_LENGTH = 3000;

            // Chuẩn hóa xuống dòng
            const normalizedText = text.replace(/\r\n/g, '\n');

            // Tách văn bản thành các đoạn dựa trên xuống dòng kép
            const paragraphs = normalizedText.split(/\n\s*\n/).filter(p => p.trim());

            // Nếu văn bản ngắn, xử lý trực tiếp
            if (text.length <= MAX_CHUNK_LENGTH) {
                onProgress?.(1, 1);
                const prompt = this.createTranslationPrompt(text, options.targetLanguage, options.preserveContext, { 
                    tone: options.tone, 
                    useFormat: options.useFormat, 
                    useMarkdownFormat: options.useMarkdownFormat 
                });
                const result = await aiService.processWithAI(prompt);
                return await dictionaryService.applyDictionary(result);
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
                    options.targetLanguage,
                    options.preserveContext,
                    {
                        previousContext: isFirstChunk ? '' : previousContext,
                        isFirstChunk,
                        isLastChunk,
                        totalChunks: chunks.length,
                        currentChunk: i + 1,
                        tone: options.tone,
                        useFormat: options.useFormat,
                        useMarkdownFormat: options.useMarkdownFormat
                    }
                );

                try {
                    const result = await aiService.processWithAI(prompt);
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
                            const subPrompt = this.createTranslationPrompt(subChunk, options.targetLanguage, options.preserveContext, { 
                                tone: options.tone, 
                                useFormat: options.useFormat,
                                useMarkdownFormat: options.useMarkdownFormat
                            });
                            const subResult = await aiService.processWithAI(subPrompt);
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
        } catch (error) {
            console.error('Translation error:', error);
            throw new Error('Failed to translate text');
        }
    }

    async translateImage(
        options: ImageTranslationOptions
    ): Promise<string> {
        try {
            console.log('📤 Sending image translation request to Gemini...');
            
            const prompt = this.createImageTranslationPrompt(
                options.targetLanguage,
                options.preserveContext,
                options.tone,
                options.useMarkdownFormat || false,
                options.useFormat || false
            );

            // Convert base64 to File object using utility function
            const file = base64ToFile(options.imageData, options.mimeType, 'image');

            const translatedText = await aiService.processImageWithAI(file, prompt);
            
            // Apply dictionary if needed
            return await dictionaryService.applyDictionary(translatedText);
        } catch (error) {
            console.error('Image translation error:', error);
            throw new Error('Failed to translate image');
        }
    }

    async translateFiles(
        files: File[],
        options: TranslationOptions,
        onProgress?: (current: number, total: number) => void
    ): Promise<{ name: string; content: string }[]> {
        try {
            const translatedContents = await Promise.all(
                files.map(async (file) => {
                    let content = '';
                    if (file.type === 'text/plain' || file.type === 'text/markdown' || file.type === 'application/json') {
                        const text = await file.text();
                        content = await this.translateText(text, options, onProgress);
                    } else {
                        content = 'File type not supported for translation yet';
                    }
                    return {
                        name: `translated_${file.name}`,
                        content
                    };
                })
            );
            return translatedContents;
        } catch (error) {
            console.error('File translation error:', error);
            throw new Error('Failed to translate files');
        }
    }

    getTranslationTones() {
        return TRANSLATION_TONES;
    }
}

export const translatorService = new TranslatorService();
