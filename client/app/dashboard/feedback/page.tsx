"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import type { CustomerFeedback } from "@/lib/types"
import { FeedbackList } from "@/components/feedback-list"

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<CustomerFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const restaurantId = "demo-restaurant-1"

  useEffect(() => {
    const fetchData = async () => {
      try {
        const feedbackRes = await fetch(`/api/feedback/list?restaurantId=${restaurantId}`)
        const feedbackData = await feedbackRes.json()
        setFeedback(feedbackData.feedback)
      } catch (error) {
        console.error("Error fetching feedback:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [restaurantId])

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
