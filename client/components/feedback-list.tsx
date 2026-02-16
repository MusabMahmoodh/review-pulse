"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, User, Phone, Calendar } from "lucide-react"
import type { CustomerFeedback } from "@/lib/types"
import { ConvertToActionable } from "@/components/convert-to-actionable"

interface FeedbackListProps {
  feedback: CustomerFeedback[]
  loading: boolean
  compact?: boolean
  restaurantId?: string
}

export function FeedbackList({ feedback, loading, compact = false, restaurantId }: FeedbackListProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg border border-border p-4">
            <div className="h-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (feedback.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No feedback yet. Share your QR code to start collecting reviews!
        </p>
      </div>
    )
  }

  return (
    <div className={compact ? "divide-y divide-border" : "space-y-3"}>
      {feedback.map((item) => (
        <div key={item.id} className={compact ? "px-5 py-4" : ""}>
          {!compact && (
            <Card className="border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2 mb-1">
                      {item.customerName ? (
                        <>
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{item.customerName}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Anonymous</span>
                      )}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      {item.customerContact && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {item.customerContact}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
                    <Star className="h-3 w-3 fill-current" />
                    {item.overallRating}
                  </Badge>
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
                  <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
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
          )}

          {compact && (
            <div className="space-y-2 rounded-md transition-colors hover:bg-muted/30">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.customerName || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
                  <Star className="h-3 w-3 fill-current" />
                  {item.overallRating}
                </Badge>
              </div>
              {item.suggestions && <p className="text-sm text-muted-foreground line-clamp-2">{item.suggestions}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
