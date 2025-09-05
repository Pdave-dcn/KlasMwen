import type {
  ActiveUserProfileDataSchema,
  PublicUserProfileDataSchema,
} from "@/zodSchemas/user.zod";

import type { z } from "zod";

type ActiveUser = z.infer<typeof ActiveUserProfileDataSchema>;
type PublicUser = z.infer<typeof PublicUserProfileDataSchema>;

export type { ActiveUser, PublicUser };
