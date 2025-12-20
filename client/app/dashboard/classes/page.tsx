"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Plus, BookOpen, QrCode, Copy, Check, Archive, Loader2, Trash2, Edit } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast-simple"
import { useAuth } from "@/hooks/use-auth"
import { classesApi } from "@/lib/api-client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { QRCodeSVG } from "qrcode.react"
import { isPremiumRequiredError, isPremiumFromAuth } from "@/lib/premium"
import { PremiumUpgrade } from "@/components/premium-upgrade"
import type { Class } from "@/lib/types"

export default function ClassesPage() {
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false)
  const [selectedQrClass, setSelectedQrClass] = useState<Class | null>(null)
  const [copied, setCopied] = useState(false)

  const teacherId = user?.id || null
  const hasPremium = isPremiumFromAuth(user?.subscription)

  // Fetch classes
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ["classes", teacherId],
    queryFn: () => classesApi.list(),
    enabled: !!teacherId,
  })

  const classes = classesData?.classes || []

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => classesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", teacherId] })
      setIsCreateDialogOpen(false)
      toast({
        title: "Success",
        description: "Class created successfully",
      })
    },
    onError: (error: any) => {
      if (isPremiumRequiredError(error)) {
        toast({
          title: "Premium Required",
          description: error?.data?.error || "Premium subscription required to create more than 1 class",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error?.data?.error || "Failed to create class",
          variant: "destructive",
        })
      }
    },
  })

  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: ({ classId, data }: { classId: string; data: { name?: string; description?: string; status?: "active" | "archived" } }) =>
      classesApi.update(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", teacherId] })
      setIsEditDialogOpen(false)
      setSelectedClass(null)
      toast({
        title: "Success",
        description: "Class updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to update class",
        variant: "destructive",
      })
    },
  })

  // Delete (archive) class mutation
  const deleteClassMutation = useMutation({
    mutationFn: (classId: string) => classesApi.delete(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes", teacherId] })
      toast({
        title: "Success",
        description: "Class archived successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to archive class",
        variant: "destructive",
      })
    },
  })

  const handleCopyLink = async (qrCodeUrl: string) => {
    try {
      await navigator.clipboard.writeText(qrCodeUrl)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Class link copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const activeClasses = classes.filter((c) => c.status === "active")
  const archivedClasses = classes.filter((c) => c.status === "archived")

  // Check if user can create more classes
  const canCreateMore = hasPremium || activeClasses.length < 1

  if (authLoading || !teacherId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex h-16 items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold leading-none">Manage Classes</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Create and manage your classes</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!canCreateMore}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Class
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Class</DialogTitle>
                  <DialogDescription>
                    Create a new class to collect feedback from students. {!hasPremium && "Free plan allows 1 class."}
                  </DialogDescription>
                </DialogHeader>
                <CreateClassForm
                  onSubmit={(data) => {
                    createClassMutation.mutate(data)
                  }}
                  isLoading={createClassMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-6">
        {/* Premium Upgrade Banner */}
        {!hasPremium && activeClasses.length >= 1 && (
          <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <PremiumUpgrade
                feature="Multiple Classes"
                description="Upgrade to premium to create unlimited classes and organize feedback by class."
              />
            </CardContent>
          </Card>
        )}

        {/* Active Classes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Active Classes ({activeClasses.length})</h2>
          </div>

          {classesLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeClasses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Classes Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first class to start collecting feedback from students
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} disabled={!canCreateMore}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeClasses.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  onEdit={() => {
                    setSelectedClass(classItem)
                    setIsEditDialogOpen(true)
                  }}
                  onArchive={() => {
                    if (confirm(`Are you sure you want to archive "${classItem.name}"?`)) {
                      deleteClassMutation.mutate(classItem.id)
                    }
                  }}
                  onShowQR={() => {
                    setSelectedQrClass(classItem)
                    setQrCodeDialogOpen(true)
                  }}
                  onCopyLink={() => handleCopyLink(classItem.qrCodeUrl || "")}
                />
              ))}
            </div>
          )}
        </div>

        {/* Archived Classes */}
        {archivedClasses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Archived Classes ({archivedClasses.length})</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {archivedClasses.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  onEdit={() => {
                    setSelectedClass(classItem)
                    setIsEditDialogOpen(true)
                  }}
                  onArchive={() => {
                    if (confirm(`Are you sure you want to restore "${classItem.name}"?`)) {
                      updateClassMutation.mutate({
                        classId: classItem.id,
                        data: { status: "active" },
                      })
                    }
                  }}
                  onShowQR={() => {
                    setSelectedQrClass(classItem)
                    setQrCodeDialogOpen(true)
                  }}
                  onCopyLink={() => handleCopyLink(classItem.qrCodeUrl || "")}
                />
              ))}
            </div>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
              <DialogDescription>Update class information</DialogDescription>
            </DialogHeader>
            {selectedClass && (
              <EditClassForm
                classItem={selectedClass}
                onSubmit={(data) => {
                  updateClassMutation.mutate({
                    classId: selectedClass.id,
                    data,
                  })
                }}
                isLoading={updateClassMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>QR Code for {selectedQrClass?.name}</DialogTitle>
              <DialogDescription>Share this QR code with your students</DialogDescription>
            </DialogHeader>
            {selectedQrClass?.qrCodeUrl && (
              <div className="space-y-4">
                <div className="flex justify-center p-6 bg-white rounded-lg">
                  <QRCodeSVG
                    value={selectedQrClass.qrCodeUrl}
                    size={250}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Feedback Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={selectedQrClass.qrCodeUrl}
                      readOnly
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleCopyLink(selectedQrClass.qrCodeUrl || "")}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}

interface ClassCardProps {
  classItem: Class
  onEdit: () => void
  onArchive: () => void
  onShowQR: () => void
  onCopyLink: () => void
}

function ClassCard({ classItem, onEdit, onArchive, onShowQR, onCopyLink }: ClassCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="truncate">{classItem.name}</span>
            </CardTitle>
            {classItem.description && (
              <CardDescription className="text-xs mt-1 line-clamp-2">
                {classItem.description}
              </CardDescription>
            )}
          </div>
          <Badge variant={classItem.status === "active" ? "default" : "secondary"}>
            {classItem.status === "active" ? "Active" : "Archived"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onShowQR}
            className="flex-1 min-w-[120px]"
          >
            <QrCode className="h-4 w-4 mr-2" />
            View QR
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCopyLink}
            className="flex-1 min-w-[120px]"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onArchive}
            className="flex-1"
          >
            {classItem.status === "active" ? (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Restore
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface CreateClassFormProps {
  onSubmit: (data: { name: string; description?: string }) => void
  isLoading: boolean
}

function CreateClassForm({ onSubmit, isLoading }: CreateClassFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: description.trim() || undefined })
    setName("")
    setDescription("")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Class Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Mathematics 101, Grade 5A, Physics Advanced"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Add a description for this class..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

interface EditClassFormProps {
  classItem: Class
  onSubmit: (data: { name?: string; description?: string; status?: "active" | "archived" }) => void
  isLoading: boolean
}

function EditClassForm({ classItem, onSubmit, isLoading }: EditClassFormProps) {
  const [name, setName] = useState(classItem.name)
  const [description, setDescription] = useState(classItem.description || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: description.trim() || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Class Name *</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-description">Description (Optional)</Label>
        <Textarea
          id="edit-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isLoading || !name.trim()}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

