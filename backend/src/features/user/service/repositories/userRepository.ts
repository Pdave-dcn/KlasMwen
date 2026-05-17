import prisma from "../../../../core/config/db.js";
import {
  BaseSelectors,
  type BaseUser,
  type CreateUserData,
  type ExtendedUser,
  type UpdateUserProfileData,
  type UserForSocket,
} from "../types/userTypes.js";

export class UserRepository {
  static findById(userId: string): Promise<BaseUser | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: BaseSelectors.user,
    });
  }

  static findByIdExtended(userId: string): Promise<ExtendedUser | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: BaseSelectors.userExtended,
    });
  }

  static findByIdForSocket(userId: string): Promise<UserForSocket | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: BaseSelectors.userForSocket,
    });
  }

  static async exists(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return !!user;
  }

  static async createUser(userData: CreateUserData) {
    return await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        avatarId: userData.avatarId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        Avatar: {
          select: { id: true, url: true },
        },
      },
    });
  }

  static updateProfile(
    userId: string,
    data: UpdateUserProfileData,
  ): Promise<ExtendedUser> {
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
