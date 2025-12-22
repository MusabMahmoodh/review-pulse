"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, Star, Filter, Calendar, X } from "lucide-react"
import Link from "next/link"
import { FeedbackList } from "@/components/feedback-list"
import { RatingsTrendChart } from "@/components/ratings-trend-chart"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { useFeedbackList, useAuth, useTags } from "@/hooks"
import type { StudentFeedback } from "@/lib/types"
import { ConvertToActionable } from "@/components/convert-to-actionable"
import { TagBadge } from "@/components/tag-badge"

export default function FeedbackPage() {
  const { user } = useAuth()
  const teacherId = user?.id || null
  const organizationId = user?.userType === "organization" ? user.id : undefined
  
  // Filter states
  const [starFilter, setStarFilter] = useState<number | "all">("all")
  const [ratingTypeFilter, setRatingTypeFilter] = useState<"all" | "teaching" | "communication" | "material" | "overall">("all")
  const [timePeriod, setTimePeriod] = useState<"1month" | "3months" | "6months" | "1year">("3months")
  const [chartRatingType, setChartRatingType] = useState<"teaching" | "communication" | "material" | "overall">("overall")
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)

  // Fetch tags for filtering
  const { data: tagsData } = useTags({
    teacherId: user?.userType === "teacher" ? teacherId : undefined,
    organizationId,
  })
  const availableTags = tagsData?.tags.filter(tag => tag.isActive) || []

  // Fetch feedback with optional tag filter
  const { data: feedbackData, isLoading: loadingFeedback } = useFeedbackList(
    teacherId,
    selectedTagId || undefined
  )
  
  const allFeedback = feedbackData?.feedback || []

  const loading = loadingFeedback

  // Filter by star rating
  const filteredByStars = useMemo(() => {
    const filteredFeedback = starFilter === "all" 
      ? allFeedback 
      : allFeedback.filter((f) => f.overallRating === starFilter)
    
    return { feedback: filteredFeedback }
  }, [allFeedback, starFilter])

  // Filter by rating type (for list display)
  const filteredData = useMemo(() => {
    if (ratingTypeFilter === "all") return filteredByStars
    
    const filteredFeedback = filteredByStars.feedback.filter((f) => {
      const rating = ratingTypeFilter === "teaching" ? f.teachingRating
        : ratingTypeFilter === "communication" ? f.communicationRating
        : ratingTypeFilter === "material" ? f.materialRating
        : f.overallRating
      
      return rating >= 4 || rating <= 2
    })
    
    return { feedback: filteredFeedback }
  }, [filteredByStars, ratingTypeFilter])

  const totalCount = filteredData.feedback.length
  const totalAvailable = allFeedback.length

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
                {totalCount} of {totalAvailable} feedback entries
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
                    { value: "teaching", label: "Teaching" },
                    { value: "communication", label: "Communication" },
                    { value: "material", label: "Materials" },
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
                  variant={ratingTypeFilter === "teaching" ? "default" : "outline"}
                  onClick={() => setRatingTypeFilter("teaching")}
                >
                  Teaching
                </Button>
                <Button
                  size="sm"
                  variant={ratingTypeFilter === "communication" ? "default" : "outline"}
                  onClick={() => setRatingTypeFilter("communication")}
                >
                  Communication
                </Button>
                <Button
                  size="sm"
                  variant={ratingTypeFilter === "material" ? "default" : "outline"}
                  onClick={() => setRatingTypeFilter("material")}
                >
                  Materials
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

            {/* Tag Filter */}
            {availableTags.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Tag</label>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={selectedTagId || "all"}
                    onValueChange={(value) => setSelectedTagId(value === "all" ? null : value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tags</SelectItem>
                      {availableTags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTagId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedTagId(null)}
                      className="h-9"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                  {selectedTagId && (
                    <TagBadge
                      tag={availableTags.find(t => t.id === selectedTagId)!}
                      size="sm"
                    />
                  )}
                </div>
              </div>
            )}
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
                    No feedback found with the selected filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredData.feedback.map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current" />
                              {item.overallRating}
                            </Badge>
                          </div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {item.studentName || "Anonymous"}
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
                          <p className="text-xs text-muted-foreground">Teaching</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="font-medium">{item.teachingRating}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Communication</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="font-medium">{item.communicationRating}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Materials</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="font-medium">{item.materialRating}</span>
                          </div>
                        </div>
                      </div>
                      {item.suggestions && (
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                          <p className="text-sm">{item.suggestions}</p>
                          {teacherId && (
                            <div className="flex justify-end pt-2">
                              <ConvertToActionable
                                teacherId={teacherId}
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
