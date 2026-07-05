import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const schools = [
    { name: "GS Kimironko", district: "Gasabo" },
    { name: "ES Remera Catholique", district: "Gasabo" },
    { name: "GS Kacyiru", district: "Gasabo" },
    { name: "Lycée de Kigali", district: "Nyarugenge" },
    { name: "GS Nyarugenge", district: "Nyarugenge" },
    { name: "ES Notre Dame de Citeaux", district: "Nyarugenge" },
  ];

  for (const school of schools) {
    const existing = await prisma.school.findFirst({
      where: { name: school.name },
    });

    if (!existing) {
      await prisma.school.create({ data: school });
    }
  }

  console.log("Seeded partner schools successfully");

  // Seed career stories — create seed professionals if needed
  const seedPros = [
    {
      email: "seed.alice@inzira.rw",
      firstName: "Alice",
      lastName: "Uwimana",
      jobTitle: "Civil Engineer",
      sector: "Engineering",
      bio: "Civil engineer with 8 years of experience in infrastructure projects across Rwanda.",
      stories: [
        {
          combinations: ["MPC", "MPG"],
          jobTitle: "Civil Engineer",
          sector: "Engineering",
          myPath:
            "I studied MPC at Lycée de Kigali, which gave me the mathematics and physics foundation I needed. After A-Levels I joined the University of Rwanda's engineering faculty. My first job was with a construction firm in Kigali where I worked on road infrastructure.",
          whatIDo:
            "Day to day I oversee construction sites, review structural designs, coordinate with contractors, and ensure projects meet safety standards. I also spend time in the office doing calculations and writing progress reports.",
          adviceForStudents:
            "If you love solving real-world problems with numbers, engineering is incredibly rewarding. Focus on understanding physics concepts deeply — not just formulas — and don't be afraid of the maths.",
        },
      ],
    },
    {
      email: "seed.joseph@inzira.rw",
      firstName: "Joseph",
      lastName: "Ndayishimiye",
      jobTitle: "Medical Doctor",
      sector: "Healthcare",
      bio: "Doctor specialising in internal medicine at CHUK, Kigali.",
      stories: [
        {
          combinations: ["PCB", "MCB"],
          jobTitle: "Medical Doctor",
          sector: "Healthcare",
          myPath:
            "PCB combination was the natural choice for me because I always wanted to be a doctor. The biology and chemistry gave me a strong base. I went to the University of Rwanda School of Medicine, completed my internship at CHUK, and have been practicing for 5 years.",
          whatIDo:
            "I see patients in the morning ward rounds, diagnose conditions, order tests, and adjust treatment plans. Afternoons I often have outpatient consultations. I also attend weekly case conferences with colleagues.",
          adviceForStudents:
            "PCB is the right path if medicine is your goal, but be prepared for a long journey. Stay consistent through A-Levels — the concepts you learn in biology and chemistry reappear in your first year of medical school.",
        },
      ],
    },
    {
      email: "seed.grace@inzira.rw",
      firstName: "Grace",
      lastName: "Mukamana",
      jobTitle: "Economist",
      sector: "Finance & Banking",
      bio: "Senior economist at the National Bank of Rwanda.",
      stories: [
        {
          combinations: ["MEG", "HEG"],
          jobTitle: "Economist",
          sector: "Finance & Banking",
          myPath:
            "I chose MEG because I liked both numbers and understanding how societies work. Economics at university felt like a natural extension. I interned at BNR during my final year and was offered a full-time role after graduating.",
          whatIDo:
            "I analyse economic data, write policy briefs, and present findings to senior leadership. I also participate in research on inflation trends and financial inclusion in Rwanda.",
          adviceForStudents:
            "Whether you pick MEG or HEG, the economics component will shape how you see the world. Read newspapers, follow Rwanda's budget debates, and start asking 'why' about prices and trade. That curiosity is what the job rewards.",
        },
      ],
    },
    {
      email: "seed.patrick@inzira.rw",
      firstName: "Patrick",
      lastName: "Habimana",
      jobTitle: "Software Engineer",
      sector: "Technology",
      bio: "Full-stack engineer at a fintech startup in Kigali.",
      stories: [
        {
          combinations: ["MPC", "MCB", "MPG"],
          jobTitle: "Software Engineer",
          sector: "Technology",
          myPath:
            "I did MPC and spent most of my free time learning to code online. Computer science wasn't widely available at my school but the logical thinking from maths and physics mapped perfectly to programming. After A-Levels I studied IT at INES Ruhengeri and taught myself web development in parallel.",
          whatIDo:
            "I build and maintain our mobile money platform. That means writing backend APIs, fixing bugs, reviewing pull requests from junior developers, and occasionally talking directly to clients about what features they need.",
          adviceForStudents:
            "Any combination with strong maths will set you up for tech. The combination matters less than building the habit of problem-solving. Start coding now — even basic Python on your phone — and you'll be ahead by the time you graduate.",
        },
      ],
    },
    {
      email: "seed.claudine@inzira.rw",
      firstName: "Claudine",
      lastName: "Iradukunda",
      jobTitle: "Journalist & Communications Officer",
      sector: "Media & Communications",
      bio: "Communications officer at a Kigali-based NGO, former journalist.",
      stories: [
        {
          combinations: ["LKF", "HGK", "HEK"],
          jobTitle: "Journalist & Communications Officer",
          sector: "Media & Communications",
          myPath:
            "Literature and Kinyarwanda were my strengths and I chose LKF because writing felt like breathing to me. I studied journalism at the University of Rwanda, worked at a local newspaper for three years, then moved into NGO communications.",
          whatIDo:
            "I write press releases, manage our social media, draft donor reports, and coordinate media interviews for our leadership team. Every day involves a lot of writing and translating ideas into clear language for different audiences.",
          adviceForStudents:
            "Humanities combinations are underestimated. Strong writing and critical thinking are skills every sector needs. If you choose LKF or HGK, invest in your reading — wide reading is the best training for any communication career.",
        },
      ],
    },
  ];

  const passwordHash = await bcrypt.hash("Seed@1234!", 12);

  for (const proData of seedPros) {
    const existing = await prisma.user.findUnique({ where: { email: proData.email } });
    if (existing) continue;

    const user = await prisma.user.create({
      data: {
        email: proData.email,
        passwordHash,
        role: "PROFESSIONAL",
      },
    });

    const professional = await prisma.professional.create({
      data: {
        userId: user.id,
        firstName: proData.firstName,
        lastName: proData.lastName,
        jobTitle: proData.jobTitle,
        employer: "Seed Employer",
        sector: proData.sector,
        bio: proData.bio,
        isVerified: true,
        verificationStatus: "APPROVED",
      },
    });

    for (const story of proData.stories) {
      await prisma.careerStory.create({
        data: {
          professionalId: professional.id,
          jobTitle: story.jobTitle,
          sector: story.sector,
          combinations: story.combinations,
          myPath: story.myPath,
          whatIDo: story.whatIDo,
          adviceForStudents: story.adviceForStudents,
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });
    }
  }

  console.log("Seeded career stories successfully");

  // Seed careers — sourced from client/src/constants/combinations.ts
  const careers = [
    { title: "Civil Engineer", sector: "Engineering", combinations: ["MPC"], description: "Designs and oversees construction of roads, bridges, and buildings." },
    { title: "Software Developer", sector: "ICT", combinations: ["MPC"], description: "Builds and maintains applications and systems software." },
    { title: "Data Scientist", sector: "ICT", combinations: ["MPC"], description: "Analyses data to uncover insights and guide decisions." },
    { title: "Architect", sector: "Architecture", combinations: ["MPC"], description: "Designs buildings and oversees their construction." },
    { title: "Industrial Chemist", sector: "Manufacturing", combinations: ["MPC", "MCE"], description: "Develops and tests chemical processes used in manufacturing." },
    { title: "Geospatial Analyst", sector: "ICT", combinations: ["MPG"], description: "Uses mapping and spatial data to solve location-based problems." },
    { title: "Urban Planner", sector: "Architecture", combinations: ["MPG"], description: "Plans land use and infrastructure for towns and cities." },
    { title: "Environmental Engineer", sector: "Engineering", combinations: ["MPG"], description: "Designs solutions to environmental problems like waste and water management." },
    { title: "Surveyor", sector: "Engineering", combinations: ["MPG"], description: "Measures and maps land, property, and construction sites." },
    { title: "Meteorologist", sector: "Other", combinations: ["MPG"], description: "Studies weather patterns and produces forecasts." },
    { title: "Chemical Engineer", sector: "Engineering", combinations: ["MCE", "PCE"], description: "Designs processes for producing chemicals, fuel, and materials." },
    { title: "Financial Analyst", sector: "Finance", combinations: ["MCE", "MEG", "MPE"], description: "Evaluates financial data to guide investment and business decisions." },
    { title: "Economist", sector: "Finance", combinations: ["MCE", "MEG", "PCE", "HEG", "HLE", "MPE"], description: "Studies how economies work to inform policy and business strategy." },
    { title: "Business Analyst", sector: "Business", combinations: ["MCE", "MEd"], description: "Identifies business needs and recommends process improvements." },
    { title: "Doctor", sector: "Healthcare", combinations: ["MCB", "PCB"], description: "Diagnoses and treats patients' illnesses and injuries." },
    { title: "Pharmacist", sector: "Healthcare", combinations: ["MCB", "PCB"], description: "Dispenses medication and advises on safe drug use." },
    { title: "Biochemist", sector: "Healthcare", combinations: ["MCB"], description: "Studies the chemical processes within living organisms." },
    { title: "Medical Researcher", sector: "Healthcare", combinations: ["MCB"], description: "Conducts research to advance medical knowledge and treatments." },
    { title: "Nutritionist", sector: "Healthcare", combinations: ["MCB"], description: "Advises on diet and nutrition for health and wellbeing." },
    { title: "Investment Banker", sector: "Finance", combinations: ["MEG"], description: "Raises capital and advises on major financial transactions." },
    { title: "Development Officer", sector: "Business", combinations: ["MEG"], description: "Coordinates development projects and programmes, often with NGOs or government." },
    { title: "Actuary", sector: "Finance", combinations: ["MEG", "MPE"], description: "Uses statistics to assess and manage financial risk." },
    { title: "Nurse", sector: "Healthcare", combinations: ["PCB"], description: "Provides patient care and support in clinical settings." },
    { title: "Lab Technician", sector: "Healthcare", combinations: ["PCB"], description: "Performs tests and experiments in medical or scientific laboratories." },
    { title: "Biomedical Engineer", sector: "Engineering", combinations: ["PCB"], description: "Designs medical equipment and devices used in healthcare." },
    { title: "Energy Analyst", sector: "Engineering", combinations: ["PCE"], description: "Assesses energy systems and usage to improve efficiency." },
    { title: "Industrial Scientist", sector: "Manufacturing", combinations: ["PCE"], description: "Applies scientific methods to improve industrial products and processes." },
    { title: "Business Manager", sector: "Business", combinations: ["PCE", "AGL"], description: "Oversees daily operations and strategy for a business or team." },
    { title: "Lawyer", sector: "Law", combinations: ["HEG", "HGL", "HLE"], description: "Advises clients and represents them in legal matters." },
    { title: "Public Servant", sector: "Other", combinations: ["HEG", "HGK"], description: "Works within government to deliver public services and policy." },
    { title: "Diplomat", sector: "Other", combinations: ["HEG"], description: "Represents national interests abroad and manages international relations." },
    { title: "Policy Analyst", sector: "Law", combinations: ["HEG"], description: "Researches and evaluates policy options for governments or organisations." },
    { title: "Journalist", sector: "Arts & Media", combinations: ["HGL", "HGK", "HLE"], description: "Researches, writes, and reports news and current affairs." },
    { title: "Teacher", sector: "Education", combinations: ["HGL", "HGK", "HLE", "AGL"], description: "Educates students and supports their academic development." },
    { title: "Social Worker", sector: "Other", combinations: ["HGL"], description: "Supports individuals and families facing social or personal challenges." },
    { title: "Communications Officer", sector: "Arts & Media", combinations: ["HGL", "AGL"], description: "Manages messaging and public communications for an organisation." },
    { title: "Cultural Officer", sector: "Arts & Media", combinations: ["HGK"], description: "Promotes and preserves cultural heritage and community programmes." },
    { title: "Community Developer", sector: "Other", combinations: ["HGK"], description: "Works with communities to plan and deliver local development initiatives." },
    { title: "Writer", sector: "Arts & Media", combinations: ["HLE"], description: "Creates written content across fiction, journalism, or media." },
    { title: "Environmentalist", sector: "Agriculture", combinations: ["BCG"], description: "Works to protect and manage natural resources and ecosystems." },
    { title: "Agronomist", sector: "Agriculture", combinations: ["BCG"], description: "Studies crop production and soil management to improve farming." },
    { title: "Veterinarian", sector: "Agriculture", combinations: ["BCG"], description: "Diagnoses and treats illness and injury in animals." },
    { title: "Public Health Officer", sector: "Healthcare", combinations: ["BCG"], description: "Monitors and improves health outcomes across communities." },
    { title: "Ecologist", sector: "Agriculture", combinations: ["BCG"], description: "Studies relationships between organisms and their environments." },
    { title: "IT Specialist", sector: "ICT", combinations: ["MEd"], description: "Maintains and supports computer systems and networks." },
    { title: "Digital Marketer", sector: "Business", combinations: ["MEd"], description: "Plans and runs online marketing campaigns for brands and products." },
    { title: "Entrepreneur", sector: "Business", combinations: ["MEd"], description: "Starts and grows businesses, taking on financial risk for potential reward." },
    { title: "Accountant", sector: "Finance", combinations: ["AGL"], description: "Manages financial records and ensures compliance with regulations." },
    { title: "Financial Auditor", sector: "Finance", combinations: ["AGL"], description: "Reviews financial records to verify accuracy and compliance." },
    { title: "Engineer", sector: "Engineering", combinations: ["MPE"], description: "Applies mathematics and physics to design and build technical solutions." },
    { title: "Investment Manager", sector: "Finance", combinations: ["MPE"], description: "Manages investment portfolios on behalf of clients or funds." },
  ];

  for (const career of careers) {
    const existing = await prisma.career.findFirst({ where: { title: career.title } });
    if (!existing) {
      await prisma.career.create({ data: career });
    }
  }

  console.log("Seeded careers successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
