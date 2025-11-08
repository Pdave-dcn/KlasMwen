import type { UseFormSetError } from "react-hook-form";

import { toast } from "sonner";

import {
  handleAuthError,
  getUniqueConstraintMessage,
  type AuthError,
} from "@/features/auth/error/authErrorHandler";
import type { FormData } from "@/types/form.type";

import type { AxiosError } from "axios";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.spyOn(console, "error").mockImplementation(() => {});

describe("handleAuthError", () => {
  let mockSetError: UseFormSetError<FormData>;

  beforeEach(() => {
    mockSetError = vi.fn();
    vi.clearAllMocks();
  });

  describe("unique constraint errors", () => {
    it("should set form errors for unique constraint violations", () => {
      const error: AxiosError<AuthError> = {
        response: {
          status: 400,
          data: {
            message: "Unique constraint violation",
            fields: ["email", "username"],
          },
        },
      } as AxiosError<AuthError>;

      handleAuthError(error, mockSetError);

      expect(mockSetError).toHaveBeenCalledWith("email", {
        message:
          "This email is already registered. Please use a different email or try signing in instead.",
      });
      expect(mockSetError).toHaveBeenCalledWith("username", {
        message:
          "This username is already taken. Please choose a different username.",
      });
      expect(mockSetError).toHaveBeenCalledTimes(2);
    });

    it("should handle single field unique constraint", () => {
      const error: AxiosError<AuthError> = {
        response: {
          status: 400,
          data: {
            message: "Email already exists",
            fields: ["email"],
          },
        },
      } as AxiosError<AuthError>;

      handleAuthError(error, mockSetError);

      expect(mockSetError).toHaveBeenCalledWith("email", {
        message:
          "This email is already registered. Please use a different email or try signing in instead.",
      });
      expect(mockSetError).toHaveBeenCalledTimes(1);
    });
  });

  describe("specific authentication errors", () => {
    it("should handle incorrect password error", () => {
      const error: AxiosError<AuthError> = {
        response: {
          status: 401,
          data: {
            message: "Incorrect Password",
          },
        },
      } as AxiosError<AuthError>;

      handleAuthError(error, mockSetError);

      expect(mockSetError).toHaveBeenCalledWith("password", {
        message: "The password you entered is incorrect. Please try again.",
      });
    });

    it("should handle invalid credentials error", () => {
      const error: AxiosError<AuthError> = {
        response: {
          status: 401,
          data: {
            message: "Invalid credentials",
          },
        },
      } as AxiosError<AuthError>;

      handleAuthError(error, mockSetError);

      expect(mockSetError).toHaveBeenCalledWith("email", {
        message:
          "No account found with this email. Please check and try again.",
      });
    });

    it("should handle user not found error", () => {
      const error: AxiosError<AuthError> = {
        response: {
          status: 404,
          data: {
            message: "User not found",
          },
        },
      } as AxiosError<AuthError>;

      handleAuthError(error, mockSetError);

      expect(mockSetError).toHaveBeenCalledWith("email", {
        message:
          "No account found with this email. Please check and try again.",
      });
    });

    it("should handle generic authentication error", () => {
      const error: AxiosError<AuthError> = {
        response: {
          status: 500,
          data: {
            message: "Internal server error",
          },
        },
      } as AxiosError<AuthError>;

      handleAuthError(error, mockSetError);

      expect(toast.error).toHaveBeenCalledWith("Authentication error", {
        description: "Something went wrong. Please try again later.",
      });
      expect(mockSetError).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle unknown field in unique constraint", () => {
      const error: AxiosError<AuthError> = {
        response: {
          status: 400,
          data: {
            message: "Unique constraint violation",
            fields: ["unknownField"],
          },
        },
      } as AxiosError<AuthError>;

      handleAuthError(error, mockSetError);

      expect(mockSetError).toHaveBeenCalledWith("unknownField", {
        message: "Unique constraint violation",
      });
    });
  });
});

describe("getUniqueConstraintMessage", () => {
  it("should return specific message for email field", () => {
    const result = getUniqueConstraintMessage("email", "Original message");
    expect(result).toBe(
      "This email is already registered. Please use a different email or try signing in instead."
    );
  });

  it("should return specific message for username field", () => {
    const result = getUniqueConstraintMessage("username", "Original message");
    expect(result).toBe(
      "This username is already taken. Please choose a different username."
    );
  });

  it("should return original message for unknown field", () => {
    const result = getUniqueConstraintMessage(
      "unknownField",
      "Original message"
    );
    expect(result).toBe("Original message");
  });

  it("should handle empty field name", () => {
    const result = getUniqueConstraintMessage("", "Original message");
    expect(result).toBe("Original message");
  });
});
