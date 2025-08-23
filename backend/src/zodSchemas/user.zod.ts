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

    avatarId: z
      .number("Avatar ID must be a number.")
      .int("Avatar ID must be an integer.")
      .positive("Avatar ID must be positive.")
      .optional(),
  })
  .partial()
  .refine(
    (data) => {
      // Check if at least one field has a non-empty, non-undefined value
      return (
        (data.bio !== undefined && data.bio !== "") ||
        data.avatarId !== undefined
      );
    },
    {
      message:
        "At least one field (bio or avatarId) must be provided with valid data for update.",
    }
  );

export { UserIdParamSchema, UpdateUserProfileSchema };
