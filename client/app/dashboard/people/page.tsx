"use client"

// Redirect to team-members for now, or we can create a dedicated people page
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function PeoplePage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace("/dashboard/team-members")
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-muted-foreground mt-2">Redirecting...</p>
      </div>
    </div>
  )
}

