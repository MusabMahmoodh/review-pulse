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
    const email = process.argv[2] || process.env.ADMIN_EMAIL || "admin@guestra.com";
    const password = process.argv[3] || process.env.ADMIN_PASSWORD || "admin123";
    const role = (process.argv[4] as "super_admin" | "admin") || "super_admin";

    console.log(`Creating admin user: ${email}`);
    console.log(`Role: ${role}`);

    const adminRepo = AppDataSource.getRepository(Admin);

    // Check if admin already exists
    const existingAdmin = await adminRepo.findOne({ where: { email } });
    if (existingAdmin) {
      console.log(`⚠️  Admin with email ${email} already exists!`);
      console.log("   Updating password and role...");
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      if (!passwordHash || passwordHash.length === 0) {
        console.error("❌ Failed to hash password!");
        await AppDataSource.destroy();
        process.exit(1);
      }
      
      // Update existing admin
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.role = role;
      await adminRepo.save(existingAdmin);
      
      // Verify the admin was updated correctly
      const updatedAdmin = await adminRepo.findOne({ where: { email } });
      if (!updatedAdmin || !updatedAdmin.passwordHash || updatedAdmin.passwordHash.length === 0) {
        console.error("❌ Admin was not updated correctly! Password hash is missing.");
        await AppDataSource.destroy();
        process.exit(1);
      }
      
      console.log(`✅ Admin updated successfully!`);
      console.log("\nAdmin Details:");
      console.log(`  ID: ${updatedAdmin.id}`);
      console.log(`  Email: ${updatedAdmin.email}`);
      console.log(`  Role: ${updatedAdmin.role}`);
      console.log(`  Password hash length: ${updatedAdmin.passwordHash.length}`);
      console.log("\n⚠️  Please save these credentials securely!");
      
      await AppDataSource.destroy();
      process.exit(0);
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    
    if (!passwordHash || passwordHash.length === 0) {
      console.error("❌ Failed to hash password!");
      await AppDataSource.destroy();
      process.exit(1);
    }
    
    console.log(`Password hash generated (length: ${passwordHash.length})`);

    // Create admin
    const admin = adminRepo.create({
      id: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      email,
      passwordHash,
      role,
    });

    await adminRepo.save(admin);
    
    // Verify the admin was saved correctly
    const savedAdmin = await adminRepo.findOne({ where: { email } });
    if (!savedAdmin || !savedAdmin.passwordHash || savedAdmin.passwordHash.length === 0) {
      console.error("❌ Admin was not saved correctly! Password hash is missing.");
      await AppDataSource.destroy();
      process.exit(1);
    }
    
    console.log(`Verified: Admin saved with password hash (length: ${savedAdmin.passwordHash.length})`);

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







