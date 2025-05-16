import { aiService } from './ai-service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { base64ToFile } from './utils';

interface SRTEntry {
    id: number;
    timecode: string;
    text: string;
}

interface SummarizeOptions {
    language: string;
    type: string;
    preserveContext?: boolean;
    useFormat?: boolean;
    useMarkdown?: boolean;
}

interface ImageSummarizeOptions extends SummarizeOptions {
    imageData: string;
    mimeType: string;
}

interface FileData {
    name: string;
    type: string;
    data: string; // base64 data
}

class SummarizeService {
    // Content type detection for better summarization
    private detectContentType(text: string): 'article' | 'technical' | 'narrative' | 'conversation' {
        const technicalPatterns = /(algorithm|implementation|function|class|method|api|documentation|technical|specification)/i;
        const conversationPatterns = /([""'].*?[""']:|^[A-Za-z]+:)/m;
        const narrativePatterns = /(chapter|scene|character|plot|story|novel)/i;

        if (technicalPatterns.test(text)) return 'technical';
        if (conversationPatterns.test(text)) return 'conversation';
        if (narrativePatterns.test(text)) return 'narrative';
        return 'article';
    }

    // Enhanced summarization method
    async summarize(text: string, language: string, type: string = 'concise'): Promise<string> {
        // Handle empty text
        if (!text.trim()) {
            return '';
        }

        // Detect content type for better prompting
        const contentType = this.detectContentType(text);

        // Calculate optimal chunk size based on content length
        const MAX_CHUNK_LENGTH = 4000;
        let chunks: string[] = [];

        if (text.length > MAX_CHUNK_LENGTH) {
            chunks = this.splitTextIntoChunks(text, MAX_CHUNK_LENGTH);
        } else {
            chunks = [text];
        }

        // Process each chunk and combine results
        const summaries: string[] = [];
        for (const chunk of chunks) {
            const prompt = this.createSummaryPrompt(chunk, language, type, contentType, chunks.length > 1);
            const summary = await aiService.processWithAI(prompt);
            summaries.push(summary);
        }

        // Combine and refine final summary if multiple chunks
        if (summaries.length > 1) {
            const combinedSummary = summaries.join('\n\n');
            const finalPrompt = this.createFinalSummaryPrompt(combinedSummary, language, type);
            return aiService.processWithAI(finalPrompt);
        }

        return summaries[0];
    }

    private createSummaryPrompt(
        text: string,
        language: string,
        type: string,
        contentType: string,
        isChunked: boolean
    ): string {
        const basePrompt = `Hãy tóm tắt văn bản sau bằng ${language}.

Yêu cầu chung:
- Đảm bảo tính chính xác và mạch lạc
- Giữ nguyên các thuật ngữ chuyên ngành quan trọng
- Tập trung vào nội dung có giá trị thông tin cao
- Sử dụng ngôn ngữ rõ ràng, dễ hiểu
${isChunked ? '- Đây là một phần của văn bản dài hơn, hãy tập trung vào các điểm chính trong phần này' : ''}

Loại nội dung: ${contentType}
`;

        switch (type) {
            case 'concise':
                return `${basePrompt}
Yêu cầu cụ thể:
- Tóm tắt ngắn gọn, súc tích
- Độ dài khoảng 20-25% văn bản gốc
- Tập trung vào những điểm quan trọng nhất

Cấu trúc:
## Tóm tắt tổng quan
[Tóm tắt ngắn gọn trong 2-3 câu]

## Các điểm chính
- [Điểm chính 1]
- [Điểm chính 2]
${contentType === 'technical' ? '## Các khái niệm kỹ thuật quan trọng\n- [Khái niệm 1]\n- [Khái niệm 2]' : ''}

Văn bản cần tóm tắt:
${text}`;

            case 'detailed':
                return `${basePrompt}
Yêu cầu cụ thể:
- Phân tích chi tiết và có cấu trúc
- Độ dài khoảng 40-50% văn bản gốc
- Bảo toàn các chi tiết quan trọng và mối liên hệ

Cấu trúc:
## Tóm tắt tổng quan
[Tóm tắt ngắn gọn nội dung chính]

## Phân tích chi tiết
[Phân tích có cấu trúc về các nội dung quan trọng]
${contentType === 'narrative' ? '\n## Phát triển cốt truyện/nhân vật\n[Phân tích về diễn biến và phát triển]' : ''}
${contentType === 'technical' ? '\n## Chi tiết kỹ thuật\n[Phân tích các khía cạnh kỹ thuật quan trọng]' : ''}

## Kết luận và ý nghĩa
[Kết luận và điểm nhấn chính]

Văn bản cần tóm tắt:
${text}`;

            case 'bullet':
                return `${basePrompt}
Yêu cầu cụ thể:
- Tóm tắt dưới dạng các điểm chính
- Mỗi điểm ngắn gọn, rõ ràng
- Sắp xếp theo thứ tự quan trọng

Cấu trúc:
## Tóm tắt ngắn gọn
[Tóm tắt trong 1-2 câu]

## Các điểm chính
- [Điểm chính 1]
- [Điểm chính 2]
...

## Chi tiết bổ sung
${contentType === 'technical' ? '### Khái niệm kỹ thuật\n- [Khái niệm 1]\n- [Khái niệm 2]' : ''}
${contentType === 'narrative' ? '### Diễn biến quan trọng\n- [Diễn biến 1]\n- [Diễn biến 2]' : ''}
${contentType === 'conversation' ? '### Các quan điểm chính\n- [Quan điểm 1]\n- [Quan điểm 2]' : ''}

Văn bản cần tóm tắt:
${text}`;

            default:
                throw new Error('Unsupported summary type');
        }
    }

