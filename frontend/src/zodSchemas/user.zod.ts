import { z } from "zod";

const AvatarSchema = z.object({
  id: z.number().int(),
  url: z.string(),
});

const UserDataSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.email(),
  bio: z.string().nullable().optional(),
  role: z.enum(["STUDENT", "ADMIN"]),
  avatar: AvatarSchema.nullable().optional(),
});

const ActiveUserProfileDataSchema = UserDataSchema.extend({
  createdAt: z.string(),
});

const PublicUserProfileDataSchema = UserDataSchema.omit({ email: true });

const GetActiveUserResponseSchema = z.object({
  data: ActiveUserProfileDataSchema,
});

const GetUserProfileResponseSchema = z.object({
  data: PublicUserProfileDataSchema,
});

export {
  UserDataSchema,
  GetActiveUserResponseSchema,
  GetUserProfileResponseSchema,
  AvatarSchema,
};
