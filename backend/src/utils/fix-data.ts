import { PrismaClient, Stream } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding subjects...");

  const naturalSubjects = [
    "Mathematics (Natural)",
    "Biology",
    "Physics",
    "Chemistry",
    "English",
    "Aptitude",
  ];

  const socialSubjects = [
    "Mathematics (Social)",
    "Economics",
    "Geography",
    "History",
    "English",
    "Aptitude",
  ];

  for (const name of naturalSubjects) {
    await prisma.subject.upsert({
      where: { id: `nat-${name.toLowerCase().replace(/\s/g, "-")}` },
      update: {},
      create: {
        id: `nat-${name.toLowerCase().replace(/\s/g, "-")}`,
        name: name,
        stream: Stream.NATURAL_SCIENCE,
      },
    });
  }

  for (const name of socialSubjects) {
    await prisma.subject.upsert({
      where: { id: `soc-${name.toLowerCase().replace(/\s/g, "-")}` },
      update: {},
      create: {
        id: `soc-${name.toLowerCase().replace(/\s/g, "-")}`,
        name: name,
        stream: Stream.SOCIAL_SCIENCE,
      },
    });
  }

  console.log("Assigning existing students to NATURAL_SCIENCE...");
  await prisma.student.updateMany({
    data: { stream: Stream.NATURAL_SCIENCE },
  });

  console.log("Setting up default ExamConfig...");
  await prisma.examConfig.upsert({
    where: { id: "default-config" },
    update: {
      naturalPassword: "natural123",
      socialPassword: "social123",
    },
    create: {
      id: "default-config",
      naturalPassword: "natural123",
      socialPassword: "social123",
      createdBy: "system",
    },
  });

  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
