import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default departments
  const departments = ["Software Engineering", "Electrical Technology", "Civil Works Technology", "Accounting & Finance"];
  for (const name of departments) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", adminUser.username);

  // Create default exam config
  await prisma.examConfig.upsert({
    where: { id: "default-config" },
    update: {},
    create: {
      id: "default-config",
      password: "exam2024",
      durationMins: 60,
      isActive: true,
      createdBy: adminUser.id,
    },
  });
  console.log("✅ Default exam config created (password: exam2024)");

  // Seed sample questions
  const sampleQuestions = [
    {
      questionText: "What is the output of print(2 ** 3) in Python?",
      optionA: "6",
      optionB: "8",
      optionC: "9",
      optionD: "5",
      correctAnswer: "B",
    },
    {
      questionText: "Which data structure uses LIFO (Last In First Out)?",
      optionA: "Queue",
      optionB: "Linked List",
      optionC: "Stack",
      optionD: "Tree",
      correctAnswer: "C",
    },
    {
      questionText: "What does SQL stand for?",
      optionA: "Structured Question Language",
      optionB: "Simple Query Language",
      optionC: "Standard Query Language",
      optionD: "Structured Query Language",
      correctAnswer: "D",
    },
    {
      questionText: "Which of the following is NOT an OOP principle?",
      optionA: "Encapsulation",
      optionB: "Compilation",
      optionC: "Inheritance",
      optionD: "Polymorphism",
      correctAnswer: "B",
    },
    {
      questionText: "What is the time complexity of binary search?",
      optionA: "O(n)",
      optionB: "O(n²)",
      optionC: "O(log n)",
      optionD: "O(1)",
      correctAnswer: "C",
    },
  ];

  for (const q of sampleQuestions) {
    await prisma.question.create({
      data: { ...q, createdBy: adminUser.id },
    });
  }
  console.log("✅ Sample questions seeded");

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
