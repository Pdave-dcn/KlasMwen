import { Router } from "express";

import {
  discoverCircles,
  getRecommendedCircles,
  getTrendingCircles,
  getNewCircles,
  getSmallCircles,
  getSimilarCircles,
  getCirclesByCreator,
  searchCircles,
  getSearchSuggestions,
} from "../../controllers/circle/index.js";

const router = Router();

// Base path is already /circles/discover from parent router
router.get("/", discoverCircles);
router.get("/recommended", getRecommendedCircles);
router.get("/trending", getTrendingCircles);
router.get("/new", getNewCircles);
router.get("/small", getSmallCircles);
router.get("/search", searchCircles);
router.get("/suggestions", getSearchSuggestions);
router.get("/similar/:circleId", getSimilarCircles);
router.get("/creator/:creatorId", getCirclesByCreator);

export default router;
