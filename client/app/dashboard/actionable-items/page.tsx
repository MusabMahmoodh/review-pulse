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
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
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
    <div className="min-h-screen bg-background flex w-full overflow-x-hidden relative">
      {/* Desktop Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-200 w-full",
        !isMobile && "ml-64"
      )}>
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{items.length}</p>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium min-w-[80px]">Status:</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={statusFilter === "all" ? "default" : "outline"}
                    onClick={() => setStatusFilter("all")}
                  >
                    All ({allItems.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    onClick={() => setStatusFilter("pending")}
                  >
                    Pending ({allItems.filter(i => !i.completed).length})
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === "completed" ? "default" : "outline"}
                    onClick={() => setStatusFilter("completed")}
                  >
                    Completed ({allItems.filter(i => i.completed).length})
                  </Button>
                </div>
              </div>

              {/* Form Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium min-w-[80px]">Form:</span>
                <Select value={formFilter} onValueChange={setFormFilter}>
                  <SelectTrigger className="w-[200px]">
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
              </div>

              {/* Assignee Filter */}
              {teamMembers.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium min-w-[80px]">Assignee:</span>
                  <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                    <SelectTrigger className="w-[200px]">
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
                </div>
              )}

              {/* Tag Filter */}
              {tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium min-w-[80px]">Tag:</span>
                  <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger className="w-[200px]">
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
                </div>
              )}
            </CardContent>
          </Card>

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
            <div className="space-y-3">
              {filteredAndSortedItems.map((item) => {
                // Get feedback for this item to show form and tags
                const feedback = item.sourceType === "comment" ? feedbackMap.get(item.sourceId) : null
                const assignedMember = item.assignedTo ? teamMembers.find(m => m.id === item.assignedTo) : null
                
                return (
                <Card
                  key={item.id}
                  className={item.completed ? "opacity-75" : ""}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => handleToggleComplete(item)}
                        disabled={updateMutation.isPending}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3
                            className={`font-semibold text-base ${
                              item.completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {item.title}
                          </h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item)}
                            disabled={deleteMutation.isPending}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {item.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              item.sourceType === "comment" ? "secondary" : "outline"
                            }
                            className="text-xs"
                          >
                            {item.sourceType === "comment" ? "From Comment" : "From AI"}
                          </Badge>
                          {feedback && (
                            <Badge variant="outline" className="text-xs">
                              {forms.find(f => f.id === feedback.formId)?.name || "Unknown Form"}
                            </Badge>
                          )}
                          {feedback?.tags && feedback.tags.length > 0 && (
                            <>
                              {feedback.tags.slice(0, 2).map(ft => (
                                <Badge 
                                  key={ft.id} 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{ borderColor: ft.tag.color, color: ft.tag.color }}
                                >
                                  {ft.tag.name}
                                </Badge>
                              ))}
                              {feedback.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{feedback.tags.length - 2}
                                </Badge>
                              )}
                            </>
                          )}
                          {assignedMember && (
                            <Badge variant="outline" className="text-xs">
                              👤 {assignedMember.name}
                            </Badge>
                          )}
                          {item.sourceText && (
                            <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                              {item.sourceText}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <ActionableItemEditor item={item} restaurantId={restaurantId} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
              })}
            </div>
          )}
        </div>
      </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

