import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "../data-source";
import { Organization, OrganizationAuth, Teacher, TeacherAuth, StudentFeedback, AIInsight, Tag, FeedbackTag } from "../models";
import { hashPassword } from "../utils/password";
import { generateTeacherId, generateOrganizationId, generateQRCodeUrl } from "../utils/qr-generator";

dotenv.config();

async function bootstrapDataTamil() {
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
      where: { email: "admin@tamilmedium.lk" },
    });

    if (existingOrg) {
      console.log("⚠️  Tamil medium demo organization already exists!");
      console.log(`   Organization ID: ${existingOrg.id}`);
      console.log("   Delete it first if you want to recreate it.");
      await AppDataSource.destroy();
      process.exit(0);
    }

    console.log("Creating Tamil medium organization and teachers for GCE A/L Science Stream...");

    // Create organization - Tamil medium tuition center
    const organizationId = generateOrganizationId();
    const organization = orgRepo.create({
      id: organizationId,
      name: "தமிழ் மீடியம் விஞ்ஞான பாடசாலை - GCE A/L அறிவியல் பிரிவு",
      email: "admin@tamilmedium.lk",
      phone: "+94771234577",
      address: "No. 123, Jaffna Road, Vavuniya, Sri Lanka",
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

    // Create organization-level tags in Tamil and English
    const orgTags = [
      { name: "தெளிவான விளக்கங்கள்", description: "Clear explanations", color: "#10b981" },
      { name: "ஈடுபாடு", description: "Engaging", color: "#3b82f6" },
      { name: "உதவி பயனுள்ள பொருட்கள்", description: "Helpful materials", color: "#8b5cf6" },
      { name: "மிக வேகமாக", description: "Too fast", color: "#ef4444" },
      { name: "தெளிவற்ற", description: "Unclear", color: "#f59e0b" },
      { name: "சிக்கல் தீர்ப்பு", description: "Problem solving", color: "#06b6d4" },
      { name: "கடந்த கால கேள்வி தாள்கள்", description: "Past papers", color: "#84cc16" },
      { name: "தேர்வு தயாரிப்பு", description: "Exam preparation", color: "#ec4899" },
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
        name: "திரு. ரோகன் பெரேரா",
        email: "rohan.perera@tamilmedium.lk",
        phone: "+94771234578",
        subject: "Physics",
        department: "அறிவியல் துறை",
      },
      {
        name: "திருமதி. நிமாலி பெர்னாண்டோ",
        email: "nimali.fernando@tamilmedium.lk",
        phone: "+94771234579",
        subject: "Mathematics",
        department: "அறிவியல் துறை",
      },
      {
        name: "டாக்டர். கமல் விக்கிரமசிங்க",
        email: "kamal.wickramasinghe@tamilmedium.lk",
        phone: "+94771234580",
        subject: "Chemistry",
        department: "அறிவியல் துறை",
      },
      {
        name: "திரு. தினேஷ் சில்வா",
        email: "dinesh.silva@tamilmedium.lk",
        phone: "+94771234581",
        subject: "CIT",
        department: "அறிவியல் துறை",
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
        address: "No. 123, Jaffna Road, Vavuniya, Sri Lanka",
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

    // Create realistic GCE A/L student feedback for each teacher (in Tamil, with some English)
    const physicsTeacher = createdTeachers.find(t => t.subject === "Physics");
    const mathsTeacher = createdTeachers.find(t => t.subject === "Mathematics");
    const chemistryTeacher = createdTeachers.find(t => t.subject === "Chemistry");
    const citTeacher = createdTeachers.find(t => t.subject === "CIT");

    if (!physicsTeacher || !mathsTeacher || !chemistryTeacher || !citTeacher) {
      throw new Error("Failed to find all required teachers");
    }

    let feedbackCounter = 1;
    const feedbackData = [
      // Physics feedback - Tamil
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "தரிந்து பெரேரா",
        studentContact: "+94771234605",
        studentId: "AL2024/TM/001",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Physics",
        suggestions: "சார் கினிமேடிக்ஸ் மற்றும் ப்ராஜெக்டைல் மோஷன் பற்றிய விளக்கம் மிகவும் நன்றாக இருந்தது! இயக்கத்தின் சமன்பாடுகளை படிப்படியாக வழங்கியது மிகவும் உதவியாக இருந்தது. வட்ட இயக்கம் மற்றும் மையவிலக்கு விசை தெளிவாக இருந்தது. தேர்வுக்கு முன் SHM (எளிய ஹார்மோனிக் மோஷன்) பற்றிய கூடுதல் பயிற்சி விரும்புகிறேன்.",
        tagIds: [createdTags[0].id, createdTags[5].id, createdTags[7].id], // Clear explanations, Problem solving, Exam preparation
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "சச்சினி ஜயசூரிய",
        studentContact: "+94771234606",
        studentId: "AL2024/TM/002",
        teachingRating: 4,
        communicationRating: 5,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Physics",
        suggestions: "வெப்ப இயற்பியல் பிரிவு நன்றாக இருந்தது! வெப்ப திறன் மற்றும் மறைந்த வெப்பம் பற்றிய பகுதி தெளிவாக இருந்தது. வாயுக்களின் இயக்கவியல் கோட்பாடு விளக்கம் உதவியாக இருந்தது. மின்சார புலங்கள் மற்றும் சாத்தியமான வேறுபாடு பற்றிய கூடுதல் வரைபடங்கள் தேவை.",
        tagIds: [createdTags[0].id, createdTags[2].id], // Clear explanations, Helpful materials
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "Dilshan Fernando",
        studentId: "AL2024/TM/003",
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
        studentName: "நேத்மி சில்வா",
        studentContact: "+94771234607",
        studentId: "AL2024/TM/004",
        teachingRating: 4,
        communicationRating: 4,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Physics",
        suggestions: "பாடத்திட்டம் நன்றாக மூடப்பட்டுள்ளது. அலைகள் பிரிவு நன்றாக இருந்தது. தேர்வு தயாரிப்புக்காக இயக்கவியல் மற்றும் மின்சாரம் பற்றிய கடந்த கால கேள்வி தாள்களின் கூடுதல் பயிற்சி தேவை.",
        tagIds: [createdTags[6].id, createdTags[7].id], // Past papers, Exam preparation
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: physicsTeacher.teacherId,
        studentName: "கவிந்து ரத்னாயக்க",
        studentId: "AL2024/TM/005",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Physics",
        suggestions: "மிகவும் நல்ல ஆசிரியர்! மின்காந்த தூண்டல் மற்றும் லென்ஸ் விதி பற்றிய விளக்கம் மிகவும் எளிதாக இருந்தது. AC சுற்றுகள் மற்றும் மின்மாற்றிகள் பிரிவு மிகவும் தெளிவாக இருந்தது. நன்றி!",
        tagIds: [createdTags[0].id, createdTags[1].id, createdTags[2].id], // Clear explanations, Engaging, Helpful materials
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      // Mathematics feedback - Tamil
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: mathsTeacher.teacherId,
        studentName: "ஹசினி விஜேசிங்க",
        studentContact: "+94771234608",
        studentId: "AL2024/TM/006",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Mathematics",
        suggestions: "மேடம் கால்குலஸ் மற்றும் ஒருங்கிணைப்பு நுட்பங்கள் பற்றிய கற்பித்தல் மிகவும் சிறந்தது! சங்கிலி விதி மற்றும் தயாரிப்பு விதி தெளிவாக இருந்தது. பகுதிகளால் ஒருங்கிணைப்பு மற்றும் மாற்று முறைகள் எளிதாக இருந்தது. ஒருங்கிணைப்பு வடிவியல் (நேர் கோடுகள், வட்டங்கள், கோனிக் பிரிவுகள்) பற்றிய கூடுதல் பயிற்சி விரும்புகிறேன்.",
        tagIds: [createdTags[0].id, createdTags[5].id], // Clear explanations, Problem solving
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: mathsTeacher.teacherId,
        studentName: "Pasindu Gunasekara",
        studentId: "AL2024/TM/007",
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
        studentName: "தருஷி த சில்வா",
        studentContact: "+94771234609",
        studentId: "AL2024/TM/008",
        teachingRating: 5,
        communicationRating: 4,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Mathematics",
        suggestions: "புள்ளிவிவரம் மற்றும் நிகழ்தகவு பிரிவு மிகவும் நன்றாக விளக்கப்பட்டது! இருபக்க விநியோகம் மற்றும் இயல்பான விநியோகம் தெளிவாக இருந்தது. வரிசைமாற்றங்கள் மற்றும் சேர்க்கைகள் தெளிவாக இருந்தது. நன்றி!",
        tagIds: [createdTags[0].id, createdTags[5].id, createdTags[2].id], // Clear explanations, Problem solving, Helpful materials
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: mathsTeacher.teacherId,
        studentName: "ரவிந்து பெரேரா",
        studentId: "AL2024/TM/009",
        teachingRating: 4,
        communicationRating: 4,
        materialRating: 4,
        overallRating: 4,
        courseName: "GCE A/L Mathematics",
        suggestions: "பொதுவாக நல்ல கற்பித்தல். திசையன்கள் பிரிவு நன்றாக இருந்தது. தேர்வு தயாரிப்புக்காக கால்குலஸ் மற்றும் ஒருங்கிணைப்பு வடிவியல் பற்றிய கூடுதல் கடந்த கால கேள்வி தாள்கள் தேவை.",
        tagIds: [createdTags[6].id, createdTags[7].id], // Past papers, Exam preparation
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      // Chemistry feedback - Tamil
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: chemistryTeacher.teacherId,
        studentName: "நிமாஷா பெர்னாண்டோ",
        studentContact: "+94771234610",
        studentId: "AL2024/TM/012",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Chemistry",
        suggestions: "டாக்டர் விக்கிரமசிங்கின் கரிம வேதியியல் எதிர்வினைகள் பற்றிய விளக்கம் மிகவும் சிறந்தது! SN1 மற்றும் SN2 வழிமுறைகள் ஆல்கைல் ஹாலைடுகளில் தெளிவாக இருந்தது. பென்சீனில் மின்னணு கவர்ச்சி மாற்றீடு நன்றாக விளக்கப்பட்டது. IUPAC பெயரிடல் பற்றிய கூடுதல் பயிற்சி விரும்புகிறேன்.",
        tagIds: [createdTags[0].id, createdTags[5].id, createdTags[2].id], // Clear explanations, Problem solving, Helpful materials
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: chemistryTeacher.teacherId,
        studentName: "Dilshan Perera",
        studentId: "AL2024/TM/013",
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
        studentName: "தரக சில்வா",
        studentContact: "+94771234611",
        studentId: "AL2024/TM/014",
        teachingRating: 5,
        communicationRating: 4,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L Chemistry",
        suggestions: "பகுப்பாய்வு வேதியியல் பிரிவு மிகவும் தெளிவாக இருந்தது. அமில-கார டைட்ரேஷன் கணக்கீடுகள் எளிதாக இருந்தது. ஈர்ப்பு பகுப்பாய்வு தெளிவாக இருந்தது. நன்றி!",
        tagIds: [createdTags[0].id, createdTags[5].id], // Clear explanations, Problem solving
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      // CIT feedback - Tamil
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: citTeacher.teacherId,
        studentName: "சச்சித் விக்கிரமசிங்க",
        studentContact: "+94771234612",
        studentId: "AL2024/TM/017",
        teachingRating: 5,
        communicationRating: 5,
        materialRating: 4,
        overallRating: 5,
        courseName: "GCE A/L CIT",
        suggestions: "சாரின் நிரலாக்க பாடங்கள் மிகவும் சிறந்தது! Java OOP கருத்துக்கள் (வகுப்புகள், பொருள்கள், பாரம்பரியம், பல்லுருவம்) மிகவும் உதவியாக இருந்தது. கட்டுப்பாட்டு கட்டமைப்புகள் மற்றும் சுழல்கள் தெளிவாக இருந்தது. தரவுத்தள வினவல்கள் மற்றும் SQL பற்றிய கூடுதல் பயிற்சி விரும்புகிறேன்.",
        tagIds: [createdTags[0].id, createdTags[1].id, createdTags[5].id], // Clear explanations, Engaging, Problem solving
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: `feedback_${Date.now()}_${feedbackCounter++}`,
        teacherId: citTeacher.teacherId,
        studentName: "Nethmi Perera",
        studentId: "AL2024/TM/018",
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
        studentName: "தில்ஷான் பெர்னாண்டோ",
        studentContact: "+94771234613",
        studentId: "AL2024/TM/019",
        teachingRating: 5,
        communicationRating: 4,
        materialRating: 5,
        overallRating: 5,
        courseName: "GCE A/L CIT",
        suggestions: "நெட்வொர்க்கிங் கருத்துக்கள் மிகவும் நன்றாக விளக்கப்பட்டது. OSI மாதிரி மற்றும் TCP/IP மாதிரி தெளிவாக இருந்தது. IP முகவரியிடல் மற்றும் சப்நெட்டிங் தெளிவாக இருந்தது. நன்றி!",
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
    console.log(`✅ Created ${feedbackData.length} student feedback entries with tags for GCE A/L Tamil medium students`);

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

    console.log("\n✅ Bootstrap data created successfully for Tamil medium!");
    console.log("\n📚 Demo Organization Credentials (Tamil Medium - GCE A/L Science Stream):");
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
    console.log("\n📝 Created feedback from GCE A/L Science Stream students (Tamil medium)");
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

bootstrapDataTamil();





