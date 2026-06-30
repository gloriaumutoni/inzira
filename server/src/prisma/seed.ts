import { PrismaClient } from "@prisma/client";
import { seedCareers } from "./seed-careers";

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

  await seedCareers();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
