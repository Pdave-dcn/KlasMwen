import z from "zod";

const UserIdParamSchema = z.object({
  id: z.uuid("Invalid user ID format in URL parameter."),
});

const UpdateUserProfileSchema = z
  .object({
    bio: z
      .string()
      .trim()
      .max(160, "Bio must be less than 160 characters.")
      .optional()
      .or(z.literal("")),
    avatarUrl: z
      .string()
      .trim()
      .regex(
        /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i,
        "Avatar URL must be a valid image URL."
      )
      .optional()
      .or(z.literal("")),
  })
  .partial()
  .refine((data) => {
    // Check if at least one field has a non-empty, non-undefined value
    return (
      (data.bio !== undefined && data.bio !== "") ||
      (data.avatarUrl !== undefined && data.avatarUrl !== "")
    );
  }, "At least one field (bio or avatarUrl) must be provided with valid data for update.");

export { UserIdParamSchema, UpdateUserProfileSchema };
