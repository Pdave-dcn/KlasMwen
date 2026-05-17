import { AvatarServiceError } from "../../../../core/error/custom/avatar.error.js";
import { AvatarRepository } from "../repositories/avatarRepository.js";

import type { CreateAvatarInput } from "../types/avatarTypes.js";

class AvatarCommandService {
  async createAvatar(data: CreateAvatarInput) {
    return await AvatarRepository.create(data);
  }

  async createAvatars(data: CreateAvatarInput[]) {
    return await AvatarRepository.createMany(data);
  }

  async deleteAvatar(id: number): Promise<void> {
    const avatar = await AvatarRepository.findById(id);
    if (!avatar) throw new AvatarServiceError("Avatar not found", 404);
    await AvatarRepository.delete(id);
  }
}

const avatarCommandService = new AvatarCommandService();
export { avatarCommandService, AvatarCommandService };
