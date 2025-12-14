"use client"

import { useState, useCallback } from "react"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

let toastIdCounter = 0
const listeners = new Set<(toasts: Toast[]) => void>()
let toastsState: Toast[] = []

function notifyListeners() {
  listeners.forEach((listener) => listener(toastsState))
}

export function toast({ title, description, variant = "default" }: Omit<Toast, "id">) {
  const id = `toast-${++toastIdCounter}`
  const newToast: Toast = { id, title, description, variant }

  toastsState = [...toastsState, newToast]
  notifyListeners()

  return {
    id,
    dismiss: () => {
      toastsState = toastsState.filter((t) => t.id !== id)
      notifyListeners()
    },
  }
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastsState)

  const subscribe = useCallback((listener: (toasts: Toast[]) => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, [])

  useState(() => {
    return subscribe(setToasts)
  })

  const dismiss = useCallback((id: string) => {
    toastsState = toastsState.filter((t) => t.id !== id)
    notifyListeners()
  }, [])

  return {
    toasts,
    toast,
    dismiss,
  }
}
