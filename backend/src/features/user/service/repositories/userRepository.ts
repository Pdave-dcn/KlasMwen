import prisma from "../../../../core/config/db";
import { BaseSelectors, type UpdateUserProfileData } from "../types/userTypes";

export class UserRepository {
  /**
   * Find a user by ID with basic fields (public profile)
   */
  static findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: BaseSelectors.user,
    });
  }

  /**
   * Find a user by ID with extended fields (private profile)
   */
  static findByIdExtended(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: BaseSelectors.userExtended,
    });
  }

  /**
   * Check if a user exists by ID
   */
  static async exists(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * Update user profile (bio and avatar)
   */
  static updateProfile(userId: string, data: UpdateUserProfileData) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        bio: data.bio,
        avatarId: data.avatarId,
      },
      select: BaseSelectors.userExtended,
    });
  }
}
