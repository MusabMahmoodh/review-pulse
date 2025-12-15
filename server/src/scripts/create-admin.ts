import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "../data-source";
import { Admin } from "../models/Admin";
import { hashPassword } from "../utils/password";

dotenv.config();

async function createAdmin() {
  try {
    console.log("Initializing database connection...");
    await AppDataSource.initialize();

    // Get admin details from command line arguments or use defaults
    const email = process.argv[2] || process.env.ADMIN_EMAIL || "admin@reviewpulse.com";
    const password = process.argv[3] || process.env.ADMIN_PASSWORD || "admin123";
    const role = (process.argv[4] as "super_admin" | "admin") || "super_admin";

    console.log(`Creating admin user: ${email}`);
    console.log(`Role: ${role}`);

    const adminRepo = AppDataSource.getRepository(Admin);

    // Check if admin already exists
    const existingAdmin = await adminRepo.findOne({ where: { email } });
    if (existingAdmin) {
      console.log(`❌ Admin with email ${email} already exists!`);
      console.log("   Use a different email or delete the existing admin first.");
      await AppDataSource.destroy();
      process.exit(1);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin
    const admin = adminRepo.create({
      id: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      email,
      passwordHash,
      role,
    });

    await adminRepo.save(admin);

    console.log("✅ Admin created successfully!");
    console.log("\nAdmin Details:");
    console.log(`  ID: ${admin.id}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role: ${admin.role}`);
    console.log(`  Created: ${admin.createdAt}`);
    console.log("\n⚠️  Please save these credentials securely!");

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

createAdmin();


