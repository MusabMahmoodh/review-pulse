"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Search, DollarSign, AlertCircle, Check, X, Crown, Trash2, Users, User } from "lucide-react"
import Link from "next/link"
import { 
  useAdminTeachers, 
  useUpdateTeacherStatus, 
  usePromoteToPremium, 
  useCancelSubscription,
  useAdminOrganizations,
  useUpdateOrganizationStatus,
  usePromoteOrganizationToPremium,
  useCancelOrganizationSubscription
} from "@/hooks/use-admin"
import { useToast } from "@/hooks/use-toast-simple"

type TeacherWithDetails = {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  subject?: string
  department?: string
  organizationId?: string
  status: "active" | "blocked"
  feedbackCount: number
  averageRating: number
  createdAt: string
  updatedAt: string
  subscription?: {
    id: string
    plan: string
    status: string
    startDate: string
    endDate: string | null
    monthlyPrice: number
    defaultPrice?: number
    discount?: number
    finalPrice?: number
    amountPaid?: number
  }
}

type OrganizationWithDetails = {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  website?: string
  status: "active" | "blocked"
  teacherCount: number
  createdAt: string
  updatedAt: string
  subscription?: {
    id: string
    plan: string
    status: string
    startDate: string
    endDate: string | null
    monthlyPrice: number
    defaultPrice?: number
    discount?: number
    finalPrice?: number
    amountPaid?: number
  }
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"organizations" | "teachers">("organizations")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "blocked">("all")
  const [filterPlan, setFilterPlan] = useState<"all" | "free" | "basic" | "premium" | "enterprise">("all")
  const [promoteDialogOpen, setPromoteDialogOpen] = useState<string | null>(null)
  const [promoteType, setPromoteType] = useState<"teacher" | "organization">("teacher")
  const [promoteMonths, setPromoteMonths] = useState<string>("")
  const [promoteDiscount, setPromoteDiscount] = useState<string>("")
  const [promoteAmountPaid, setPromoteAmountPaid] = useState<string>("")
  const { toast } = useToast()
  
  const { data: teachersData, isLoading: teachersLoading, error: teachersError } = useAdminTeachers()
  const { data: orgsData, isLoading: orgsLoading, error: orgsError } = useAdminOrganizations()
  
  const updateTeacherStatusMutation = useUpdateTeacherStatus()
  const promoteTeacherMutation = usePromoteToPremium()
  const cancelTeacherSubscriptionMutation = useCancelSubscription()
  
  const updateOrgStatusMutation = useUpdateOrganizationStatus()
  const promoteOrgMutation = usePromoteOrganizationToPremium()
  const cancelOrgSubscriptionMutation = useCancelOrganizationSubscription()
  
  const allTeachers: TeacherWithDetails[] = teachersData?.teachers || []
  const soloTeachers = allTeachers.filter(t => !t.organizationId)
  const organizations: OrganizationWithDetails[] = orgsData?.organizations || []
  
  const DEFAULT_PRICE = 15000

  const handleTeacherStatusToggle = async (teacherId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active"
    try {
      await updateTeacherStatusMutation.mutateAsync({ teacherId, status: newStatus as "active" | "blocked" })
      toast({
        title: "Status Updated",
        description: `Teacher ${newStatus === "active" ? "activated" : "blocked"} successfully`,
      })
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error?.data?.error || error?.message || "Failed to update teacher status",
        variant: "destructive",
      })
    }
  }

  const handleOrgStatusToggle = async (organizationId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active"
    try {
      await updateOrgStatusMutation.mutateAsync({ organizationId, status: newStatus as "active" | "blocked" })
      toast({
        title: "Status Updated",
        description: `Organization ${newStatus === "active" ? "activated" : "blocked"} successfully`,
      })
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error?.data?.error || error?.message || "Failed to update organization status",
        variant: "destructive",
      })
    }
  }

  const handlePromoteToPremium = async (id: string) => {
    try {
      const months = promoteMonths.trim() === "" || promoteMonths === "0" ? null : parseInt(promoteMonths)
      if (months !== null && (isNaN(months) || months < 1)) {
        toast({
          title: "Invalid Input",
          description: "Please enter a valid number of months or leave empty for forever",
          variant: "destructive",
        })
        return
      }
      
      const discount = promoteDiscount.trim() === "" ? undefined : parseFloat(promoteDiscount)
      const amountPaid = promoteAmountPaid.trim() === "" ? undefined : parseFloat(promoteAmountPaid)
      
      if (discount !== undefined && (isNaN(discount) || discount < 0)) {
        toast({
          title: "Invalid Discount",
          description: "Please enter a valid discount amount",
          variant: "destructive",
        })
        return
      }
      
      if (amountPaid !== undefined && (isNaN(amountPaid) || amountPaid < 0)) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount paid",
          variant: "destructive",
        })
        return
      }
      
      if (promoteType === "teacher") {
        await promoteTeacherMutation.mutateAsync({ teacherId: id, months, discount, amountPaid })
      } else {
        await promoteOrgMutation.mutateAsync({ organizationId: id, months, discount, amountPaid })
      }
      
      const pricing = calculatePricing()
      toast({
        title: "Premium Enabled",
        description: months 
          ? `Premium enabled for ${months} months - LKR ${pricing.finalPrice.toLocaleString()} paid`
          : `Premium enabled forever - LKR ${pricing.finalPrice.toLocaleString()} paid`,
      })
      setPromoteDialogOpen(null)
      setPromoteMonths("")
      setPromoteDiscount("")
      setPromoteAmountPaid("")
    } catch (error: any) {
      toast({
        title: "Promotion Failed",
        description: error?.data?.error || error?.message || "Failed to promote to premium",
        variant: "destructive",
      })
    }
  }

  const handleCancelSubscription = async (subscriptionId: string, type: "teacher" | "organization") => {
    if (!confirm("Are you sure you want to cancel this subscription?")) {
      return
    }
    
    try {
      if (type === "teacher") {
        await cancelTeacherSubscriptionMutation.mutateAsync(subscriptionId)
      } else {
        await cancelOrgSubscriptionMutation.mutateAsync(subscriptionId)
      }
      toast({
        title: "Subscription Cancelled",
        description: "Subscription has been cancelled successfully",
      })
    } catch (error: any) {
      toast({
        title: "Cancellation Failed",
        description: error?.data?.error || error?.message || "Failed to cancel subscription",
        variant: "destructive",
      })
    }
  }

  const calculatePricing = () => {
    const months = promoteMonths.trim() === "" || promoteMonths === "0" ? null : parseInt(promoteMonths)
    const numMonths = months || 1
    const totalPrice = DEFAULT_PRICE * numMonths
    const discount = promoteDiscount.trim() === "" ? 0 : parseFloat(promoteDiscount) || 0
    const finalPrice = totalPrice - discount
    return { totalPrice, discount, finalPrice, months: numMonths }
  }

  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || org.status === filterStatus
    const matchesPlan = filterPlan === "all" || org.subscription?.plan === filterPlan
    return matchesSearch && matchesStatus && matchesPlan
  })

  const filteredSoloTeachers = soloTeachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || teacher.status === filterStatus
    const matchesPlan = filterPlan === "all" || teacher.subscription?.plan === filterPlan
    return matchesSearch && matchesStatus && matchesPlan
  })

  const stats = {
    totalOrganizations: organizations.length,
    activeOrganizations: organizations.filter((o) => o.status === "active").length,
    blockedOrganizations: organizations.filter((o) => o.status === "blocked").length,
    totalSoloTeachers: soloTeachers.length,
    activeSoloTeachers: soloTeachers.filter((t) => t.status === "active").length,
    blockedSoloTeachers: soloTeachers.filter((t) => t.status === "blocked").length,
    totalRevenue: [...organizations, ...soloTeachers].reduce((sum, item) => {
      const sub = item.subscription
      if (sub && sub.status === "active") {
        return sum + (sub.amountPaid || sub.finalPrice || sub.defaultPrice || 0)
      }
      return sum
    }, 0),
  }

  const isLoading = activeTab === "organizations" ? orgsLoading : teachersLoading
  const error = activeTab === "organizations" ? orgsError : teachersError

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Failed to load data. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage organizations and solo teachers</p>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                Exit Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-orange-600" />
                <p className="text-xs font-medium text-muted-foreground">Organizations</p>
              </div>
              <p className="text-2xl font-bold">{stats.totalOrganizations}</p>
              <p className="text-xs text-muted-foreground">{stats.activeOrganizations} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-medium text-muted-foreground">Solo Teachers</p>
              </div>
              <p className="text-2xl font-bold">{stats.totalSoloTeachers}</p>
              <p className="text-xs text-muted-foreground">{stats.activeSoloTeachers} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-xs font-medium text-muted-foreground">Blocked</p>
              </div>
              <p className="text-2xl font-bold">{stats.blockedOrganizations + stats.blockedSoloTeachers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
              </div>
              <p className="text-2xl font-bold">LKR {stats.totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "organizations" | "teachers")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="organizations">
              <Building2 className="w-4 h-4 mr-2" />
              Organizations ({stats.totalOrganizations})
            </TabsTrigger>
            <TabsTrigger value="teachers">
              <User className="w-4 h-4 mr-2" />
              Solo Teachers ({stats.totalSoloTeachers})
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={`Search ${activeTab === "organizations" ? "organizations" : "teachers"}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value as any)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">All Plans</option>
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-3">
            {filteredOrganizations.map((org) => (
              <Card key={org.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{org.name}</h3>
                        <Badge variant={org.status === "active" ? "default" : "destructive"} className="text-xs">
                          {org.status}
                        </Badge>
                        {org.subscription && (
                          <Badge variant="outline" className="text-xs">
                            {org.subscription.plan}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{org.email}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>👥 {org.teacherCount} teachers</span>
                        {org.subscription && (
                          <>
                            <span>💰 LKR {org.subscription.monthlyPrice?.toLocaleString() || org.subscription.defaultPrice?.toLocaleString() || '0'}/mo</span>
                            {org.subscription.amountPaid && (
                              <span>💵 Paid: LKR {org.subscription.amountPaid.toLocaleString()}</span>
                            )}
                            {org.subscription.discount && org.subscription.discount > 0 && (
                              <span>🎁 Discount: LKR {org.subscription.discount.toLocaleString()}</span>
                            )}
                          </>
                        )}
                      </div>
                      {org.subscription && (
                        <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Subscription:</span>
                            <Badge variant={org.subscription.status === "active" ? "default" : "outline"} className="text-xs">
                              {org.subscription.status}
                            </Badge>
                          </div>
                          {org.subscription.endDate ? (
                            <span>Valid until: {new Date(org.subscription.endDate).toLocaleDateString()}</span>
                          ) : (
                            <span>Valid: Forever</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={promoteDialogOpen === org.id && promoteType === "organization"} onOpenChange={(open) => {
                        setPromoteDialogOpen(open ? org.id : null)
                        setPromoteType("organization")
                        if (!open) {
                          setPromoteMonths("")
                          setPromoteDiscount("")
                          setPromoteAmountPaid("")
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={promoteOrgMutation.isPending}
                          >
                            <Crown className="w-4 h-4 mr-1" />
                            Promote
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Promote to Premium</DialogTitle>
                            <DialogDescription>
                              Promote {org.name} to premium. Leave months empty for forever.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Months (leave empty for forever)</label>
                              <Input
                                type="number"
                                placeholder="e.g., 3, 6, 12"
                                value={promoteMonths}
                                onChange={(e) => setPromoteMonths(e.target.value)}
                                min="1"
                              />
                            </div>
                            
                            {(() => {
                              const { totalPrice, discount, finalPrice, months } = calculatePricing()
                              return (
                                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Default Price ({months} {months === 1 ? 'month' : 'months'}):</span>
                                    <span className="font-medium">LKR {totalPrice.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Discount (LKR)</label>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={promoteDiscount}
                                      onChange={(e) => setPromoteDiscount(e.target.value)}
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>
                                  <div className="flex justify-between text-sm border-t pt-2">
                                    <span className="text-muted-foreground">Final Price:</span>
                                    <span className="font-semibold">LKR {finalPrice.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Amount Paid (LKR) - Optional</label>
                                    <Input
                                      type="number"
                                      placeholder={`${finalPrice.toLocaleString()} (auto-filled)`}
                                      value={promoteAmountPaid}
                                      onChange={(e) => setPromoteAmountPaid(e.target.value)}
                                      min="0"
                                      step="0.01"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Leave empty to use final price
                                    </p>
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setPromoteDialogOpen(null)
                                setPromoteMonths("")
                                setPromoteDiscount("")
                                setPromoteAmountPaid("")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handlePromoteToPremium(org.id)}
                              disabled={promoteOrgMutation.isPending}
                            >
                              {promoteOrgMutation.isPending ? "Promoting..." : "Promote"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {org.subscription && org.subscription.status === "active" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelSubscription(org.subscription!.id, "organization")}
                          disabled={cancelOrgSubscriptionMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Cancel Sub
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={org.status === "active" ? "destructive" : "default"}
                        onClick={() => handleOrgStatusToggle(org.id, org.status)}
                        disabled={updateOrgStatusMutation.isPending}
                      >
                        {org.status === "active" ? (
                          <>
                            <X className="w-4 h-4 mr-1" />
                            Block
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredOrganizations.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No organizations found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Solo Teachers Tab */}
          <TabsContent value="teachers" className="space-y-3">
            {filteredSoloTeachers.map((teacher) => (
              <Card key={teacher.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{teacher.name}</h3>
                        <Badge variant={teacher.status === "active" ? "default" : "destructive"} className="text-xs">
                          {teacher.status}
                        </Badge>
                        {teacher.subscription && (
                          <Badge variant="outline" className="text-xs">
                            {teacher.subscription.plan}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{teacher.email}</p>
                      {teacher.subject && (
                        <p className="text-xs text-muted-foreground mb-2">Subject: {teacher.subject}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>📊 {teacher.feedbackCount} reviews</span>
                        <span>⭐ {teacher.averageRating.toFixed(1)} avg rating</span>
                        {teacher.subscription && (
                          <>
                            <span>💰 LKR {teacher.subscription.monthlyPrice?.toLocaleString() || teacher.subscription.defaultPrice?.toLocaleString() || '0'}/mo</span>
                            {teacher.subscription.amountPaid && (
                              <span>💵 Paid: LKR {teacher.subscription.amountPaid.toLocaleString()}</span>
                            )}
                            {teacher.subscription.discount && teacher.subscription.discount > 0 && (
                              <span>🎁 Discount: LKR {teacher.subscription.discount.toLocaleString()}</span>
                            )}
                          </>
                        )}
                      </div>
                      {teacher.subscription && (
                        <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Subscription:</span>
                            <Badge variant={teacher.subscription.status === "active" ? "default" : "outline"} className="text-xs">
                              {teacher.subscription.status}
                            </Badge>
                          </div>
                          {teacher.subscription.endDate ? (
                            <span>Valid until: {new Date(teacher.subscription.endDate).toLocaleDateString()}</span>
                          ) : (
                            <span>Valid: Forever</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={promoteDialogOpen === teacher.id && promoteType === "teacher"} onOpenChange={(open) => {
                        setPromoteDialogOpen(open ? teacher.id : null)
                        setPromoteType("teacher")
                        if (!open) {
                          setPromoteMonths("")
                          setPromoteDiscount("")
                          setPromoteAmountPaid("")
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={promoteTeacherMutation.isPending}
                          >
                            <Crown className="w-4 h-4 mr-1" />
                            Promote
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Promote to Premium</DialogTitle>
                            <DialogDescription>
                              Promote {teacher.name} to premium. Leave months empty for forever.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Months (leave empty for forever)</label>
                              <Input
                                type="number"
                                placeholder="e.g., 3, 6, 12"
                                value={promoteMonths}
                                onChange={(e) => setPromoteMonths(e.target.value)}
                                min="1"
                              />
                            </div>
                            
                            {(() => {
                              const { totalPrice, discount, finalPrice, months } = calculatePricing()
                              return (
                                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Default Price ({months} {months === 1 ? 'month' : 'months'}):</span>
                                    <span className="font-medium">LKR {totalPrice.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Discount (LKR)</label>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={promoteDiscount}
                                      onChange={(e) => setPromoteDiscount(e.target.value)}
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>
                                  <div className="flex justify-between text-sm border-t pt-2">
                                    <span className="text-muted-foreground">Final Price:</span>
                                    <span className="font-semibold">LKR {finalPrice.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Amount Paid (LKR) - Optional</label>
                                    <Input
                                      type="number"
                                      placeholder={`${finalPrice.toLocaleString()} (auto-filled)`}
                                      value={promoteAmountPaid}
                                      onChange={(e) => setPromoteAmountPaid(e.target.value)}
                                      min="0"
                                      step="0.01"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Leave empty to use final price
                                    </p>
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setPromoteDialogOpen(null)
                                setPromoteMonths("")
                                setPromoteDiscount("")
                                setPromoteAmountPaid("")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handlePromoteToPremium(teacher.id)}
                              disabled={promoteTeacherMutation.isPending}
                            >
                              {promoteTeacherMutation.isPending ? "Promoting..." : "Promote"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {teacher.subscription && teacher.subscription.status === "active" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancelSubscription(teacher.subscription!.id, "teacher")}
                          disabled={cancelTeacherSubscriptionMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Cancel Sub
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={teacher.status === "active" ? "destructive" : "default"}
                        onClick={() => handleTeacherStatusToggle(teacher.id, teacher.status)}
                        disabled={updateTeacherStatusMutation.isPending}
                      >
                        {teacher.status === "active" ? (
                          <>
                            <X className="w-4 h-4 mr-1" />
                            Block
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredSoloTeachers.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No solo teachers found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
