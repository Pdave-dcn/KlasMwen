import { ZodError } from "zod";

const handleZodValidationError = (error: unknown) => {
  if (error instanceof ZodError) {
    console.error(
      "Invalid server response format:",
      error.issues.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }))
    );
    throw new Error("Server returned invalid response format");
  }
};

export default handleZodValidationError;
