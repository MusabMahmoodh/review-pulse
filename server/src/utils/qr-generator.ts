export function generateTeacherId(): string {
  return `teacher_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateOrganizationId(): string {
  return `org_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateQRCodeUrl(teacherId: string): string {
  const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
  return `${baseUrl}/feedback/${teacherId}`;
}















