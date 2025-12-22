"use client"

import type React from "react"

import { useState, use, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send, CheckCircle, Star, ChevronRight, Sparkles } from "lucide-react"
import { Logo } from "@/components/logo"
import { useToast } from "@/hooks/use-toast-simple"
import { useSubmitFeedback, useReviewPageSettings, useTags } from "@/hooks"
import { TagSelector } from "@/components/tag-selector"

interface PageProps {
  params: Promise<{ teacherId: string }>
}

export default function FeedbackPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const teacherIdOrOrgId = resolvedParams.teacherId
  const searchParams = useSearchParams()
  const formId = searchParams.get("formId") || undefined
  const { toast } = useToast()
  const [submitted, setSubmitted] = useState(false)
  const [showOptionalDetails, setShowOptionalDetails] = useState(false)
  const submitMutation = useSubmitFeedback()
  
  // Check if it's an organization ID (starts with "org_") or teacher ID
  const isOrganizationId = teacherIdOrOrgId.startsWith("org_")
  const teacherId = isOrganizationId ? undefined : teacherIdOrOrgId
  const organizationId = isOrganizationId ? teacherIdOrOrgId : undefined
  
  const { data: settings } = useReviewPageSettings(teacherId || undefined)

  const [formData, setFormData] = useState({
    studentName: "",
    studentContact: "",
    teachingRating: 5,
    communicationRating: 5,
    materialRating: 5,
    overallRating: 5,
    suggestions: "",
    tagIds: [] as string[],
  })

  // Fetch available tags for this teacher or organization
  const { data: tagsData } = useTags({ 
    teacherId: teacherId || undefined, 
    organizationId: organizationId || undefined 
  })
  const availableTags = tagsData?.tags || []

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
        teacherId: teacherId || undefined,
        organizationId: organizationId || undefined,
        formId: formId,
        teachingRating: formData.teachingRating,
        communicationRating: formData.communicationRating,
        materialRating: formData.materialRating,
        overallRating: formData.overallRating,
        studentName: formData.studentName || undefined,
        studentContact: formData.studentContact || undefined,
        suggestions: formData.suggestions || undefined,
        tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
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

  // Rating categories with questions
  const ratingCategories = [
    {
      question: "How do you feel about the teaching quality?",
      description: "How effective was the teaching and explanation?",
      ratingKey: "teachingRating" as const,
      icon: "📚",
    },
    {
      question: "How do you feel about the communication?",
      description: "How clear and responsive was the communication?",
      ratingKey: "communicationRating" as const,
      icon: "💬",
    },
    {
      question: "How do you feel about the course materials?",
      description: "How useful and well-organized were the materials?",
      ratingKey: "materialRating" as const,
      icon: "📝",
    },
    {
      question: "How do you feel about the overall experience?",
      description: "How likely are you to recommend this teacher?",
      ratingKey: "overallRating" as const,
      icon: "⭐",
    },
  ]

  // Check if all ratings are set (for quick submit)
  const allRatingsSet = ratingCategories.every(
    (cat) => formData[cat.ratingKey] > 0
  )

  // Quick submit handler (skip optional details)
  const handleQuickSubmit = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    submitMutation.mutate(
      {
        teacherId: teacherId || undefined,
        organizationId: organizationId || undefined,
        formId: formId,
        teachingRating: formData.teachingRating,
        communicationRating: formData.communicationRating,
        materialRating: formData.materialRating,
        overallRating: formData.overallRating,
        studentName: formData.studentName || undefined,
        studentContact: formData.studentContact || undefined,
        suggestions: formData.suggestions || undefined,
        tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
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
          buttonClass: 'hover:opacity-90 text-white',
          buttonStyle: {
            background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
            color: 'white',
          } as React.CSSProperties,
        }
      case 'minimal':
        return {
          ...baseStyles,
          headerClass: 'bg-transparent border-b-2 border-[var(--primary-color)]',
          cardClass: 'shadow-none border-2 border-[var(--primary-color)]/20',
          buttonClass: 'text-white',
          buttonStyle: {
            backgroundColor: primaryColor,
            color: 'white',
          } as React.CSSProperties,
        }
      case 'elegant':
        return {
          ...baseStyles,
          headerClass: 'bg-[var(--background-color)] border-b border-[var(--primary-color)]/30',
          cardClass: 'shadow-lg border border-[var(--primary-color)]/10 bg-white/50 backdrop-blur-sm',
          buttonClass: 'text-white',
          buttonStyle: {
            backgroundColor: secondaryColor,
            color: 'white',
          } as React.CSSProperties,
        }
      default: // default
        return {
          ...baseStyles,
          headerClass: 'border-b bg-card/50 backdrop-blur-sm',
          cardClass: '',
          buttonClass: 'text-white',
          buttonStyle: {
            backgroundColor: primaryColor,
            color: 'white',
          } as React.CSSProperties,
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
            <p className="text-muted-foreground">Your feedback helps improve the learning experience</p>
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
          : `linear-gradient(to bottom, ${pageSettings.backgroundColor}, ${pageSettings.backgroundColor}dd)`,
        ...designStyles as React.CSSProperties
      }}
    >
      <header className={designStyles.headerClass}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-2">
          <Logo width={32} height={32} />
          <span className="text-xl font-bold">Share Your Feedback</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className={designStyles.cardClass}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{pageSettings.welcomeMessage}</CardTitle>
            <CardDescription>Help us improve by sharing your learning experience</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* All Ratings Section - Single Page */}
              <div className="space-y-6">
                <div className="text-center pb-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Rate your experience
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click the stars to rate each category
                  </p>
                </div>

                <div className="space-y-6">
                  {ratingCategories.map((category, index) => (
                    <div
                      key={category.ratingKey}
                      className="space-y-3 pb-4 border-b last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-1">{category.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-base">{category.question}</h4>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {category.description}
                          </p>
                        </div>
                      </div>

                      <RatingSection
                        value={formData[category.ratingKey]}
                        onChange={(value) => handleRatingChange(category.ratingKey, value)}
                        primaryColor={pageSettings.primaryColor}
                        designVariation={pageSettings.designVariation}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Details Section - Collapsible */}
              <div className="space-y-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">
                      Additional Details (Optional)
                    </span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      showOptionalDetails ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {showOptionalDetails && (
                  <div className="space-y-4 pl-1 animate-in slide-in-from-top-2 duration-200">
                    {/* Comments */}
                    <div className="space-y-2">
                      <Label htmlFor="suggestions">Additional Comments</Label>
                      <Textarea
                        id="suggestions"
                        name="suggestions"
                        placeholder="Any suggestions or feedback you'd like to share?"
                        value={formData.suggestions}
                        onChange={handleChange}
                        rows={4}
                      />
                    </div>

                    {/* Name and Phone - Side by side on larger screens */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="studentName">Your Name</Label>
                        <Input
                          id="studentName"
                          name="studentName"
                          placeholder="John Doe"
                          value={formData.studentName}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="studentContact">Contact Number</Label>
                        <Input
                          id="studentContact"
                          name="studentContact"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={formData.studentContact}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We'll only use this to stay connected with you
                    </p>

                    {/* Tag Selector */}
                    {availableTags.length > 0 && (
                      <div className="space-y-2">
                        <Label>Tags</Label>
                        <TagSelector
                          tags={availableTags}
                          selectedTagIds={formData.tagIds}
                          onSelectionChange={(tagIds) => setFormData({ ...formData, tagIds })}
                          maxSelections={5}
                        />
                        <p className="text-xs text-muted-foreground">
                          Select tags that best describe your feedback
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                {allRatingsSet && !showOptionalDetails && (
                  <Button
                    type="button"
                    onClick={handleQuickSubmit}
                    variant="outline"
                    className="flex-1"
                    disabled={submitMutation.isPending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {submitMutation.isPending ? "Submitting..." : "Submit Now"}
                  </Button>
                )}
                <Button
                  type="submit"
                  className={`flex-1 ${designStyles.buttonClass}`}
                  size="lg"
                  disabled={submitMutation.isPending}
                  style={designStyles.buttonStyle}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface RatingSectionProps {
  value: number
  onChange: (value: number) => void
  primaryColor: string
  designVariation: string
}

function RatingSection({ value, onChange, primaryColor, designVariation }: RatingSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="flex-1 transition-all hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg p-1"
            style={{
              focusRingColor: primaryColor,
            }}
            aria-label={`Rate ${rating} stars`}
          >
            <Star
              className={`h-10 w-10 sm:h-12 sm:w-12 mx-auto transition-all ${
                rating <= value ? "" : "text-muted stroke-muted-foreground opacity-40"
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
        <span className="font-medium" style={{ color: primaryColor }}>
          {value}/5
        </span>
        <span>Excellent</span>
      </div>
    </div>
  )
}

