"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Building2, Search, DollarSign, AlertCircle, Check, X } from "lucide-react"
import type { RestaurantWithDetails } from "@/lib/types"
import Link from "next/link"

export default function AdminDashboardPage() {
  const [restaurants, setRestaurants] = useState<RestaurantWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "blocked">("all")
  const [filterPlan, setFilterPlan] = useState<"all" | "free" | "basic" | "premium" | "enterprise">("all")

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    try {
      const response = await fetch("/api/admin/restaurants")
      const data = await response.json()
      setRestaurants(data.restaurants)
    } catch (error) {
      console.error("Failed to fetch restaurants:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (restaurantId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "blocked" : "active"
    try {
      const response = await fetch("/api/admin/restaurants/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, status: newStatus }),
      })

      if (response.ok) {
        setRestaurants((prev) =>
          prev.map((r) => (r.id === restaurantId ? { ...r, status: newStatus as "active" | "blocked" } : r)),
        )
      }
    } catch (error) {
      console.error("Failed to update status:", error)
    }
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
    totalRevenue: restaurants.reduce((sum, r) => sum + (r.subscription?.monthlyPrice || 0), 0),
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
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
              <p className="text-2xl font-bold">${stats.totalRevenue}</p>
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
                      {restaurant.subscription && <span>💰 ${restaurant.subscription.monthlyPrice}/mo</span>}
                      {restaurant.lastActivity && <span>🕒 Last: {restaurant.lastActivity.toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={restaurant.status === "active" ? "destructive" : "default"}
                      onClick={() => handleStatusToggle(restaurant.id, restaurant.status)}
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
