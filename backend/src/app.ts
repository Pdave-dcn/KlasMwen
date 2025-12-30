import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import passport from "passport";

import { corsOptions } from "./core/config/cors.js";
import initializePassport from "./core/config/passport.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { httpLogger } from "./middleware/httpLogger.middleware.js";
import router from "./routes/index.js";
import setupSwagger from "./swagger/index.js";

const app = express();

app.use(cookieParser());

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(passport.initialize());
initializePassport(passport);

setupSwagger(app);

app.use(httpLogger);

app.use("/", router);

app.use(errorMiddleware);

export default app;
