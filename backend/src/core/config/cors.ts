import dotenv from "dotenv";

import type cors from "cors";

dotenv.config();

const allowedOrigin = process.env.ALLOWED_ORIGIN;

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin === allowedOrigin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
