import handleZodValidationError from "@/utils/zodErrorHandler.util";
import { QuickStatsResponseSchema } from "@/zodSchemas/chat.zod";

import api from "../api";

export const getQuickStats = async () => {
  try {
    const res = await api.get("/groups/stats/quick");
    const validatedData = QuickStatsResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getQuickStats");
    throw error;
  }
};
