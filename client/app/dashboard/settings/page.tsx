"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Facebook, Instagram, Save, RefreshCw, Plus, X, CheckCircle2, AlertCircle, Loader2, Hash, Crown, Lock, Palette, MessageSquare, Star, MapPin } from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast-simple"
import { useAuth } from "@/hooks/use-auth"
import { restaurantsApi, externalReviewsApi, metaAuthApi } from "@/lib/api-client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { isPremiumRequiredError, isPremiumFromAuth } from "@/lib/premium"
import { PremiumUpgrade } from "@/components/premium-upgrade"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

function SettingsPageContent() {
  const { toast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [newKeyword, setNewKeyword] = useState("")
  const [premiumError, setPremiumError] = useState<{ section?: string } | null>(null)
  const [placeId, setPlaceId] = useState("")

  const restaurantId = user?.id || null
  const hasPremium = isPremiumFromAuth(user?.subscription)

  // Fetch saved Place ID
  const { data: placeIdData } = useQuery({
    queryKey: ["restaurants", "google-place-id", restaurantId],
    queryFn: () => restaurantsApi.getGooglePlaceId(restaurantId!),
    enabled: !!restaurantId && isAuthenticated,
  })

  // Load saved placeId when data is available
  useEffect(() => {
    if (placeIdData?.placeId) {
      setPlaceId(placeIdData.placeId)
    }
  }, [placeIdData?.placeId])

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

  // Fetch Meta integration status
  const { data: metaIntegration, isLoading: metaLoading } = useQuery({
    queryKey: ["restaurants", "meta-integration", restaurantId],
    queryFn: () => restaurantsApi.getMetaIntegration(restaurantId!),
    enabled: !!restaurantId && isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds to check status
  })

  // Fetch review page settings
  const { data: reviewPageSettings, isLoading: reviewSettingsLoading } = useQuery({
    queryKey: ["restaurants", "review-page-settings", restaurantId],
    queryFn: () => restaurantsApi.getReviewPageSettings(restaurantId!),
    enabled: !!restaurantId && isAuthenticated,
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
        setPremiumError({ section: "keywords" })
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

  // Update review page settings mutation
  const updateReviewSettingsMutation = useMutation({
    mutationFn: (settings: typeof reviewSettings) => 
      restaurantsApi.updateReviewPageSettings(restaurantId!, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants", "review-page-settings", restaurantId] })
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

  // Sync reviews mutation
  const syncMutation = useMutation({
    mutationFn: ({ platforms, placeId }: { platforms?: string[]; placeId?: string }) => 
      externalReviewsApi.sync(restaurantId!, platforms, placeId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["external-reviews", restaurantId] })
      queryClient.invalidateQueries({ queryKey: ["restaurants", "meta-integration", restaurantId] })
      
      const totalSynced = data.totalSynced || 0
      const googleResult = data.results?.google
      // const facebookResult = data.results?.facebook
      
      const successMessages: string[] = []
      const errorMessages: string[] = []
      
      if (googleResult?.success) {
        successMessages.push(`Google: ${googleResult.count} review${googleResult.count !== 1 ? "s" : ""}`)
      } else if (googleResult?.error) {
        errorMessages.push(`Google: ${googleResult.error}`)
      }
      
      // if (facebookResult?.success) {
      //   successMessages.push(`Facebook: ${facebookResult.count} review${facebookResult.count !== 1 ? "s" : ""}`)
      // } else if (facebookResult?.error) {
      //   errorMessages.push(`Facebook: ${facebookResult.error}`)
      // }
      
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
        setPremiumError({ section: "sync" })
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

  const handleConnectMeta = () => {
    if (!restaurantId) return
    const authUrl = metaAuthApi.authorize(restaurantId)
    window.location.href = authUrl
  }

  const handleSyncNow = async () => {
    if (!placeId) {
      toast({
        title: "Place ID Required",
        description: "Please enter a Google Place ID to sync reviews.",
        variant: "destructive",
      })
      return
    }
    
    syncMutation.mutate({ 
      platforms: ["google"],
      placeId: placeId
    })
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
      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-6">
        {/* Social Keywords Section */}
        {/* <Card className="overflow-hidden border-2">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">Social Media Keywords</CardTitle>
                  <Badge className="text-xs bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-950 border-yellow-400 shadow-sm font-semibold">
                    <Crown className="h-3 w-3 mr-1 fill-yellow-900 text-yellow-900" />
                    Premium
                  </Badge>
                </div>
                <CardDescription className="text-xs mt-1">
                 
                  Add 3-5 keywords to find your restaurant mentions on social media
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
            ) : (!hasPremium || premiumError?.section === "keywords") ? (
              <PremiumUpgrade 
                feature="Social Media Keywords"
                description="Track your restaurant mentions on social media with custom keywords. This feature requires a premium subscription."
              />
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
        </Card> */}

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
                  <Badge className="text-xs bg-gradient-to-r from-yellow-500 to-yellow-600 text-yellow-950 border-yellow-400 shadow-sm font-semibold">
                    <Crown className="h-3 w-3 mr-1 fill-yellow-900 text-yellow-900" />
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
            {!hasPremium || premiumError?.section === "integrations" ? (
              <PremiumUpgrade 
                feature="Platform Integrations"
                description="Connect your Google Business Profile to sync reviews automatically. This feature requires a premium subscription."
              />
            ) : (
              <>
                {/* Meta Integration - Commented out for now */}
            {/* <div className="space-y-3">
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
            </div> */}

            {/* Google Integration - Place ID */}
            <div className="space-y-3">
              <div className={`p-4 border-2 rounded-lg transition-all ${
                placeId 
                  ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" 
                  : "bg-muted/30 border-border"
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    placeId 
                      ? "bg-blue-100 dark:bg-blue-900" 
                      : "bg-muted"
                  }`}>
                    <MapPin className={`h-6 w-6 ${
                      placeId 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-muted-foreground"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Google Place ID</p>
                    <p className="text-xs text-muted-foreground">
                      Enter your Google Place ID to sync reviews from Google.
                    </p>
                  </div>
                  {placeId && (
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                      Set
                    </Badge>
                  )}
                </div>

                {/* Manual Place ID Input */}
                <div className="space-y-2">
                  <Label htmlFor="place-id">Google Place ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="place-id"
                      placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                      value={placeId}
                      onChange={(e) => setPlaceId(e.target.value)}
                      className="flex-1"
                    />
                    {placeId && placeId !== placeIdData?.placeId && (
                      <Button
                        onClick={async () => {
                          try {
                            await restaurantsApi.updateGooglePlaceId(restaurantId!, placeId)
                            toast({
                              title: "Place ID Saved",
                              description: "Google Place ID has been saved successfully.",
                            })
                            queryClient.invalidateQueries({ queryKey: ["restaurants", restaurantId] })
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error?.data?.error || "Failed to save Place ID",
                              variant: "destructive",
                            })
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Save
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Find your Place ID using{" "}
                    <a
                      href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      Google's Place ID Finder
                    </a>
                  </p>
                </div>

                {placeId && (
                  <div className="p-3 bg-green-50/50 dark:bg-green-950/10 rounded-lg border border-green-200/50 dark:border-green-800/50 mt-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">✓ Place ID saved:</span> {placeId}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You can now sync reviews using this Place ID.
                    </p>
                  </div>
                )}
              </div>
            </div>
              </>
            )}
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
            {!hasPremium || premiumError?.section === "sync" ? (
              <PremiumUpgrade 
                feature="Sync Settings"
                description="Manually sync reviews from connected platforms. This feature requires a premium subscription."
              />
            ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-2 rounded-lg bg-muted/20">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-1">Last Sync</p>
                <p className="text-xs text-muted-foreground">
                  {placeId
                    ? "Ready to sync with Place ID"
                    : "Enter Place ID to sync reviews"
                  }
                </p>
              </div>
              <Button 
                onClick={handleSyncNow} 
                disabled={
                  syncMutation.isPending || 
                  !restaurantId || 
                  !placeId
                } 
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
            )}
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
