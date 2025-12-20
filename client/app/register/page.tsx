"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Building2, User } from "lucide-react"
import { Logo } from "@/components/logo"
import { useToast } from "@/hooks/use-toast-simple"
import { authApi } from "@/lib/api-client"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [registrationType, setRegistrationType] = useState<"organization" | "teacher">("teacher")
  const [isLoading, setIsLoading] = useState(false)

  // Organization form data
  const [orgFormData, setOrgFormData] = useState({
    organizationName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    website: "",
  })

  // Teacher form data
  const [teacherFormData, setTeacherFormData] = useState({
    teacherName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    subject: "",
    department: "",
    organizationId: "",
  })

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (orgFormData.password !== orgFormData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (orgFormData.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await authApi.registerOrganization({
        organizationName: orgFormData.organizationName,
        email: orgFormData.email,
        password: orgFormData.password,
        phone: orgFormData.phone,
        address: orgFormData.address,
        website: orgFormData.website || undefined,
      })

      if (result.success) {
        toast({
          title: "Success!",
          description: "Your organization account has been created",
        })
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || error?.message || "Registration failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (teacherFormData.password !== teacherFormData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (teacherFormData.password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await authApi.registerTeacher({
        teacherName: teacherFormData.teacherName,
        email: teacherFormData.email,
        password: teacherFormData.password,
        phone: teacherFormData.phone,
        address: teacherFormData.address || undefined,
        subject: teacherFormData.subject || undefined,
        department: teacherFormData.department || undefined,
        organizationId: teacherFormData.organizationId || undefined,
      })

      if (result.success) {
        toast({
          title: "Success!",
          description: "Your teacher account has been created",
        })
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || error?.message || "Registration failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setOrgFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleTeacherChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTeacherFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Logo width={40} height={40} />
            <span className="text-2xl font-bold">Review Pulse</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>Start collecting student feedback today</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Registration Type Selector */}
            <div className="flex gap-2 mb-6">
              <Button
                type="button"
                variant={registrationType === "teacher" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setRegistrationType("teacher")}
              >
                <User className="h-4 w-4 mr-2" />
                Single Teacher
              </Button>
              <Button
                type="button"
                variant={registrationType === "organization" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setRegistrationType("organization")}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Organization
              </Button>
            </div>

            {registrationType === "organization" ? (
              <form onSubmit={handleOrgSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Institute/Organization Name</Label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    placeholder="ABC Institute"
                    value={orgFormData.organizationName}
                    onChange={handleOrgChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@institute.com"
                    value={orgFormData.email}
                    onChange={handleOrgChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={orgFormData.phone}
                    onChange={handleOrgChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="123 Education Street, City"
                    value={orgFormData.address}
                    onChange={handleOrgChange}
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://institute.com"
                    value={orgFormData.website}
                    onChange={handleOrgChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={orgFormData.password}
                    onChange={handleOrgChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={orgFormData.confirmPassword}
                    onChange={handleOrgChange}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Organization Account"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleTeacherSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teacherName">Teacher Name</Label>
                  <Input
                    id="teacherName"
                    name="teacherName"
                    placeholder="Dr. John Smith"
                    value={teacherFormData.teacherName}
                    onChange={handleTeacherChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="teacher@institute.com"
                    value={teacherFormData.email}
                    onChange={handleTeacherChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={teacherFormData.phone}
                    onChange={handleTeacherChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="123 Education Street"
                    value={teacherFormData.address}
                    onChange={handleTeacherChange}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject (Optional)</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Mathematics, Science, etc."
                    value={teacherFormData.subject}
                    onChange={handleTeacherChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department (Optional)</Label>
                  <Input
                    id="department"
                    name="department"
                    placeholder="Science Department"
                    value={teacherFormData.department}
                    onChange={handleTeacherChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationId">Organization ID (Optional - if joining an existing organization)</Label>
                  <Input
                    id="organizationId"
                    name="organizationId"
                    placeholder="Leave empty for standalone teacher"
                    value={teacherFormData.organizationId}
                    onChange={handleTeacherChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={teacherFormData.password}
                    onChange={handleTeacherChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={teacherFormData.confirmPassword}
                    onChange={handleTeacherChange}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Teacher Account"
                  )}
                </Button>
              </form>
            )}

            <p className="text-sm text-center text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
