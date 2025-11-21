import bcrypt from "bcryptjs";

import prisma from "../core/config/db.js";
import env from "../core/config/env.js";

async function seedAdmin() {
  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: env.ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log(
        `Admin user with email ${env.ADMIN_EMAIL} already exists. Skipping.`
      );
      return;
    }

    const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

    const admin = await prisma.user.create({
      data: {
        username: env.ADMIN_USERNAME,
        email: env.ADMIN_EMAIL,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log(`Admin user created: ${admin.username} (${admin.email})`);
  } catch (error) {
    console.error("Error seeding admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

await seedAdmin();
