import PCBuilder from '@/components/PCBuilder'

export default function PCBuilderPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Tạo cấu hình PC</h1>
        <PCBuilder />
      </div>
    </div>
  )
} 