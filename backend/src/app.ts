import cors from "cors";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import passport from "passport";

import { corsOptions } from "./config/cors.js";
import initializePassport from "./config/passport.js";
import router from "./routes/index.route.js";

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cors(corsOptions));

app.use(passport.initialize());
initializePassport(passport);

app.use("/", router);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error("Error occurred:", {
    error: err,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  let statusCode = 500;
  let message = "Internal Server Error";

  if (err && typeof err === "object") {
    if ("status" in err && typeof err.status === "number") {
      statusCode = err.status;
    }

    if ("statusCode" in err && typeof err.statusCode === "number") {
      statusCode = err.statusCode;
    }

    if ("message" in err && typeof err.message === "string") {
      message = err.message;
    }
  }

  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    message = "Internal Server Error";
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err instanceof Error ? err.stack : undefined,
    }),
  });
});

export default app;
