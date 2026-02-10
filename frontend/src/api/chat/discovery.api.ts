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

export const searchGroups = async (
  filters: GroupSearchFilters,
  cursor?: string,
  limit = 10,
) => {
  try {
    const res = await api.get("/groups/discover/search", {
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
    handleZodValidationError(error, "searchGroups");
    throw error;
  }
};

export const getChatGroupsForDiscovery = async (
  limit: number = 10,
  cursor?: string,
) => {
  try {
    const res = await api.get(`/groups/discover`, {
      params: { limit, cursor },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getChatGroupsForDiscovery");
    throw error;
  }
};

export const getRecommendedGroups = async (cursor?: string, limit = 5) => {
  try {
    const res = await api.get("/groups/discover/recommended", {
      params: { cursor, limit },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getRecommendedGroups");
    throw error;
  }
};

export const getTrendingGroups = async (
  cursor?: string,
  limit = 10,
  timeframe = 7,
) => {
  try {
    const res = await api.get("/groups/discover/trending", {
      params: { cursor, limit, timeframe },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getTrendingGroups");
    throw error;
  }
};

export const getNewGroups = async (cursor?: string, limit = 10) => {
  try {
    const res = await api.get("/groups/discover/new", {
      params: { cursor, limit },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getNewGroups");
    throw error;
  }
};

export const getSmallGroups = async (
  cursor?: string,
  limit = 10,
  maxMembers = 10,
) => {
  try {
    const res = await api.get("/groups/discover/small", {
      params: { cursor, limit, maxMembers },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getSmallGroups");
    throw error;
  }
};

export const getSearchSuggestions = async (query: string, limit = 10) => {
  try {
    const res = await api.get("/groups/discover/suggestions", {
      params: { query, limit },
    });
    const validatedData = ChatGroupsSearchResponseSchema.parse(res.data);
    return validatedData.data;
  } catch (error) {
    handleZodValidationError(error, "getSearchSuggestions");
    throw error;
  }
};

export const getSimilarGroups = async (
  chatGroupId: string,
  cursor?: string,
  limit = 10,
) => {
  try {
    const res = await api.get(`/groups/discover/similar/${chatGroupId}`, {
      params: { cursor, limit },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getSimilarGroups");
    throw error;
  }
};

export const getGroupsByCreator = async (
  creatorId: string,
  cursor?: string,
  limit = 10,
) => {
  try {
    const res = await api.get(`/groups/discover/creator/${creatorId}`, {
      params: { cursor, limit },
    });
    const validatedData = ChatGroupsForDiscoveryResponseSchema.parse(res.data);
    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "getGroupsByCreator");
    throw error;
  }
};
