"use client"

import type React from "react"

import { useState, use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChefHat, Send, CheckCircle, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast-simple"

interface PageProps {
  params: Promise<{ restaurantId: string }>
}

export default function FeedbackPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const restaurantId = resolvedParams.restaurantId
  const { toast } = useToast()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customerName: "",
    customerContact: "",
    foodRating: 5,
    staffRating: 5,
    ambienceRating: 5,
    overallRating: 5,
    suggestions: "",
  })

  const handleRatingChange = (category: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [category]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          ...formData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      setSubmitted(true)
      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-12 pb-12">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground">Your feedback helps us serve you better</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-2">
          <ChefHat className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Share Your Experience</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">We Value Your Feedback</CardTitle>
            <CardDescription>Help us improve by rating your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating Sections */}
              <RatingSection
                title="Food Quality"
                description="How was the taste, presentation, and quality?"
                value={formData.foodRating}
                onChange={(value) => handleRatingChange("foodRating", value)}
              />

              <RatingSection
                title="Staff Service"
                description="How friendly and helpful was our team?"
                value={formData.staffRating}
                onChange={(value) => handleRatingChange("staffRating", value)}
              />

              <RatingSection
                title="Ambience"
                description="How was the atmosphere and cleanliness?"
                value={formData.ambienceRating}
                onChange={(value) => handleRatingChange("ambienceRating", value)}
              />

              <RatingSection
                title="Overall Experience"
                description="How likely are you to recommend us?"
                value={formData.overallRating}
                onChange={(value) => handleRatingChange("overallRating", value)}
              />

              <div className="border-t pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="suggestions">Additional Comments (Optional)</Label>
                  <Textarea
                    id="suggestions"
                    name="suggestions"
                    placeholder="Any suggestions or special mentions?"
                    value={formData.suggestions}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerName">Your Name (Optional)</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    placeholder="John Doe"
                    value={formData.customerName}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerContact">Contact Number (Optional)</Label>
                  <Input
                    id="customerContact"
                    name="customerContact"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.customerContact}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">We'll only use this to stay connected with you</p>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface RatingSectionProps {
  title: string
  description: string
  value: number
  onChange: (value: number) => void
}

function RatingSection({ title, description, value, onChange }: RatingSectionProps) {
  return (
    <div className="space-y-3 pb-4 border-b last:border-b-0">
      <div>
        <h3 className="font-medium text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="flex-1 transition-all hover:scale-110"
            aria-label={`Rate ${rating} stars`}
          >
            <Star
              className={`h-10 w-10 mx-auto transition-colors ${
                rating <= value ? "fill-primary text-primary" : "text-muted stroke-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  )
}