    private createFinalSummaryPrompt(combinedSummary: string, language: string, type: string): string {
        return `Hãy tổng hợp và tinh chỉnh các phần tóm tắt sau thành một bản tóm tắt hoàn chỉnh bằng ${language}.

Yêu cầu:
- Loại bỏ thông tin trùng lặp
- Đảm bảo tính mạch lạc và liên kết giữa các phần
- Giữ nguyên cấu trúc và định dạng
- Tối ưu độ dài phù hợp với loại tóm tắt

Các phần tóm tắt cần tổng hợp:
${combinedSummary}`;
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

    private createImageSummaryPrompt(
        language: string,
        type: string,
        useMarkdown: boolean,
        useFormat: boolean
    ): string {
        let prompt = `Vui lòng tóm tắt nội dung chính và quan trọng trong hình ảnh bằng ${language}.

Requirements:
- Focus ONLY on summarizing main and important content
- Ignore small, decorative, or unimportant elements
- Ignore text that is less than approximately 12px in size
- Maintain the original context and meaning
- Only return the summary
- Do not add any explanations or comments
- If there's no significant content in the image, respond with "No significant content found in image"
- CRITICAL: The response MUST be in ${language} language
- CRITICAL: Do not include any English text in the response
- CRITICAL: If the image contains English text, translate it to ${language} in the summary`;

        if (useFormat) {
            prompt += `
- Format the summary for better readability:
  + Add appropriate line breaks and spacing
  + Clearly separate sections
  + Maintain logical structure
  + Ensure consistency in formatting`;
        } else {
            prompt += `
- CRITICAL: Preserve ALL original formatting:
  + Keep exact same line breaks and spacing
  + Maintain original structure
  + Preserve all indentation and alignment
  + Keep original emphasis and styling
  + Do not modify any formatting elements`;
        }

        if (useMarkdown) {
            prompt += `
- CRITICAL: The response MUST be formatted using markdown syntax:
  + Use **bold** for important terms and emphasis
  + Use *italics* for special terms
  + Use # ## ### for headings and section hierarchy
  + Use ordered lists (1. 2. 3.) for sequential items
  + Use unordered lists (- or *) for non-sequential items
  + Use > for quotes and blockquotes
  + Use \`code\` for technical terms
  + Use --- or === for horizontal dividers
  + Use tables (| Header | Header |) when appropriate
  + Use [link text](url) for links
  + Use ![alt text](image-url) for images
  + Use ~~strikethrough~~ for deleted or corrected text
  + Use superscript^text^ for footnotes
  + Use subscript~text~ for chemical formulas
  + Use >!spoiler!< for spoiler text
- The response MUST be properly formatted markdown
- Do not include any explanations about markdown formatting
- Do not include any markdown syntax guides or examples
- Just return the summarized and markdown-formatted content`;
        }

        return prompt;
    }

    async summarizeImage(
        options: ImageSummarizeOptions
    ): Promise<string> {
        try {
            console.log('📤 Sending image summarization request to Gemini...');
            
            const prompt = this.createImageSummaryPrompt(
                options.language,
                options.type,
                options.useMarkdown || false,
                options.useFormat || false
            );

            // Convert base64 to File object using utility function
            const file = base64ToFile(options.imageData, options.mimeType, 'image');

            return await aiService.processImageWithAI(file, prompt);
        } catch (error) {
            console.error('Image summarization error:', error);
            throw new Error('Failed to summarize image');
        }
    }

    async summarizeFiles(
        files: FileData[],
        options: SummarizeOptions,
        onProgress?: (current: number, total: number) => void
    ): Promise<{ name: string; content: string }[]> {
        try {
            const summarizedContents = await Promise.all(
                files.map(async (file) => {
                    let content = '';

                    if (file.type === 'text/plain' || file.type === 'text/markdown' || file.type === 'application/json') {
                        // Decode base64 text
                        const text = Buffer.from(file.data, 'base64').toString('utf-8');
                        content = await this.summarize(text, options.language, options.type);
                    } else if (file.type.startsWith('image/')) {
                        content = await this.summarizeImage({
                            ...options,
                            imageData: file.data,
                            mimeType: file.type
                        });
                    } else {
                        content = 'File type not supported for summarization yet';
                    }
                    return {
                        name: `summarized_${file.name}`,
                        content
                    };
                })
            );
            return summarizedContents;
        } catch (error) {
            console.error('File summarization error:', error);
            throw new Error('Failed to summarize files');
        }
    }
}

export const summarizeService = new SummarizeService();
