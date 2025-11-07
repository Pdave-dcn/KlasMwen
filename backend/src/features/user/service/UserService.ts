import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { createLogger } from "../../../core/config/logger";
import { UserNotFoundError } from "../../../core/error/custom/user.error";
import { getRandomDefaultAvatar } from "../../avatar/avatarService";

import { UserRepository } from "./repositories/userRepository";

import type {
  AuthTokenPayload,
  RegisterUserData,
  UpdateUserProfileData,
} from "./types/userTypes";

const serviceLogger = createLogger({ service: "UserService" });

class UserService {
  // ==================== Authentication Methods ====================

  /**
   * Hash a password using bcrypt
   * @throws Error if hashing fails
   */
  static async hashPassword(password: string): Promise<string> {
    const methodLogger = serviceLogger.child({ method: "hashPassword" });

    methodLogger.debug("Starting password hash");
    const hashedPassword = await bcrypt.hash(password, 12);

    methodLogger.debug("Password hashed successfully");

    return hashedPassword;
  }

  /**
   * Generate JWT token for authenticated user
   * @throws Error if JWT_SECRET is not defined or token generation fails
   */
  static generateToken(userData: AuthTokenPayload): string {
    const methodLogger = serviceLogger.child({
      method: "generateToken",
      username: userData.username,
      role: userData.role,
    });

    methodLogger.debug("Generating JWT token");

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      methodLogger.error("JWT_SECRET not defined in environment variables");
      throw new Error("JWT_SECRET not defined in environment variables");
    }

    const token = jwt.sign(
      {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
      },
      jwtSecret,
      { expiresIn: "3d" }
    );

    methodLogger.info("JWT token generated successfully");
    return token;
  }

  /**
   * Register a new user
   * @throws Error if user creation fails
   */
  static async registerUser(userData: RegisterUserData) {
    const methodLogger = serviceLogger.child({
      method: "registerUser",
      username: userData.username,
    });

    methodLogger.info("Starting user registration");

    methodLogger.debug("Hashing password");
    const passwordHash = await this.hashPassword(userData.password);

    methodLogger.debug("Retrieving user default avatar");
    const avatar = await getRandomDefaultAvatar();

    methodLogger.debug("Creating user in database");
    const newUser = await UserRepository.createUser({
      username: userData.username,
      email: userData.email,
      password: passwordHash,
      avatarId: avatar.id,
    });

    methodLogger.info(
      {
        userId: newUser.id,
        role: newUser.role,
      },
      "User registered successfully"
    );

    methodLogger.debug("Generating authentication token");
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

  /**
   * Process successful login and generate token
   * @param user - Authenticated user object
   * @returns User data and authentication token
   */
  static processLogin(user: {
    id: string;
    username: string;
    email: string;
    role: string;
    Avatar: { id: number; url: string } | null;
  }) {
    const methodLogger = serviceLogger.child({
      method: "processLogin",
      userId: user.id,
      username: user.username,
    });

    methodLogger.info("Processing successful login");

    const token = this.generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    methodLogger.info("Login processed successfully");

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

  // ==================== User Profile Methods ====================

  /**
   * Verify if user exists
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

export default UserService;
