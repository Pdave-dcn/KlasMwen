import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import env from "../core/config/env.js";

let prisma: PrismaClient | null = null;

export function getPrisma() {
  if (prisma) return prisma;

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  return prisma;
}
