"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Facebook, Instagram, Chrome, Save, RefreshCw, Plus, X, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast-simple"
import { restaurantsApi, externalReviewsApi, googleAuthApi, metaAuthApi } from "@/lib/api-client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

function SettingsPageContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [newKeyword, setNewKeyword] = useState("")

  const restaurantId = "rest_1765777607402_t8kmpnz"

  // Fetch keywords
  const { data: keywordsData, isLoading: keywordsLoading } = useQuery({
    queryKey: ["restaurants", "keywords", restaurantId],
    queryFn: () => restaurantsApi.getKeywords(restaurantId),
    enabled: !!restaurantId,
  })

  const keywords = keywordsData?.keywords || []

  // Fetch Google integration status
  const { data: googleIntegration, isLoading: googleLoading } = useQuery({
    queryKey: ["restaurants", "google-integration", restaurantId],
    queryFn: () => restaurantsApi.getGoogleIntegration(restaurantId),
    enabled: !!restaurantId,
    refetchInterval: 30000, // Refetch every 30 seconds to check status
  })

  // Fetch Meta integration status
  const { data: metaIntegration, isLoading: metaLoading } = useQuery({
    queryKey: ["restaurants", "meta-integration", restaurantId],
    queryFn: () => restaurantsApi.getMetaIntegration(restaurantId),
    enabled: !!restaurantId,
    refetchInterval: 30000, // Refetch every 30 seconds to check status
  })

  // Update keywords mutation
  const updateKeywordsMutation = useMutation({
    mutationFn: (keywords: string[]) => restaurantsApi.updateKeywords(restaurantId, keywords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurants", "keywords", restaurantId] })
      toast({
        title: "Success",
        description: "Social media keywords updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to update keywords",
        variant: "destructive",
      })
    },
  })

  // Sync reviews mutation
  const syncMutation = useMutation({
    mutationFn: (platforms?: string[]) => externalReviewsApi.sync(restaurantId, platforms),
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
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to sync reviews",
        variant: "destructive",
      })
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
    const authUrl = googleAuthApi.authorize(restaurantId)
    window.location.href = authUrl
  }

  const handleConnectMeta = () => {
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

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg">Settings</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Social Keywords Section */}
        <Card>
          <CardHeader>
            <CardTitle>Social Media Keywords</CardTitle>
            <CardDescription>
              Add 3-5 keywords to find your restaurant mentions on Facebook and Instagram. Include your restaurant name,
              hashtags, and common variations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="e.g., #MyRestaurant or @restaurant_name"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
                  maxLength={50}
                  disabled={keywordsLoading || updateKeywordsMutation.isPending}
                />
              </div>
              <Button 
                onClick={handleAddKeyword} 
                disabled={keywords.length >= 5 || keywordsLoading || updateKeywordsMutation.isPending} 
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {keywords.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Current Keywords ({keywords.length}/5)</Label>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="pr-1 text-sm">
                      {keyword}
                      <button
                        onClick={() => handleRemoveKeyword(index)}
                        className="ml-2 hover:bg-destructive/20 rounded-full p-0.5"
                        disabled={updateKeywordsMutation.isPending}
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
              disabled={keywordsLoading || updateKeywordsMutation.isPending || keywords.length < 3} 
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateKeywordsMutation.isPending ? "Saving..." : "Save Keywords"}
            </Button>
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>Manage your social media and review platform connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`flex items-center justify-between p-3 border rounded-lg ${isMetaConnected ? "bg-blue-50 dark:bg-blue-950/20" : "bg-muted/30"}`}>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isMetaConnected 
                    ? "bg-blue-100 dark:bg-blue-900" 
                    : "bg-gray-100 dark:bg-gray-800"
                }`}>
                  <Facebook className={`h-5 w-5 ${
                    isMetaConnected 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-gray-600 dark:text-gray-400"
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-sm">Facebook & Instagram</p>
                  <p className="text-xs text-muted-foreground">
                    {isMetaConnected 
                      ? `Last synced: ${formatLastSync(metaIntegration?.lastSyncedAt || null)}`
                      : "OAuth required"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isMetaConnected ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <Badge variant="default" className="bg-blue-600">Connected</Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">Not Connected</Badge>
                  </>
                )}
              </div>
            </div>

            {!isMetaConnected && (
              <Button 
                onClick={handleConnectMeta} 
                className="w-full" 
                variant="outline"
                disabled={metaLoading}
              >
                <Facebook className="h-4 w-4 mr-2" />
                Connect Meta Account
              </Button>
            )}

            {isMetaConnected && (
              <p className="text-xs text-muted-foreground px-1">
                Your Facebook Page{metaIntegration?.instagramBusinessAccountId ? " and Instagram Business Account" : ""} {metaIntegration?.instagramBusinessAccountId ? "are" : "is"} connected. Reviews will sync automatically every 24 hours.
              </p>
            )}

            <div className={`flex items-center justify-between p-3 border rounded-lg ${isGoogleConnected ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/30"}`}>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  isGoogleConnected 
                    ? "bg-green-100 dark:bg-green-900" 
                    : "bg-gray-100 dark:bg-gray-800"
                }`}>
                  <Chrome className={`h-5 w-5 ${
                    isGoogleConnected 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-gray-600 dark:text-gray-400"
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-sm">Google My Business</p>
                  <p className="text-xs text-muted-foreground">
                    {isGoogleConnected 
                      ? `Last synced: ${formatLastSync(googleIntegration?.lastSyncedAt || null)}`
                      : "OAuth required"
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isGoogleConnected ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <Badge variant="default" className="bg-green-600">Connected</Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">Not Connected</Badge>
                  </>
                )}
              </div>
            </div>

            {!isGoogleConnected && (
              <Button 
                onClick={handleConnectGoogle} 
                className="w-full" 
                variant="outline"
                disabled={googleLoading}
              >
                <Chrome className="h-4 w-4 mr-2" />
                Connect Google Account
              </Button>
            )}

            {isGoogleConnected && (
              <p className="text-xs text-muted-foreground px-1">
                Your Google Business Profile is connected. Reviews will sync automatically every 24 hours.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Sync Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Settings</CardTitle>
            <CardDescription>External reviews are automatically synced every 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Last Sync</p>
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
                  disabled={syncMutation.isPending || (!isGoogleConnected && !isMetaConnected)} 
                  size="sm" 
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                  {syncMutation.isPending ? "Syncing..." : "Sync Now"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
