import { Prisma } from "@prisma/client";

/**
 * Formats Prisma errors into a concise and human-readable string.
 *
 * Specifically:
 * - For `PrismaClientValidationError`, extracts the invalid argument
 *   and any available options Prisma suggests.
 * - For `PrismaClientKnownRequestError` and `PrismaClientInitializationError`,
 *   prepends a descriptive label.
 * - For other errors, falls back to the native error message.
 *
 * @param {unknown} error - The error thrown by Prisma or another source.
 * @returns {string} A formatted error message suitable for logging or responses.
 */
function formatPrismaError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientValidationError) {
    const raw = error.message;

    // Capture all "? fieldName?: ..." lines
    const optionMatches = raw.match(/^\s*\?\s+[\w]+.*$/gm);
    const options = optionMatches
      ? optionMatches
          .map((line) =>
            line
              .replace(/^\s*\?\s*/, "") // remove leading "? "
              .replace(/\?.*$/, "") // strip type info, keep field name
              .trim()
          )
          .filter(Boolean)
      : [];

    // Extract the "Unknown argument ..." line
    const unknownMatch = raw.match(/Unknown argument[^\n]*/);
    const unknown = unknownMatch ? unknownMatch[0] : "Validation failed";

    // Build final message
    if (options.length > 0) {
      return `Prisma validation error: ${unknown} Available options: ${options.join(
        ", "
      )}.`;
    }

    return `Prisma validation error: ${unknown}`;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return `[Prisma ${error.code}] ${error.message}`;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return `Prisma initialization error: ${error.message}`;
  }

  return (error as Error).message ?? "Unknown Prisma error";
}

export default formatPrismaError;
