import app from "./app.js";
import { verifyCloudinaryConnection } from "./core/config/cloudinary.js";
import prisma from "./core/config/db.js";

const PORT = process.env.PORT ?? 3000;

const startServer = async () => {
  console.log("Verifying external connections...");

  await verifyCloudinaryConnection();

  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server is running on PORT ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  throw new Error("Database connection failed");
});
