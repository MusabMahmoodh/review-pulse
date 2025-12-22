"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2, Copy, Check, Loader2 } from "lucide-react"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast-simple"
import { useAuth } from "@/hooks"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { QRCodeSVG } from "qrcode.react"

export default function QRCodePage() {
  const { toast } = useToast()
  const { user, isLoading: authLoading } = useAuth()
  const [copied, setCopied] = useState(false)
  const qrCodeRef = useRef<HTMLDivElement>(null)
  
  const teacherId = user?.id || null
  const feedbackUrl = teacherId 
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/feedback/${teacherId}`
    : ""

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !teacherId) {
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
  }, [authLoading, teacherId])

  const handleCopyLink = async () => {
    if (!feedbackUrl) return
    
    try {
      await navigator.clipboard.writeText(feedbackUrl)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Feedback link copied to clipboard",
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

  const handleDownload = async () => {
    if (!qrCodeRef.current || !feedbackUrl) return

    try {
      const svg = qrCodeRef.current.querySelector("svg")
      if (!svg) return

      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        
        canvas.toBlob((blob) => {
          if (!blob) return
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = "teacher-feedback-qr.png"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          
          toast({
            title: "Downloaded!",
            description: "QR code saved to your device",
          })
        })
      }

      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    if (!feedbackUrl) return

    // Use native share API if available (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Leave us feedback!",
          text: "Scan this QR code or use the link to share your feedback",
          url: feedbackUrl,
        })
        toast({
          title: "Shared!",
          description: "Link shared successfully",
        })
      } catch (error: any) {
        // User cancelled or error occurred
        if (error.name !== "AbortError") {
          console.error("Share error:", error)
          // Fallback to copy if share fails
          handleCopyLink()
        }
      }
    } else {
      // Fallback to copy on desktop
      handleCopyLink()
    }
  }

  // Show loading state while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (redirect will happen)
  if (!teacherId || !feedbackUrl) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo width={32} height={32} />
            <span className="text-xl font-bold">Guestra</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl pb-24 md:pb-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Your Feedback QR Code</CardTitle>
            <CardDescription>Display this QR code in your classroom for students to scan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code Display */}
            <div className="flex justify-center p-6 bg-white rounded-lg" ref={qrCodeRef}>
              <QRCodeSVG
                value={feedbackUrl}
                size={300}
                level="H"
                includeMargin={true}
                className="w-full max-w-sm"
              />
            </div>

            {/* Feedback URL */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Feedback Link:</p>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm break-all">{feedbackUrl}</div>
                <Button size="icon" variant="outline" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
              <Button onClick={handleShare} variant="outline" className="flex-1">
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </Button>
            </div>

            {/* Tips */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-medium text-sm">Tips for best results:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Print the QR code and display it in your classroom or on course materials</li>
                <li>Make sure the QR code is easy to scan (good lighting, flat surface)</li>
                <li>Consider adding instructions like "Scan to leave feedback"</li>
                <li>Test the QR code with your phone before displaying</li>
                <li>Share the link directly via WhatsApp, email, or other messaging apps</li>
                <li>Share your QR code with students to collect feedback</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
