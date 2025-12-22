"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Star, Calendar, User } from "lucide-react"
import type { StudentFeedback } from "@/lib/types"

interface SupportingReviewsDialogProps {
  recommendation: string
  feedback: StudentFeedback[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Extract keywords from recommendation text for matching
 */
function extractKeywords(text: string): string[] {
  // Remove common words and extract meaningful terms
  const stopWords = new Set([
    "more", "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "should", "could",
    "may", "might", "must", "can", "this", "that", "these", "those", "it", "its",
    "students", "student", "practice", "examples", "include", "add", "consider",
    "would", "benefit", "requested", "additional", "helpful", "useful"
  ])
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
  
  return [...new Set(words)] // Remove duplicates
}

/**
 * Find relevant feedback entries based on recommendation keywords
 */
function findRelevantFeedback(
  recommendation: string,
  feedback: StudentFeedback[]
): StudentFeedback[] {
  const keywords = extractKeywords(recommendation)
  
  if (keywords.length === 0) {
    return feedback.slice(0, 5) // Return first 5 if no keywords
  }
  
  // Score each feedback entry based on keyword matches
  const scoredFeedback = feedback
    .filter(f => f.suggestions && f.suggestions.trim().length > 0)
    .map(f => {
      const suggestionText = (f.suggestions || "").toLowerCase()
      const courseName = (f.courseName || "").toLowerCase()
      const combinedText = `${suggestionText} ${courseName}`
      
      // Count keyword matches
      const matchCount = keywords.reduce((count, keyword) => {
        if (combinedText.includes(keyword)) {
          return count + 1
        }
        return count
      }, 0)
      
      return {
        feedback: f,
        score: matchCount,
      }
    })
    .filter(item => item.score > 0) // Only include feedback with matches
    .sort((a, b) => b.score - a.score) // Sort by relevance
    .slice(0, 10) // Top 10 most relevant
  
  return scoredFeedback.map(item => item.feedback)
}

export function SupportingReviewsDialog({
  recommendation,
  feedback,
  open,
  onOpenChange,
}: SupportingReviewsDialogProps) {
  const relevantFeedback = useMemo(
    () => findRelevantFeedback(recommendation, feedback),
    [recommendation, feedback]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Supporting Reviews
          </DialogTitle>
          <DialogDescription>
            Student feedback that supports this recommendation
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {relevantFeedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No relevant feedback found for this recommendation.</p>
            </div>
          ) : (
            relevantFeedback.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {item.studentName && (
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{item.studentName}</span>
                        </div>
                      )}
                      {item.courseName && (
                        <Badge variant="outline" className="text-xs">
                          {item.courseName}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{item.overallRating}/5</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {item.suggestions && (
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {item.suggestions}
                  </p>
                )}
                
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: tag.color ? `${tag.color}20` : undefined,
                          color: tag.color || undefined,
                        }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}






