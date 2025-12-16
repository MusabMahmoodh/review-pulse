"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Building2, Search, DollarSign, AlertCircle, Check, X, Crown, Trash2 } from "lucide-react"
import type { RestaurantWithDetails } from "@/lib/types"
import Link from "next/link"
import { useAdminRestaurants, useUpdateRestaurantStatus, usePromoteToPremium, useCancelSubscription } from "@/hooks/use-admin"
import { useToast } from "@/hooks/use-toast-simple"

export default function AdminDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "blocked">("all")
  const [filterPlan, setFilterPlan] = useState<"all" | "free" | "basic" | "premium" | "enterprise">("all")
  const [promoteDialogOpen, setPromoteDialogOpen] = useState<string | null>(null)
  const [promoteMonths, setPromoteMonths] = useState<string>("")
  const [promoteDiscount, setPromoteDiscount] = useState<string>("")
  const [promoteAmountPaid, setPromoteAmountPaid] = useState<string>("")
  const { toast } = useToast()
  
  const { data, isLoading, error } = useAdminRestaurants()
  const updateStatusMutation = useUpdateRestaurantStatus()
  const promoteMutation = usePromoteToPremium()
  const cancelSubscriptionMutation = useCancelSubscription()
  
  const restaurants: RestaurantWithDetails[] = data?.restaurants || []
  
  const DEFAULT_PRICE = 15000

  const handleStatusToggle = async (restaurantId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active"
    try {
      await updateStatusMutation.mutateAsync({ restaurantId, status: newStatus as "active" | "blocked" })
      toast({
        title: "Status Updated",
        description: `Restaurant ${newStatus === "active" ? "activated" : "blocked"} successfully`,
      })
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error?.data?.error || error?.message || "Failed to update restaurant status",
        variant: "destructive",
      })
    }
  }

  const handlePromoteToPremium = async (restaurantId: string) => {
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
      
      await promoteMutation.mutateAsync({ restaurantId, months, discount, amountPaid })
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
        description: error?.data?.error || error?.message || "Failed to promote restaurant to premium",
        variant: "destructive",
      })
    }
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) {
      return
    }
    
    try {
      await cancelSubscriptionMutation.mutateAsync(subscriptionId)
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

  // Calculate pricing for display
  const calculatePricing = () => {
    const months = promoteMonths.trim() === "" || promoteMonths === "0" ? null : parseInt(promoteMonths)
    const numMonths = months || 1 // For calculation, use 1 if forever
    const totalPrice = DEFAULT_PRICE * numMonths
    const discount = promoteDiscount.trim() === "" ? 0 : parseFloat(promoteDiscount) || 0
    const finalPrice = totalPrice - discount
    return { totalPrice, discount, finalPrice, months: numMonths }
  }

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesSearch =
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || restaurant.status === filterStatus
    const matchesPlan = filterPlan === "all" || restaurant.subscription?.plan === filterPlan
    return matchesSearch && matchesStatus && matchesPlan
  })

  const stats = {
    totalRestaurants: restaurants.length,
    activeRestaurants: restaurants.filter((r) => r.status === "active").length,
    blockedRestaurants: restaurants.filter((r) => r.status === "blocked").length,
    totalRevenue: restaurants.reduce((sum, r) => {
      const sub = r.subscription
      if (sub && sub.status === "active") {
        return sum + (sub.amountPaid || sub.finalPrice || sub.defaultPrice || 0)
      }
      return sum
    }, 0),
  }

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
        <p className="text-destructive">Failed to load restaurants. Please try again.</p>
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
              <p className="text-sm text-muted-foreground">Manage restaurants and subscriptions</p>
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
                <p className="text-xs font-medium text-muted-foreground">Total Restaurants</p>
              </div>
              <p className="text-2xl font-bold">{stats.totalRestaurants}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-muted-foreground">Active</p>
              </div>
              <p className="text-2xl font-bold">{stats.activeRestaurants}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-xs font-medium text-muted-foreground">Blocked</p>
              </div>
              <p className="text-2xl font-bold">{stats.blockedRestaurants}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-muted-foreground">Monthly Revenue</p>
              </div>
              <p className="text-2xl font-bold">LKR {stats.totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search restaurants..."
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

        {/* Restaurant List */}
        <div className="space-y-3">
          {filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{restaurant.name}</h3>
                      <Badge variant={restaurant.status === "active" ? "default" : "destructive"} className="text-xs">
                        {restaurant.status}
                      </Badge>
                      {restaurant.subscription && (
                        <Badge variant="outline" className="text-xs">
                          {restaurant.subscription.plan}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{restaurant.email}</p>
                    {restaurant.socialKeywords && restaurant.socialKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {restaurant.socialKeywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>📊 {restaurant.feedbackCount} reviews</span>
                      <span>⭐ {restaurant.averageRating.toFixed(1)} avg rating</span>
                      {restaurant.subscription && (
                        <>
                          <span>💰 LKR {restaurant.subscription.monthlyPrice?.toLocaleString() || restaurant.subscription.defaultPrice?.toLocaleString() || '0'}/mo</span>
                          {restaurant.subscription.amountPaid && (
                            <span>💵 Paid: LKR {restaurant.subscription.amountPaid.toLocaleString()}</span>
                          )}
                          {restaurant.subscription.discount && restaurant.subscription.discount > 0 && (
                            <span>🎁 Discount: LKR {restaurant.subscription.discount.toLocaleString()}</span>
                          )}
                        </>
                      )}
                      {restaurant.lastActivity && <span>🕒 Last: {restaurant.lastActivity.toLocaleDateString()}</span>}
                    </div>
                    {restaurant.subscription && (
                      <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Subscription:</span>
                          <Badge variant={restaurant.subscription.status === "active" ? "default" : "outline"} className="text-xs">
                            {restaurant.subscription.status}
                          </Badge>
                        </div>
                        {restaurant.subscription.endDate ? (
                          <span>Valid until: {new Date(restaurant.subscription.endDate).toLocaleDateString()}</span>
                        ) : (
                          <span>Valid: Forever</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={promoteDialogOpen === restaurant.id} onOpenChange={(open) => {
                      setPromoteDialogOpen(open ? restaurant.id : null)
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
                          disabled={promoteMutation.isPending}
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          Promote
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Promote to Premium</DialogTitle>
                          <DialogDescription>
                            Promote {restaurant.name} to premium. Leave months empty for forever.
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
                            onClick={() => handlePromoteToPremium(restaurant.id)}
                            disabled={promoteMutation.isPending}
                          >
                            {promoteMutation.isPending ? "Promoting..." : "Promote"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    {restaurant.subscription && restaurant.subscription.status === "active" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancelSubscription(restaurant.subscription!.id)}
                        disabled={cancelSubscriptionMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Cancel Sub
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={restaurant.status === "active" ? "destructive" : "default"}
                      onClick={() => handleStatusToggle(restaurant.id, restaurant.status)}
                      disabled={updateStatusMutation.isPending}
                    >
                      {restaurant.status === "active" ? (
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

          {filteredRestaurants.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No restaurants found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
