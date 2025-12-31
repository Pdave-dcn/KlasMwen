import { z } from "zod";

const RoleSchema = z.enum(["STUDENT", "MODERATOR", "ADMIN", "GUEST"]);

const AvatarSchema = z.object({
  id: z.number().int(),
  url: z.string(),
});

const UserDataSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.email().optional(),
  bio: z.string().nullable().optional(),
  role: RoleSchema,
  avatar: AvatarSchema.nullable().optional(),
  createdAt: z.string().nullable().optional(),
});

const UpdateProfileSchema = z.object({
  bio: z.string().trim().max(160, "Bio must be less than 160 characters."),
  avatarId: z.number().int(),
  twitter: z.string(),
  instagram: z.string(),
});

const UpdatedUserServerResponseSchema = z.object({
  message: z.string(),
  user: UserDataSchema,
});
const PublicUserProfileDataSchema = UserDataSchema.omit({ email: true });

const GetActiveUserResponseSchema = z.object({
  data: UserDataSchema,
});

const GetUserProfileResponseSchema = z.object({
  data: PublicUserProfileDataSchema,
});

export {
  RoleSchema,
  UserDataSchema,
  GetActiveUserResponseSchema,
  PublicUserProfileDataSchema,
  GetUserProfileResponseSchema,
  AvatarSchema,
  UpdateProfileSchema,
  UpdatedUserServerResponseSchema,
};
