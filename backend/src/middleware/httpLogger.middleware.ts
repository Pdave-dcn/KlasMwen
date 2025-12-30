import pinoHttp from "pino-http";

import { logger } from "../core/config/logger";

export const httpLogger = pinoHttp({
  logger,
});
