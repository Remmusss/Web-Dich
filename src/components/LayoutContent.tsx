'use client';

import { usePageView } from '@/hooks/usePageView';
import Sidebar from '@/components/Sidebar';
import Menubar from '@/components/Menubar';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Analytics } from "@vercel/analytics/react";

export default function LayoutContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  usePageView();

  return (
    <body className={className}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <SidebarProvider>
              <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                  <Menubar />
                  <main className="flex-1 overflow-y-auto">
                    {children}
                  </main>
                  <footer className="py-5 border-t border-gray-100 dark:border-gray-800">
                    <div className="container mx-auto px-4 text-center text-xs text-gray-400 dark:text-gray-600">
                      <p>© {new Date().getFullYear()} Amri2k. All rights reserved.</p>
                    </div>
                  </footer>
                </div>
              </div>
            </SidebarProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
      <Analytics />
    </body>
  );
} 