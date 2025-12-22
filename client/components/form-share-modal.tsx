"use client"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, Download, Share2, MessageCircle } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useToast } from "@/hooks/use-toast-simple"

interface FormShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formId: string
  formName: string
  teacherId?: string
  organizationId?: string
}

export function FormShareModal({
  open,
  onOpenChange,
  formId,
  formName,
  teacherId,
  organizationId,
}: FormShareModalProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const qrCodeRef = useRef<HTMLDivElement>(null)

  // Generate feedback URL with formId
  const feedbackUrl = typeof window !== "undefined"
    ? `${window.location.origin}/feedback/${teacherId || organizationId}?formId=${formId}`
    : ""

  // WhatsApp share URL
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `Please provide your feedback: ${feedbackUrl}`
  )}`

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
    if (!qrCodeRef.current) return

    try {
      // Use dynamic import for html2canvas (optional dependency)
      const html2canvas = (await import("html2canvas")).default
      const canvas = await html2canvas(qrCodeRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      })
      const url = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `qr-code-${formName.replace(/\s+/g, "-").toLowerCase()}.png`
      link.href = url
      link.click()
      toast({
        title: "Downloaded!",
        description: "QR code downloaded successfully",
      })
    } catch (error) {
      // Fallback: Right-click to save or copy QR code
      toast({
        title: "Info",
        description: "Right-click on the QR code to save it",
      })
    }
  }

  const handleWhatsAppShare = () => {
    window.open(whatsappUrl, "_blank")
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Feedback Form: ${formName}`,
          text: `Please provide your feedback`,
          url: feedbackUrl,
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to copy
      handleCopyLink()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Form</DialogTitle>
          <DialogDescription>
            Share this feedback form with your students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="flex justify-center p-6 bg-white rounded-lg" ref={qrCodeRef}>
            <QRCodeSVG
              value={feedbackUrl}
              size={250}
              level="H"
              includeMargin={true}
              className="w-full max-w-xs"
            />
          </div>

          {/* Form Name */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Form:</p>
            <p className="font-medium">{formName}</p>
          </div>

          {/* Feedback URL */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Feedback Link:</p>
            <div className="flex gap-2">
              <Input
                value={feedbackUrl}
                readOnly
                className="flex-1 text-sm"
              />
              <Button size="icon" variant="outline" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleWhatsAppShare}
              className="bg-[#25D366] hover:bg-[#20BA5A] text-white"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              onClick={handleNativeShare}
              variant="outline"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          {/* Download QR Code */}
          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

