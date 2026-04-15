import { PrismaClient, Stream } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Normalizing subjects...");

  const naturalSubjects = [
    "Mathematics (Natural)",
    "Biology",
    "Physics",
    "Chemistry",
  ];

  const socialSubjects = [
    "Mathematics (Social)",
    "Economics",
    "Geography",
    "History",
  ];

  const sharedSubjects = ["English", "Aptitude"];

  const slugify = (name: string): string =>
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

  type SubjectKind = "STREAM_SPECIFIC" | "SHARED";

  const mergeDuplicateSubjectIds = async (
    canonicalId: string,
    name: string,
    type: SubjectKind,
    stream: Stream | null
  ): Promise<void> => {
    const where: any = {
      name,
      type,
      id: { not: canonicalId },
    };
    where.stream = stream;

    const duplicates = await prisma.subject.findMany({
      where,
      select: { id: true },
    });

    for (const duplicate of duplicates) {
      await prisma.$transaction(async (tx) => {
        await tx.question.updateMany({
          where: { subjectId: duplicate.id },
          data: { subjectId: canonicalId },
        });

        await tx.examAttempt.updateMany({
          where: { subjectId: duplicate.id },
          data: { subjectId: canonicalId },
        });

        await tx.instructor.updateMany({
          where: { subjectId: duplicate.id },
          data: { subjectId: canonicalId },
        });

        await tx.subject.delete({ where: { id: duplicate.id } });
      });
    }
  };

  for (const name of naturalSubjects) {
    const canonicalId = `nat-${slugify(name)}`;
    await prisma.subject.upsert({
      where: { id: canonicalId },
      update: {
        name,
        type: "STREAM_SPECIFIC" as any,
        stream: Stream.NATURAL_SCIENCE,
      },
      create: {
        id: canonicalId,
        name,
        type: "STREAM_SPECIFIC" as any,
        stream: Stream.NATURAL_SCIENCE,
      },
    });

    await mergeDuplicateSubjectIds(canonicalId, name, "STREAM_SPECIFIC", Stream.NATURAL_SCIENCE);
  }

  for (const name of socialSubjects) {
    const canonicalId = `soc-${slugify(name)}`;
    await prisma.subject.upsert({
      where: { id: canonicalId },
      update: {
        name,
        type: "STREAM_SPECIFIC" as any,
        stream: Stream.SOCIAL_SCIENCE,
      },
      create: {
        id: canonicalId,
        name,
        type: "STREAM_SPECIFIC" as any,
        stream: Stream.SOCIAL_SCIENCE,
      },
    });

    await mergeDuplicateSubjectIds(canonicalId, name, "STREAM_SPECIFIC", Stream.SOCIAL_SCIENCE);
  }

  for (const name of sharedSubjects) {
    const canonicalId = `shared-${slugify(name)}`;

    await prisma.subject.upsert({
      where: { id: canonicalId },
      update: {
        name,
        type: "SHARED" as any,
        stream: null as any,
      },
      create: {
        id: canonicalId,
        name,
        type: "SHARED" as any,
        stream: null as any,
      },
    });

    await mergeDuplicateSubjectIds(canonicalId, name, "SHARED", null);
  }

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

  console.log("Done. Subjects are normalized for shared-subject mode.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
