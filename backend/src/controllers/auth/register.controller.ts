import { getCookieConfig } from "../../core/config/cookie.js";
import { createLogger } from "../../core/config/logger.js";
import { userCommandService } from "../../features/user/service/index.js";
import { withLogging } from "../../utils/logger.util.js";
import RegisterUserSchema from "../../zodSchemas/register.zod.js";

const controllerLogger = createLogger({ module: "AuthController" });

const registerUser = withLogging(
  controllerLogger, "registerUser",
  async ({ req, res, log }) => {
    log.info("User registration attempt started");

    const validatedData = RegisterUserSchema.parse(req.body);
    const { user, token } = await userCommandService.registerUser(validatedData);

    log.info(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      "User registration completed successfully",
    );

    res.cookie("token", token, getCookieConfig());
    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  },
);

export { registerUser };
