import pinoHttp from "pino-http";

import { logger } from "../core/config/logger.js";

export const httpLogger = pinoHttp({
  logger,
});
