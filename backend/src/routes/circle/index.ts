import { Router } from "express";

import { generalApiLimiter } from "../../middleware/coreRateLimits.middleware.js";
import attachLogContext from "../../middleware/logContext.middleware.js";
import { requireAuth } from "../../middleware/requireAuth.middleware.js";

import circleRoutes from "./circles.route.js";
import discoveryRoutes from "./discovery.route.js";
import memberRoutes from "./members.route.js";
import messageRoutes from "./messages.route.js";
import statsRoutes from "./stats.route.js";

const router = Router();

router.use(attachLogContext("StudyCircleControllers"));

router.use(generalApiLimiter);
router.use(requireAuth);

router.use("/", circleRoutes);
router.use("/", memberRoutes);
router.use("/", messageRoutes);
router.use("/discover", discoveryRoutes);
router.use("/stats", statsRoutes);

export default router;
