import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, User, Phone, Calendar } from "lucide-react"
import type { CustomerFeedback } from "@/lib/types"

interface FeedbackListProps {
  feedback: CustomerFeedback[]
  loading: boolean
  compact?: boolean
}

export function FeedbackList({ feedback, loading, compact = false }: FeedbackListProps) {
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
          <p>No feedback yet. Share your QR code to start collecting reviews!</p>
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
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm">{item.suggestions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {compact && (
            <div className="space-y-2">
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
