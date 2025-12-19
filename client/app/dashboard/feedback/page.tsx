"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Star, Filter, RefreshCw, Calendar } from "lucide-react"
import Link from "next/link"
import { FeedbackList } from "@/components/feedback-list"
import { RatingsTrendChart } from "@/components/ratings-trend-chart"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { useFeedbackList, useExternalReviews, useSyncExternalReviews } from "@/hooks"
import { useToast } from "@/hooks/use-toast-simple"
import type { CustomerFeedback, ExternalReview } from "@/lib/types"
import { ConvertToActionable } from "@/components/convert-to-actionable"

export default function FeedbackPage() {
  const restaurantId = "rest_1765777607402_t8kmpnz"
  const { toast } = useToast()
  const { data: feedbackData, isLoading: loadingFeedback } = useFeedbackList(restaurantId)
  const { data: externalReviewsData, isLoading: loadingExternal } = useExternalReviews(restaurantId)
  const syncMutation = useSyncExternalReviews()
  
  const allFeedback = feedbackData?.feedback || []
  const allExternalReviews = externalReviewsData?.reviews || []

  // Filter states
  const [sourceTypeFilter, setSourceTypeFilter] = useState<"all" | "internal" | "external">("all")
  const [starFilter, setStarFilter] = useState<number | "all">("all")
  const [ratingTypeFilter, setRatingTypeFilter] = useState<"all" | "food" | "staff" | "ambience" | "overall">("all")
  const [timePeriod, setTimePeriod] = useState<"1month" | "3months" | "6months" | "1year">("3months")
  const [chartRatingType, setChartRatingType] = useState<"food" | "staff" | "ambience" | "overall">("overall")

  const loading = loadingFeedback || loadingExternal

  const syncExternalReviews = async () => {
    syncMutation.mutate(
      { restaurantId },
      {
        onSuccess: () => {
          toast({
            title: "Sync Complete",
            description: "External reviews synced successfully",
          })
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to sync external reviews",
            variant: "destructive",
          })
        },
      }
    )
  }

  // Filter by source type (internal/external/all)
  const filteredBySource = useMemo(() => {
    if (sourceTypeFilter === "internal") {
      return { feedback: allFeedback, externalReviews: [] }
    }
    if (sourceTypeFilter === "external") {
      return { feedback: [], externalReviews: allExternalReviews }
    }
    return { feedback: allFeedback, externalReviews: allExternalReviews }
  }, [allFeedback, allExternalReviews, sourceTypeFilter])

  // Filter by star rating
  const filteredByStars = useMemo(() => {
    const filteredFeedback = starFilter === "all" 
      ? filteredBySource.feedback 
      : filteredBySource.feedback.filter((f) => f.overallRating === starFilter)
    
    const filteredExternal = starFilter === "all"
      ? filteredBySource.externalReviews
      : filteredBySource.externalReviews.filter((r) => r.rating === starFilter)
    
    return { feedback: filteredFeedback, externalReviews: filteredExternal }
  }, [filteredBySource, starFilter])

  // Filter by rating type (for list display)
  const filteredData = useMemo(() => {
    if (ratingTypeFilter === "all") return filteredByStars
    
    // For external reviews, only overall rating exists, so filter by that
    const filteredExternal = filteredByStars.externalReviews.filter((r) => {
      if (ratingTypeFilter === "overall") {
        return r.rating >= 4 || r.rating <= 2
      }
      // For food/staff/ambience filters, external reviews don't have these, so exclude them
      return false
    })
    
    const filteredFeedback = filteredByStars.feedback.filter((f) => {
      const rating = ratingTypeFilter === "food" ? f.foodRating
        : ratingTypeFilter === "staff" ? f.staffRating
        : ratingTypeFilter === "ambience" ? f.ambienceRating
        : f.overallRating
      
      return rating >= 4 || rating <= 2
    })
    
    return { feedback: filteredFeedback, externalReviews: filteredExternal }
  }, [filteredByStars, ratingTypeFilter])

  const totalCount = filteredData.feedback.length + filteredData.externalReviews.length
  const totalAvailable = allFeedback.length + allExternalReviews.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center gap-3">
            <Link href="/dashboard">
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold leading-none">All Feedback</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalCount} of {totalAvailable} reviews
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-6">
        {/* Trend Chart Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Rating Trends</CardTitle>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Time Period Selector */}
                <div className="flex gap-1 border rounded-md p-1">
                  {[
                    { value: "1month", label: "1M" },
                    { value: "3months", label: "3M" },
                    { value: "6months", label: "6M" },
                    { value: "1year", label: "1Y" },
                  ].map((period) => (
                    <Button
                      key={period.value}
                      size="sm"
                      variant={timePeriod === period.value ? "default" : "ghost"}
                      onClick={() => setTimePeriod(period.value as typeof timePeriod)}
                      className="h-7 px-3 text-xs"
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
                {/* Rating Type Selector for Chart */}
                <div className="flex gap-1 border rounded-md p-1">
                  {[
                    { value: "food", label: "Food" },
                    { value: "staff", label: "Staff" },
                    { value: "ambience", label: "Ambience" },
                    { value: "overall", label: "Overall" },
                  ].map((type) => (
                    <Button
                      key={type.value}
                      size="sm"
                      variant={chartRatingType === type.value ? "default" : "ghost"}
                      onClick={() => setChartRatingType(type.value as typeof chartRatingType)}
                      className="h-7 px-3 text-xs"
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RatingsTrendChart
              feedback={allFeedback}
              timePeriod={timePeriod}
              ratingType={chartRatingType}
            />
          </CardContent>
        </Card>

         {/* Filters Section */}
         <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Filters</CardTitle>
              </div>
              {sourceTypeFilter !== "internal" && (
                <Button 
                  onClick={syncExternalReviews} 
                  disabled={syncMutation.isPending} 
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                  {syncMutation.isPending ? "Syncing..." : "Sync External"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Source Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Source</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={sourceTypeFilter === "all" ? "default" : "outline"}
                  onClick={() => setSourceTypeFilter("all")}
                >
                  All ({allFeedback.length + allExternalReviews.length})
                </Button>
                <Button
                  size="sm"
                  variant={sourceTypeFilter === "internal" ? "default" : "outline"}
                  onClick={() => setSourceTypeFilter("internal")}
                >
                  Guestra ({allFeedback.length})
                </Button>
                <Button
                  size="sm"
                  variant={sourceTypeFilter === "external" ? "default" : "outline"}
                  onClick={() => setSourceTypeFilter("external")}
                >
                  External ({allExternalReviews.length})
                </Button>
              </div>
            </div>

            {/* Star Rating Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Star Rating</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={starFilter === "all" ? "default" : "outline"}
                  onClick={() => setStarFilter("all")}
                  className="gap-1"
                >
                  All
                </Button>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <Button
                    key={stars}
                    size="sm"
                    variant={starFilter === stars ? "default" : "outline"}
                    onClick={() => setStarFilter(stars)}
                    className="gap-1"
                  >
                    <Star className="h-3 w-3 fill-current" />
                    {stars}
                  </Button>
                ))}
              </div>
            </div>

            {/* Rating Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Rating Type</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={ratingTypeFilter === "all" ? "default" : "outline"}
                  onClick={() => setRatingTypeFilter("all")}
                >
                  All Types
                </Button>
                <Button
                  size="sm"
                  variant={ratingTypeFilter === "food" ? "default" : "outline"}
                  onClick={() => setRatingTypeFilter("food")}
                  disabled={sourceTypeFilter === "external"}
                >
                  Food
                </Button>
                <Button
                  size="sm"
                  variant={ratingTypeFilter === "staff" ? "default" : "outline"}
                  onClick={() => setRatingTypeFilter("staff")}
                  disabled={sourceTypeFilter === "external"}
                >
                  Staff
                </Button>
                <Button
                  size="sm"
                  variant={ratingTypeFilter === "ambience" ? "default" : "outline"}
                  onClick={() => setRatingTypeFilter("ambience")}
                  disabled={sourceTypeFilter === "external"}
                >
                  Ambience
                </Button>
                <Button
                  size="sm"
                  variant={ratingTypeFilter === "overall" ? "default" : "outline"}
                  onClick={() => setRatingTypeFilter("overall")}
                >
                  Overall
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Feedback List */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Feedback List</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : totalCount === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>
                    No {sourceTypeFilter === "all" ? "feedback" : sourceTypeFilter === "internal" ? "Guestra feedback" : "external reviews"} found with the selected filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Internal Feedback with Guestra badge */}
                {filteredData.feedback.length > 0 && filteredData.feedback.map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {sourceTypeFilter === "all" && (
                              <Badge 
                                variant="outline" 
                                className="bg-primary/10 text-primary border-primary/20"
                              >
                                Guestra
                              </Badge>
                            )}
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              {item.overallRating}
                            </Badge>
                          </div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {item.customerName || "Anonymous"}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Food</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="font-medium">{item.foodRating}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Staff</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="font-medium">{item.staffRating}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Ambience</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="font-medium">{item.ambienceRating}</span>
                          </div>
                        </div>
                      </div>
                      {item.suggestions && (
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                          <p className="text-sm">{item.suggestions}</p>
                          {restaurantId && (
                            <div className="flex justify-end pt-2">
                              <ConvertToActionable
                                restaurantId={restaurantId}
                                sourceType="comment"
                                sourceId={item.id}
                                sourceText={item.suggestions}
                                defaultTitle={item.suggestions.substring(0, 50) + (item.suggestions.length > 50 ? "..." : "")}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {/* External Reviews */}
                {filteredData.externalReviews.length > 0 && filteredData.externalReviews.map((review) => (
                  <Card key={`external-${review.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className={
                                review.platform === "google" 
                                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                                  : review.platform === "facebook"
                                  ? "bg-blue-600/10 text-blue-800 dark:text-blue-300 border-blue-600/20"
                                  : "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20"
                              }
                            >
                              {review.platform === "google" ? "🔍" : review.platform === "facebook" ? "👥" : "📸"}{" "}
                              {review.platform.charAt(0).toUpperCase() + review.platform.slice(1)}
                            </Badge>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              {review.rating}
                            </Badge>
                          </div>
                          <CardTitle className="text-base">{review.author}</CardTitle>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{new Date(review.reviewDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm leading-relaxed">{review.comment}</p>
                      {restaurantId && review.comment && (
                        <div className="flex justify-end pt-2 border-t">
                          <ConvertToActionable
                            restaurantId={restaurantId}
                            sourceType="comment"
                            sourceId={review.id}
                            sourceText={review.comment}
                            defaultTitle={review.comment.substring(0, 50) + (review.comment.length > 50 ? "..." : "")}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
