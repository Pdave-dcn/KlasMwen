import type { PublicUserProfileDataSchema } from "@/zodSchemas/user.zod";

import type { z } from "zod";

type PublicUser = z.infer<typeof PublicUserProfileDataSchema>;

export type { PublicUser };
