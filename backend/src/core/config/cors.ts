import env from "./env.js";

import type cors from "cors";

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin === env.ALLOWED_ORIGIN) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
