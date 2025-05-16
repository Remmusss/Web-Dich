import type { Metadata } from 'next'
import RecipeGenerator from '@/components/RecipeGenerator'

export const metadata: Metadata = {
  title: 'Tạo Công Thức Nấu Ăn | Công Cụ Nấu Ăn',
  description: 'Tạo công thức nấu ăn chi tiết với AI. Nhập tên món ăn và nhận công thức nấu ăn đầy đủ với nguyên liệu, các bước thực hiện và mẹo nấu ăn.',
  keywords: 'công thức nấu ăn, món ăn, hướng dẫn nấu ăn, AI nấu ăn, công thức món ăn, nấu ăn, recipe generator, cooking recipe',
  openGraph: {
    title: 'Tạo Công Thức Nấu Ăn | Công Cụ Nấu Ăn',
    description: 'Tạo công thức nấu ăn chi tiết với AI. Nhập tên món ăn và nhận công thức nấu ăn đầy đủ với nguyên liệu, các bước thực hiện và mẹo nấu ăn.',
    type: 'website',
  }
}

export default function RecipeGeneratorPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <RecipeGenerator />
            </div>
        </div>
    )
} 