import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "../data-source";
import { Organization, OrganizationAuth, Teacher, TeacherAuth, StudentFeedback, AIInsight } from "../models";
import { hashPassword } from "../utils/password";
import { generateTeacherId, generateOrganizationId, generateQRCodeUrl } from "../utils/qr-generator";

dotenv.config();

async function bootstrapData() {
  try {
    console.log("Initializing database connection...");
    await AppDataSource.initialize();

    const orgRepo = AppDataSource.getRepository(Organization);
    const orgAuthRepo = AppDataSource.getRepository(OrganizationAuth);
    const teacherRepo = AppDataSource.getRepository(Teacher);
    const teacherAuthRepo = AppDataSource.getRepository(TeacherAuth);
    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);
    const insightRepo = AppDataSource.getRepository(AIInsight);

    // Check if demo organization already exists
    const existingOrg = await orgRepo.findOne({
      where: { email: "demo@institute.com" },
    });

    if (existingOrg) {
      console.log("⚠️  Demo organization already exists!");
      console.log(`   Organization ID: ${existingOrg.id}`);
      console.log("   Delete it first if you want to recreate it.");
      await AppDataSource.destroy();
      process.exit(0);
    }

    console.log("Creating demo organization and teacher...");

    // Create organization
    const organizationId = generateOrganizationId();
    const organization = orgRepo.create({
      id: organizationId,
      name: "Future Academy",
      email: "demo@institute.com",
      phone: "+1234567890",
      address: "123 Education Street, Learning City",
      status: "active",
    });

    await orgRepo.save(organization);
    console.log(`✅ Organization created: ${organization.name} (${organizationId})`);

    // Create organization auth
    const orgPasswordHash = await hashPassword("demo123");
    const orgAuth = orgAuthRepo.create({
      organizationId,
      email: organization.email,
      passwordHash: orgPasswordHash,
    });

    await orgAuthRepo.save(orgAuth);
    console.log("✅ Organization authentication credentials created");

    // Create teacher
    const teacherId = generateTeacherId();
    const teacher = teacherRepo.create({
      id: teacherId,
      name: "Ms. Emily White",
      email: "demo@teacher.com",
      phone: "+1234567891",
      address: "123 Education Street, Learning City",
      subject: "Mathematics",
      department: "Science Department",
      qrCode: teacherId,
      organizationId: organizationId,
      status: "active",
    });

    await teacherRepo.save(teacher);
    console.log(`✅ Teacher created: ${teacher.name} (${teacherId})`);

    // Create teacher auth
    const teacherPasswordHash = await hashPassword("demo123");
    const teacherAuth = teacherAuthRepo.create({
      teacherId,
      email: teacher.email,
      passwordHash: teacherPasswordHash,
    });

    await teacherAuthRepo.save(teacherAuth);
    console.log("✅ Teacher authentication credentials created");

    // Create sample student feedback
    const feedbackData = [
      {
        id: `feedback_${Date.now()}_1`,
        teacherId,
        studentName: "Alex Johnson",
        studentContact: "+1234567892",
        studentId: "STU001",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 4,
        overallRating: 5,
        courseName: "Calculus I",
        suggestions: "Excellent explanations! Would love more practice problems.",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        id: `feedback_${Date.now()}_2`,
        teacherId,
        studentName: "Sarah Williams",
        studentId: "STU002",
        teachingRating: 4,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 4,
        courseName: "Calculus I",
        suggestions: "Great teaching style and very approachable!",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: `feedback_${Date.now()}_3`,
        teacherId,
        studentId: "STU003",
        teachingRating: 5,
        communicationRating: 4,
        materialRating: 5,
        overallRating: 5,
        courseName: "Linear Algebra",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: `feedback_${Date.now()}_4`,
        teacherId,
        studentName: "Michael Chen",
        studentId: "STU004",
        teachingRating: 4,
        communicationRating: 4,
        materialRating: 4,
        overallRating: 4,
        courseName: "Calculus I",
        suggestions: "Good teaching overall. Could use more visual aids.",
        createdAt: new Date(),
      },
      {
        id: `feedback_${Date.now()}_5`,
        teacherId,
        studentName: "Emma Rodriguez",
        studentId: "STU005",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "Linear Algebra",
        suggestions: "Perfect class! The examples were very helpful.",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
      {
        id: `feedback_${Date.now()}_6`,
        teacherId,
        studentName: "David Lee",
        studentId: "STU006",
        teachingRating: 3,
        communicationRating: 4,
        materialRating: 4,
        overallRating: 3,
        courseName: "Calculus I",
        suggestions: "Teaching is okay but could be more engaging.",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    ];

    for (const feedback of feedbackData) {
      const feedbackEntity = feedbackRepo.create(feedback);
      await feedbackRepo.save(feedbackEntity);
    }
    console.log(`✅ Created ${feedbackData.length} student feedback entries`);

    // Create AI insight
    const insight = insightRepo.create({
      id: `insight_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      teacherId,
      summary:
        "Your teaching is performing exceptionally well with an average rating of 4.3 stars. Students consistently praise your teaching quality and communication, with particular emphasis on clear explanations and approachable teaching style.",
      recommendations: [
        "Add More Practice Problems - Multiple students have requested more practice exercises",
        "Incorporate Visual Aids - Some students suggested using more visual aids for complex concepts",
        "Maintain Current Communication Standards - Students appreciate your approachable teaching style",
      ],
      sentiment: "positive" as const,
      keyTopics: [
        "Excellent teaching quality and clear explanations",
        "Outstanding communication and approachability",
        "High-quality course materials",
        "Request for more practice problems",
        "Visual aids enhancement needed",
      ],
      generatedAt: new Date(),
    });

    await insightRepo.save(insight);
    console.log("✅ Created AI insight");

    console.log("\n✅ Bootstrap data created successfully!");
    console.log("\nDemo Organization Credentials:");
    console.log(`  Email: demo@institute.com`);
    console.log(`  Password: demo123`);
    console.log(`  Organization ID: ${organizationId}`);
    console.log("\nDemo Teacher Credentials:");
    console.log(`  Email: demo@teacher.com`);
    console.log(`  Password: demo123`);
    console.log(`  Teacher ID: ${teacherId}`);
    console.log(`  QR Code URL: ${generateQRCodeUrl(teacherId)}`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error bootstrapping data:", error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

bootstrapData();
















