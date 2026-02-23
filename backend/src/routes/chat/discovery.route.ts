import { Router } from "express";

import {
  discoverGroups,
  getRecommendedGroups,
  getTrendingGroups,
  getNewGroups,
  getSmallGroups,
  getSimilarGroups,
  getGroupsByCreator,
  searchGroups,
  getSearchSuggestions,
} from "../../controllers/chat/index.js";

const router = Router();

// Base path is already /groups/discover from parent router
router.get("/", discoverGroups);
router.get("/recommended", getRecommendedGroups);
router.get("/trending", getTrendingGroups);
router.get("/new", getNewGroups);
router.get("/small", getSmallGroups);
router.get("/search", searchGroups);
router.get("/suggestions", getSearchSuggestions);
router.get("/similar/:circleId", getSimilarGroups);
router.get("/creator/:creatorId", getGroupsByCreator);

export default router;
