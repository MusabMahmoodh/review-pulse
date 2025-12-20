"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Save, Loader2, Crown, Palette, MessageSquare, BookOpen, Star } from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast-simple"
import { useAuth } from "@/hooks/use-auth"
import { teachersApi } from "@/lib/api-client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { isPremiumRequiredError, isPremiumFromAuth } from "@/lib/premium"
import { PremiumUpgrade } from "@/components/premium-upgrade"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

function SettingsPageContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [premiumError, setPremiumError] = useState<{ section?: string } | null>(null)

  const teacherId = user?.id || null
  const hasPremium = isPremiumFromAuth(user?.subscription)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch review page settings
  const { data: reviewPageSettings, isLoading: reviewSettingsLoading } = useQuery({
    queryKey: ["teachers", "review-page-settings", teacherId],
    queryFn: () => teachersApi.getReviewPageSettings(teacherId!),
    enabled: !!teacherId && isAuthenticated,
  })

  const [reviewSettings, setReviewSettings] = useState({
    welcomeMessage: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#1e40af",
    backgroundColor: "#f3f4f6",
    designVariation: "default" as "default" | "modern" | "minimal" | "elegant",
  })

  // Update review settings when data loads
  useEffect(() => {
    if (reviewPageSettings) {
      setReviewSettings({
        welcomeMessage: reviewPageSettings.welcomeMessage || "We Value Your Feedback",
        primaryColor: reviewPageSettings.primaryColor || "#3b82f6",
        secondaryColor: reviewPageSettings.secondaryColor || "#1e40af",
        backgroundColor: reviewPageSettings.backgroundColor || "#f3f4f6",
        designVariation: (reviewPageSettings.designVariation || "default") as "default" | "modern" | "minimal" | "elegant",
      })
    }
  }, [reviewPageSettings])

  // Update review page settings mutation
  const updateReviewSettingsMutation = useMutation({
    mutationFn: (settings: typeof reviewSettings) => 
      teachersApi.updateReviewPageSettings(teacherId!, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers", "review-page-settings", teacherId] })
      toast({
        title: "Success",
        description: "Review page settings updated successfully",
      })
    },
    onError: (error: any) => {
      if (isPremiumRequiredError(error)) {
        setPremiumError({ section: "review-page" })
        toast({
          title: "Premium Required",
          description: "Review page customization requires a premium subscription. Please contact admin to upgrade.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error?.data?.error || "Failed to update review page settings",
          variant: "destructive",
        })
      }
    },
  })


  // Loading state
  if (authLoading || !isAuthenticated || !teacherId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex h-16 items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold leading-none">Settings</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your integrations and preferences</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-6">
        {/* Classes Management */}
        <Card className="overflow-hidden border-2">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Class Management</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Create and manage classes to organize feedback by class
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create separate classes to collect feedback from different groups of students. Each class gets its own QR code and feedback link.
              </p>
              <Link href="/dashboard/classes">
                <Button className="w-full" variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Classes
                </Button>
              </Link>
              {!hasPremium && (
                <div className="p-3 bg-yellow-50/50 dark:bg-yellow-950/10 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Free Plan:</span> You can create 1 class. Upgrade to premium for unlimited classes.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Review Page Customization */}
        <Card className="overflow-hidden border-2">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Review Page Customization</CardTitle>
                  <Badge className="text-xs bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-950 border-yellow-400 shadow-sm font-semibold">
                    <Crown className="h-3 w-3 mr-1 fill-yellow-900 text-yellow-900" />
                    Premium
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                  Customize the welcome message, colors, and design of your review page
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {reviewSettingsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (!hasPremium || premiumError?.section === "review-page") ? (
              <PremiumUpgrade 
                feature="Review Page Customization"
                description="Customize your review page with personalized welcome messages, colors, and design variations. This feature requires a premium subscription."
              />
            ) : (
              <>
                {/* Welcome Message */}
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Welcome Message
                  </Label>
                  <Input
                    id="welcomeMessage"
                    placeholder="We Value Your Feedback"
                    value={reviewSettings.welcomeMessage}
                    onChange={(e) => setReviewSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                    maxLength={100}
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    This message will be displayed at the top of your review page
                  </p>
                </div>

                {/* Design Variation */}
                <div className="space-y-2">
                  <Label>Design Variation</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(["default", "modern", "minimal", "elegant"] as const).map((variation) => (
                      <button
                        key={variation}
                        type="button"
                        onClick={() => setReviewSettings(prev => ({ ...prev, designVariation: variation }))}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                          reviewSettings.designVariation === variation
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {variation.charAt(0).toUpperCase() + variation.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose a design style for your review page
                  </p>
                </div>

                {/* Colors */}
                <div className="space-y-4">
                  <Label>Color Customization</Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Primary Color */}
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor" className="text-sm">Primary Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="primaryColor"
                          value={reviewSettings.primaryColor}
                          onChange={(e) => setReviewSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="h-10 w-20 rounded border cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={reviewSettings.primaryColor}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                              setReviewSettings(prev => ({ ...prev, primaryColor: e.target.value }))
                            }
                          }}
                          placeholder="#3b82f6"
                          className="flex-1 h-10 font-mono text-sm"
                          maxLength={7}
                        />
                      </div>
                    </div>

                    {/* Secondary Color */}
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor" className="text-sm">Secondary Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="secondaryColor"
                          value={reviewSettings.secondaryColor}
                          onChange={(e) => setReviewSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="h-10 w-20 rounded border cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={reviewSettings.secondaryColor}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                              setReviewSettings(prev => ({ ...prev, secondaryColor: e.target.value }))
                            }
                          }}
                          placeholder="#1e40af"
                          className="flex-1 h-10 font-mono text-sm"
                          maxLength={7}
                        />
                      </div>
                    </div>

                    {/* Background Color */}
                    <div className="space-y-2">
                      <Label htmlFor="backgroundColor" className="text-sm">Background Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="backgroundColor"
                          value={reviewSettings.backgroundColor}
                          onChange={(e) => setReviewSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                          className="h-10 w-20 rounded border cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={reviewSettings.backgroundColor}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                              setReviewSettings(prev => ({ ...prev, backgroundColor: e.target.value }))
                            }
                          }}
                          placeholder="#f3f4f6"
                          className="flex-1 h-10 font-mono text-sm"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label className="text-sm">Preview</Label>
                  <div className="p-4 border-2 rounded-lg bg-muted/20">
                    <div 
                      className="rounded-lg border overflow-hidden"
                      style={{ 
                        backgroundColor: reviewSettings.backgroundColor,
                        minHeight: '200px'
                      }}
                    >
                      {/* Header Preview */}
                      <div 
                        className={`px-4 py-3 border-b ${
                          reviewSettings.designVariation === 'modern' 
                            ? 'bg-gradient-to-r text-white' 
                            : reviewSettings.designVariation === 'minimal'
                            ? 'bg-transparent border-b-2'
                            : 'bg-card/50'
                        }`}
                        style={
                          reviewSettings.designVariation === 'modern'
                            ? {
                                background: `linear-gradient(to right, ${reviewSettings.primaryColor}, ${reviewSettings.secondaryColor})`,
                                borderColor: reviewSettings.primaryColor
                              }
                            : reviewSettings.designVariation === 'minimal'
                            ? {
                                borderColor: reviewSettings.primaryColor
                              }
                            : {}
                        }
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Logo 
                            width={20} 
                            height={20}
                          />
                          <span 
                            className="text-sm font-bold"
                            style={{ 
                              color: reviewSettings.designVariation === 'modern' 
                                ? 'white' 
                                : 'inherit' 
                            }}
                          >
                            Share Your Experience
                          </span>
                        </div>
                      </div>

                      {/* Card Preview */}
                      <div className="p-4">
                        <div className="text-center mb-4">
                          <h3 
                            className="text-lg font-semibold mb-1"
                            style={{ color: reviewSettings.designVariation === 'modern' ? reviewSettings.primaryColor : 'inherit' }}
                          >
                            {reviewSettings.welcomeMessage}
                          </h3>
                          <p className="text-xs text-muted-foreground">Help us improve by rating your experience</p>
                        </div>

                        {/* Star Rating Preview */}
                        <div className="flex items-center justify-center gap-1 mb-4">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Star
                              key={rating}
                              className="h-6 w-6"
                              style={{ 
                                fill: rating <= 4 ? reviewSettings.primaryColor : 'transparent',
                                color: rating <= 4 ? reviewSettings.primaryColor : '#d1d5db',
                                strokeWidth: rating <= 4 ? 0 : 1
                              }}
                            />
                          ))}
                        </div>

                        {/* Button Preview */}
                        <div className="flex justify-center">
                          <div
                            className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                              reviewSettings.designVariation === 'modern'
                                ? 'bg-gradient-to-r'
                                : ''
                            }`}
                            style={
                              reviewSettings.designVariation === 'modern'
                                ? {
                                    background: `linear-gradient(to right, ${reviewSettings.primaryColor}, ${reviewSettings.secondaryColor})`
                                  }
                                : {
                                    backgroundColor: reviewSettings.designVariation === 'elegant' 
                                      ? reviewSettings.secondaryColor 
                                      : reviewSettings.primaryColor
                                  }
                            }
                          >
                            Submit Feedback
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground text-center mt-3">
                          Design: {reviewSettings.designVariation.charAt(0).toUpperCase() + reviewSettings.designVariation.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <Button 
                  onClick={() => updateReviewSettingsMutation.mutate(reviewSettings)}
                  disabled={updateReviewSettingsMutation.isPending}
                  className="w-full h-10"
                  size="default"
                >
                  {updateReviewSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Review Page Settings
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  )
}
