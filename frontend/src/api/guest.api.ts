import handleZodValidationError from "@/utils/zodErrorHandler.util";
import { AuthResponseSchema } from "@/zodSchemas/auth.zod";

import api from "./api";

const signInGuest = async () => {
  try {
    const res = await api.post("/auth/guest");

    const validatedData = AuthResponseSchema.parse(res.data);

    return validatedData;
  } catch (error) {
    handleZodValidationError(error, "signIn");
    throw error;
  }
};

export default signInGuest;
