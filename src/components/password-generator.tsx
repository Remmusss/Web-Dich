"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Check, Copy, RefreshCw } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export function PasswordGenerator() {
  const [password, setPassword] = useState("")
  const [copied, setCopied] = useState(false)
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })
  const [strength, setStrength] = useState(0)

  // Generate password on component mount and when options change
  useEffect(() => {
    generatePassword()
  }, [length, options])

  // Calculate password strength
  useEffect(() => {
    let score = 0

    // Length contributes up to 40% of the strength
    score += Math.min(40, (password.length / 20) * 40)

    // Character variety contributes up to 60% of the strength
    const hasLower = /[a-z]/.test(password)
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSymbol = /[^A-Za-z0-9]/.test(password)

    const varietyCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length
    score += (varietyCount / 4) * 60

    setStrength(score)
  }, [password])

  const generatePassword = () => {
    let charset = ""
    let newPassword = ""

    if (options.lowercase) charset += "abcdefghijklmnopqrstuvwxyz"
    if (options.uppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    if (options.numbers) charset += "0123456789"
    if (options.symbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?"

    // Ensure at least one character set is selected
    if (charset === "") {
      charset = "abcdefghijklmnopqrstuvwxyz"
      setOptions((prev) => ({ ...prev, lowercase: true }))
    }

    // Generate the password
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      newPassword += charset[randomIndex]
    }

    setPassword(newPassword)
    setCopied(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStrengthLabel = () => {
    if (strength < 40) return "Weak"
    if (strength < 70) return "Medium"
    if (strength < 90) return "Strong"
    return "Very Strong"
  }

  const getStrengthColor = () => {
    if (strength < 40) return "bg-red-500"
    if (strength < 70) return "bg-yellow-500"
    if (strength < 90) return "bg-green-400"
    return "bg-green-600"
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="generated-password">Generated Password</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={generatePassword} title="Generate new password">
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Generate new password</span>
            </Button>
            <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy to clipboard">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy to clipboard</span>
            </Button>
          </div>
        </div>
        <Input id="generated-password" value={password} readOnly className="font-mono" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Password Strength</span>
          <span className="text-sm font-medium">{getStrengthLabel()}</span>
        </div>
        <Progress value={strength} className="h-2" indicatorClassName={getStrengthColor()} />
      </div>

      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password-length">Password Length: {length}</Label>
          </div>
          <Slider
            id="password-length"
            min={8}
            max={32}
            step={1}
            value={[length]}
            onValueChange={(value) => setLength(value[0])}
          />
        </div>

        <div className="space-y-3">
          <Label>Character Types</Label>

          <div className="flex items-center justify-between">
            <Label htmlFor="uppercase" className="text-sm cursor-pointer">
              Uppercase Letters (A-Z)
            </Label>
            <Switch
              id="uppercase"
              checked={options.uppercase}
              onCheckedChange={(checked) => setOptions({ ...options, uppercase: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="lowercase" className="text-sm cursor-pointer">
              Lowercase Letters (a-z)
            </Label>
            <Switch
              id="lowercase"
              checked={options.lowercase}
              onCheckedChange={(checked) => setOptions({ ...options, lowercase: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="numbers" className="text-sm cursor-pointer">
              Numbers (0-9)
            </Label>
            <Switch
              id="numbers"
              checked={options.numbers}
              onCheckedChange={(checked) => setOptions({ ...options, numbers: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="symbols" className="text-sm cursor-pointer">
              Special Characters (!@#$%^&*)
            </Label>
            <Switch
              id="symbols"
              checked={options.symbols}
              onCheckedChange={(checked) => setOptions({ ...options, symbols: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
