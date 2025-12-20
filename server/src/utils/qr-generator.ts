export function generateTeacherId(): string {
  return `teacher_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateOrganizationId(): string {
  return `org_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateClassId(): string {
  return `class_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function generateQRCodeUrl(teacherId: string, classId?: string): string {
  const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
  if (classId) {
    return `${baseUrl}/feedback/${teacherId}?class=${classId}`;
  }
  return `${baseUrl}/feedback/${teacherId}`;
}

export function generateOrganizationQRCodeUrl(organizationId: string, classId?: string): string {
  const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
  if (classId) {
    return `${baseUrl}/feedback/org/${organizationId}?class=${classId}`;
  }
  return `${baseUrl}/feedback/org/${organizationId}`;
}















