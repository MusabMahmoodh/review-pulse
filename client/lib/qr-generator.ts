// QR Code generation utility
export function generateQRCodeUrl(restaurantId: string): string {
  // Generate URL for feedback form
  const feedbackUrl = `${typeof window !== "undefined" ? window.location.origin : "https://feedback.app"}/feedback/${restaurantId}`

  // Use Google Charts API for QR code generation (free, no dependencies)
  return `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(feedbackUrl)}&choe=UTF-8`
}

export function generateRestaurantId(): string {
  return `rest_${Date.now()}_${Math.random().toString(36).substring(7)}`
}
