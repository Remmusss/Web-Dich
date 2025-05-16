"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsernameGenerator } from "@/components/username-generator"

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <UsernameGenerator />
        </div>
      </div>
    </main>
  )
}
