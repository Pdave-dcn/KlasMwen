import handleZodValidationError from "@/utils/zodErrorHandler.util";
import {
  ChatGroupsForDiscoveryResponseSchema,
  ChatGroupsSearchResponseSchema,
} from "@/zodSchemas/chat.zod";

import api from "../api";

export interface GroupSearchFilters {
  query?: string;
  isPrivate?: boolean;
  excludeJoined?: boolean;
  creatorId?: string;
  minMembers?: number;
  maxMembers?: number;
  tagIds?: number[];
}

export const searchCircles = async (
  filters: GroupSearchFilters,
  cursor?: string,
  limit = 10,
) => {
  try {
    const res = await api.get("/circles/discover/search", {
      params: {
        ...filters,
        tagIds: filters.tagIds?.join(","),
        cursor,
        limit,
      },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "searchCircles");
    throw error;
  }
};

export const getCirclesForDiscovery = async (
  limit: number = 10,
  cursor?: string,
) => {
  try {
    const res = await api.get(`/circles/discover`, {
      params: { limit, cursor },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getCirclesForDiscovery");
    throw error;
  }
};

export const getRecommendedCircles = async (cursor?: string, limit = 5) => {
  try {
    const res = await api.get("/circles/discover/recommended", {
      params: { cursor, limit },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getRecommendedCircles");
    throw error;
  }
};

export const getTrendingCircles = async (
  cursor?: string,
  limit = 10,
  timeframe = 7,
) => {
  try {
    const res = await api.get("/circles/discover/trending", {
      params: { cursor, limit, timeframe },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getTrendingCircles");
    throw error;
  }
};

export const getNewCircles = async (cursor?: string, limit = 10) => {
  try {
    const res = await api.get("/circles/discover/new", {
      params: { cursor, limit },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getNewCircles");
    throw error;
  }
};

export const getSmallCircles = async (
  cursor?: string,
  limit = 10,
  maxMembers = 10,
) => {
  try {
    const res = await api.get("/circles/discover/small", {
      params: { cursor, limit, maxMembers },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getSmallCircles");
    throw error;
  }
};

export const getSearchSuggestions = async (query: string, limit = 10) => {
  try {
    const res = await api.get("/circles/discover/suggestions", {
      params: { query, limit },
    });
    const validatedData = ChatGroupsSearchResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getSearchSuggestions");
    throw error;
  }
};

export const getSimilarCircles = async (
  circleId: string,
  cursor?: string,
  limit = 10,
) => {
  try {
    const res = await api.get(`/circles/discover/similar/${circleId}`, {
      params: { cursor, limit },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getSimilarCircles");
    throw error;
  }
};

export const getCirclesByCreator = async (
  creatorId: string,
  cursor?: string,
  limit = 10,
) => {
  try {
    const res = await api.get(`/circles/discover/creator/${creatorId}`, {
      params: { cursor, limit },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getCirclesByCreator");
    throw error;
  }
};
