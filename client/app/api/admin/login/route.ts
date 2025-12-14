import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-data"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Simple auth check (in production, use proper password hashing)
    const adminId = mockDb.adminAuth.login(email, password)

    if (!adminId) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const admin = mockDb.admins.getById(adminId)

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
