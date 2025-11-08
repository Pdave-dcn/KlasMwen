import type { FieldError, UseFormSetError } from "react-hook-form";

import { toast } from "sonner";

import type { FormData } from "@/types/form.type";

import type { AxiosError } from "axios";

interface UniqueConstraintError {
  message: string;
  fields: string[];
}

interface ValidationErrors {
  errors: Record<string, string>;
}

interface GeneralError {
  message: string;
}

export type AuthError = UniqueConstraintError | ValidationErrors | GeneralError;

/**
 * Handles authentication errors from API responses and sets appropriate form errors
 *
 * Processes different types of authentication errors:
 * - Unique constraint violations (email/username already exists)
 * - Invalid credentials errors
 * - Rate limit errors
 * - General authentication failures
 *
 * @param {AxiosError<AuthError>} error - The axios error object containing response data
 * @param {UseFormSetError<FormData>} setError - React Hook Form's setError function to set field-specific errors
 * @return {void} This function doesn't return a value, it sets form errors as side effects
 */
const handleAuthError = (
  error: AxiosError<AuthError>,
  setError: UseFormSetError<FormData>
) => {
  const errorData = error.response?.data;
  const status = error.response?.status;

  // Already handled in the Axios config file
  if (!errorData) return;

  // Already handled in the Axios config file
  if (status === 429) return;

  // Handle unique constraint errors
  if ("fields" in errorData && "message" in errorData) {
    errorData.fields.forEach((field: string) => {
      const errorMessage = getUniqueConstraintMessage(field, errorData.message);
      setError(
        field as keyof FormData,
        {
          message: errorMessage,
        } as FieldError
      );
    });
    return;
  }

  // Handle specific auth error cases with message
  if ("message" in errorData) {
    if (errorData.message.includes("Incorrect Password")) {
      setError("password", {
        message: "The password you entered is incorrect. Please try again.",
      } as FieldError);
    } else if (
      errorData.message.includes("Invalid credentials") ||
      errorData.message.includes("User not found")
    ) {
      setError("email", {
        message:
          "No account found with this email. Please check and try again.",
      } as FieldError);
    } else {
      toast.error("Authentication error", {
        description: "Something went wrong. Please try again later.",
      });
    }
    return;
  }
};

const getUniqueConstraintMessage = (
  field: string,
  originalMessage: string
): string => {
  const fieldMessages: Record<string, string> = {
    email:
      "This email is already registered. Please use a different email or try signing in instead.",
    username:
      "This username is already taken. Please choose a different username.",
  };

  return fieldMessages[field] || originalMessage;
};

export { handleAuthError, getUniqueConstraintMessage };
