"use client"

import type React from "react"

import { useState, use, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChefHat, Send, CheckCircle, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast-simple"
import { useSubmitFeedback, useReviewPageSettings } from "@/hooks"

interface PageProps {
  params: Promise<{ restaurantId: string }>
}

export default function FeedbackPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const restaurantId = resolvedParams.restaurantId
  const { toast } = useToast()
  const [submitted, setSubmitted] = useState(false)
  const submitMutation = useSubmitFeedback()
  const { data: settings } = useReviewPageSettings(restaurantId)
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerContact: "",
    foodRating: 5,
    staffRating: 5,
    ambienceRating: 5,
    overallRating: 5,
    suggestions: "",
  })

  // Use settings or defaults
  const pageSettings = useMemo(() => ({
    welcomeMessage: settings?.welcomeMessage || "We Value Your Feedback",
    primaryColor: settings?.primaryColor || "#3b82f6",
    secondaryColor: settings?.secondaryColor || "#1e40af",
    backgroundColor: settings?.backgroundColor || "#f3f4f6",
    designVariation: settings?.designVariation || "default",
  }), [settings])

  const handleRatingChange = (category: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [category]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    submitMutation.mutate(
      {
        restaurantId,
        ...formData,
      },
      {
        onSuccess: () => {
          setSubmitted(true)
          toast({
            title: "Thank you!",
            description: "Your feedback has been submitted successfully",
          })
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to submit feedback. Please try again.",
            variant: "destructive",
          })
        },
      }
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // Get design variation styles
  const designStyles = useMemo(() => {
    const { designVariation, primaryColor, secondaryColor, backgroundColor } = pageSettings
    
    const baseStyles: React.CSSProperties = {
      '--primary-color': primaryColor,
      '--secondary-color': secondaryColor,
      '--background-color': backgroundColor,
    } as React.CSSProperties

    switch (designVariation) {
      case 'modern':
        return {
          ...baseStyles,
          headerClass: 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white',
          cardClass: 'shadow-2xl border-0',
          buttonClass: 'bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] hover:opacity-90',
        }
      case 'minimal':
        return {
          ...baseStyles,
          headerClass: 'bg-transparent border-b-2 border-[var(--primary-color)]',
          cardClass: 'shadow-none border-2 border-[var(--primary-color)]/20',
          buttonClass: 'bg-[var(--primary-color)] hover:bg-[var(--secondary-color)]',
        }
      case 'elegant':
        return {
          ...baseStyles,
          headerClass: 'bg-[var(--background-color)] border-b border-[var(--primary-color)]/30',
          cardClass: 'shadow-lg border border-[var(--primary-color)]/10 bg-white/50 backdrop-blur-sm',
          buttonClass: 'bg-[var(--secondary-color)] hover:bg-[var(--primary-color)]',
        }
      default: // default
        return {
          ...baseStyles,
          headerClass: 'border-b bg-card/50 backdrop-blur-sm',
          cardClass: '',
          buttonClass: '',
        }
    }
  }, [pageSettings])

  if (submitted) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: pageSettings.backgroundColor }}
      >
        <Card className={`w-full max-w-md text-center ${designStyles.cardClass}`}>
          <CardContent className="pt-12 pb-12">
            <CheckCircle 
              className="h-16 w-16 mx-auto mb-4" 
              style={{ color: pageSettings.primaryColor }}
            />
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground">Your feedback helps us serve you better</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: pageSettings.backgroundColor,
        background: pageSettings.designVariation === 'modern' 
          ? `linear-gradient(to bottom, ${pageSettings.backgroundColor}, ${pageSettings.primaryColor}15)`
          : `linear-gradient(to bottom, ${pageSettings.backgroundColor}, ${pageSettings.backgroundColor}dd)`
      }}
    >
      <header className={designStyles.headerClass}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-2">
          <ChefHat 
            className="h-8 w-8" 
            style={{ color: pageSettings.designVariation === 'modern' ? 'white' : pageSettings.primaryColor }}
          />
          <span className="text-xl font-bold">Share Your Experience</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className={designStyles.cardClass}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{pageSettings.welcomeMessage}</CardTitle>
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
                primaryColor={pageSettings.primaryColor}
                designVariation={pageSettings.designVariation}
              />

              <RatingSection
                title="Staff Service"
                description="How friendly and helpful was our team?"
                value={formData.staffRating}
                onChange={(value) => handleRatingChange("staffRating", value)}
                primaryColor={pageSettings.primaryColor}
                designVariation={pageSettings.designVariation}
              />

              <RatingSection
                title="Ambience"
                description="How was the atmosphere and cleanliness?"
                value={formData.ambienceRating}
                onChange={(value) => handleRatingChange("ambienceRating", value)}
                primaryColor={pageSettings.primaryColor}
                designVariation={pageSettings.designVariation}
              />

              <RatingSection
                title="Overall Experience"
                description="How likely are you to recommend us?"
                value={formData.overallRating}
                onChange={(value) => handleRatingChange("overallRating", value)}
                primaryColor={pageSettings.primaryColor}
                designVariation={pageSettings.designVariation}
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

              <Button 
                type="submit" 
                className={`w-full ${designStyles.buttonClass}`}
                size="lg" 
                disabled={submitMutation.isPending}
                style={designStyles.buttonClass ? {} : { 
                  backgroundColor: pageSettings.primaryColor,
                  color: 'white'
                }}
              >
                <Send className="mr-2 h-4 w-4" />
                {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
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
  primaryColor: string
  designVariation: string
}

function RatingSection({ title, description, value, onChange, primaryColor, designVariation }: RatingSectionProps) {
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
                rating <= value ? "" : "text-muted stroke-muted-foreground"
              }`}
              style={rating <= value ? { 
                fill: primaryColor, 
                color: primaryColor,
                filter: designVariation === 'modern' ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : undefined
              } : {}}
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
