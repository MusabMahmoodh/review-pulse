"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, Star, Filter } from "lucide-react"
import Link from "next/link"
import { FeedbackList } from "@/components/feedback-list"
import { RatingsTrendChart } from "@/components/ratings-trend-chart"
import { useFeedbackList } from "@/hooks"

export default function FeedbackPage() {
  const restaurantId = "rest_1765777607402_t8kmpnz"
  const { data: feedbackData, isLoading: loading } = useFeedbackList(restaurantId)
  const allFeedback = feedbackData?.feedback || []

  // Filter states
  const [starFilter, setStarFilter] = useState<number | "all">("all")
  const [ratingTypeFilter, setRatingTypeFilter] = useState<"all" | "food" | "staff" | "ambience" | "overall">("all")
  const [timePeriod, setTimePeriod] = useState<"1month" | "3months" | "6months" | "1year">("3months")
  const [chartRatingType, setChartRatingType] = useState<"food" | "staff" | "ambience" | "overall">("overall")

  // Filter feedback by star rating
  const filteredByStars = useMemo(() => {
    if (starFilter === "all") return allFeedback
    return allFeedback.filter((f) => f.overallRating === starFilter)
  }, [allFeedback, starFilter])

  // Filter feedback by rating type (for list display)
  const filteredFeedback = useMemo(() => {
    if (ratingTypeFilter === "all") return filteredByStars
    
    return filteredByStars.filter((f) => {
      const rating = ratingTypeFilter === "food" ? f.foodRating
        : ratingTypeFilter === "staff" ? f.staffRating
        : ratingTypeFilter === "ambience" ? f.ambienceRating
        : f.overallRating
      
      // Show feedback where this rating type is >= 4 (good) or <= 2 (needs improvement)
      // You can adjust this logic as needed
      return rating >= 4 || rating <= 2
    })
  }, [filteredByStars, ratingTypeFilter])

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
                {filteredFeedback.length} of {allFeedback.length} reviews
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
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
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
                >
                  Food
                </Button>
                <Button
                  size="sm"
                  variant={ratingTypeFilter === "staff" ? "default" : "outline"}
                  onClick={() => setRatingTypeFilter("staff")}
                >
                  Staff
                </Button>
                <Button
                  size="sm"
                  variant={ratingTypeFilter === "ambience" ? "default" : "outline"}
                  onClick={() => setRatingTypeFilter("ambience")}
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
            <FeedbackList feedback={filteredFeedback} loading={loading} restaurantId={restaurantId} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
