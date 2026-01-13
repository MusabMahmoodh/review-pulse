"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronLeft, Users, Plus, X, Loader2, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useTeamMembers, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember } from "@/hooks"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast-simple"
import { isPremiumFromAuth } from "@/lib/premium"
import { PremiumUpgrade } from "@/components/premium-upgrade"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import type { TeamMember } from "@/lib/types"

export default function TeamMembersPage() {
  const { user, isLoading: authLoading } = useAuth()
  const restaurantId = user?.id || null
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("")

  const { data, isLoading } = useTeamMembers(restaurantId)
  const createMutation = useCreateTeamMember()
  const updateMutation = useUpdateTeamMember()
  const deleteMutation = useDeleteTeamMember()

  const members = data?.members || []
  const hasPremium = isPremiumFromAuth(user?.subscription)

  const handleOpenDialog = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member)
      setName(member.name)
      setEmail(member.email || "")
      setPhone(member.phone || "")
      setRole(member.role || "")
    } else {
      setEditingMember(null)
      setName("")
      setEmail("")
      setPhone("")
      setRole("")
    }
    setOpen(true)
  }

  const handleCloseDialog = () => {
    setOpen(false)
    setEditingMember(null)
    setName("")
    setEmail("")
    setPhone("")
    setRole("")
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the team member",
        variant: "destructive",
      })
      return
    }

    if (editingMember) {
      updateMutation.mutate(
        {
          id: editingMember.id,
          data: {
            name: name.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            role: role.trim() || undefined,
          },
        },
        {
          onSuccess: () => {
            toast({
              title: "Updated",
              description: "Team member has been updated",
            })
            handleCloseDialog()
          },
          onError: (error: any) => {
            toast({
              title: "Error",
              description: error?.data?.error || "Failed to update team member",
              variant: "destructive",
            })
          },
        }
      )
    } else {
      createMutation.mutate(
        {
          restaurantId: restaurantId!,
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          role: role.trim() || undefined,
        },
        {
          onSuccess: () => {
            toast({
              title: "Created",
              description: "Team member has been added",
            })
            handleCloseDialog()
          },
          onError: (error: any) => {
            toast({
              title: "Error",
              description: error?.data?.error || "Failed to create team member",
              variant: "destructive",
            })
          },
        }
      )
    }
  }

  const handleDelete = async (member: TeamMember) => {
    if (!confirm(`Are you sure you want to delete "${member.name}"?`)) return

    deleteMutation.mutate(member.id, {
      onSuccess: () => {
        toast({
          title: "Deleted",
          description: `"${member.name}" has been removed`,
        })
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error?.data?.error || "Failed to delete team member",
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
      <div className="min-h-screen bg-background flex w-full overflow-x-hidden">
        <DashboardSidebar />
        <main className={cn(
          "flex-1 transition-all duration-200 w-full",
          !isMobile && "ml-64"
        )}>
          <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-40 shadow-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 h-16">
                <Link href="/dashboard">
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="flex-1">
                  <h1 className="font-bold text-lg leading-tight">Team Members</h1>
                  <p className="text-xs text-muted-foreground">Manage your team</p>
                </div>
              </div>
            </div>
          </header>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <PremiumUpgrade
              feature="Team Members"
              description="Add team members and assign them to actionable items for better task management."
            />
          </div>
        </main>
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex w-full overflow-x-hidden">
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
              <Link href="/dashboard">
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="font-bold text-lg leading-tight">Team Members</h1>
                <p className="text-xs text-muted-foreground">Manage your team</p>
              </div>
              <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Member
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-sm text-muted-foreground">Total Team Members</p>
              </div>
            </CardContent>
          </Card>

          {/* Team Members List */}
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Loading members...</p>
              </CardContent>
            </Card>
          ) : members.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No team members yet. Add your first team member to get started.
                </p>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Team Member
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base">{member.name}</h3>
                          {member.role && (
                            <Badge variant="secondary" className="text-xs">
                              {member.role}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {member.email && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium">Email:</span> {member.email}
                            </p>
                          )}
                          {member.phone && (
                            <p className="flex items-center gap-2">
                              <span className="font-medium">Phone:</span> {member.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(member)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(member)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={open} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "Edit Team Member" : "Add Team Member"}
            </DialogTitle>
            <DialogDescription>
              {editingMember
                ? "Update team member information."
                : "Add a new team member to assign to actionable items."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter team member name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Manager, Chef, Server (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                (createMutation.isPending || updateMutation.isPending) && !name.trim()
              }
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingMember ? "Updating..." : "Creating..."}
                </>
              ) : (
                editingMember ? "Update" : "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}








