import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import LayoutContent from '@/components/LayoutContent'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI-Tools',
  description: 'AI-Tools',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
          * {
            box-sizing: border-box;
          }
          
          html, body {
            width: 100%;
            max-width: 100vw;
            overflow-x: hidden;
            padding: 0;
            margin: 0;
          }
          
          @media (max-width: 640px) {
            div {
              max-width: 100%;
              width: auto;
            }
          }
        `}</style>
      </head>
      <body className={inter.className}>
          <LayoutContent className={`${inter.className} antialiased`}>
            {children}
          </LayoutContent>
          <Toaster />
      </body>
    </html>
  )
} 