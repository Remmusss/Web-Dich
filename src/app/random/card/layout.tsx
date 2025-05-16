import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Tạo Thẻ Bài Ngẫu Nhiên | Công Cụ Ngẫu Nhiên',
  description: 'Tạo thẻ bài ngẫu nhiên từ bộ bài tiêu chuẩn hoặc bộ bài có Joker. Xem lịch sử các thẻ bài đã tạo.',
  keywords: 'thẻ bài ngẫu nhiên, random card, bài ngẫu nhiên, tạo thẻ bài, bộ bài, joker',
  openGraph: {
    title: 'Tạo Thẻ Bài Ngẫu Nhiên | Công Cụ Ngẫu Nhiên',
    description: 'Tạo thẻ bài ngẫu nhiên từ bộ bài tiêu chuẩn hoặc bộ bài có Joker. Xem lịch sử các thẻ bài đã tạo.',
    type: 'website',
  }
}

export default function RandomCardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}