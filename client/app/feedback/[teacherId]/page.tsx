"use client"

import type React from "react"

import { useState, use, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, CheckCircle, Star, BookOpen } from "lucide-react"
import { Logo } from "@/components/logo"
import { useToast } from "@/hooks/use-toast-simple"
import { useSubmitFeedback, useReviewPageSettings, useTags } from "@/hooks"
import { classesApi } from "@/lib/api-client"
import { useQuery } from "@tanstack/react-query"
import { TagSelector } from "@/components/tag-selector"

interface PageProps {
  params: Promise<{ teacherId: string }>
}

export default function FeedbackPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const teacherIdOrOrgId = resolvedParams.teacherId
  const searchParams = useSearchParams()
  const classId = searchParams.get("class") || undefined
  const { toast } = useToast()
  const [submitted, setSubmitted] = useState(false)
  const submitMutation = useSubmitFeedback()
  
  // Check if it's an organization ID (starts with "org_") or teacher ID
  const isOrganizationId = teacherIdOrOrgId.startsWith("org_")
  const teacherId = isOrganizationId ? undefined : teacherIdOrOrgId
  const organizationId = isOrganizationId ? teacherIdOrOrgId : undefined
  
  const { data: settings } = useReviewPageSettings(teacherId || undefined)
  
  // Fetch class information if classId is provided (only for teachers)
  const { data: classData } = useQuery({
    queryKey: ["class", classId],
    queryFn: () => classesApi.get(classId!),
    enabled: !!classId && !!teacherId,
  })

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
        classId: classId,
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

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className={designStyles.cardClass}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{pageSettings.welcomeMessage}</CardTitle>
            <CardDescription>Help us improve by sharing your learning experience</CardDescription>
            {classData?.class && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Badge variant="secondary" className="gap-1.5">
                  <BookOpen className="h-3 w-3" />
                  {classData.class.name}
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating Sections */}
              <RatingSection
                title="Teaching Quality"
                description="How effective was the teaching and explanation?"
                value={formData.teachingRating}
                onChange={(value) => handleRatingChange("teachingRating", value)}
                primaryColor={pageSettings.primaryColor}
                designVariation={pageSettings.designVariation}
              />

              <RatingSection
                title="Communication"
                description="How clear and responsive was the communication?"
                value={formData.communicationRating}
                onChange={(value) => handleRatingChange("communicationRating", value)}
                primaryColor={pageSettings.primaryColor}
                designVariation={pageSettings.designVariation}
              />

              <RatingSection
                title="Course Materials"
                description="How useful and well-organized were the materials?"
                value={formData.materialRating}
                onChange={(value) => handleRatingChange("materialRating", value)}
                primaryColor={pageSettings.primaryColor}
                designVariation={pageSettings.designVariation}
              />

              <RatingSection
                title="Overall Experience"
                description="How likely are you to recommend this teacher?"
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
                    placeholder="Any suggestions or feedback you'd like to share?"
                    value={formData.suggestions}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentName">Your Name (Optional)</Label>
                  <Input
                    id="studentName"
                    name="studentName"
                    placeholder="John Doe"
                    value={formData.studentName}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentContact">Contact Number (Optional)</Label>
                  <Input
                    id="studentContact"
                    name="studentContact"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.studentContact}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">We'll only use this to stay connected with you</p>
                </div>

                {/* Tag Selector */}
                {availableTags.length > 0 && (
                  <div className="space-y-2">
                    <TagSelector
                      tags={availableTags}
                      selectedTagIds={formData.tagIds}
                      onSelectionChange={(tagIds) => setFormData({ ...formData, tagIds })}
                      maxSelections={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Select tags that best describe your feedback (optional)
                    </p>
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className={`w-full ${designStyles.buttonClass}`}
                size="lg" 
                disabled={submitMutation.isPending}
                style={designStyles.buttonStyle}
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

