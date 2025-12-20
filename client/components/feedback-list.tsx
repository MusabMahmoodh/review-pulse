"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, User, Phone, Calendar } from "lucide-react"
import type { StudentFeedback } from "@/lib/types"
import { ConvertToActionable } from "@/components/convert-to-actionable"
import { TagBadge } from "@/components/tag-badge"

interface FeedbackListProps {
  feedback: StudentFeedback[]
  loading: boolean
  compact?: boolean
  teacherId?: string | null
  organizationId?: string
}

export function FeedbackList({ feedback, loading, compact = false, teacherId, organizationId }: FeedbackListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (feedback.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>No feedback yet. Share your QR code to start collecting student feedback!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={compact ? "space-y-0 divide-y" : "space-y-3"}>
      {feedback.map((item) => (
        <div key={item.id} className={compact ? "px-6 py-4" : ""}>
          {!compact && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2 mb-1">
                      {item.studentName ? (
                        <>
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{item.studentName}</span>
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
                      {item.studentContact && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {item.studentContact}
                        </span>
                      )}
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag) => (
                          <TagBadge key={tag.id} tag={tag} size="sm" />
                        ))}
                      </div>
                    )}
                    {/* Show teacher name if organization view */}
                    {organizationId && (item as any).teacher && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          Teacher: {(item as any).teacher.name}
                        </Badge>
                      </div>
                    )}
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
                    {(teacherId || organizationId) && (
                      <div className="flex justify-end pt-2">
                        <ConvertToActionable
                          teacherId={teacherId || undefined}
                          organizationId={organizationId}
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
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.studentName || "Anonymous"}</p>
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
