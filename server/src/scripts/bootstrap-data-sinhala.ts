import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "../data-source";
import { Organization, OrganizationAuth, Teacher, TeacherAuth, StudentFeedback, AIInsight, Tag, FeedbackTag } from "../models";
import { hashPassword } from "../utils/password";
import { generateTeacherId, generateOrganizationId, generateQRCodeUrl } from "../utils/qr-generator";

dotenv.config();

async function bootstrapDataSinhala() {
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
      where: { email: "admin@sinhalamedium.lk" },
    });

    if (existingOrg) {
      console.log("⚠️  Sinhala medium demo organization already exists!");
      console.log(`   Organization ID: ${existingOrg.id}`);
      console.log("   Delete it first if you want to recreate it.");
      await AppDataSource.destroy();
      process.exit(0);
    }

    console.log("Creating Sinhala medium organization and teachers for GCE A/L Science Stream...");

    // Create organization - Sinhala medium tuition center
    const organizationId = generateOrganizationId();
    const organization = orgRepo.create({
      id: organizationId,
      name: "සිංහල මාධ්‍ය විද්‍යාලය - GCE A/L විද්‍යා ශාඛාව",
      email: "admin@sinhalamedium.lk",
      phone: "+94771234572",
      address: "No. 78, Kandy Road, Peradeniya, Sri Lanka",
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

    // Create organization-level tags in Sinhala and English
    const orgTags = [
      { name: "හොඳ පැහැදිලි කිරීම්", description: "Clear explanations", color: "#10b981" },
      { name: "උනන්දුවක් දනවන", description: "Engaging", color: "#3b82f6" },
      { name: "උපකාරක ද්‍රව්‍ය", description: "Helpful materials", color: "#8b5cf6" },
      { name: "වේගවත්", description: "Too fast", color: "#ef4444" },
      { name: "පැහැදිලි නොවන", description: "Unclear", color: "#f59e0b" },
      { name: "ප්‍රශ්න විසඳීම", description: "Problem solving", color: "#06b6d4" },
      { name: "පසුගිය ප්‍රශ්න පත්‍ර", description: "Past papers", color: "#84cc16" },
      { name: "විභාග සූදානම", description: "Exam preparation", color: "#ec4899" },
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
        name: "මහාචාර්ය රෝහණ පෙරේරා",
        email: "rohan.perera@sinhalamedium.lk",
        phone: "+94771234573",
        subject: "Physics",
        department: "විද්‍යා දෙපාර්තමේන්තුව",
      },
      {
        name: "මහාචාර්යා නිමලි ප්‍රනාන්දු",
        email: "nimali.fernando@sinhalamedium.lk",
        phone: "+94771234574",
        subject: "Mathematics",
        department: "විද්‍යා දෙපාර්තමේන්තුව",
      },
      {
        name: "ආචාර්ය කමල් වික්‍රමසිංහ",
        email: "kamal.wickramasinghe@sinhalamedium.lk",
        phone: "+94771234575",
        subject: "Chemistry",
        department: "විද්‍යා දෙපාර්තමේන්තුව",
      },
      {
        name: "මහාචාර්ය දිනේෂ් සිල්වා",
        email: "dinesh.silva@sinhalamedium.lk",
        phone: "+94771234576",
        subject: "CIT",
        department: "විද්‍යා දෙපාර්තමේන්තුව",
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
        address: "No. 78, Kandy Road, Peradeniya, Sri Lanka",
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

    // Create realistic GCE A/L student feedback for each teacher (in Sinhala, with some English)
    const physicsTeacher = createdTeachers.find(t => t.subject === "Physics");
    const mathsTeacher = createdTeachers.find(t => t.subject === "Mathematics");
    const chemistryTeacher = createdTeachers.find(t => t.subject === "Chemistry");
    const citTeacher = createdTeachers.find(t => t.subject === "CIT");

    if (!physicsTeacher || !mathsTeacher || !chemistryTeacher || !citTeacher) {
      throw new Error("Failed to find all required teachers");
    }

    let feedbackCounter = 1;
    const feedbackData = [
      // Physics feedback - Sinhala
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "තරින්දු පෙරේරා",
        studentContact: "+94771234596",
        studentId: "AL2024/SM/001",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Physics",
        suggestions: "සර්ගේ චලිත විද්‍යාව සහ ප්‍රක්ෂේපණ චලනය පැහැදිලි කිරීම ඉතා හොඳයි! චලනයේ සමීකරණ පියවරෙන් පියවර ව්‍යුත්පන්න කිරීම ඉතා උපකාර විය. වෘත්තාකාර චලනය සහ කේන්ද්‍රාපසාරී බලය පැහැදිලි විය. විභාගයට පෙර SHM (සරල හාර්මොනික් චලනය) පිළිබඳ වැඩි පුහුණුවක් අවශ්‍යයි.",
        tagIds: [createdTags[0].id, createdTags[5].id, createdTags[7].id], // Clear explanations, Problem solving, Exam preparation
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "සචිනි ජයසූරිය",
        studentContact: "+94771234597",
        studentId: "AL2024/SM/002",
        teachingRating: 4,
        communicationRating: 5,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Physics",
        suggestions: "උෂ්ණත්ව විද්‍යාව පිළිබඳ උගැන්වීම හොඳයි! තාප ධාරිතාව සහ සුපිරි තාපය පිළිබඳ කොටස පැහැදිලි විය. වායුවල චාලක න්‍යාය පැහැදිලි කිරීම උපකාර විය. විද්‍යුත් ක්ෂේත්‍ර සහ විභව වෙනස පිළිබඳ වැඩි රූප සටහන් අවශ්‍යයි.",
        tagIds: [createdTags[0].id, createdTags[2].id], // Clear explanations, Helpful materials
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "Dilshan Fernando",
        studentId: "AL2024/SM/003",
        teachingRating: 5,
        communicationRating: 4,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Physics",
        suggestions: "Modern physics section on atomic structure and Bohr's model was explained very well. The photoelectric effect examples were helpful. The nuclear physics section on alpha, beta, and gamma decay is now clear.",
        tagIds: [createdTags[0].id, createdTags[5].id], // Clear explanations, Problem solving
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "නෙත්මි සිල්වා",
        studentContact: "+94771234598",
        studentId: "AL2024/SM/004",
        teachingRating: 4,
        communicationRating: 4,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Physics",
        suggestions: "පාඨමාලාව හොඳින් ආවරණය කර ඇත. තරංග පිළිබඳ කොටස හොඳයි. විභාග සූදානම සඳහා යාන්ත්‍ර විද්‍යාව සහ විද්‍යුත් විද්‍යාව පිළිබඳ වැඩි පසුගිය ප්‍රශ්න පත්‍ර පුහුණුවක් අවශ්‍යයි.",
        tagIds: [createdTags[6].id, createdTags[7].id], // Past papers, Exam preparation
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "කවින්දු රත්නායක",
        studentId: "AL2024/SM/005",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Physics",
        suggestions: "ඉතා හොඳ ගුරුවරයෙක්! විද්‍යුත් චුම්බක ප්‍රේරණය සහ ලෙන්ස්ගේ නියමය පැහැදිලි කිරීම ඉතා පහසුය. AC පරිපථ සහ ට්‍රාන්ස්ෆෝමර් පිළිබඳ කොටස ඉතා පැහැදිලි විය. ස්තුතියි!",
        tagIds: [createdTags[0].id, createdTags[1].id, createdTags[2].id], // Clear explanations, Engaging, Helpful materials
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      // Mathematics feedback - Sinhala
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: mathsTeacher.teacherId,
        studentName: "හසිනි විජේසිංහ",
        studentContact: "+94771234599",
        studentId: "AL2024/SM/006",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Mathematics",
        suggestions: "මැඩම්ගේ අවකලනය සහ අනුකලනය පිළිබඳ උගැන්වීම ඉතා හොඳයි! දාම නියමය සහ ගුණිත නියමය පැහැදිලි විය. කොටස් වලින් අනුකලනය සහ ආදේශන ක්‍රම පහසු විය. ඛණ්ඩාංක ජ්‍යාමිතිය (සරල රේඛා, වෘත්ත, ශංකු) පිළිබඳ වැඩි පුහුණුවක් අවශ්‍යයි.",
        tagIds: [createdTags[0].id, createdTags[5].id], // Clear explanations, Problem solving
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: mathsTeacher.teacherId,
        studentName: "Pasindu Gunasekara",
        studentId: "AL2024/SM/007",
        teachingRating: 4,
        communicationRating: 5,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Mathematics",
        suggestions: "Very clear explanations of quadratic equations and polynomial functions. The trigonometry section on compound angles and double angle formulas was good. The complex numbers section (De Moivre's theorem) could use more examples.",
        tagIds: [createdTags[0].id, createdTags[2].id], // Clear explanations, Helpful materials
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: mathsTeacher.teacherId,
        studentName: "තරුෂි ද සිල්වා",
        studentContact: "+94771234600",
        studentId: "AL2024/SM/008",
        teachingRating: 5,
        communicationRating: 4,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Mathematics",
        suggestions: "සංඛ්‍යානය සහ සම්භාවිතාව පිළිබඳ කොටස ඉතා හොඳින් පැහැදිලි කරන ලදී! ද්විපද ව්‍යාප්තිය සහ සාමාන්‍ය ව්‍යාප්තිය පැහැදිලි විය. ප්‍රගණන සහ සංයෝජන පැහැදිලි විය. ස්තුතියි!",
        tagIds: [createdTags[0].id, createdTags[5].id, createdTags[2].id], // Clear explanations, Problem solving, Helpful materials
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: mathsTeacher.teacherId,
        studentName: "රවින්දු පෙරේරා",
        studentId: "AL2024/SM/009",
        teachingRating: 4,
        communicationRating: 4,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Mathematics",
        suggestions: "සාමාන්‍යයෙන් හොඳ උගැන්වීමකි. දෛශික පිළිබඳ කොටස හොඳයි. විභාග සූදානම සඳහා අවකලනය සහ ඛණ්ඩාංක ජ්‍යාමිතිය පිළිබඳ වැඩි පසුගිය ප්‍රශ්න පත්‍ර අවශ්‍යයි.",
        tagIds: [createdTags[6].id, createdTags[7].id], // Past papers, Exam preparation
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      // Chemistry feedback - Sinhala
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: chemistryTeacher.teacherId,
        studentName: "නිමෂා ප්‍රනාන්දු",
        studentContact: "+94771234601",
        studentId: "AL2024/SM/012",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Chemistry",
        suggestions: "ආචාර්ය වික්‍රමසිංහගේ කාබනික රසායනික ප්‍රතික්‍රියා පැහැදිලි කිරීම ඉතා හොඳයි! SN1 සහ SN2 යාන්ත්‍රණ ඇල්කයිල් හැලයිඩ වලින් පැහැදිලි විය. බෙන්සීන් හි විද්‍යුත් ආකර්ෂක ආදේශනය හොඳින් පැහැදිලි කරන ලදී. IUPAC නම් කිරීම පිළිබඳ වැඩි පුහුණුවක් අවශ්‍යයි.",
        tagIds: [createdTags[0].id, createdTags[5].id, createdTags[2].id], // Clear explanations, Problem solving, Helpful materials
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: chemistryTeacher.teacherId,
        studentName: "Dilshan Perera",
        studentId: "AL2024/SM/013",
        teachingRating: 4,
        communicationRating: 5,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Chemistry",
        suggestions: "Physical chemistry topics like thermodynamics (enthalpy, entropy, Gibbs free energy) and chemical equilibrium (Le Chatelier's principle) are well explained. The rate of reaction and kinetics section was good. The inorganic chemistry section on s-block and p-block elements could use more examples.",
        tagIds: [createdTags[0].id, createdTags[2].id], // Clear explanations, Helpful materials
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: chemistryTeacher.teacherId,
        studentName: "තරක සිල්වා",
        studentContact: "+94771234602",
        studentId: "AL2024/SM/014",
        teachingRating: 5,
        communicationRating: 4,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Chemistry",
        suggestions: "විශ්ලේෂණ රසායන විද්‍යාව පිළිබඳ කොටස ඉතා පැහැදිලි විය. අම්ල-භෂ්ම ටයිට්‍රේෂන් ගණනය කිරීම් පහසු විය. ගුරුත්වාකර්ෂණ විශ්ලේෂණය පැහැදිලි විය. ස්තුතියි!",
        tagIds: [createdTags[0].id, createdTags[5].id], // Clear explanations, Problem solving
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      // CIT feedback - Sinhala
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: citTeacher.teacherId,
        studentName: "සචිත් වික්‍රමසිංහ",
        studentContact: "+94771234603",
        studentId: "AL2024/SM/017",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 4,
        overallRating: 5,
        courseName: "GCE A/L CIT",
        suggestions: "සර්ගේ ප්‍රෝග්‍රෑමිං පාඩම් ඉතා හොඳයි! Java OOP සංකල්ප (ක්ලාස්, වස්තු, උරුමකම, බහුරූපතාව) ඉතා උපකාර විය. පාලන ව්‍යුහ සහ ලූප පැහැදිලි විය. දත්ත සමුදා විමසීම් සහ SQL පිළිබඳ වැඩි පුහුණුවක් අවශ්‍යයි.",
        tagIds: [createdTags[0].id, createdTags[1].id, createdTags[5].id], // Clear explanations, Engaging, Problem solving
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: citTeacher.teacherId,
        studentName: "Nethmi Perera",
        studentId: "AL2024/SM/018",
        teachingRating: 4,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 4,
        courseName: "GCE A/L CIT",
        suggestions: "Web development section is clear. The HTML/CSS examples on forms, tables, and styling are good. The responsive design concepts were helpful. More practice on JavaScript (DOM manipulation, event handling) would be helpful.",
        tagIds: [createdTags[0].id, createdTags[2].id], // Clear explanations, Helpful materials
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: citTeacher.teacherId,
        studentName: "දිල්ෂාන් ප්‍රනාන්දු",
        studentContact: "+94771234604",
        studentId: "AL2024/SM/019",
        teachingRating: 5,
        communicationRating: 4,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L CIT",
        suggestions: "ජාලකරණ සංකල්ප ඉතා හොඳින් පැහැදිලි කරන ලදී. OSI ආකෘතිය සහ TCP/IP ආකෘතිය පැහැදිලි විය. IP ලිපිනකරණය සහ සබ්නෙටිං පැහැදිලි විය. ස්තුතියි!",
        tagIds: [createdTags[0].id, createdTags[5].id, createdTags[2].id], // Clear explanations, Problem solving, Helpful materials
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
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
    console.log(`✅ Created ${feedbackData.length} student feedback entries with tags for GCE A/L Sinhala medium students`);

    // Create AI insights for each teacher
    const insights = [
      {
        teacherId: physicsTeacher.teacherId,
        summary: "Your Physics teaching is performing exceptionally well with an average rating of 4.6 stars. Students consistently praise your clear explanations of kinematics, mechanics, circular motion, and modern physics topics. Your step-by-step approach to deriving equations and use of real-world examples is highly appreciated.",
        recommendations: [
          "More Practice on SHM - Students have requested additional practice on Simple Harmonic Motion before exams",
          "Enhanced Visual Aids - Consider adding more diagrams for electric fields, potential difference, and magnetism topics",
          "Past Paper Practice - Students would benefit from more past paper question practice on mechanics and electricity",
        ],
        sentiment: "positive" as const,
        keyTopics: [
          "Excellent kinematics and projectile motion explanations",
          "Clear circular motion and centripetal force teaching",
          "Strong modern physics coverage (atomic structure, photoelectric effect, nuclear physics)",
          "Good thermal physics and kinetic theory explanations",
          "Request for more SHM practice",
        ],
      },
      {
        teacherId: mathsTeacher.teacherId,
        summary: "Your Mathematics teaching is highly effective with an average rating of 4.5 stars. Students particularly appreciate your step-by-step approach to differentiation, integration techniques, and statistics. Your teaching method for calculus, coordinate geometry, and probability is consistently praised.",
        recommendations: [
          "More Coordinate Geometry Practice - Students have requested additional practice on straight lines, circles, and conic sections",
          "Complex Numbers Examples - Some students need more examples for De Moivre's theorem and complex number operations",
          "Past Paper Questions - Include more past paper questions on calculus and coordinate geometry with model answers",
        ],
        sentiment: "positive" as const,
        keyTopics: [
          "Outstanding differentiation and integration teaching (chain rule, product rule, integration by parts)",
          "Clear statistics and probability explanations (binomial distribution, normal distribution)",
          "Effective step-by-step teaching method for differential equations",
          "Request for more coordinate geometry practice",
        ],
      },
      {
        teacherId: chemistryTeacher.teacherId,
        summary: "Your Chemistry teaching is excellent with an average rating of 4.6 stars. Students consistently praise your organic chemistry explanations, especially SN1/SN2 mechanisms, electrophilic substitution, and reaction mechanisms. Your physical chemistry coverage on thermodynamics and equilibrium is also highly regarded.",
        recommendations: [
          "IUPAC Naming Practice - Students would benefit from more practice on IUPAC naming of complex organic compounds",
          "Inorganic Chemistry Examples - Add more examples for s-block, p-block, and d-block elements",
          "Organic Synthesis Practice - Include more past paper practice on multi-step organic synthesis reactions",
        ],
        sentiment: "positive" as const,
        keyTopics: [
          "Excellent organic chemistry reaction mechanisms (SN1, SN2, electrophilic substitution)",
          "Clear physical chemistry explanations (thermodynamics, equilibrium, kinetics)",
          "Strong analytical chemistry teaching (titration calculations, gravimetric analysis)",
          "Request for more IUPAC naming practice",
        ],
      },
      {
        teacherId: citTeacher.teacherId,
        summary: "Your CIT teaching is performing very well with an average rating of 4.6 stars. Students appreciate your programming lessons, especially Java OOP concepts (classes, objects, inheritance, polymorphism). Your database normalization, ER diagrams, and networking explanations (OSI model, TCP/IP) are also highly praised.",
        recommendations: [
          "More SQL Practice - Students have requested additional practice on database queries, JOIN operations, and SQL clauses",
          "JavaScript Exercises - Include more hands-on JavaScript practice on DOM manipulation and event handling",
          "Practical Programming - Add more hands-on programming exercises on Java arrays and data structures for practical exam preparation",
        ],
        sentiment: "positive" as const,
        keyTopics: [
          "Excellent Java OOP programming examples (classes, objects, inheritance, polymorphism)",
          "Clear database normalization concepts (1NF, 2NF, 3NF) and ER diagrams",
          "Strong networking teaching (OSI model, TCP/IP, IP addressing, subnetting)",
          "Request for more SQL practice",
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

    console.log("\n✅ Bootstrap data created successfully for Sinhala medium!");
    console.log("\n📚 Demo Organization Credentials (Sinhala Medium - GCE A/L Science Stream):");
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
    console.log("\n📝 Created feedback from GCE A/L Science Stream students (Sinhala medium)");
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

bootstrapDataSinhala();




