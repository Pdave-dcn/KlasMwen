import { toast } from "sonner";

import type { AxiosError } from "axios";

/**
 * Handles API rate limit (HTTP 429) errors consistently across the app.
 *
 * It detects generic write operation limits (10/hour) and shows a
 * contextual message depending on the operation type.
 *
 * @param error Axios error object
 * @param context A short identifier describing the operation, e.g. "post.create", "comment.create"
 * @returns true if the error was a rate-limit error and handled, false otherwise
 */
export const handleRateLimitError = (
  error: AxiosError,
  context: string
): boolean => {
  const status = error.response?.status;

  if (status !== 429) return false;

  /**
   * Context-specific message mapping
   * (custom messages override generic limiter message)
   */
  const contextMessages: Record<string, string> = {
    "post.create":
      "You're posting too frequently. Please wait a bit before posting again.",
    "post.update":
      "You've reached the hourly edit limit. You can only update posts up to 10 times per hour.",
    "post.delete":
      "You've reached the hourly delete limit. You can only delete up to 10 posts per hour.",
    "comment.create":
      "You're commenting too fast. Please slow down before commenting again.",
    "comment.delete":
      "You've reached the hourly delete limit. You can only delete up to 10 comments per hour.",
    "profile.update":
      "You've reached the hourly update limit. You can update your profile up to 10 times per hour",
    "auth.login":
      "You've made too many login attempts. Please wait 15 minutes before trying again.",
    "auth.register":
      "You've made too many signup attempts. Please wait 1 hour before trying again.",
    "report.create":
      "Too many reports submitted. You can report up to 5 items per hour. Please try again later.",
    "report.moderation":
      "Moderation action limit reached. You can perform up to 50 moderation actions per hour. Please try again later.",

    default: "Too Many Requests. Please slow down.",
  };

  const message = contextMessages[context] ?? contextMessages["default"];

  toast.error("Too Many Requests", {
    description: message,
    duration: 5000,
  });

  return true;
};
