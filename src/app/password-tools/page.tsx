"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PasswordStrengthChecker } from "@/components/PasswordStrength"
import { PasswordGenerator } from "@/components/password-generator"
import { UsernameGenerator } from "@/components/username-generator"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Password Tools</h1>
          <p className="text-gray-500">Check or generate secure passwords</p>
        </div>

        <Tabs defaultValue="check" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="check">Check Password</TabsTrigger>
            <TabsTrigger value="generate">Generate Password</TabsTrigger>
          </TabsList>

          <TabsContent value="check" className="mt-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <PasswordStrengthChecker value="" onChange={(value) => console.log("Password changed:", value)} />
            </div>
          </TabsContent>

          <TabsContent value="generate" className="mt-4">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <PasswordGenerator />
            </div>
          </TabsContent>

        </Tabs>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-medium">Password Security Tips</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Use a password manager to store and generate passwords</li>
            <li>• Avoid password reuse across websites and apps</li>
            <li>• Avoid using personal information in passwords</li>
            <li>• Consider using multi-factor authentication when available</li>
            <li>• Passwords are more secure when they are longer and use a variety of characters</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
