import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

const allowedOrigin = process.env.ALLOWED_ORIGIN;

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigin?.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
