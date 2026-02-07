import { Router } from "express";

import { getQuickStats } from "../../controllers/chat/index.js";

const router = Router();

router.get("/quick", getQuickStats);

export default router;
