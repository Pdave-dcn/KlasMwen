import type { SignInResponse, SignUpResponse } from "@/types/auth.type";
import handleZodValidationError from "@/utils/zodErrorHandler.util";
import { AuthResponseSchema } from "@/zodSchemas/auth.zod";

import api from "./api";

interface RegisterValues {
  username: string;
  email: string;
  password: string;
}

interface SignInValues {
  email: string;
  password: string;
}

type FormValues = SignInValues | RegisterValues;

const signIn = async (data: FormValues): Promise<SignInResponse> => {
  try {
    const res = await api.post("/auth/login", data);

    const validatedData = AuthResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error);
    throw error;
  }
};

const signUp = async (data: FormValues): Promise<SignUpResponse> => {
  try {
    const res = await api.post("/auth/register", data);

    const validatedData = AuthResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error);
    throw error;
  }
};

const logOut = async () => {
  const res = await api.post("/auth/logout", {});
  return res.data;
};

export { signIn, signUp, logOut };
