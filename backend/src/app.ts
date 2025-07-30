import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors(corsOptions));

app.get("/", (_req, res) => {
  res.send("Hello world");
});

export default app;
