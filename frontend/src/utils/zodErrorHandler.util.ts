import { ZodError, z } from "zod";

/**
 * Handles Zod validation errors by formatting them into readable error messages
 * and throwing a standardized Error with contextual information.
 *
 * @param {unknown} error - The error to handle, expected to be a ZodError instance
 * @param {string} [context] - Optional context string to provide additional information about where the validation failed
 * @example
 * ```typescript
 * try {
 *   const result = userSchema.parse(invalidData);
 * } catch (error) {
 *   handleZodValidationError(error, "user registration");
 * }
 * ```
 */
const handleZodValidationError = (error: unknown, context?: string) => {
  if (error instanceof ZodError) {
    const contextMessage = context ? ` in ${context}` : "";

    const prettyError = z.prettifyError(error);

    console.error(`Validation failed${contextMessage}:\n${prettyError}`);

    const firstIssue = error.issues[0];
    const fieldPath =
      firstIssue.path.length > 0 ? firstIssue.path.join(".") : "root";

    const errorMessage =
      error.issues.length === 1
        ? `Invalid data${contextMessage}: ${fieldPath} - ${firstIssue.message}`
        : `Invalid data${contextMessage}: ${error.issues.length} validation errors (see console for details)`;

    throw new Error(errorMessage);
  }
};

export default handleZodValidationError;
