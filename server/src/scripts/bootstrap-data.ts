import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "../data-source";
import { Organization, OrganizationAuth, Teacher, TeacherAuth, StudentFeedback, AIInsight, Tag, FeedbackTag } from "../models";
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
    const tagRepo = AppDataSource.getRepository(Tag);
    const feedbackTagRepo = AppDataSource.getRepository(FeedbackTag);

    // Check if demo organization already exists
    const existingOrg = await orgRepo.findOne({
      where: { email: "admin@excellenceacademy.lk" },
    });

    if (existingOrg) {
      console.log("⚠️  Demo organization already exists!");
      console.log(`   Organization ID: ${existingOrg.id}`);
      console.log("   Delete it first if you want to recreate it.");
      await AppDataSource.destroy();
      process.exit(0);
    }

    console.log("Creating demo organization and teachers for GCE A/L Science Stream...");

    // Create organization - Sri Lankan tuition center
    const organizationId = generateOrganizationId();
    const organization = orgRepo.create({
      id: organizationId,
      name: "Excellence Academy - GCE A/L Science Stream",
      email: "admin@excellenceacademy.lk",
      phone: "+94771234567",
      address: "No. 45, Galle Road, Colombo 03, Sri Lanka",
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

    // Create organization-level tags
    const orgTags = [
      { name: "Clear Explanations", description: "Clear explanations", color: "#10b981" },
      { name: "Engaging", description: "Engaging", color: "#3b82f6" },
      { name: "Helpful Materials", description: "Helpful materials", color: "#8b5cf6" },
      { name: "Too Fast", description: "Too fast", color: "#ef4444" },
      { name: "Unclear", description: "Unclear", color: "#f59e0b" },
      { name: "Problem Solving", description: "Problem solving", color: "#06b6d4" },
      { name: "Past Papers", description: "Past papers", color: "#84cc16" },
      { name: "Exam Preparation", description: "Exam preparation", color: "#ec4899" },
    ];

    const createdTags = [];
    for (const tagData of orgTags) {
      const tagId = `tag_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const tag = tagRepo.create({
        id: tagId,
        name: tagData.name,
        description: tagData.description,
        color: tagData.color,
        organizationId: organizationId,
        isActive: true,
      });
      await tagRepo.save(tag);
      createdTags.push(tag);
    }
    console.log(`✅ Created ${createdTags.length} organization-level tags`);

    // Create teachers for Physics, Mathematics, Chemistry, and CIT
    const teachers = [
      {
        name: "Mr. Rohan Perera",
        email: "rohan.perera@excellenceacademy.lk",
        phone: "+94771234568",
        subject: "Physics",
        department: "Science Department",
      },
      {
        name: "Ms. Nimali Fernando",
        email: "nimali.fernando@excellenceacademy.lk",
        phone: "+94771234569",
        subject: "Mathematics",
        department: "Science Department",
      },
      {
        name: "Dr. Kamal Wickramasinghe",
        email: "kamal.wickramasinghe@excellenceacademy.lk",
        phone: "+94771234570",
        subject: "Chemistry",
        department: "Science Department",
      },
      {
        name: "Mr. Dinesh Silva",
        email: "dinesh.silva@excellenceacademy.lk",
        phone: "+94771234571",
        subject: "CIT",
        department: "Science Department",
      },
    ];

    const createdTeachers = [];
    for (const teacherData of teachers) {
      const teacherId = generateTeacherId();
      const teacher = teacherRepo.create({
        id: teacherId,
        name: teacherData.name,
        email: teacherData.email,
        phone: teacherData.phone,
        address: "No. 45, Galle Road, Colombo 03, Sri Lanka",
        subject: teacherData.subject,
        department: teacherData.department,
        qrCode: teacherId,
        organizationId: organizationId,
        status: "active",
      });

      await teacherRepo.save(teacher);
      console.log(`✅ Teacher created: ${teacher.name} - ${teacher.subject} (${teacherId})`);

      // Create teacher auth
      const teacherPasswordHash = await hashPassword("demo123");
      const teacherAuth = teacherAuthRepo.create({
        teacherId,
        email: teacher.email,
        passwordHash: teacherPasswordHash,
      });

      await teacherAuthRepo.save(teacherAuth);
      createdTeachers.push({ ...teacher, teacherId });
    }
    console.log("✅ All teacher authentication credentials created");

    // Create realistic GCE A/L student feedback for each teacher
    const physicsTeacher = createdTeachers.find(t => t.subject === "Physics");
    const mathsTeacher = createdTeachers.find(t => t.subject === "Mathematics");
    const chemistryTeacher = createdTeachers.find(t => t.subject === "Chemistry");
    const citTeacher = createdTeachers.find(t => t.subject === "CIT");

    if (!physicsTeacher || !mathsTeacher || !chemistryTeacher || !citTeacher) {
      throw new Error("Failed to find all required teachers");
    }

    let feedbackCounter = 1;
    const feedbackData = [
      // Physics feedback - GCE A/L specific topics
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "Tharindu Perera",
        studentContact: "+94771234580",
        studentId: "AL2024/001",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Physics",
        suggestions: "Sir's explanation of kinematics and projectile motion was excellent! The way you derived equations of motion step by step really helped. The circular motion and centripetal force examples were very clear. Would love more practice on SHM (Simple Harmonic Motion) before the exam.",
        tagIds: [createdTags[0].id, createdTags[5].id, createdTags[7].id], // Clear explanations, Problem solving, Exam preparation
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "Sachini Jayasuriya",
        studentContact: "+94771234581",
        studentId: "AL2024/002",
        teachingRating: 4,
        communicationRating: 5,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Physics",
        suggestions: "Very good teaching! The thermal physics section on heat capacity and latent heat was clear. The kinetic theory of gases explanation was helpful. Could use more diagrams for electric fields and potential difference topics.",
        tagIds: [createdTags[0].id, createdTags[2].id], // Clear explanations, Helpful materials
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "Dilshan Fernando",
        studentId: "AL2024/003",
        teachingRating: 5,
        communicationRating: 4,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Physics",
        suggestions: "Modern physics section on atomic structure and Bohr's model was explained very well. The photoelectric effect examples were helpful. The nuclear physics section on alpha, beta, and gamma decay is now clear.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "Nethmi Silva",
        studentContact: "+94771234582",
        studentId: "AL2024/004",
        teachingRating: 4,
        communicationRating: 4,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Physics",
        suggestions: "Good coverage of the syllabus. The waves section on interference and diffraction was okay. More past paper practice on mechanics and electricity would be helpful for exam preparation.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "Kavindu Rathnayake",
        studentId: "AL2024/005",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Physics",
        suggestions: "Excellent teacher! The way you explain electromagnetic induction and Lenz's law makes it easy to understand. The AC circuits and transformers section was very clear. Thank you!",
        tagIds: [createdTags[0].id, createdTags[1].id, createdTags[2].id], // Clear explanations, Engaging, Helpful materials
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "Pasindu Gunasekara",
        studentContact: "+94771234592",
        studentId: "AL2024/022",
        teachingRating: 4,
        communicationRating: 4,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Physics",
        suggestions: "The mechanics section on work, energy, and power was good. More examples on rotational dynamics would help. The moment of inertia calculations need more practice.",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "Tharushi De Silva",
        studentId: "AL2024/023",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Physics",
        suggestions: "The optics section on reflection, refraction, and lenses was excellent! Snell's law and total internal reflection are now clear. More practice on lens formula would be great.",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      // Mathematics feedback - GCE A/L specific topics
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: mathsTeacher.teacherId,
        studentName: "Hasini Wijesinghe",
        studentContact: "+94771234583",
        studentId: "AL2024/006",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Mathematics",
        suggestions: "Madam's teaching of differentiation and integration techniques is outstanding! The chain rule and product rule examples were very clear. Integration by parts and substitution methods are now easy. More practice on coordinate geometry (straight lines, circles, conic sections) would be great.",
        tagIds: [createdTags[0].id, createdTags[5].id], // Clear explanations, Problem solving
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: mathsTeacher.teacherId,
        studentName: "Pasindu Gunasekara",
        studentId: "AL2024/007",
        teachingRating: 4,
        communicationRating: 5,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Mathematics",
        suggestions: "Very clear explanations of quadratic equations and polynomial functions. The trigonometry section on compound angles and double angle formulas was good. The complex numbers section (De Moivre's theorem) could use more examples.",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: mathsTeacher.teacherId,
        studentName: "Tharushi De Silva",
        studentContact: "+94771234584",
        studentId: "AL2024/008",
        teachingRating: 5,
        communicationRating: 4,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Mathematics",
        suggestions: "Statistics and probability section was explained very well! The binomial distribution and normal distribution examples were helpful. Permutations and combinations are now clear. Thank you for the detailed examples!",
        tagIds: [createdTags[0].id, createdTags[5].id, createdTags[2].id], // Clear explanations, Problem solving, Helpful materials
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: mathsTeacher.teacherId,
        studentName: "Ravindu Perera",
        studentId: "AL2024/009",
        teachingRating: 4,
        communicationRating: 4,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Mathematics",
        suggestions: "Good teaching overall. The vectors section on scalar and vector products was okay. More past paper questions on calculus and coordinate geometry with model answers would help with exam preparation.",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: mathsTeacher.teacherId,
        studentName: "Sanduni Karunaratne",
        studentContact: "+94771234585",
        studentId: "AL2024/010",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Mathematics",
        suggestions: "Excellent! The first-order and second-order differential equations section is now clear. The method of solving homogeneous equations was very well explained. Your teaching method is very effective.",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: mathsTeacher.teacherId,
        studentName: "Chamod Wickramasinghe",
        studentId: "AL2024/011",
        teachingRating: 3,
        communicationRating: 4,
        materialRating: 3,
        overallRating: 3,
        courseName: "GCE A/L Mathematics",
        suggestions: "Teaching is okay but could be faster. The matrices and determinants section needs more time for practice. More examples on solving systems of linear equations would help.",
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: mathsTeacher.teacherId,
        studentName: "Nimasha Fernando",
        studentContact: "+94771234593",
        studentId: "AL2024/024",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Mathematics",
        suggestions: "The sequences and series section was excellent! Arithmetic and geometric progressions are now clear. The sum to infinity formula was well explained. More practice on binomial expansion would be helpful.",
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      },
      // Chemistry feedback - GCE A/L specific topics
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: chemistryTeacher.teacherId,
        studentName: "Nimasha Fernando",
        studentContact: "+94771234586",
        studentId: "AL2024/012",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Chemistry",
        suggestions: "Dr. Wickramasinghe's explanation of organic chemistry reactions is excellent! The SN1 and SN2 mechanisms for alkyl halides were very clear. The electrophilic substitution in benzene and aromatic compounds was well explained. The mechanism diagrams really help. More practice on IUPAC naming of complex organic compounds would be useful.",
        tagIds: [createdTags[0].id, createdTags[5].id, createdTags[2].id], // Clear explanations, Problem solving, Helpful materials
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: chemistryTeacher.teacherId,
        studentName: "Dilshan Perera",
        studentId: "AL2024/013",
        teachingRating: 4,
        communicationRating: 5,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Chemistry",
        suggestions: "Physical chemistry topics like thermodynamics (enthalpy, entropy, Gibbs free energy) and chemical equilibrium (Le Chatelier's principle) are well explained. The rate of reaction and kinetics section was good. The inorganic chemistry section on s-block and p-block elements could use more examples.",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: chemistryTeacher.teacherId,
        studentName: "Tharaka Silva",
        studentContact: "+94771234587",
        studentId: "AL2024/014",
        teachingRating: 5,
        communicationRating: 4,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Chemistry",
        suggestions: "Analytical chemistry section was very clear. The acid-base titration calculations and redox titration are now easy to understand. The gravimetric analysis examples were helpful. Thank you!",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: chemistryTeacher.teacherId,
        studentName: "Kavindi Jayasuriya",
        studentId: "AL2024/015",
        teachingRating: 4,
        communicationRating: 4,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Chemistry",
        suggestions: "Good coverage of the syllabus. The organic functional groups (alcohols, aldehydes, ketones, carboxylic acids) section was okay. More past paper practice on organic synthesis and multi-step reactions would help.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: chemistryTeacher.teacherId,
        studentName: "Ravindu Gunasekara",
        studentContact: "+94771234588",
        studentId: "AL2024/016",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Chemistry",
        suggestions: "Excellent teaching! The way you explain reaction mechanisms (nucleophilic substitution, elimination reactions) makes organic chemistry much easier. The periodic table trends (ionization energy, electron affinity, atomic radius) are also very clear now. The d-block elements and transition metals section was well explained.",
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: chemistryTeacher.teacherId,
        studentName: "Sachini Perera",
        studentContact: "+94771234594",
        studentId: "AL2024/025",
        teachingRating: 4,
        communicationRating: 4,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Chemistry",
        suggestions: "The electrochemistry section on electrochemical cells and standard electrode potentials was good. More examples on Nernst equation calculations would help. The organic polymers section needs more practice.",
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: chemistryTeacher.teacherId,
        studentName: "Tharindu Wickramasinghe",
        studentId: "AL2024/026",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Chemistry",
        suggestions: "The organic chemistry section on alkenes and alkynes (addition reactions, Markovnikov's rule) was excellent! The carbonyl compounds reactions (nucleophilic addition) are now clear. More practice on stereochemistry (E/Z isomerism) would be helpful.",
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },
      // CIT feedback - GCE A/L specific topics
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: citTeacher.teacherId,
        studentName: "Sachith Wickramasinghe",
        studentContact: "+94771234589",
        studentId: "AL2024/017",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 4,
        overallRating: 5,
        courseName: "GCE A/L CIT",
        suggestions: "Sir's programming lessons are excellent! The Java examples on object-oriented programming (classes, objects, inheritance, polymorphism) were very helpful. The control structures and loops examples were clear. Would love more practice on database queries and SQL (SELECT, JOIN, WHERE clauses).",
        tagIds: [createdTags[0].id, createdTags[1].id, createdTags[5].id], // Clear explanations, Engaging, Problem solving
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: citTeacher.teacherId,
        studentName: "Nethmi Perera",
        studentId: "AL2024/018",
        teachingRating: 4,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 4,
        courseName: "GCE A/L CIT",
        suggestions: "Web development section is clear. The HTML/CSS examples on forms, tables, and styling are good. The responsive design concepts were helpful. More practice on JavaScript (DOM manipulation, event handling) would be helpful.",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: citTeacher.teacherId,
        studentName: "Dilshan Fernando",
        studentContact: "+94771234590",
        studentId: "AL2024/019",
        teachingRating: 5,
        communicationRating: 4,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L CIT",
        suggestions: "Networking concepts are well explained. The OSI model and TCP/IP model layers are now clear. The IP addressing and subnetting examples were helpful. The network topologies and protocols section was good. Thank you!",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: citTeacher.teacherId,
        studentName: "Tharindu Silva",
        studentId: "AL2024/020",
        teachingRating: 4,
        communicationRating: 4,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L CIT",
        suggestions: "Good teaching overall. The system analysis and design section (SDLC, DFD, system flowcharts) was okay. More hands-on programming exercises on Java arrays and data structures would help with practical exams.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: citTeacher.teacherId,
        studentName: "Kavindi Rathnayake",
        studentContact: "+94771234591",
        studentId: "AL2024/021",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L CIT",
        suggestions: "Excellent! The database normalization concepts (1NF, 2NF, 3NF) are now clear. The ER diagram examples and entity relationships were very helpful. The SQL DDL and DML commands section was well explained.",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: citTeacher.teacherId,
        studentName: "Pasindu Jayasuriya",
        studentContact: "+94771234595",
        studentId: "AL2024/027",
        teachingRating: 4,
        communicationRating: 4,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L CIT",
        suggestions: "The computer hardware section on CPU, memory, and storage devices was good. The operating system concepts (process management, file systems) were clear. More examples on algorithm design and flowcharts would help.",
        createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), // 11 days ago
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: citTeacher.teacherId,
        studentName: "Tharushi Gunasekara",
        studentId: "AL2024/028",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L CIT",
        suggestions: "The data structures section on arrays, linked lists, stacks, and queues was excellent! The sorting and searching algorithms (bubble sort, binary search) are now clear. More practice on recursion would be helpful.",
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      },
    ];

    // Create feedback entries and link tags
    for (const feedbackDataItem of feedbackData) {
      const { tagIds, ...feedbackFields } = feedbackDataItem;
      const feedback = feedbackRepo.create(feedbackFields);
      await feedbackRepo.save(feedback);

      // Link tags to feedback
      if (tagIds && tagIds.length > 0) {
        for (const tagId of tagIds) {
          const feedbackTag = feedbackTagRepo.create({
            id: `feedbacktag_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            feedbackId: feedback.id,
            tagId: tagId,
          });
          await feedbackTagRepo.save(feedbackTag);
        }
      }
    }
    console.log(`✅ Created ${feedbackData.length} student feedback entries with tags for GCE A/L students`);

    // Create AI insights for each teacher based on GCE A/L feedback
    const insights = [
      {
        teacherId: physicsTeacher.teacherId,
        summary: "Your Physics teaching is performing exceptionally well with an average rating of 4.6 stars. Students consistently praise your clear explanations of kinematics, mechanics, circular motion, and modern physics topics. Your step-by-step approach to deriving equations and use of real-world examples is highly appreciated.",
        recommendations: [
          "More Practice on SHM - Students have requested additional practice on Simple Harmonic Motion before exams",
          "Enhanced Visual Aids - Consider adding more diagrams for electric fields, potential difference, and magnetism topics",
          "Past Paper Practice - Students would benefit from more past paper question practice on mechanics and electricity",
          "Rotational Dynamics - Add more examples on moment of inertia calculations and rotational motion",
        ],
        sentiment: "positive" as const,
        keyTopics: [
          "Excellent kinematics and projectile motion explanations",
          "Clear circular motion and centripetal force teaching",
          "Strong modern physics coverage (atomic structure, photoelectric effect, nuclear physics)",
          "Good thermal physics and kinetic theory explanations",
          "Request for more SHM practice",
          "Need for more visual aids in electricity and magnetism",
          "Optics section (reflection, refraction, lenses) highly praised",
        ],
      },
      {
        teacherId: mathsTeacher.teacherId,
        summary: "Your Mathematics teaching is highly effective with an average rating of 4.5 stars. Students particularly appreciate your step-by-step approach to differentiation, integration techniques, and statistics. Your teaching method for calculus, coordinate geometry, and probability is consistently praised.",
        recommendations: [
          "More Coordinate Geometry Practice - Students have requested additional practice on straight lines, circles, and conic sections",
          "Complex Numbers Examples - Some students need more examples for De Moivre's theorem and complex number operations",
          "Past Paper Questions - Include more past paper questions on calculus and coordinate geometry with model answers",
          "Matrices Practice - Add more examples on solving systems of linear equations using matrices",
        ],
        sentiment: "positive" as const,
        keyTopics: [
          "Outstanding differentiation and integration teaching (chain rule, product rule, integration by parts)",
          "Clear statistics and probability explanations (binomial distribution, normal distribution)",
          "Effective step-by-step teaching method for differential equations",
          "Good sequences and series coverage (AP, GP, sum to infinity)",
          "Request for more coordinate geometry practice",
          "Need for more complex numbers examples",
          "Vectors section (scalar and vector products) well received",
        ],
      },
      {
        teacherId: chemistryTeacher.teacherId,
        summary: "Your Chemistry teaching is excellent with an average rating of 4.6 stars. Students consistently praise your organic chemistry explanations, especially SN1/SN2 mechanisms, electrophilic substitution, and reaction mechanisms. Your physical chemistry coverage on thermodynamics and equilibrium is also highly regarded.",
        recommendations: [
          "IUPAC Naming Practice - Students would benefit from more practice on IUPAC naming of complex organic compounds",
          "Inorganic Chemistry Examples - Add more examples for s-block, p-block, and d-block elements",
          "Organic Synthesis Practice - Include more past paper practice on multi-step organic synthesis reactions",
          "Electrochemistry - More examples on Nernst equation calculations and electrochemical cells",
        ],
        sentiment: "positive" as const,
        keyTopics: [
          "Excellent organic chemistry reaction mechanisms (SN1, SN2, electrophilic substitution)",
          "Clear physical chemistry explanations (thermodynamics, equilibrium, kinetics)",
          "Strong analytical chemistry teaching (titration calculations, gravimetric analysis)",
          "Good coverage of functional groups (alcohols, aldehydes, ketones, carboxylic acids)",
          "Request for more IUPAC naming practice",
          "Need for more inorganic chemistry examples",
          "Periodic table trends and d-block elements well explained",
          "Stereochemistry (E/Z isomerism) needs more practice",
        ],
      },
      {
        teacherId: citTeacher.teacherId,
        summary: "Your CIT teaching is performing very well with an average rating of 4.6 stars. Students appreciate your programming lessons, especially Java OOP concepts (classes, objects, inheritance, polymorphism). Your database normalization, ER diagrams, and networking explanations (OSI model, TCP/IP) are also highly praised.",
        recommendations: [
          "More SQL Practice - Students have requested additional practice on database queries, JOIN operations, and SQL clauses",
          "JavaScript Exercises - Include more hands-on JavaScript practice on DOM manipulation and event handling",
          "Practical Programming - Add more hands-on programming exercises on Java arrays and data structures for practical exam preparation",
          "Algorithm Design - More examples on algorithm design, flowcharts, and problem-solving approaches",
        ],
        sentiment: "positive" as const,
        keyTopics: [
          "Excellent Java OOP programming examples (classes, objects, inheritance, polymorphism)",
          "Clear database normalization concepts (1NF, 2NF, 3NF) and ER diagrams",
          "Strong networking teaching (OSI model, TCP/IP, IP addressing, subnetting)",
          "Good web development coverage (HTML/CSS, responsive design)",
          "Request for more SQL practice",
          "Need for more JavaScript exercises",
          "Data structures (arrays, linked lists, stacks, queues) well explained",
          "Sorting and searching algorithms (bubble sort, binary search) clear",
        ],
      },
    ];

    for (const insightData of insights) {
      const insight = insightRepo.create({
        id: `insight_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        teacherId: insightData.teacherId,
        summary: insightData.summary,
        recommendations: insightData.recommendations,
        sentiment: insightData.sentiment,
        keyTopics: insightData.keyTopics,
        generatedAt: new Date(),
      });

      await insightRepo.save(insight);
      console.log(`✅ Created AI insight for ${createdTeachers.find(t => t.teacherId === insightData.teacherId)?.subject} teacher`);
    }

    console.log("\n✅ Bootstrap data created successfully!");
    console.log("\n📚 Demo Organization Credentials (GCE A/L Science Stream):");
    console.log(`  Name: ${organization.name}`);
    console.log(`  Email: ${organization.email}`);
    console.log(`  Password: demo123`);
    console.log(`  Organization ID: ${organizationId}`);
    console.log(`  Address: ${organization.address}`);
    console.log("\n👨‍🏫 Demo Teacher Credentials:");
    for (const teacher of createdTeachers) {
      console.log(`\n  ${teacher.subject} - ${teacher.name}:`);
      console.log(`    Email: ${teacher.email}`);
      console.log(`    Password: demo123`);
      console.log(`    Teacher ID: ${teacher.teacherId}`);
      console.log(`    QR Code URL: ${generateQRCodeUrl(teacher.teacherId)}`);
    }
    console.log("\n📝 Created feedback from GCE A/L Science Stream students");
    console.log("   Topics covered: Physics, Mathematics, Chemistry, and CIT");
    console.log(`   Tags created: ${createdTags.length} organization-level tags`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error bootstrapping data:", error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

bootstrapData();
















