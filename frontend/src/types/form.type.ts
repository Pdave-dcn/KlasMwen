import type { RegisterSchema, SignInSchema } from "@/zodSchemas/auth.zod";

import type { z } from "zod";

type FormType = "signup" | "signin";

type SignInData = z.infer<typeof SignInSchema>;
type RegisterData = z.infer<typeof RegisterSchema>;
type FormData = SignInData | RegisterData;

export type { FormType, FormData };
