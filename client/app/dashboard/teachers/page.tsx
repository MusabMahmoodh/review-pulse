"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks";
import {
  useOrganizationTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
} from "@/hooks/use-organizations";
import { Users, Plus, Edit, Trash2, Mail, Phone, BookOpen, Building2, Star } from "lucide-react";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TeachersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<{ open: boolean; teacherId?: string }>({
    open: false,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<{ open: boolean; teacherId?: string }>({
    open: false,
  });

  // Redirect if not organization
  useEffect(() => {
    if (user && user.userType !== "organization") {
      router.push("/dashboard");
    }
  }, [user, router]);

  const { data: teachersData, isLoading } = useOrganizationTeachers();
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const deleteMutation = useDeleteTeacher();

  const teachers = teachersData?.teachers || [];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    subject: "",
    department: "",
  });

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address || undefined,
        subject: formData.subject || undefined,
        department: formData.department || undefined,
      });
      setCreateDialogOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        subject: "",
        department: "",
      });
      toast({
        title: "Success",
        description: "Teacher created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to create teacher",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async () => {
    if (!editDialogOpen.teacherId) return;
    try {
      await updateMutation.mutateAsync({
        teacherId: editDialogOpen.teacherId,
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address || undefined,
          subject: formData.subject || undefined,
          department: formData.department || undefined,
        },
      });
      setEditDialogOpen({ open: false });
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        subject: "",
        department: "",
      });
      toast({
        title: "Success",
        description: "Teacher updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to update teacher",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialogOpen.teacherId) return;
    try {
      await deleteMutation.mutateAsync(deleteDialogOpen.teacherId);
      setDeleteDialogOpen({ open: false });
      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.data?.error || "Failed to delete teacher",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (teacher: any) => {
    setFormData({
      name: teacher.name,
      email: teacher.email,
      password: "", // Don't pre-fill password
      phone: teacher.phone,
      address: teacher.address || "",
      subject: teacher.subject || "",
      department: teacher.department || "",
    });
    setEditDialogOpen({ open: true, teacherId: teacher.id });
  };

  if (user?.userType !== "organization") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              <div>
                <h1 className="text-lg font-semibold leading-none">Manage Teachers</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Organization Teachers</p>
              </div>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Teacher
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24 md:pb-6">
        {isLoading ? (
          <div className="text-center py-12">Loading teachers...</div>
        ) : teachers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No teachers yet</h3>
              <p className="text-muted-foreground mb-4">
                Add teachers to your organization to start collecting reviews
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Teacher
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teachers.map((teacher) => (
              <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{teacher.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(teacher)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialogOpen({ open: true, teacherId: teacher.id })}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {teacher.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                    {teacher.subject && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3 w-3 text-muted-foreground" />
                        <span>{teacher.subject}</span>
                      </div>
                    )}
                    {teacher.department && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span>{teacher.department}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="font-medium">
                        {teacher.stats.averageRating.toFixed(1)} / 5.0
                      </span>
                      <span className="text-muted-foreground">
                        ({teacher.stats.totalFeedback} reviews)
                      </span>
                    </div>
                  </div>
                  <Link href={`/dashboard/feedback?filterTeacherId=${teacher.id}`}>
                    <Button variant="outline" className="w-full mt-4" size="sm">
                      View Reviews
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>Add a new teacher to your organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Teacher name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="teacher@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Address"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Mathematics"
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Science Department"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen.open} onOpenChange={(open) => setEditDialogOpen({ open })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>Update teacher information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Teacher name"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="teacher@example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Address"
              />
            </div>
            <div>
              <Label htmlFor="edit-subject">Subject</Label>
              <Input
                id="edit-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Mathematics"
              />
            </div>
            <div>
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g., Science Department"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={deleteDialogOpen.open}
        onOpenChange={(open) => setDeleteDialogOpen({ open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the teacher and all associated data. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MobileBottomNav />
    </div>
  );
}

