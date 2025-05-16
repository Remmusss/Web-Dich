import { NextResponse } from 'next/server';
import { summarizeService } from '@/lib/summarize-service';

interface SummarizeRequest {
    text?: string;
    files?: Array<{
        name: string;
        type: string;
        data: string;
    }>;
    language: string;
    type: string;
    preserveContext?: boolean;
    useFormat?: boolean;
    useMarkdown?: boolean;
}

export async function POST(request: Request) {
    try {
        const data: SummarizeRequest = await request.json();
        console.log('📤 Received request:', {
            hasText: !!data.text,
            hasFiles: !!data.files,
            fileCount: data.files?.length,
            language: data.language,
            type: data.type
        });

        if (data.text) {
            console.log('📤 Sending text for summarization...');
            const summary = await summarizeService.summarize(
                data.text,
                data.language,
                data.type
            );
            console.log('📥 Received summary:', {
                status: 'success',
                length: summary.length,
                type: data.type
            });
            return NextResponse.json({ summary });
        }

        if (data.files && data.files.length > 0) {
            console.log('📤 Processing files for summarization...');
            const summarizedContents = await summarizeService.summarizeFiles(
                data.files,
                {
                    language: data.language,
                    type: data.type,
                    preserveContext: data.preserveContext,
                    useFormat: data.useFormat,
                    useMarkdown: data.useMarkdown
                }
            );

            console.log('📥 Received file summarization:', {
                status: 'success',
                fileCount: summarizedContents.length,
                type: data.type
            });

            return NextResponse.json({ summarizedContents });
        }

        return NextResponse.json(
            { error: 'No text or files provided for summarization' },
            { status: 400 }
        );
    } catch (error) {
        console.error('❌ Summarization error:', {
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
            { error: 'Failed to process summarization request' },
            { status: 500 }
        );
    }
} 