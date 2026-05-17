import { createLogger } from "../../../../core/config/logger.js";
import { UserNotFoundError } from "../../../../core/error/custom/user.error.js";
import { UserRepository } from "../repositories/userRepository.js";

import type {
  ServiceBaseUser,
  ServiceUser,
  UserForSocket,
} from "../types/userTypes.js";

const serviceLogger = createLogger({ service: "UserQueryService" });

interface IUserQueryService {
  getActiveUser(userId: string): Promise<ServiceUser>;
  findUserById(userId: string): Promise<ServiceBaseUser>;
  getUserForSocket(userId: string): Promise<UserForSocket>;
  userExists(userId: string): Promise<boolean>;
}

class UserQueryService implements IUserQueryService {
  async getActiveUser(userId: string): Promise<ServiceUser> {
    const user = await UserRepository.findByIdExtended(userId);
    if (!user) throw new UserNotFoundError(userId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar: user.Avatar,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async findUserById(userId: string): Promise<ServiceBaseUser> {
    const user = await UserRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);
    return {
      id: user.id,
      username: user.username,
      bio: user.bio,
      role: user.role,
      avatar: user.Avatar,
    };
  }

  async getUserForSocket(userId: string): Promise<UserForSocket> {
    const methodLogger = serviceLogger.child({
      method: "getUserForSocket",
      userId,
    });
    const user = await UserRepository.findByIdForSocket(userId);
    if (!user) {
      methodLogger.warn("User not found for socket authentication");
      throw new UserNotFoundError(userId);
    }
    return user;
  }

  async userExists(userId: string): Promise<boolean> {
    const exists = await UserRepository.exists(userId);
    if (!exists) throw new UserNotFoundError(userId);
    return exists;
  }
}

const userQueryService = new UserQueryService();
export { userQueryService, type IUserQueryService, UserQueryService };
