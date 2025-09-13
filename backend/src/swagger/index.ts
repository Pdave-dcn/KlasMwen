import path from "path";
import { fileURLToPath } from "url";

import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { commonParameters } from "./parameters/index.js";
import { allSchemas } from "./schemas/index.js";

import type { Express } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "KlasMwen API",
      version: "1.0.0",
      description: "API documentation with Swagger",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "Authentication is handled via httpOnly cookie",
        },
      },
      parameters: commonParameters,
      schemas: allSchemas,
    },
    tags: [
      { name: "Auth", description: "Operations related to auth" },
      { name: "Avatars", description: "Operations related to avatars" },
      { name: "Bookmarks", description: "Operations related to bookmarking" },
      { name: "Comments", description: "Operations related to comments" },
      { name: "Posts", description: "Operations related to posts" },
      { name: "Reactions", description: "Operations related to reactions" },
      { name: "Search", description: "Operations related to searching" },
      { name: "Tags", description: "Operations related to tags" },
      { name: "Users", description: "Operations related to users" },
    ],
  },
  apis: [
    path.join(__dirname, "../routes/**/*.ts"),
    path.join(__dirname, "../routes/**/*.js"),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default function setupSwagger(app: Express) {
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        supportedSubmitMethods: [],
      },
    })
  );

  app.get("/swagger.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}
