import { bindMethods } from "../../../utils/bindMethods.util.js";

import { CircleCoreService } from "./core/CircleCoreService.js";
import { CircleMemberService } from "./core/CircleMemberService.js";
import { CircleMessageService } from "./core/CircleMessageService.js";
import { CircleSearchService } from "./core/CircleSearchService.js";
import { CircleValidationService } from "./core/CircleValidationService.js";
import CircleRepository from "./Repositories/CircleRepository.js";

/**
 * Main facade for circle operations.
 * Delegates to specialized services for different concerns.
 *
 * This facade provides a unified interface for:
 * - Circle group management (create, read, update, delete)
 * - Member management (add, remove, update roles)
 * - Message operations (send, retrieve, delete)
 * - Validation utilities
 * - Search and discovery of circles
 * - Statistics retrieval
 *
 * Each method is statically bound to the corresponding service implementation.
 */
export class CircleService {
  // Circle Operations
  static createCircle: typeof CircleCoreService.createCircle;
  static getCircleById: typeof CircleCoreService.getCircleById;
  static getCirclePreviewDetails: typeof CircleCoreService.getCirclePreviewDetails;
  static getUserCircles: typeof CircleCoreService.getUserCircles;
  static updateCircle: typeof CircleCoreService.updateCircle;
  static deleteCircle: typeof CircleCoreService.deleteCircle;
  static joinCircle: typeof CircleCoreService.joinCircle;
  static getRecentActivityCircles: typeof CircleCoreService.getRecentActivityCircles;
  static getCircleAvatars: typeof CircleCoreService.getCircleAvatars;

  // Member Operations
  static addMember: typeof CircleMemberService.addMember;
  static removeMember: typeof CircleMemberService.removeMember;
  static updateMemberRole: typeof CircleMemberService.updateMemberRole;
  static getCircleMembers: typeof CircleMemberService.getCircleMembers;
  static getMemberInfo: typeof CircleMemberService.getMemberInfo;
  static isMember: typeof CircleMemberService.isMember;
  static updateLastReadAt: typeof CircleMemberService.updateLastReadAt;
  static muteMember: typeof CircleMemberService.muteMember;
  static unmuteMember: typeof CircleMemberService.unmuteMember;

  // Message Operations
  static sendMessage: typeof CircleMessageService.sendMessage;
  static getMessages: typeof CircleMessageService.getMessages;
  static getMessageById: typeof CircleMessageService.getMessageById;
  static deleteMessage: typeof CircleMessageService.deleteMessage;
  static getLatestMessage: typeof CircleMessageService.getLatestMessage;

  // Validation Operations
  static verifyCircleExists: typeof CircleValidationService.verifyCircleExists;
  static verifyMembership: typeof CircleValidationService.verifyMembership;
  static verifyMessageExists: typeof CircleValidationService.verifyMessageExists;
  static checkMembership: typeof CircleValidationService.checkMembership;

  // Search and Discovery Operations
  static discoverCircles: typeof CircleSearchService.discoverCircles;
  static getRecommendedCircles: typeof CircleSearchService.getRecommendedCircles;
  static getTrendingCircles: typeof CircleSearchService.getTrendingCircles;
  static getNewCircles: typeof CircleSearchService.getNewCircles;
  static getSmallCircles: typeof CircleSearchService.getSmallCircles;
  static getSimilarCircles: typeof CircleSearchService.getSimilarCircles;
  static getCirclesByCreator: typeof CircleSearchService.getCirclesByCreator;
  static searchCircles: typeof CircleSearchService.searchCircles;
  static getSearchSuggestions: typeof CircleSearchService.getSearchSuggestions;

  // Statistics
  static async getQuickStats(userId: string) {
    return await CircleRepository.getQuickStats(userId);
  }

  static {
    Object.assign(
      this,
      // Bind circle operations
      bindMethods(CircleCoreService, [
        "createCircle",
        "joinCircle",
        "getCircleById",
        "getCirclePreviewDetails",
        "getUserCircles",
        "updateCircle",
        "deleteCircle",
        "getRecentActivityCircles",
        "getCircleAvatars",
      ]),
      // Bind member operations
      bindMethods(CircleMemberService, [
        "addMember",
        "removeMember",
        "updateMemberRole",
        "getCircleMembers",
        "getMemberInfo",
        "isMember",
        "updateLastReadAt",
        "muteMember",
        "unmuteMember",
      ]),
      // Bind message operations
      bindMethods(CircleMessageService, [
        "sendMessage",
        "getMessages",
        "getMessageById",
        "deleteMessage",
        "getLatestMessage",
      ]),
      // Bind validation operations
      bindMethods(CircleValidationService, [
        "verifyCircleExists",
        "verifyMembership",
        "verifyMessageExists",
        "checkMembership",
      ]),
      // Bind search and discovery operations
      bindMethods(CircleSearchService, [
        "discoverCircles",
        "getRecommendedCircles",
        "getTrendingCircles",
        "getNewCircles",
        "getSmallCircles",
        "getSimilarCircles",
        "getCirclesByCreator",
        "searchCircles",
        "getSearchSuggestions",
      ]),
    );
  }
}

export default CircleService;
