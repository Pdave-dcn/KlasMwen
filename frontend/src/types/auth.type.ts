import type { AuthResponseSchema } from "@/zodSchemas/auth.zod";
import type { UserDataSchema } from "@/zodSchemas/user.zod";

import type { z } from "zod";

type SignInResponse = z.infer<typeof AuthResponseSchema>;
type SignUpResponse = z.infer<typeof AuthResponseSchema>;
type User = z.infer<typeof UserDataSchema>;

export type { SignInResponse, SignUpResponse, User };
