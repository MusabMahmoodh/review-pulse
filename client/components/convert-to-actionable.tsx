"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckSquare, Loader2, Link2, CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast-simple"
import { useCreateActionableItem, useActionableItemBySource, useTeamMembers } from "@/hooks"
import { User, Calendar } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { isPremiumFromAuth } from "@/lib/premium"
import { PremiumUpgrade } from "@/components/premium-upgrade"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"

interface ConvertToActionableProps {
  restaurantId: string
  sourceType: "comment" | "ai_suggestion"
  sourceId: string
  sourceText: string
  defaultTitle?: string
  trigger?: React.ReactNode
}

export function ConvertToActionable({
  restaurantId,
  sourceType,
  sourceId,
  sourceText,
  defaultTitle,
  trigger,
}: ConvertToActionableProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [showLinkedDialog, setShowLinkedDialog] = useState(false)
  const [title, setTitle] = useState(defaultTitle || "")
  const [description, setDescription] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [deadline, setDeadline] = useState("")
  const createMutation = useCreateActionableItem()
  
  const { data: teamMembersData } = useTeamMembers(restaurantId)
  const teamMembers = teamMembersData?.members || []
  
  // Check if this source is already linked to an actionable item
  const { data: linkedItemData, isLoading: checkingLink } = useActionableItemBySource(
    restaurantId,
    sourceType,
    sourceId
  )
  
  const linkedItem = linkedItemData?.item
  const hasPremium = isPremiumFromAuth(user?.subscription)
  
  // Fetch team members for showing assigned member name
  const { data: teamMembersDataForLinked } = useTeamMembers(restaurantId)
  const teamMembersForLinked = teamMembersDataForLinked?.members || []

  const handleConvert = async () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the actionable item",
        variant: "destructive",
      })
      return
    }

    createMutation.mutate(
      {
        restaurantId,
        title: title.trim(),
        description: description.trim() || undefined,
        sourceType,
        sourceId,
        sourceText,
        assignedTo: assignedTo || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Actionable item created successfully",
          })
          setOpen(false)
          setTitle(defaultTitle || "")
          setDescription("")
          setAssignedTo("")
          setDeadline("")
          // The query will automatically refetch and show "Linked" button
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error?.data?.error || "Failed to create actionable item",
            variant: "destructive",
          })
        },
      }
    )
  }

  if (!hasPremium) {
    return (
      <div className="inline-block">
        <PremiumUpgrade
          feature="Actionable Items"
          description="Convert comments and AI suggestions into actionable items to track improvements."
          className="p-4"
        />
      </div>
    )
  }

  // Show loading state while checking if linked
  if (checkingLink) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="gap-2"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking...
      </Button>
    )
  }

  // If already linked, show "Linked" button
  if (linkedItem) {
    return (
      <>
        {trigger ? (
          <div onClick={() => setShowLinkedDialog(true)}>{trigger}</div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLinkedDialog(true)}
            className="gap-2"
          >
            <Link2 className="h-4 w-4" />
            Linked
          </Button>
        )}

        {/* Dialog showing linked actionable item */}
        <Dialog open={showLinkedDialog} onOpenChange={setShowLinkedDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Linked Actionable Item</DialogTitle>
              <DialogDescription>
                This {sourceType === "comment" ? "comment" : "AI suggestion"} is already linked to an actionable item.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="font-semibold">{linkedItem.title}</p>
                </div>
              </div>
              {linkedItem.description && (
                <div className="space-y-2">
                  <Label>Description</Label>
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-sm">{linkedItem.description}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Label>Status:</Label>
                <Badge
                  variant={linkedItem.completed ? "default" : "secondary"}
                  className="gap-1"
                >
                  {linkedItem.completed ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3" />
                      Pending
                    </>
                  )}
                </Badge>
              </div>
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">Source:</p>
                <p className="line-clamp-2">{linkedItem.sourceText || sourceText}</p>
              </div>
              {linkedItem.assignedTo && (
                <div className="flex items-center gap-2">
                  <Label>Assigned To:</Label>
                  <Badge variant="outline" className="text-xs gap-1">
                    <User className="h-3 w-3" />
                    {(() => {
                      const member = teamMembersForLinked.find((m) => m.id === linkedItem.assignedTo)
                      return member ? member.name : "Unknown"
                    })()}
                  </Badge>
                </div>
              )}
              {linkedItem.deadline && (
                <div className="flex items-center gap-2">
                  <Label>Deadline:</Label>
                  <Badge
                    variant={
                      new Date(linkedItem.deadline) < new Date() && !linkedItem.completed
                        ? "destructive"
                        : "outline"
                    }
                    className="text-xs gap-1"
                  >
                    <Calendar className="h-3 w-3" />
                    {new Date(linkedItem.deadline).toLocaleDateString()}
                  </Badge>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Created: {new Date(linkedItem.createdAt).toLocaleDateString()}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLinkedDialog(false)}>
                Close
              </Button>
              <Button asChild>
                <Link href="/dashboard/actionable-items">
                  View All Items
                </Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Not linked, show "Convert" button
  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <CheckSquare className="h-4 w-4" />
          Convert to Actionable Item
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Actionable Item</DialogTitle>
            <DialogDescription>
              Convert this {sourceType === "comment" ? "comment" : "AI suggestion"} into an actionable item to track.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter actionable item title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To (Optional)</Label>
              <Select value={assignedTo || "unassigned"} onValueChange={(value) => setAssignedTo(value === "unassigned" ? "" : value)}>
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} {member.role && `(${member.role})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {teamMembers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  <Link href="/dashboard/team-members" className="text-primary hover:underline">
                    Add team members
                  </Link>{" "}
                  to assign tasks
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Source:</p>
              <p className="line-clamp-2">{sourceText}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              disabled={createMutation.isPending || !title.trim()}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

