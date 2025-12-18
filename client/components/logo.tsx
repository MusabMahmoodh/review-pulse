import Image from "next/image"
import { cn } from "@/lib/utils"
import type { CSSProperties } from "react"

interface LogoProps {
  className?: string
  width?: number
  height?: number
  showText?: boolean
  style?: CSSProperties
  imageClassName?: string
}

export function Logo({ 
  className, 
  width = 32, 
  height = 32, 
  showText = false, 
  style,
  imageClassName 
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} style={style}>
      <Image
        src="/logo.png"
        alt="Guestra Logo"
        width={width}
        height={height}
        className={cn("object-contain", imageClassName)}
        priority
      />
      {showText && (
        <div>
          <span className="text-xl font-bold">Guestra</span>
          <p className="text-xs text-muted-foreground">every review is a growth opportunity</p>
        </div>
      )}
    </div>
  )
}

