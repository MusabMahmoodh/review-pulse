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
import { Star, Filter, Calendar, X } from "lucide-react"
import { FeedbackList } from "@/components/feedback-list"
import { RatingsTrendChart } from "@/components/ratings-trend-chart"
import { useFeedbackList, useAuth, useTags } from "@/hooks"
import type { StudentFeedback } from "@/lib/types"
import { ConvertToActionable } from "@/components/convert-to-actionable"
import { TagBadge } from "@/components/tag-badge"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export default function FeedbackPage() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
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

  // Show latest feedback twice (as requested)
  const latestFeedback = useMemo(() => {
    const sorted = [...filteredData.feedback].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const latest = sorted[0]
    if (latest) {
      return [latest, latest, ...sorted.slice(1)]
    }
    return sorted
  }, [filteredData.feedback])

  return (
    <>
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex h-16 items-center gap-3">
              <div className="flex-1">
                <h1 className="text-lg font-semibold leading-none">All Feedback</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalCount} of {totalAvailable} feedback entries
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-6">
        {/* Trend Chart Section */}
        <div className="bg-card border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h2 className="text-base sm:text-lg font-semibold">Rating Trends</h2>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Time Period Selector */}
            <div className="flex gap-1 border rounded-md p-1 flex-wrap">
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
                  className="h-7 px-2 text-xs flex-shrink-0"
                >
                  {period.label}
                </Button>
              ))}
            </div>
            {/* Rating Type Selector for Chart */}
            <div className="flex gap-1 border rounded-md p-1 flex-wrap">
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
                  className="h-7 px-2 text-xs flex-shrink-0"
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <RatingsTrendChart
              feedback={allFeedback}
              timePeriod={timePeriod}
              ratingType={chartRatingType}
            />
          </div>
        </div>

         {/* Filters Section */}
         <div className="bg-card border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h2 className="text-base sm:text-lg font-semibold">Filters</h2>
          </div>
          
          {/* Star Rating Filter */}
          <div>
            <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Star Rating</label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Button
                size="sm"
                variant={starFilter === "all" ? "default" : "outline"}
                onClick={() => setStarFilter("all")}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs gap-1"
              >
                All
              </Button>
              {[5, 4, 3, 2, 1].map((stars) => (
                <Button
                  key={stars}
                  size="sm"
                  variant={starFilter === stars ? "default" : "outline"}
                  onClick={() => setStarFilter(stars)}
                  className="h-7 sm:h-8 px-2 sm:px-3 text-xs gap-1"
                >
                  <Star className="h-3 w-3 fill-current" />
                  {stars}
                </Button>
              ))}
            </div>
          </div>

          {/* Rating Type Filter */}
          <div>
            <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Rating Type</label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Button
                size="sm"
                variant={ratingTypeFilter === "all" ? "default" : "outline"}
                onClick={() => setRatingTypeFilter("all")}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={ratingTypeFilter === "teaching" ? "default" : "outline"}
                onClick={() => setRatingTypeFilter("teaching")}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
              >
                Teaching
              </Button>
              <Button
                size="sm"
                variant={ratingTypeFilter === "communication" ? "default" : "outline"}
                onClick={() => setRatingTypeFilter("communication")}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
              >
                Comm
              </Button>
              <Button
                size="sm"
                variant={ratingTypeFilter === "material" ? "default" : "outline"}
                onClick={() => setRatingTypeFilter("material")}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
              >
                Materials
              </Button>
              <Button
                size="sm"
                variant={ratingTypeFilter === "overall" ? "default" : "outline"}
                onClick={() => setRatingTypeFilter("overall")}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
              >
                Overall
              </Button>
            </div>
          </div>

          {/* Tag Filter */}
          {availableTags.length > 0 && (
            <div>
              <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Tag</label>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selectedTagId || "all"}
                  onValueChange={(value) => setSelectedTagId(value === "all" ? null : value)}
                >
                  <SelectTrigger className="h-8 sm:h-9 w-full sm:w-[200px] text-xs sm:text-sm">
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
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedTagId(null)}
                      className="h-8 sm:h-9 px-2 text-xs"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <TagBadge
                      tag={availableTags.find(t => t.id === selectedTagId)!}
                      size="sm"
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>


        {/* Feedback List */}
        <div className="bg-card border rounded-lg p-3 sm:p-4">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Feedback</h2>
          {loading ? (
            <div className="space-y-2 sm:space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-muted rounded-lg h-24 sm:h-28" />
              ))}
            </div>
          ) : totalCount === 0 ? (
            <div className="p-6 sm:p-8 text-center text-muted-foreground">
              <p className="text-sm sm:text-base">
                No feedback found with the selected filters.
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredData.feedback.map((item) => (
                <div key={item.id} className="bg-background border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="flex items-center gap-1 h-5 sm:h-6 px-1.5 sm:px-2 text-xs">
                          <Star className="h-3 w-3 fill-current" />
                          {item.overallRating}
                        </Badge>
                        <span className="text-sm sm:text-base font-semibold">
                          {item.studentName || "Anonymous"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 border-t">
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Teaching</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-xs sm:text-sm font-medium">{item.teachingRating}</span>
                      </div>
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Comm</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-xs sm:text-sm font-medium">{item.communicationRating}</span>
                      </div>
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Materials</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-xs sm:text-sm font-medium">{item.materialRating}</span>
                      </div>
                    </div>
                  </div>
                  {item.suggestions && (
                    <div className="bg-muted/50 rounded-lg p-2.5 sm:p-3 space-y-2 pt-2.5 sm:pt-3">
                      <p className="text-xs sm:text-sm leading-relaxed">{item.suggestions}</p>
                      {teacherId && (
                        <div className="flex justify-end pt-1">
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
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
    </>
  )
}
