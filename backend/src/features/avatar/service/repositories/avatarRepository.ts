import prisma from "../../../../core/config/db.js";
import { BaseSelectors, type CreateAvatarInput } from "../types/avatarTypes.js";

export class AvatarRepository {
  static async findMany(
    where: Record<string, unknown> = {},
    limit: number,
    cursor?: number,
  ) {
    return await prisma.avatar.findMany({
      where,
      select: BaseSelectors.avatar,
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  static async findById(id: number) {
    return await prisma.avatar.findUnique({
      where: { id },
      select: BaseSelectors.avatar,
    });
  }

  static async findDefaults() {
    return await prisma.avatar.findMany({
      where: { isDefault: true },
    });
  }

  static async findCircleAvatars() {
    return await prisma.circleAvatar.findMany();
  }

  static async create(data: CreateAvatarInput) {
    return await prisma.avatar.create({
      data: {
        url: data.url,
        isDefault: data.isDefault ?? false,
      },
      select: BaseSelectors.avatar,
    });
  }

  static async createMany(data: CreateAvatarInput[]) {
    return await prisma.avatar.createMany({
      data: data.map((a) => ({
        url: a.url,
        isDefault: a.isDefault ?? false,
      })),
    });
  }

  static async delete(id: number) {
    return await prisma.avatar.delete({
      where: { id },
    });
  }
}
