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
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, Calendar, Loader2, Edit } from "lucide-react"
import { useToast } from "@/hooks/use-toast-simple"
import { useUpdateActionableItem, useTeamMembers } from "@/hooks"
import type { ActionableItem } from "@/lib/types"

interface ActionableItemEditorProps {
  item: ActionableItem
  restaurantId: string
}

export function ActionableItemEditor({ item, restaurantId }: ActionableItemEditorProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [assignedTo, setAssignedTo] = useState(item.assignedTo || "")
  const [deadline, setDeadline] = useState(
    item.deadline ? new Date(item.deadline).toISOString().split("T")[0] : ""
  )
  const updateMutation = useUpdateActionableItem()
  const { data: teamMembersData } = useTeamMembers(restaurantId)
  const teamMembers = teamMembersData?.members || []

  const handleSave = async () => {
    updateMutation.mutate(
      {
        id: item.id,
        data: {
          assignedTo: assignedTo || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Updated",
            description: "Actionable item has been updated",
          })
          setOpen(false)
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

  const assignedMember = teamMembers.find((m) => m.id === item.assignedTo)

  return (
    <>
      <div className="flex items-center gap-1.5">
        {assignedMember && (
          <Badge variant="outline" className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2 gap-1">
            <User className="h-3 w-3" />
            <span className="hidden sm:inline">{assignedMember.name}</span>
            <span className="sm:hidden">{assignedMember.name.split(' ')[0]}</span>
          </Badge>
        )}
        {item.deadline && (
          <Badge
            variant={
              new Date(item.deadline) < new Date() && !item.completed
                ? "destructive"
                : "outline"
            }
            className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2 gap-1"
          >
            <Calendar className="h-3 w-3" />
            {new Date(item.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="h-6 sm:h-7 px-2 text-[10px] sm:text-xs ml-auto"
        >
          <Edit className="h-3 w-3 sm:mr-1" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assignment & Deadline</DialogTitle>
            <DialogDescription>
              Assign this item to a team member and set a deadline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign To</Label>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

