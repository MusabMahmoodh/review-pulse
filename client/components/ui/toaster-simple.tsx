"use client"

import { useToast } from "@/hooks/use-toast-simple"
import { ToastSimple } from "@/components/ui/toast-simple"

export function ToasterSimple() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:right-0 sm:flex-col md:max-w-[420px] md:left-auto">
      {toasts.map((toast) => (
        <ToastSimple key={toast.id} {...toast} onClose={() => dismiss(toast.id)} />
      ))}
    </div>
  )
}
