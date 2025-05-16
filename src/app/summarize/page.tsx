import type { Metadata } from 'next'
import TextSummarization from '@/components/TextSummarization';

export const metadata: Metadata = {
  title: 'Text Summarization | AI Tool',
  description: 'Summarize your text using AI technology. Get concise summaries of long articles, documents, or any text content.',
  keywords: 'text summarization, AI summary, text compression, content summarizer',
  openGraph: {
    title: 'Text Summarization | AI Tool',
    description: 'Summarize your text using AI technology. Get concise summaries of long articles, documents, or any text content.',
    type: 'website',
  }
}

export default function SummarizePage() {
  return (
    <main className="container mx-auto px-4 py-8" suppressHydrationWarning>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TextSummarization />
      </div>
    </main>
  );
} 