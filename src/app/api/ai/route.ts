import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
    try {
        const { action, data } = await request.json();

        switch (action) {
            case 'process':
                if (!data.prompt) {
                    return NextResponse.json(
                        { error: 'Missing prompt parameter' },
                        { status: 400 }
                    );
                }
                const processedResult = await aiService.processWithAI(data.prompt);
                return NextResponse.json({ result: processedResult });

            case 'translate':
                if (!data.text || !data.targetLanguage) {
                    return NextResponse.json(
                        { error: 'Missing required parameters' },
                        { status: 400 }
                    );
                }
                const translatedText = await aiService.translateSRT(
                    data.text,
                    data.targetLanguage
                );
                return NextResponse.json({ result: translatedText });

            case 'enhance':
                if (!data.text) {
                    return NextResponse.json(
                        { error: 'Missing text parameter' },
                        { status: 400 }
                    );
                }
                const enhancedText = await aiService.enhanceText(data.text);
                return NextResponse.json({ result: enhancedText });

            case 'chat':
                if (!data.message || !data.language || !data.conversationHistory) {
                    return NextResponse.json(
                        { error: 'Missing required parameters' },
                        { status: 400 }
                    );
                }
                const chatResponse = await aiService.generateChatResponse(
                    data.message,
                    data.language,
                    data.conversationHistory
                );
                return NextResponse.json({ result: chatResponse });

            case 'quiz':
                if (!data.systemPrompt || !data.userPrompt) {
                    return NextResponse.json(
                        { error: 'Missing required parameters' },
                        { status: 400 }
                    );
                }
                const quizResult = await aiService.generateQuiz(
                    data.systemPrompt,
                    data.userPrompt
                );
                return NextResponse.json({ result: quizResult });

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('AI API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 