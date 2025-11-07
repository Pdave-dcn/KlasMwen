import "dotenv/config";

import dotenv from "dotenv";
import { z } from "zod";

import envSchema from "../../zodSchemas/env.zod.js";

dotenv.config({ override: true });

console.log("Validating environment variables");
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const error = parsed.error;
  console.error("Invalid environment variables:", z.prettifyError(error));
  throw new Error("Invalid environment variables");
}

const env = parsed.data;
console.log("Environment variables successfully validated");

export default env;
