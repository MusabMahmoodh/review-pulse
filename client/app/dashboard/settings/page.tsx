"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Facebook, Instagram, Chrome, Save, RefreshCw, Plus, X } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast-simple"

export default function SettingsPage() {
  const { toast } = useToast()
  const [keywords, setKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const restaurantId = "rest_1765722970886_70yxgey"

  useEffect(() => {
    // Load current keywords
    const mockKeywords = [
      "The Culinary Corner",
      "TCC Restaurant",
      "Culinary Corner NYC",
      "best italian nyc",
      "@culinarycorner",
    ]
    setKeywords(mockKeywords)
  }, [])

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a keyword",
        variant: "destructive",
      })
      return
    }

    if (keywords.length >= 5) {
      toast({
        title: "Limit Reached",
        description: "Maximum 5 keywords allowed",
        variant: "destructive",
      })
      return
    }

    setKeywords([...keywords, newKeyword.trim()])
    setNewKeyword("")
  }

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (keywords.length < 3) {
      toast({
        title: "Error",
        description: "Please add at least 3 keywords",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Success",
        description: "Social media keywords updated successfully",
      })
    }, 1000)
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    // Simulate sync
    setTimeout(() => {
      setSyncing(false)
      toast({
        title: "Sync Complete",
        description: "External reviews synced successfully",
      })
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg">Settings</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Social Keywords Section */}
        <Card>
          <CardHeader>
            <CardTitle>Social Media Keywords</CardTitle>
            <CardDescription>
              Add 3-5 keywords to find your restaurant mentions on Facebook and Instagram. Include your restaurant name,
              hashtags, and common variations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="e.g., #MyRestaurant or @restaurant_name"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
                  maxLength={50}
                />
              </div>
              <Button onClick={handleAddKeyword} disabled={keywords.length >= 5} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {keywords.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Current Keywords ({keywords.length}/5)</Label>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="pr-1 text-sm">
                      {keyword}
                      <button
                        onClick={() => handleRemoveKeyword(index)}
                        className="ml-2 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleSave} disabled={loading || keywords.length < 3} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Keywords"}
            </Button>
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>Manage your social media and review platform connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Facebook className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Facebook</p>
                  <p className="text-xs text-muted-foreground">Scraping mentions</p>
                </div>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Instagram className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">Instagram</p>
                  <p className="text-xs text-muted-foreground">Scraping mentions</p>
                </div>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Chrome className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Google My Business</p>
                  <p className="text-xs text-muted-foreground">OAuth required</p>
                </div>
              </div>
              <Badge variant="outline">Not Connected</Badge>
            </div>
            <p className="text-xs text-muted-foreground px-1">
              Google integration requires OAuth authentication to access your Google My Business reviews. This feature
              will be available soon.
            </p>
          </CardContent>
        </Card>

        {/* Sync Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Settings</CardTitle>
            <CardDescription>External reviews are automatically synced every 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Last Sync</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
                <Button onClick={handleSyncNow} disabled={syncing} size="sm" variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing..." : "Sync Now"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
