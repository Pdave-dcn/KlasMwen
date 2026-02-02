import { bindMethods } from "../../../utils/bindMethods.util.js";

import { ChatGroupSearchService } from "./core/ChatGroupSearchService.js";
import { ChatGroupService } from "./core/ChatGroupService.js";
import { ChatMemberService } from "./core/ChatMemberService.js";
import { ChatMessageService } from "./core/ChatMessageService.js";
import { ChatValidationService } from "./core/ChatValidationService.js";

/**
 * Main facade for chat operations.
 * Delegates to specialized services for different concerns.
 *
 * This facade provides a unified interface for:
 * - Chat group management (create, read, update, delete)
 * - Member management (add, remove, update roles)
 * - Message operations (send, retrieve, delete)
 * - Validation utilities
 * - Search and discovery of chat groups
 */
export class ChatService {
  // Group Operations
  static createGroup: typeof ChatGroupService.createGroup;
  static getGroupById: typeof ChatGroupService.getGroupById;
  static getUserGroups: typeof ChatGroupService.getUserGroups;
  static updateGroup: typeof ChatGroupService.updateGroup;
  static deleteGroup: typeof ChatGroupService.deleteGroup;

  // ==================== Member Operations ====================
  static addMember: typeof ChatMemberService.addMember;
  static removeMember: typeof ChatMemberService.removeMember;
  static updateMemberRole: typeof ChatMemberService.updateMemberRole;
  static getGroupMembers: typeof ChatMemberService.getGroupMembers;
  static getMemberInfo: typeof ChatMemberService.getMemberInfo;
  static isMember: typeof ChatMemberService.isMember;
  static updateLastReadAt: typeof ChatMemberService.updateLastReadAt;
  static joinGroup: typeof ChatGroupService.joinGroup;

  // Message Operations
  static sendMessage: typeof ChatMessageService.sendMessage;
  static getMessages: typeof ChatMessageService.getMessages;
  static getMessageById: typeof ChatMessageService.getMessageById;
  static deleteMessage: typeof ChatMessageService.deleteMessage;
  static getLatestMessage: typeof ChatMessageService.getLatestMessage;

  // Validation Operations
  static verifyGroupExists: typeof ChatValidationService.verifyGroupExists;
  static verifyMembership: typeof ChatValidationService.verifyMembership;
  static verifyMessageExists: typeof ChatValidationService.verifyMessageExists;
  static checkMembership: typeof ChatValidationService.checkMembership;

  // Search and Discovery Operations
  static discoverGroups: typeof ChatGroupSearchService.discoverGroups;

  static {
    Object.assign(
      this,
      // Bind group operations
      bindMethods(ChatGroupService, [
        "createGroup",
        "joinGroup",
        "getGroupById",
        "getUserGroups",
        "updateGroup",
        "deleteGroup",
      ]),
      // Bind member operations
      bindMethods(ChatMemberService, [
        "addMember",
        "removeMember",
        "updateMemberRole",
        "getGroupMembers",
        "getMemberInfo",
        "isMember",
        "updateLastReadAt",
      ]),
      // Bind message operations
      bindMethods(ChatMessageService, [
        "sendMessage",
        "getMessages",
        "getMessageById",
        "deleteMessage",
        "getLatestMessage",
      ]),
      // Bind validation operations
      bindMethods(ChatValidationService, [
        "verifyGroupExists",
        "verifyMembership",
        "verifyMessageExists",
        "checkMembership",
      ]),
      // Bind search and discovery operations
      bindMethods(ChatGroupSearchService, ["discoverGroups"]),
    );
  }
}

export default ChatService;
