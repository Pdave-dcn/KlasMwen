import { Router } from "express";

import { getQuickStats } from "../../controllers/circle/index.js";

const router = Router();

router.get("/quick", getQuickStats);

export default router;
