"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, Plus, Tag as TagIcon, Edit, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag, useAuth, useFeedbackList } from "@/hooks";
import { useToast } from "@/hooks/use-toast-simple";
import { TagBadge } from "@/components/tag-badge";
import { TagAnalytics } from "@/components/tag-analytics";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function TagsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<{ open: boolean; tagId?: string }>({
    open: false,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<{ open: boolean; tagId?: string }>({
    open: false,
  });
  const [showInactive, setShowInactive] = useState(false);

  const teacherId = user?.id || null;
  const organizationId = user?.userType === "organization" ? user.id : undefined;

  const { data: tagsData, isLoading } = useTags({
    teacherId: user?.userType === "teacher" ? teacherId : undefined,
    organizationId,
    includeInactive: showInactive,
  });

  // Fetch feedback for analytics
  const { data: feedbackData } = useFeedbackList(teacherId);
  const totalFeedback = feedbackData?.feedback.length || 0;

  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  const tags = tagsData?.tags || [];
  const activeTags = tags.filter((tag) => tag.isActive);
  const inactiveTags = tags.filter((tag) => !tag.isActive);

  const handleCreate = async (data: {
    name: string;
    description?: string;
    color?: string;
  }) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        teacherId: user?.userType === "teacher" ? teacherId : undefined,
        organizationId,
      });
      setCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Tag created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to create tag",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (tagId: string, data: {
    name?: string;
    description?: string;
    color?: string;
    isActive?: boolean;
  }) => {
    try {
      await updateMutation.mutateAsync({ tagId, data });
      setEditDialogOpen({ open: false });
      toast({
        title: "Success",
        description: "Tag updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to update tag",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (tagId: string) => {
    try {
      await deleteMutation.mutateAsync(tagId);
      setDeleteDialogOpen({ open: false });
      toast({
        title: "Success",
        description: "Tag deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to delete tag",
        variant: "destructive",
      });
    }
  };

  return (
    <>
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex h-16 items-center gap-3">
              <Link href="/dashboard">
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-lg font-semibold leading-none">Tag Management</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeTags.length} active tag{activeTags.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tag
                  </Button>
                </DialogTrigger>
                <CreateTagDialog
                  onSubmit={handleCreate}
                  isLoading={createMutation.isPending}
                />
              </Dialog>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-6">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-primary" />
              About Tags
            </CardTitle>
            <CardDescription>
              Tags help categorize and organize feedback. Students can select tags when submitting
              feedback, making it easier to identify common themes and patterns.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-inactive" className="cursor-pointer">
                Show inactive tags
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInactive(!showInactive)}
              >
                {showInactive ? "Hide" : "Show"} Inactive
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Tags */}
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading tags...</p>
            </CardContent>
          </Card>
        ) : activeTags.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <TagIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No tags created yet</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Tag
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeTags.map((tag) => (
                    <TagCard
                      key={tag.id}
                      tag={tag}
                      onEdit={() => setEditDialogOpen({ open: true, tagId: tag.id })}
                      onDelete={() => setDeleteDialogOpen({ open: true, tagId: tag.id })}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tag Analytics */}
            {activeTags.length > 0 && totalFeedback > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tag Analytics</CardTitle>
                  <CardDescription>
                    View usage statistics and performance metrics for your tags
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeTags.slice(0, 6).map((tag) => (
                      <TagAnalytics
                        key={tag.id}
                        tag={tag}
                        totalFeedback={totalFeedback}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Inactive Tags */}
        {showInactive && inactiveTags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inactive Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveTags.map((tag) => (
                  <TagCard
                    key={tag.id}
                    tag={tag}
                    onEdit={() => setEditDialogOpen({ open: true, tagId: tag.id })}
                    onDelete={() => setDeleteDialogOpen({ open: true, tagId: tag.id })}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        {editDialogOpen.tagId && (
          <Dialog
            open={editDialogOpen.open}
            onOpenChange={(open) => setEditDialogOpen({ open, tagId: open ? editDialogOpen.tagId : undefined })}
          >
            <EditTagDialog
              tag={tags.find((t) => t.id === editDialogOpen.tagId)}
              onSubmit={(data) => handleUpdate(editDialogOpen.tagId!, data)}
              isLoading={updateMutation.isPending}
            />
          </Dialog>
        )}

        {/* Delete Dialog */}
        {deleteDialogOpen.tagId && (
          <AlertDialog
            open={deleteDialogOpen.open}
            onOpenChange={(open) =>
              setDeleteDialogOpen({ open, tagId: open ? deleteDialogOpen.tagId : undefined })
            }
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this tag? This will remove it from all associated
                  feedback. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(deleteDialogOpen.tagId!)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        </div>
    </>
  );
}

interface TagCardProps {
  tag: {
    id: string;
    name: string;
    description?: string;
    color?: string;
    isActive: boolean;
  };
  onEdit: () => void;
  onDelete: () => void;
}

function TagCard({ tag, onEdit, onDelete }: TagCardProps) {
  return (
    <Card className="relative">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
          <div className="flex-1 min-w-0">
            <TagBadge tag={tag} size="md" className="w-full" />
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {tag.description && (
          <p className="text-sm text-muted-foreground mt-2 break-words">{tag.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface CreateTagDialogProps {
  onSubmit: (data: { name: string; description?: string; color?: string }) => void;
  isLoading: boolean;
}

function CreateTagDialog({ onSubmit, isLoading }: CreateTagDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color || undefined,
    });
    setFormData({ name: "", description: "", color: "#3b82f6" });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create New Tag</DialogTitle>
        <DialogDescription>
          Create a tag to help categorize feedback from students.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Tag Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Clear Explanations"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of what this tag represents"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Color (Optional)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="h-10 w-20"
            />
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#3b82f6"
              className="flex-1"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading || !formData.name.trim()}>
            {isLoading ? "Creating..." : "Create Tag"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

interface EditTagDialogProps {
  tag?: {
    id: string;
    name: string;
    description?: string;
    color?: string;
    isActive: boolean;
  };
  onSubmit: (data: {
    name?: string;
    description?: string;
    color?: string;
    isActive?: boolean;
  }) => void;
  isLoading: boolean;
}

function EditTagDialog({ tag, onSubmit, isLoading }: EditTagDialogProps) {
  const [formData, setFormData] = useState({
    name: tag?.name || "",
    description: tag?.description || "",
    color: tag?.color || "#3b82f6",
    isActive: tag?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      color: formData.color || undefined,
      isActive: formData.isActive,
    });
  };

  if (!tag) return null;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Tag</DialogTitle>
        <DialogDescription>Update tag details.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Tag Name *</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-description">Description (Optional)</Label>
          <Textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-color">Color (Optional)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="edit-color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="h-10 w-20"
            />
            <Input
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="edit-active"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4"
          />
          <Label htmlFor="edit-active" className="cursor-pointer">
            Active
          </Label>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading || !formData.name.trim()}>
            {isLoading ? "Updating..." : "Update Tag"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

