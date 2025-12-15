"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { FeedbackList } from "@/components/feedback-list"
import { useFeedbackList } from "@/hooks"

export default function FeedbackPage() {
  const restaurantId = "rest_1765777607402_t8kmpnz"
  const { data: feedbackData, isLoading: loading } = useFeedbackList(restaurantId)
  const feedback = feedbackData?.feedback || []

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button size="sm" variant="ghost" className="h-10 w-10 p-0">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-base leading-tight">All Feedback</h1>
              <p className="text-xs text-muted-foreground">{feedback.length} reviews</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        <FeedbackList feedback={feedback} loading={loading} />
      </div>
    </div>
  )
}
