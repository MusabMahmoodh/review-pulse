"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Facebook, Instagram, Chrome, Save, RefreshCw, Plus, X, CheckCircle2, AlertCircle, Loader2, Hash, Crown, Lock } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast-simple"
import { useAuth } from "@/hooks/use-auth"
import { restaurantsApi, externalReviewsApi, googleAuthApi, metaAuthApi } from "@/lib/api-client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { isPremiumRequiredError } from "@/lib/premium"

function SettingsPageContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [newKeyword, setNewKeyword] = useState("")

  const restaurantId = user?.id || null

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch keywords
  const { data: keywordsData, isLoading: keywordsLoading } = useQuery({
    queryKey: ["restaurants", "keywords", restaurantId],
    queryFn: () => restaurantsApi.getKeywords(restaurantId!),
    enabled: !!restaurantId && isAuthenticated,
  })

  const keywords = keywordsData?.keywords || []

  // Fetch Google integration status
  const { data: googleIntegration, isLoading: googleLoading } = useQuery({
    queryKey: ["restaurants", "google-integration", restaurantId],
    queryFn: () => restaurantsApi.getGoogleIntegration(restaurantId!),
    enabled: !!restaurantId && isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds to check status
  })

  // Fetch Meta integration status
  const { data: metaIntegration, isLoading: metaLoading } = useQuery({
    queryKey: ["restaurants", "meta-integration", restaurantId],
    queryFn: () => restaurantsApi.getMetaIntegration(restaurantId!),
    enabled: !!restaurantId && isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds to check status
  })

  // Update keywords mutation
  const updateKeywordsMutation = useMutation({
    mutationFn: (keywords: string[]) => restaurantsApi.updateKeywords(restaurantId!, keywords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants", "keywords", restaurantId] })
      toast({
        title: "Success",
        description: "Social media keywords updated successfully",
      })
    },
    onError: (error: any) => {
      if (isPremiumRequiredError(error)) {
        toast({
          title: "Premium Required",
          description: "Social media features require a premium subscription. Please contact admin to upgrade.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error?.data?.error || "Failed to update keywords",
          variant: "destructive",
        })
      }
    },
  })

  // Sync reviews mutation
  const syncMutation = useMutation({
    mutationFn: (platforms?: string[]) => externalReviewsApi.sync(restaurantId!, platforms),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["external-reviews", restaurantId] })
      queryClient.invalidateQueries({ queryKey: ["restaurants", "google-integration", restaurantId] })
      queryClient.invalidateQueries({ queryKey: ["restaurants", "meta-integration", restaurantId] })
      
      const totalSynced = data.totalSynced || 0
      const googleResult = data.results?.google
      const facebookResult = data.results?.facebook
      
      const successMessages: string[] = []
      const errorMessages: string[] = []
      
      if (googleResult?.success) {
        successMessages.push(`Google: ${googleResult.count} review${googleResult.count !== 1 ? "s" : ""}`)
      } else if (googleResult?.error) {
        errorMessages.push(`Google: ${googleResult.error}`)
      }
      
      if (facebookResult?.success) {
        successMessages.push(`Facebook: ${facebookResult.count} review${facebookResult.count !== 1 ? "s" : ""}`)
      } else if (facebookResult?.error) {
        errorMessages.push(`Facebook: ${facebookResult.error}`)
      }
      
      if (successMessages.length > 0) {
        toast({
          title: "Sync Complete",
          description: successMessages.join(", "),
        })
      }
      
      if (errorMessages.length > 0) {
        toast({
          title: "Sync Issues",
          description: errorMessages.join(", "),
          variant: "destructive",
        })
      }
      
      if (successMessages.length === 0 && errorMessages.length === 0) {
        toast({
          title: "Sync Complete",
          description: "External reviews synced successfully",
        })
      }
    },
    onError: (error: any) => {
      if (isPremiumRequiredError(error)) {
        toast({
          title: "Premium Required",
          description: "Social media sync requires a premium subscription. Please contact admin to upgrade.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error?.data?.error || "Failed to sync reviews",
          variant: "destructive",
        })
      }
    },
  })

  // Handle OAuth callback messages from URL params
  useEffect(() => {
    const googleConnected = searchParams.get("google_connected")
    const googleError = searchParams.get("google_error")
    const metaConnected = searchParams.get("meta_connected")
    const metaError = searchParams.get("meta_error")

    if (googleConnected === "true") {
      queryClient.invalidateQueries({ queryKey: ["restaurants", "google-integration", restaurantId] })
      toast({
        title: "Success",
        description: "Google account connected successfully!",
      })
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/settings")
    }

    if (googleError) {
    const errorMessages: Record<string, string> = {
      missing_params: "Missing authorization parameters",
      token_failed: "Failed to obtain access token from Google",
      account_failed: "Failed to fetch your Google Business Profile account",
      no_account: "No Google Business Profile account found. Please set up Google Business Profile first.",
      location_failed: "Failed to fetch business locations",
      no_location: "No business location found. Please ensure your Google Business Profile has at least one location.",
      quota_exceeded: "API quota exceeded. Your Google Business Profile API access may still be pending approval, or quota hasn't been allocated. Please request quota increase in Google Cloud Console.",
      premium_required: "Premium subscription required. Please contact admin to upgrade.",
      unknown: "An unknown error occurred during Google authorization",
    }

      toast({
        title: "Connection Failed",
        description: errorMessages[googleError] || "Failed to connect Google account",
        variant: "destructive",
      })
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/settings")
    }

    if (metaConnected === "true") {
      queryClient.invalidateQueries({ queryKey: ["restaurants", "meta-integration", restaurantId] })
      toast({
        title: "Success",
        description: "Meta (Facebook & Instagram) account connected successfully!",
      })
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/settings")
    }

    if (metaError) {
      const errorMessages: Record<string, string> = {
        missing_params: "Missing authorization parameters",
        token_exchange_failed: "Failed to obtain access token from Meta",
        no_pages: "No Facebook pages found. Please create a Facebook Page first.",
        invalid_account: "Unable to determine Facebook account ID",
        premium_required: "Premium subscription required. Please contact admin to upgrade.",
        unknown: "An unknown error occurred during Meta authorization",
      }

      toast({
        title: "Connection Failed",
        description: errorMessages[metaError] || "Failed to connect Meta account",
        variant: "destructive",
      })
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/settings")
    }
  }, [searchParams, queryClient, restaurantId, toast])

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a keyword",
        variant: "destructive",
      })
      return
    }

    if (keywords.length >= 5) {
      toast({
        title: "Limit Reached",
        description: "Maximum 5 keywords allowed",
        variant: "destructive",
      })
      return
    }

    if (keywords.includes(newKeyword.trim())) {
      toast({
        title: "Duplicate",
        description: "This keyword already exists",
        variant: "destructive",
      })
      return
    }

    updateKeywordsMutation.mutate([...keywords, newKeyword.trim()])
    setNewKeyword("")
  }

  const handleRemoveKeyword = (index: number) => {
    const updatedKeywords = keywords.filter((_, i) => i !== index)
    updateKeywordsMutation.mutate(updatedKeywords)
  }

  const handleSave = async () => {
    if (keywords.length < 3) {
      toast({
        title: "Error",
        description: "Please add at least 3 keywords",
        variant: "destructive",
      })
      return
    }

    updateKeywordsMutation.mutate(keywords)
  }

  const handleConnectGoogle = () => {
    if (!restaurantId) return
    const authUrl = googleAuthApi.authorize(restaurantId)
    window.location.href = authUrl
  }

  const handleConnectMeta = () => {
    if (!restaurantId) return
    const authUrl = metaAuthApi.authorize(restaurantId)
    window.location.href = authUrl
  }

  const handleSyncNow = async () => {
    const platforms: string[] = []
    if (isGoogleConnected) platforms.push("google")
    if (isMetaConnected) platforms.push("facebook")
    syncMutation.mutate(platforms.length > 0 ? platforms : undefined)
  }

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return "Never"
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
  }

  const isGoogleConnected = googleIntegration?.connected && googleIntegration?.status === "active"
  const isMetaConnected = metaIntegration?.connected && metaIntegration?.status === "active"

  // Loading state
  if (authLoading || !isAuthenticated || !restaurantId) {
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
      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Social Keywords Section */}
        <Card className="overflow-hidden border-2">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Social Media Keywords</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                  Add 3-5 keywords to find your restaurant mentions on Facebook and Instagram
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {keywordsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="e.g., #MyRestaurant or @restaurant_name"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
                      maxLength={50}
                      disabled={updateKeywordsMutation.isPending}
                      className="h-10"
                    />
                  </div>
                  <Button 
                    onClick={handleAddKeyword} 
                    disabled={keywords.length >= 5 || updateKeywordsMutation.isPending} 
                    size="default"
                    className="h-10 sm:w-auto w-full"
                  >
                    {updateKeywordsMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add
                  </Button>
                </div>

                {keywords.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Current Keywords</Label>
                      <span className="text-xs text-muted-foreground">{keywords.length}/5</span>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
                      {keywords.map((keyword, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="pr-1 text-sm py-1.5 px-3 h-auto"
                        >
                          <span className="mr-1.5">{keyword}</span>
                          <button
                            onClick={() => handleRemoveKeyword(index)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                            disabled={updateKeywordsMutation.isPending}
                            aria-label={`Remove ${keyword}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleSave} 
                  disabled={updateKeywordsMutation.isPending || keywords.length < 3} 
                  className="w-full h-10"
                  size="default"
                >
                  {updateKeywordsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Keywords
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Card className="overflow-hidden border-2">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Platform Integrations</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                  Connect your social media and review platforms
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Meta Integration */}
            <div className="space-y-3">
              <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-2 rounded-lg transition-all ${
                isMetaConnected 
                  ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" 
                  : "bg-muted/30 border-border"
              }`}>
                <div className="flex items-center gap-3 flex-1">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isMetaConnected 
                      ? "bg-blue-100 dark:bg-blue-900" 
                      : "bg-muted"
                  }`}>
                    <Facebook className={`h-6 w-6 ${
                      isMetaConnected 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-muted-foreground"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">Facebook & Instagram</p>
                      {isMetaConnected && (
                        <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metaLoading ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading...
                        </span>
                      ) : isMetaConnected ? (
                        `Last synced: ${formatLastSync(metaIntegration?.lastSyncedAt || null)}`
                      ) : (
                        "Connect to sync reviews from Facebook and Instagram"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isMetaConnected ? (
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-muted-foreground/30">
                      Not Connected
                    </Badge>
                  )}
                </div>
              </div>

              {!isMetaConnected && (
                <Button 
                  onClick={handleConnectMeta} 
                  className="w-full h-10" 
                  variant="outline"
                  disabled={metaLoading || !restaurantId}
                >
                  {metaLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Facebook className="h-4 w-4 mr-2" />
                      Connect Meta Account
                    </>
                  )}
                </Button>
              )}

              {isMetaConnected && (
                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">Connected:</span> Your Facebook Page
                    {metaIntegration?.instagramBusinessAccountId && " and Instagram Business Account"}
                    {metaIntegration?.instagramBusinessAccountId ? " are" : " is"} connected. 
                    Reviews will sync automatically every 24 hours.
                  </p>
                </div>
              )}
            </div>

            {/* Google Integration */}
            <div className="space-y-3">
              <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-2 rounded-lg transition-all ${
                isGoogleConnected 
                  ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                  : "bg-muted/30 border-border"
              }`}>
                <div className="flex items-center gap-3 flex-1">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isGoogleConnected 
                      ? "bg-green-100 dark:bg-green-900" 
                      : "bg-muted"
                  }`}>
                    <Chrome className={`h-6 w-6 ${
                      isGoogleConnected 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-muted-foreground"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">Google Business Profile</p>
                      {isGoogleConnected && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {googleLoading ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading...
                        </span>
                      ) : isGoogleConnected ? (
                        `Last synced: ${formatLastSync(googleIntegration?.lastSyncedAt || null)}`
                      ) : (
                        "Connect to sync reviews from Google Business Profile"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isGoogleConnected ? (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-muted-foreground/30">
                      Not Connected
                    </Badge>
                  )}
                </div>
              </div>

              {!isGoogleConnected && (
                <Button 
                  onClick={handleConnectGoogle} 
                  className="w-full h-10" 
                  variant="outline"
                  disabled={googleLoading || !restaurantId}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Chrome className="h-4 w-4 mr-2" />
                      Connect Google Account
                    </>
                  )}
                </Button>
              )}

              {isGoogleConnected && (
                <div className="p-3 bg-green-50/50 dark:bg-green-950/10 rounded-lg border border-green-200/50 dark:border-green-800/50">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">Connected:</span> Your Google Business Profile is connected. 
                    Reviews will sync automatically every 24 hours.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sync Settings */}
        <Card className="overflow-hidden border-2">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Sync Settings</CardTitle>
                <CardDescription className="text-xs mt-1">
                  External reviews are automatically synced every 24 hours
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-2 rounded-lg bg-muted/20">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-1">Last Sync</p>
                <p className="text-xs text-muted-foreground">
                  {isGoogleConnected || isMetaConnected
                    ? (() => {
                        const googleSync = isGoogleConnected ? googleIntegration?.lastSyncedAt : null
                        const metaSync = isMetaConnected ? metaIntegration?.lastSyncedAt : null
                        if (googleSync && metaSync) {
                          const googleDate = new Date(googleSync)
                          const metaDate = new Date(metaSync)
                          const latest = googleDate > metaDate ? googleDate : metaDate
                          return formatLastSync(latest.toISOString())
                        }
                        return formatLastSync(googleSync || metaSync || null)
                      })()
                    : "Not available - Connect an account first"
                  }
                </p>
              </div>
              <Button 
                onClick={handleSyncNow} 
                disabled={syncMutation.isPending || (!isGoogleConnected && !isMetaConnected) || !restaurantId} 
                size="default"
                variant="outline"
                className="h-10 w-full sm:w-auto shrink-0"
              >
                {syncMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
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
