import { UserNotFoundError } from "../../../core/error/custom/user.error";

import { UserRepository } from "./repositories/userRepository";

import type { UpdateUserProfileData } from "./types/userTypes";

export class UserService {
  /** Verify if user exists
   * @throws UserNotFoundError if user does not exist
   */
  static async userExists(userId: string): Promise<boolean> {
    const exists = await UserRepository.exists(userId);

    if (!exists) {
      throw new UserNotFoundError(userId);
    }

    return exists;
  }

  /**
   * Get active/authenticated user (private profile view)
   * @throws UserNotFoundError if user does not exist
   */
  static async getActiveUser(userId: string) {
    const user = await UserRepository.findByIdExtended(userId);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

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

  /**
   * Get user by ID (public profile view)
   * @throws UserNotFoundError if user does not exist
   */
  static async findUserById(userId: string) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return {
      id: user.id,
      username: user.username,
      bio: user.bio,
      role: user.role,
      avatar: user.Avatar,
    };
  }

  /**
   * Update user profile
   * @throws UserNotFoundError if user does not exist
   */
  static async updateUserProfile(userId: string, data: UpdateUserProfileData) {
    const exists = await UserRepository.exists(userId);

    if (!exists) {
      throw new UserNotFoundError(userId);
    }

    const updatedUser = await UserRepository.updateProfile(userId, data);

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      bio: updatedUser.bio,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      avatar: updatedUser.Avatar,
    };
  }
}
