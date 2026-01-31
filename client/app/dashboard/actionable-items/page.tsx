"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, CheckSquare, X, Loader2, Filter } from "lucide-react"
import Link from "next/link"
import { useActionableItems, useUpdateActionableItem, useDeleteActionableItem, useForms, useTags, useFeedbackList } from "@/hooks"
import { useTeamMembers } from "@/hooks/use-team-members"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast-simple"
import { isPremiumFromAuth } from "@/lib/premium"
import { PremiumUpgrade } from "@/components/premium-upgrade"
import { ActionableItemEditor } from "@/components/actionable-item-editor"
import type { ActionableItem } from "@/lib/types"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export default function ActionableItemsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const isMobile = useIsMobile()
  const restaurantId = user?.id || null
  const isOrganization = user?.userType === "organization"
  const teacherId = isOrganization ? null : restaurantId
  const organizationId = isOrganization ? restaurantId : undefined
  const { toast } = useToast()
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all")
  const [formFilter, setFormFilter] = useState<string | "all">("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string | "all">("all")
  const [tagFilter, setTagFilter] = useState<string | "all">("all")
  
  // Fetch data
  const { data, isLoading } = useActionableItems(
    teacherId,
    statusFilter === "completed" ? true : statusFilter === "pending" ? false : undefined,
    organizationId
  )
  const { data: formsData } = useForms({
    teacherId: teacherId || undefined,
    organizationId: organizationId,
  })
  const { data: tagsData } = useTags({
    teacherId: teacherId || undefined,
    organizationId: organizationId,
  })
  const { data: teamMembersData } = useTeamMembers(teacherId)
  const { data: allFeedbackData } = useFeedbackList(teacherId, null, null, undefined)
  
  const updateMutation = useUpdateActionableItem()
  const deleteMutation = useDeleteActionableItem()

  const allItems = data?.items || []
  const forms = formsData?.forms || []
  const tags = tagsData?.tags?.filter(t => t.isActive) || []
  const teamMembers = teamMembersData?.members || []
  const allFeedback = allFeedbackData?.feedback || []
  const hasPremium = isPremiumFromAuth(user?.subscription)

  // Create a map of feedback by ID for quick lookup
  const feedbackMap = useMemo(() => {
    const map = new Map<string, typeof allFeedback[0]>()
    allFeedback.forEach(f => map.set(f.id, f))
    return map
  }, [allFeedback])

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...allItems]

    // Filter by form (through feedback)
    if (formFilter !== "all") {
      filtered = filtered.filter(item => {
        if (item.sourceType === "comment") {
          const feedback = feedbackMap.get(item.sourceId)
          return feedback?.formId === formFilter
        }
        return false // AI suggestions don't have direct form link
      })
    }

    // Filter by assignee
    if (assigneeFilter !== "all") {
      if (assigneeFilter === "unassigned") {
        filtered = filtered.filter(item => !item.assignedTo)
      } else {
        filtered = filtered.filter(item => item.assignedTo === assigneeFilter)
      }
    }

    // Filter by tag (through feedback)
    if (tagFilter !== "all") {
      filtered = filtered.filter(item => {
        if (item.sourceType === "comment") {
          const feedback = feedbackMap.get(item.sourceId)
          return feedback?.tags?.some(ft => ft.tag.id === tagFilter)
        }
        return false
      })
    }

    // Sort: unfinished first, then by createdAt (newest first)
    filtered.sort((a, b) => {
      // First sort by completion status (unfinished first)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return filtered
  }, [allItems, formFilter, assigneeFilter, tagFilter, feedbackMap])

  const items = filteredAndSortedItems

  const handleToggleComplete = async (item: ActionableItem) => {
    updateMutation.mutate(
      { id: item.id, data: { completed: !item.completed } },
      {
        onSuccess: () => {
          toast({
            title: item.completed ? "Marked as pending" : "Marked as completed",
            description: `"${item.title}" has been updated`,
          })
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error?.data?.error || "Failed to update item",
            variant: "destructive",
          })
        },
      }
    )
  }

  const handleDelete = async (item: ActionableItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return

    deleteMutation.mutate(item.id, {
      onSuccess: () => {
        toast({
          title: "Deleted",
          description: `"${item.title}" has been deleted`,
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error?.data?.error || "Failed to delete item",
          variant: "destructive",
        })
      },
    })
  }

  // Show loading state while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!restaurantId) {
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    return null
  }

  // Show premium upgrade if not premium
  if (!hasPremium) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 h-16">
              <Link href="/dashboard">
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="font-bold text-lg leading-tight">Actionable Items</h1>
                <p className="text-xs text-muted-foreground">Track and manage improvement tasks</p>
              </div>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <PremiumUpgrade
            feature="Actionable Items"
            description="Convert comments and AI suggestions into actionable items to track improvements and manage tasks."
          />
        </div>
      </div>
    )
  }

  const completedCount = allItems.filter((item) => item.completed).length
  const pendingCount = allItems.filter((item) => !item.completed).length

  return (
    <>
        {/* Header */}
        <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 h-16">
              {isMobile && (
                <Link href="/dashboard">
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <div className="flex-1">
                <h1 className="font-bold text-lg leading-tight">Actionable Items</h1>
                <p className="text-xs text-muted-foreground">Track and manage improvement tasks</p>
              </div>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Stats - Compact on mobile */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-card border rounded-lg p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-semibold">{items.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Total</p>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-semibold text-green-600 dark:text-green-500">{completedCount}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Done</p>
            </div>
            <div className="bg-card border rounded-lg p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-semibold text-orange-600 dark:text-orange-500">{pendingCount}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Pending</p>
            </div>
          </div>

          {/* Filters - Compact on mobile */}
          <div className="bg-card border rounded-lg p-3 sm:p-4 space-y-3">
            {/* Status Filter - Horizontal on mobile */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1">
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-muted-foreground">Status</span>
              </div>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  onClick={() => setStatusFilter("pending")}
                  className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                >
                  Pending
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === "completed" ? "default" : "outline"}
                  onClick={() => setStatusFilter("completed")}
                  className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                >
                  Done
                </Button>
              </div>
            </div>

            {/* Other Filters - Stacked on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <Select value={formFilter} onValueChange={setFormFilter}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="All Forms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Forms</SelectItem>
                  {forms.map(form => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {teamMembers.length > 0 && (
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All People" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All People</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {tags.length > 0 && (
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {tags.map(tag => (
                      <SelectItem key={tag.id} value={tag.id}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Actionable Items List */}
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Loading items...</p>
              </CardContent>
            </Card>
          ) : filteredAndSortedItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No actionable items yet. Convert comments or AI suggestions to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredAndSortedItems.map((item) => {
                // Get feedback for this item to show form and tags
                const feedback = item.sourceType === "comment" ? feedbackMap.get(item.sourceId) : null
                const assignedMember = item.assignedTo ? teamMembers.find(m => m.id === item.assignedTo) : null
                
                return (
                <div
                  key={item.id}
                  className={cn(
                    "bg-card border rounded-lg p-3 sm:p-4 transition-all",
                    item.completed && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => handleToggleComplete(item)}
                      disabled={updateMutation.isPending}
                      className="mt-0.5 sm:mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                        <h3
                          className={cn(
                            "font-semibold text-sm sm:text-base leading-snug flex-1",
                            item.completed && "line-through text-muted-foreground"
                          )}
                        >
                          {item.title}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item)}
                          disabled={deleteMutation.isPending}
                          className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          )}
                        </Button>
                      </div>
                      {item.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                        <Badge
                          variant={item.sourceType === "comment" ? "secondary" : "outline"}
                          className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2"
                        >
                          {item.sourceType === "comment" ? "Comment" : "AI"}
                        </Badge>
                        {feedback && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2">
                            {forms.find(f => f.id === feedback.formId)?.name || "Form"}
                          </Badge>
                        )}
                        {feedback?.tags && feedback.tags.length > 0 && (
                          <>
                            {feedback.tags.slice(0, 2).map(ft => (
                              <Badge 
                                key={ft.id} 
                                variant="outline" 
                                className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2"
                                style={{ borderColor: ft.tag.color, color: ft.tag.color }}
                              >
                                {ft.tag.name}
                              </Badge>
                            ))}
                            {feedback.tags.length > 2 && (
                              <Badge variant="outline" className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2">
                                +{feedback.tags.length - 2}
                              </Badge>
                            )}
                          </>
                        )}
                        {assignedMember && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2">
                            {assignedMember.name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <ActionableItemEditor item={item} restaurantId={restaurantId} />
                      </div>
                    </div>
                  </div>
                </div>
              )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

