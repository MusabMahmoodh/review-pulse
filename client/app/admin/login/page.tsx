"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast-simple"
import { ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAdminLogin } from "@/hooks/use-admin"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { toast } = useToast()
  const router = useRouter()
  const loginMutation = useAdminLogin()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const result = await loginMutation.mutateAsync({ email, password })
      
      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Welcome to the admin dashboard",
        })
        router.push("/admin/dashboard")
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error?.data?.error || error?.message || "Invalid credentials",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Access the Guestra admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@guestra.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Demo: admin@reviewpulse2.com / admin123
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
