import { toast } from "sonner";

import type { AxiosError } from "axios";

export interface ApiErrorData {
  message?: string;
  errors?: Record<string, string>;
}

/**
 * Handles errors for user profile updates by displaying toast notifications.
 *
 * This function processes different types of Axios errors, including network issues,
 * and specific HTTP status codes (401, 404, 429, 500) to provide a user-friendly
 * toast notification. It also handles generic server-provided error messages
 * as a fallback.
 *
 * @param {AxiosError<ApiErrorData>} error The Axios error object containing the server's response.
 * @return {void} This function does not return a value. It performs side effects by displaying toasts.
 */
const handleProfileUpdateError = (error: AxiosError<ApiErrorData>) => {
  const status = error.response?.status;
  const errorData = error.response?.data;

  // Handle network or non-response errors
  if (!errorData) {
    console.error("Network or unknown error:", error);
    toast.error("Network error", {
      description:
        "Unable to connect. Please check your internet and try again.",
    });
    return;
  }

  // Handle specific HTTP status codes
  switch (status) {
    case 401:
      toast.error("Authentication Error", {
        description:
          "You are not authorized to perform this action. Please log in again.",
      });
      break;
    case 404:
      toast.error("Not Found", {
        description: "The requested user profile was not found.",
      });
      break;
    case 429:
      toast.error("Too Many Requests", {
        description:
          "You've reached the hourly limit. You can make up to 10 changes (create, update, or delete) per hour. Please try again later.",
      });
      break;
    case 500:
      toast.error("Server Error", {
        description: "Something went wrong on our end. Please try again later.",
      });
      break;
    default:
      if (errorData.message) {
        toast.error("Error", {
          description: errorData.message,
        });
      } else {
        toast.error("Update Failed", {
          description: "An unexpected error occurred. Please try again.",
        });
      }
      break;
  }
};

export { handleProfileUpdateError };
