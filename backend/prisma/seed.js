
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function seedSubscriptionPlans() {
  const plans = [
    {
      name: "Monthly Membership",
      description: "Monthly GoodRound membership (demo price).",
      billingInterval: "MONTHLY",
      price: "499",
      currency: "INR",
      isActive: true,
    },
    {
      name: "Yearly Membership",
      description: "Yearly GoodRound membership (demo price).",
      billingInterval: "YEARLY",
      price: "4999",
      currency: "INR",
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: {
        name_billingInterval: {
          name: plan.name,
          billingInterval: plan.billingInterval,
        },
      },
      update: {
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        isActive: plan.isActive,
      },
      create: plan,
    });
  }

  console.log("Subscription plans seeded successfully.");
}

async function seedAdmin() {
  const email = "admin@goodround.com";
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 8) {
    throw new Error(
      "Set ADMIN_PASSWORD in backend/.env (minimum 12 characters)."
    );
  }

  const passwordHash = await bcrypt.hash(password, 8);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
    create: {
      name: "GoodRound Admin",
      email,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log("Admin seeded successfully:", admin);
}

async function main() {
  await seedSubscriptionPlans();
  await seedAdmin();
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
