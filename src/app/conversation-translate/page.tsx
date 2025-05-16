import ConversationTranslator from '@/components/ConversationTranslator'

export const metadata = {
  title: 'Dịch hội thoại - AI Tool',
  description: 'Dịch hội thoại hai chiều với nhiều ngôn ngữ khác nhau',
}

export default function ConversationPage() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <ConversationTranslator />
    </div>
  )
} 