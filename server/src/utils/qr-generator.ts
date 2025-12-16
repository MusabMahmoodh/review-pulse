export function generateRestaurantId(): string {
  return `rest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateQRCodeUrl(restaurantId: string): string {
  const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
  return `${baseUrl}/feedback/${restaurantId}`;
}







