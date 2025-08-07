// config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const verifyCloudinaryConnection = async () => {
  try {
    await cloudinary.api.ping();
    console.log("✅ Cloudinary connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Cloudinary connection failed:", error);
    return false;
  }
};

export default cloudinary;
