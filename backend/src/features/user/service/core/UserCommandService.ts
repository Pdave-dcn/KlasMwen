import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import env from "../../../../core/config/env.js";
import { UserNotFoundError } from "../../../../core/error/custom/user.error.js";
import { avatarQueryService } from "../../../avatar/service/index.js";
import { UserRepository } from "../repositories/userRepository.js";

import type {
  AuthTokenPayload,
  RegisterUserData,
  ServiceUser,
  UpdateUserProfileData,
} from "../types/userTypes.js";

interface IUserCommandService {
  registerUser(userData: RegisterUserData): Promise<{
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
      avatar: { id: number; url: string } | null;
    };
    token: string;
  }>;
  processLogin(user: {
    id: string;
    username: string;
    email: string;
    role: string;
    Avatar: { id: number; url: string } | null;
  }): {
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
      avatar: { id: number; url: string } | null;
    };
    token: string;
  };
  updateUserProfile(
    userId: string,
    data: UpdateUserProfileData,
  ): Promise<ServiceUser>;
}

class UserCommandService implements IUserCommandService {
  private async hashPassword(password: string): Promise<string> {
    const hashedPassword = await bcrypt.hash(password, 12);
    return hashedPassword;
  }

  private generateToken(userData: AuthTokenPayload): string {
    const token = jwt.sign(
      {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
      },
      env.JWT_SECRET,
      { expiresIn: "3d" },
    );
    return token;
  }

  async registerUser(userData: RegisterUserData) {
    const passwordHash = await this.hashPassword(userData.password);
    const avatar = await avatarQueryService.getRandomDefaultAvatar();
    const newUser = await UserRepository.createUser({
      username: userData.username,
      email: userData.email,
      password: passwordHash,
      avatarId: avatar.id,
    });

    const token = this.generateToken({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });
    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.Avatar,
      },
      token,
    };
  }

  processLogin(user: {
    id: string;
    username: string;
    email: string;
    role: string;
    Avatar: { id: number; url: string } | null;
  }) {
    const token = this.generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.Avatar,
      },
      token,
    };
  }

  async updateUserProfile(
    userId: string,
    data: UpdateUserProfileData,
  ): Promise<ServiceUser> {
    const exists = await UserRepository.exists(userId);
    if (!exists) throw new UserNotFoundError(userId);
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

const userCommandService = new UserCommandService();
export { userCommandService, type IUserCommandService, UserCommandService };
