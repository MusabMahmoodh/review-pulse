"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Star, Calendar, Loader2 } from "lucide-react"
import type { ExternalReview } from "@/lib/types"
import { useToast } from "@/hooks/use-toast-simple"

interface ExternalReviewsProps {
  restaurantId: string
  compact?: boolean
}

export function ExternalReviews({ restaurantId, compact = false }: ExternalReviewsProps) {
  const { toast } = useToast()
  const [reviews, setReviews] = useState<ExternalReview[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all")

  useEffect(() => {
    fetchReviews()
  }, [restaurantId])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/external-reviews/list?restaurantId=${restaurantId}`)
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const syncReviews = async (platforms?: string[]) => {
    setSyncing(true)
    try {
      const response = await fetch("/api/external-reviews/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, platforms }),
      })

      if (!response.ok) {
        throw new Error("Failed to sync reviews")
      }

      const data = await response.json()

      toast({
        title: "Sync Complete",
        description: `Synced ${data.syncedCount} new reviews`,
      })

      await fetchReviews()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync reviews",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      google: "🔍",
      facebook: "👥",
      instagram: "📸",
    }
    return icons[platform] || "⭐"
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      google: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      facebook: "bg-blue-600/10 text-blue-800 dark:text-blue-300 border-blue-600/20",
      instagram: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
    }
    return colors[platform] || "bg-muted"
  }

  const filteredReviews = selectedPlatform === "all" ? reviews : reviews.filter((r) => r.platform === selectedPlatform)

  const displayReviews = compact ? filteredReviews.slice(0, 3) : filteredReviews

  const googleCount = reviews.filter((r) => r.platform === "google").length
  const facebookCount = reviews.filter((r) => r.platform === "facebook").length
  const instagramCount = reviews.filter((r) => r.platform === "instagram").length

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Loading reviews...</p>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2 px-6">
          <Button
            variant={selectedPlatform === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPlatform("all")}
            className="flex-shrink-0"
          >
            All ({reviews.length})
          </Button>
          <Button
            variant={selectedPlatform === "google" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPlatform("google")}
            className="flex-shrink-0"
          >
            Google ({googleCount})
          </Button>
          <Button
            variant={selectedPlatform === "facebook" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPlatform("facebook")}
            className="flex-shrink-0"
          >
            FB ({facebookCount})
          </Button>
          <Button
            variant={selectedPlatform === "instagram" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPlatform("instagram")}
            className="flex-shrink-0"
          >
            IG ({instagramCount})
          </Button>
        </div>

        <div className="space-y-0 divide-y">
          {displayReviews.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              <p>No reviews from {selectedPlatform === "all" ? "any platform" : selectedPlatform} yet.</p>
            </div>
          ) : (
            displayReviews.map((review) => (
              <div key={review.id} className="px-6 py-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getPlatformColor(review.platform)}>
                        {getPlatformIcon(review.platform)} {review.platform}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        {review.rating}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{review.author}</p>
                    <p className="text-xs text-muted-foreground">{new Date(review.reviewDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">External Reviews</CardTitle>
              <CardDescription>Reviews from Google, Facebook, and Instagram</CardDescription>
            </div>
            <Button onClick={() => syncReviews()} disabled={syncing} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedPlatform === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPlatform("all")}
          className="flex-shrink-0"
        >
          All ({reviews.length})
        </Button>
        <Button
          variant={selectedPlatform === "google" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPlatform("google")}
          className="flex-shrink-0"
        >
          Google ({googleCount})
        </Button>
        <Button
          variant={selectedPlatform === "facebook" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPlatform("facebook")}
          className="flex-shrink-0"
        >
          Facebook ({facebookCount})
        </Button>
        <Button
          variant={selectedPlatform === "instagram" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPlatform("instagram")}
          className="flex-shrink-0"
        >
          Instagram ({instagramCount})
        </Button>
      </div>

      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>No reviews from {selectedPlatform === "all" ? "any platform" : selectedPlatform} yet.</p>
              <Button
                onClick={() => syncReviews()}
                disabled={syncing}
                variant="outline"
                className="mt-4 bg-transparent"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Reviews
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getPlatformColor(review.platform)}>
                        {getPlatformIcon(review.platform)}{" "}
                        {review.platform.charAt(0).toUpperCase() + review.platform.slice(1)}
                      </Badge>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        {review.rating}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{review.author}</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(review.reviewDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{review.comment}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Last Sync Info */}
      {reviews.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Last synced: {new Date(reviews[0].syncedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
